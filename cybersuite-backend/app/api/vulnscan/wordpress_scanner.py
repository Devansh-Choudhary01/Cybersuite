import re
import asyncio
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.vuln_models import (
    WordPressScanRequest, WordPressScanResponse, WPFinding, WPPlugin
)
from app.core.security import sanitize_url_base
from app.api.auth.auth import get_current_user
from app.core.audit import log_scan

router = APIRouter()

WP_PATHS = {
    "login_page":        "/wp-login.php",
    "xmlrpc":            "/xmlrpc.php",
    "readme":            "/readme.html",
    "wp_json":           "/wp-json/",
    "wp_content":        "/wp-content/",
    "admin":             "/wp-admin/",
    "upgrade":           "/wp-admin/upgrade.php",
    "install":           "/wp-admin/install.php",
    "wp_cron":           "/wp-cron.php",
    "license":           "/license.txt",
    "debug_log":         "/wp-content/debug.log",
}

# Known plugins to actively probe for exposure
VULNERABLE_PLUGINS = [
    "contact-form-7",
    "woocommerce",
    "elementor",
    "yoast-seo",
    "wpforms-lite",
    "all-in-one-seo-pack",
    "wordfence",
    "akismet",
    "jetpack",
    "classic-editor",
    "really-simple-ssl",
    "litespeed-cache",
    "wp-super-cache",
    "duplicate-page",
    "advanced-custom-fields",
]

# Regex patterns to extract WP version from page bodies
_VERSION_PATTERNS = [
    re.compile(r'<meta[^>]+generator[^>]+WordPress\s+([\d.]+)', re.IGNORECASE),
    re.compile(r'WordPress\s+([\d.]+)', re.IGNORECASE),
    re.compile(r'Version\s+([\d.]+)', re.IGNORECASE),
]


async def _probe(client: httpx.AsyncClient, base: str, path: str) -> tuple[str, int, str]:
    """Probe a path; return (path, status_code, body_snippet)."""
    try:
        r = await client.get(base + path, follow_redirects=True, timeout=6)
        return path, r.status_code, r.text[:2000]
    except Exception:
        return path, 0, ""


def _extract_version(body: str) -> str | None:
    """Try to extract WP version from a page body using known patterns."""
    for pattern in _VERSION_PATTERNS:
        m = pattern.search(body)
        if m:
            version = m.group(1).strip()
            if re.match(r'^\d+\.\d+', version):
                return version
    return None


@router.post("/wordpress-scan", response_model=WordPressScanResponse, summary="WordPress Scanner")
async def wordpress_scan(
    request: WordPressScanRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Scan a WordPress site for vulnerabilities. Requires JWT auth and consent."""
    if not request.consent_confirmed:
        raise HTTPException(status_code=403, detail="You must confirm authorization before scanning.")

    url = sanitize_url_base(request.url)
    client_ip = http_request.client.host if http_request.client else "unknown"
    log_scan(current_user["email"], "wordpress-scan", url, client_ip)

    findings: list[WPFinding] = []
    plugins_found: list[WPPlugin] = []
    wp_version: str | None = None
    is_wordpress = False

    async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:

        # ── Step 1: Detect WordPress from homepage ────────────────────────────
        try:
            home = await client.get(url)
            body = home.text
            body_lower = body.lower()

            if "wp-content" in body_lower or "wp-includes" in body_lower or "wordpress" in body_lower:
                is_wordpress = True

            # Try to extract version from homepage meta generator tag
            if is_wordpress:
                wp_version = _extract_version(body)

        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Unable to reach site: {exc}")

        if not is_wordpress:
            return WordPressScanResponse(
                url=url, is_wordpress=False,
                login_page_exposed=False, xmlrpc_enabled=False,
                readme_exposed=False, findings=[], plugins_found=[],
                risk_score=0,
            )

        # ── Step 2: Probe known WP paths ──────────────────────────────────────
        path_tasks = [_probe(client, url, p) for p in WP_PATHS.values()]
        path_results_raw = await asyncio.gather(*path_tasks)
        path_results: dict[str, tuple[int, str]] = {
            path: (status, body) for path, status, body in path_results_raw
        }

        # ── Step 3: Extract version from readme.html if not found yet ─────────
        readme_status, readme_body = path_results.get("/readme.html", (0, ""))
        if not wp_version and readme_status == 200 and readme_body:
            wp_version = _extract_version(readme_body)

        # ── Step 4: Probe plugin readmes ──────────────────────────────────────
        plugin_tasks = [
            _probe(client, url, f"/wp-content/plugins/{slug}/readme.txt")
            for slug in VULNERABLE_PLUGINS
        ]
        plugin_results_raw = await asyncio.gather(*plugin_tasks)

        for i, (path, status, _) in enumerate(plugin_results_raw):
            slug = VULNERABLE_PLUGINS[i]
            accessible = status == 200
            plugins_found.append(WPPlugin(slug=slug, readme_accessible=accessible))
            if accessible:
                findings.append(WPFinding(
                    type="plugin",
                    name=f"Plugin Exposed: {slug}",
                    severity="medium",
                    detail=(
                        f"readme.txt for '{slug}' is publicly readable at "
                        f"/wp-content/plugins/{slug}/readme.txt — "
                        "this leaks the exact plugin version, aiding targeted attacks."
                    )
                ))

    # ── Step 5: Evaluate path probe results ───────────────────────────────────
    login_exposed     = path_results.get("/wp-login.php",         (0, ""))[0] == 200
    xmlrpc_enabled    = path_results.get("/xmlrpc.php",           (0, ""))[0] in (200, 405)
    readme_exposed    = path_results.get("/readme.html",          (0, ""))[0] == 200
    debug_log_exposed = path_results.get("/wp-content/debug.log", (0, ""))[0] == 200
    install_exposed   = path_results.get("/wp-admin/install.php", (0, ""))[0] == 200

    if login_exposed:
        findings.append(WPFinding(
            type="config", name="Login Page Exposed",
            severity="medium", detail="wp-login.php is publicly accessible."
        ))
    if xmlrpc_enabled:
        findings.append(WPFinding(
            type="config", name="XML-RPC Enabled",
            severity="high", detail="xmlrpc.php is active — brute-force amplification risk."
        ))
    if readme_exposed:
        findings.append(WPFinding(
            type="config", name="Readme Exposed",
            severity="low",
            detail=(
                "readme.html is publicly accessible"
                + (f" and reveals WordPress version {wp_version}." if wp_version else ".")
            )
        ))
    if debug_log_exposed:
        findings.append(WPFinding(
            type="config", name="Debug Log Accessible",
            severity="critical", detail="/wp-content/debug.log is publicly readable."
        ))
    if install_exposed:
        findings.append(WPFinding(
            type="config", name="Install Script Accessible",
            severity="critical", detail="wp-admin/install.php is accessible — reinstall risk."
        ))
    if wp_version:
        findings.append(WPFinding(
            type="version", name=f"WordPress Version Detected: {wp_version}",
            severity="info",
            detail=(
                f"Version {wp_version} is publicly disclosed. "
                "Ensure this is the latest release and update immediately if not."
            )
        ))

    # ── Risk score ────────────────────────────────────────────────────────────
    weight = {"critical": 30, "high": 20, "medium": 10, "low": 5, "info": 0}
    total_risk = sum(weight.get(f.severity, 0) for f in findings)
    risk_score = min(100, total_risk)

    return WordPressScanResponse(
        url=url,
        is_wordpress=is_wordpress,
        wp_version=wp_version,
        login_page_exposed=login_exposed,
        xmlrpc_enabled=xmlrpc_enabled,
        readme_exposed=readme_exposed,
        findings=findings,
        plugins_found=plugins_found,
        risk_score=risk_score,
    )
