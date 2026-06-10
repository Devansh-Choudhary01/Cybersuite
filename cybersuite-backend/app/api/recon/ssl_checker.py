import ssl
import socket
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

class SSLCheckRequest(BaseModel):
    domain: str

def parse_cert_date(date_str: str) -> datetime:
    return datetime.strptime(date_str, "%b %d %H:%M:%S %Y %Z")

@router.post("/ssl-check", summary="SSL/TLS Certificate Checker")
@limiter.limit("10/minute")
async def ssl_check(request: Request, payload: SSLCheckRequest):
    domain = payload.domain.replace("https://", "").replace("http://", "").split("/")[0]
    if not domain:
        raise HTTPException(status_code=400, detail="Invalid domain provided.")

    ctx_none = ssl.create_default_context()
    ctx_none.check_hostname = False
    ctx_none.verify_mode = ssl.CERT_NONE
    
    tls_version = "Unknown"
    cert_dict = {}
    der_cert = None
    
    try:
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with ctx_none.wrap_socket(sock, server_hostname=domain) as ssock:
                tls_version = ssock.version()
                der_cert = ssock.getpeercert(binary_form=True)
    except Exception as e:
        return {"hostname": domain, "status": "error", "error": str(e)}

    if der_cert:
        try:
            cert_dict = ssl._ssl._test_decode_cert(der_cert)
        except Exception:
            pass

    ctx_req = ssl.create_default_context()
    is_valid = False
    is_self_signed = False
    status = "error"
    error_msg = ""
    
    try:
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with ctx_req.wrap_socket(sock, server_hostname=domain) as ssock:
                is_valid = True
                status = "valid"
                if not cert_dict:
                    cert_dict = ssock.getpeercert()
    except ssl.SSLCertVerificationError as e:
        error_msg = str(e)
        if "self signed" in error_msg.lower() or "self-signed" in error_msg.lower() or "unable to get local issuer certificate" in error_msg.lower():
            status = "self_signed"
            is_self_signed = True
        elif "expired" in error_msg.lower() or "certificate has expired" in error_msg.lower():
            status = "expired"
        else:
            status = "error"
    except Exception as e:
        error_msg = str(e)

    def get_field(cert, field_name):
        for tuple_group in cert.get(field_name, []):
            for k, v in tuple_group:
                if k in ("commonName", "organizationName"):
                    return v
        return "Unknown"

    issuer = get_field(cert_dict, "issuer") if cert_dict else "Unknown"
    subject = get_field(cert_dict, "subject") if cert_dict else "Unknown"
    
    issued_on = cert_dict.get("notBefore", "Unknown") if cert_dict else "Unknown"
    expires_on = cert_dict.get("notAfter", "Unknown") if cert_dict else "Unknown"
    
    days_remaining = 0
    if expires_on != "Unknown":
        try:
            expires_dt = parse_cert_date(expires_on)
            days_remaining = (expires_dt - datetime.utcnow()).days
            if days_remaining <= 0:
                status = "expired"
                is_valid = False
            elif days_remaining < 30 and status == "valid":
                status = "expiring"
        except Exception:
            pass

    return {
        "hostname": domain,
        "valid": is_valid,
        "issuer": issuer,
        "subject": subject,
        "issued_on": issued_on,
        "expires_on": expires_on,
        "days_remaining": days_remaining,
        "is_self_signed": is_self_signed,
        "tls_version": tls_version,
        "status": status,
        "error": error_msg if not is_valid else None
    }
