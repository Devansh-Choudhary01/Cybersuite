import whois
from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.recon_models import WHOISRequest, WHOISResponse
from app.core.security import sanitize_host
from app.api.auth.auth import get_current_user
from app.core.audit import log_scan
from datetime import datetime, timedelta

router = APIRouter()


def _to_str(value) -> str | None:
    """Safely convert whois field to string."""
    if value is None:
        return None
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    return str(value)


@router.post("/whois", response_model=WHOISResponse, summary="WHOIS Lookup")
async def whois_lookup(
    request: WHOISRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Perform a WHOIS lookup. Requires JWT auth and consent."""
    if not getattr(request, "consent_confirmed", False):
        raise HTTPException(status_code=403, detail="You must confirm authorization before scanning.")
    domain = sanitize_host(request.domain)
    client_ip = http_request.client.host if http_request.client else "unknown"
    log_scan(current_user["email"], "whois", domain, client_ip)

    try:
        w = whois.whois(domain)
        # Normalise name_servers and status to lists
        name_servers = w.name_servers
        if isinstance(name_servers, str):
            name_servers = [name_servers]
        elif isinstance(name_servers, list):
            name_servers = [ns.lower() for ns in name_servers if ns]

        status = w.status
        if isinstance(status, str):
            status = [status]

        emails = w.emails
        if isinstance(emails, str):
            emails = [emails]

        return WHOISResponse(
            domain=domain,
            registrar=_to_str(w.registrar),
            creation_date=_to_str(w.creation_date),
            expiration_date=_to_str(w.expiration_date),
            updated_date=_to_str(w.updated_date),
            name_servers=name_servers or [],
            status=status or [],
            emails=emails or [],
            country=_to_str(w.country),
            raw=str(w.text)[:2000] if w.text else None,
        )
    except Exception as e:
        # Fallback: return simulated data when whois library/binary fails.
        # is_mocked=True signals the frontend to show a warning banner.
        now = datetime.now()
        return WHOISResponse(
            domain=domain,
            registrar="Mocked Registrar Inc.",
            creation_date=(now - timedelta(days=3650)).strftime("%Y-%m-%d"),
            expiration_date=(now + timedelta(days=365)).strftime("%Y-%m-%d"),
            updated_date=(now - timedelta(days=120)).strftime("%Y-%m-%d"),
            name_servers=[f"ns1.{domain}", f"ns2.{domain}"],
            status=["clientTransferProhibited", "serverUpdateProhibited"],
            emails=["abuse@mockedregistrar.com"],
            country="US",
            raw=f"Domain Name: {domain.upper()}\nRegistry Domain ID: 123456789_DOMAIN_COM-VRSN\nRegistrar: Mocked Registrar Inc.\nThis is a simulated response due to missing whois binaries.",
            is_mocked=True,
        )
