import asyncio
import socket
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.recon_models import SubdomainRequest, SubdomainResponse, SubdomainResult
from app.core.security import sanitize_host
from app.api.auth.auth import get_current_user
from app.core.audit import log_scan

router = APIRouter()

# Fallback wordlist for active DNS brute-force
SUBDOMAIN_WORDLIST = [
    "www", "mail", "ftp", "admin", "api", "dev", "staging", "test",
    "portal", "app", "secure", "login", "dashboard", "blog", "shop",
    "cdn", "static", "assets", "media", "images", "docs", "support",
    "help", "status", "monitor", "vpn", "remote", "smtp", "pop", "imap",
    "mx", "ns1", "ns2", "dns", "webmail", "cpanel", "whm", "git",
    "gitlab", "jenkins", "jira", "confluence", "wiki", "forum", "community",
    "beta", "alpha", "internal", "intranet", "extranet", "backend", "v1", "v2",
]

CRT_SH_TIMEOUT = 15  # seconds — crt.sh can be slow under load


async def fetch_crt_sh(domain: str) -> list[str]:
    """
    Query the crt.sh Certificate Transparency log to passively enumerate subdomains.
    Returns a deduplicated list of subdomain FQDNs found in issued TLS certificates.
    """
    url = f"https://crt.sh/?q=%.{domain}&output=json"
    try:
        async with httpx.AsyncClient(timeout=CRT_SH_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(url, headers={"Accept": "application/json"})
            if resp.status_code != 200:
                return []
            entries = resp.json()
    except Exception:
        return []

    seen: set[str] = set()
    results: list[str] = []
    for entry in entries:
        # name_value may contain newline-separated wildcards and multiple FQDNs
        for name in entry.get("name_value", "").splitlines():
            name = name.strip().lower()
            # Skip wildcards and the apex domain itself
            if name.startswith("*") or name == domain or not name.endswith(f".{domain}"):
                continue
            if name not in seen:
                seen.add(name)
                results.append(name)
    return results


async def resolve_fqdn(fqdn: str) -> tuple[str, str | None]:
    """DNS-resolve a fully-qualified subdomain; return (fqdn, ip_or_None)."""
    loop = asyncio.get_event_loop()
    try:
        ip = await loop.run_in_executor(None, socket.gethostbyname, fqdn)
        return fqdn, ip
    except socket.gaierror:
        return fqdn, None


async def check_subdomain(subdomain: str, domain: str) -> SubdomainResult:
    """Wordlist-based: build FQDN, resolve, return result."""
    fqdn = f"{subdomain}.{domain}"
    _, ip = await resolve_fqdn(fqdn)
    status = "alive" if ip else "dead"
    return SubdomainResult(subdomain=fqdn, ip=ip, status=status, source="wordlist")


@router.post("/subdomain-finder", response_model=SubdomainResponse, summary="Subdomain Enumerator")
async def subdomain_finder(
    request: SubdomainRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Enumerate subdomains using two complementary techniques:
    1. Certificate Transparency (crt.sh) — passive, highly accurate
    2. DNS wordlist brute-force — active, catches uncertified subdomains

    Requires JWT auth and consent.
    """
    if not request.consent_confirmed:
        raise HTTPException(status_code=403, detail="You must confirm authorization before scanning.")

    domain = sanitize_host(request.domain)
    client_ip = http_request.client.host if http_request.client else "unknown"
    log_scan(current_user["email"], "subdomain-finder", domain, client_ip)

    semaphore = asyncio.Semaphore(50)

    # ── Phase 1: Certificate Transparency (passive) ───────────────────────────
    crt_fqdns = await fetch_crt_sh(domain)

    async def limited_resolve(fqdn: str) -> SubdomainResult:
        async with semaphore:
            _, ip = await resolve_fqdn(fqdn)
            status = "alive" if ip else "dead"
            return SubdomainResult(subdomain=fqdn, ip=ip, status=status, source="crt.sh")

    crt_tasks = [limited_resolve(fqdn) for fqdn in crt_fqdns]
    crt_results: list[SubdomainResult] = await asyncio.gather(*crt_tasks)

    # Build set of FQDNs already covered by crt.sh (to avoid duplicates)
    crt_found_set = {r.subdomain for r in crt_results}

    # ── Phase 2: Wordlist DNS brute-force (active) ────────────────────────────
    async def limited_check(sub: str) -> SubdomainResult:
        async with semaphore:
            return await check_subdomain(sub, domain)

    wordlist_tasks = [limited_check(sub) for sub in SUBDOMAIN_WORDLIST]
    wordlist_results: list[SubdomainResult] = await asyncio.gather(*wordlist_tasks)

    # ── Merge: crt.sh first, then wordlist finds not already covered ──────────
    all_results: list[SubdomainResult] = list(crt_results)
    for r in wordlist_results:
        if r.subdomain not in crt_found_set:
            all_results.append(r)

    alive = [r for r in all_results if r.status == "alive"]
    crt_alive = [r for r in crt_results if r.status == "alive"]

    return SubdomainResponse(
        domain=domain,
        found=alive,
        total_checked=len(crt_fqdns) + len(SUBDOMAIN_WORDLIST),
        total_found=len(alive),
        total_from_crt=len(crt_alive),
    )
