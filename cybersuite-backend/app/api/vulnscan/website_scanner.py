import ssl
import socket
import asyncio
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.vuln_models import (
    WebsiteScanRequest, WebsiteScanResponse, HeaderAnalysis, SSLInfo
)
from app.core.security import sanitize_url_base, resolve_host, is_private_ip, is_blocked_host
from app.api.auth.auth import get_current_user
from app.core.audit import log_scan

router = APIRouter()

# Security headers to audit
SECURITY_HEADERS = {
    "Strict-Transport-Security": {
        "severity": "critical",
        "recommendation": "Add HSTS to enforce HTTPS: max-age=31536000; includeSubDomains"
    },
    "Content-Security-Policy": {
        "severity": "warning",
        "recommendation": "Define a strict Content-Security-Policy to prevent XSS."
    },
    "X-Frame-Options": {
        "severity": "warning",
        "recommendation": "Set X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking."
    },
    "X-Content-Type-Options": {
        "severity": "warning",
        "recommendation": "Add X-Content-Type-Options: nosniff."
    },
    "Referrer-Policy": {
        "severity": "info",
        "recommendation": "Set Referrer-Policy: strict-origin-when-cross-origin."
    },
    "Permissions-Policy": {
        "severity": "info",
        "recommendation": "Restrict browser feature access with Permissions-Policy."
    },
    "X-XSS-Protection": {
        "severity": "warning",
        "recommendation": "Add X-XSS-Protection: 1; mode=block (legacy browsers)."
    },
    "Cross-Origin-Opener-Policy": {
        "severity": "warning",
        "recommendation": "Add COOP header to prevent cross-origin attacks"
    },
    "Cross-Origin-Resource-Policy": {
        "severity": "info",
        "recommendation": "Add CORP header to control resource sharing"
    },
}

TECH_SIGNATURES = {
    "WordPress": ["wp-content", "wp-includes", "/xmlrpc.php"],
    "Nginx": ["nginx"],
    "Apache": ["apache"],
    "PHP": ["php", "x-powered-by: php"],
    "Cloudflare": ["cf-ray", "cloudflare"],
    "React": ["react", "__next"],
    "Vue.js": ["vue", "nuxt"],
    "Django": ["csrftoken", "django"],
}


def _check_ssl(hostname: str) -> SSLInfo:
    """Check SSL certificate details for a hostname."""
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((hostname, 443), timeout=5) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                cipher = ssock.cipher()
                cipher_name = cipher[0] if cipher else "Unknown"
                version = ssock.version() or "Unknown"
                
                issuer = dict(x[0] for x in cert.get("issuer", []))
                subject = dict(x[0] for x in cert.get("subject", []))
                expire_str = cert.get("notAfter", "")
                expire_dt = datetime.strptime(expire_str, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
                days_left = (expire_dt - datetime.now(timezone.utc)).days

                grade = "A" if days_left > 90 else ("B" if days_left > 30 else "C")
                if version not in ("TLSv1.2", "TLSv1.3"):
                    grade = "F"
                elif any(weak in cipher_name for weak in ["RC4", "DES", "MD5", "NULL"]):
                    grade = "F"

                return SSLInfo(
                    valid=True,
                    issuer=issuer.get("organizationName", "Unknown"),
                    subject=subject.get("commonName", hostname),
                    expires_on=expire_dt.strftime("%Y-%m-%d"),
                    days_remaining=days_left,
                    protocols=[version, cipher_name],
                    grade=grade,
                )
    except ssl.SSLCertVerificationError:
        return SSLInfo(valid=False, grade="F")
    except Exception:
        return SSLInfo(valid=False, grade="N/A")


@router.post("/website-scan", response_model=WebsiteScanResponse, summary="Website Security Scanner")
async def website_scan(
    request: WebsiteScanRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Analyse a website for security headers, SSL, and tech stack. Requires JWT auth and consent."""
    if not getattr(request, "consent_confirmed", False):
        raise HTTPException(status_code=403, detail="You must confirm authorization before scanning.")
    url = sanitize_url_base(request.url)
    hostname = url.split("//")[1].split("/")[0]
    ip = resolve_host(hostname)

    # Block private/internal ranges and blocked hostnames
    if is_blocked_host(hostname) or (ip and is_private_ip(ip)):
        raise HTTPException(status_code=403, detail="Scanning of private or blocked hosts is not allowed.")

    client_ip = http_request.client.host if http_request.client else "unknown"
    log_scan(current_user["email"], "website-scan", url, client_ip)

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(url)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach target: {exc}")

    resp_headers = {k.lower(): v for k, v in response.headers.items()}
    body_snippet = response.text[:5000].lower()

    # Audit security headers
    header_results = []
    risk_score = 100
    for header, meta in SECURITY_HEADERS.items():
        present = header.lower() in resp_headers
        if not present:
            deduct = {"critical": 15, "warning": 7, "info": 3}
            risk_score -= deduct.get(meta["severity"], 0)
        if present:
            risk_score += 5  # reward for having good headers
        header_results.append(HeaderAnalysis(
            header=header,
            present=present,
            value=resp_headers.get(header.lower()),
            severity=meta["severity"] if not present else "info",
            recommendation=meta["recommendation"] if not present else "✓ Header present",
        ))

    # Detect technologies
    technologies = []
    for tech, signatures in TECH_SIGNATURES.items():
        if any(sig in body_snippet or sig in str(resp_headers) for sig in signatures):
            technologies.append(tech)

    # SSL check (run in thread pool)
    loop = asyncio.get_event_loop()
    ssl_info = await loop.run_in_executor(None, _check_ssl, hostname)
    if not ssl_info.valid:
        risk_score -= 30

    risk_score = max(0, min(100, risk_score))

    summary_map = {
        range(85, 101): "Excellent — security headers well configured.",
        range(65, 85):  "Good — minor security headers missing.",
        range(40, 65):  "Moderate risk — several security headers missing.",
        range(0, 40):   "High risk — critical security controls missing.",
    }
    summary = next((v for k, v in summary_map.items() if risk_score in k), "Unknown")

    return WebsiteScanResponse(
        url=url,
        status_code=response.status_code,
        server=resp_headers.get("server"),
        technologies=technologies,
        headers=header_results,
        ssl=ssl_info,
        risk_score=risk_score,
        summary=summary,
    )
