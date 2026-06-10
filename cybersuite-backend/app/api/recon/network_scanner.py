import asyncio
import socket
import time
from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.recon_models import NetworkScanRequest, NetworkScanResponse
from app.core.security import sanitize_host, resolve_host
from app.api.auth.auth import get_current_user
from app.core.audit import log_scan

router = APIRouter()

import subprocess
import platform
import re

# Extended list of 50 common ports for better network profiling
QUICK_PORTS = [
    21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 465, 514, 587,
    993, 995, 1433, 1521, 1723, 2049, 2082, 2083, 2222, 3306, 3389, 4848, 5000, 
    5432, 5900, 5985, 6379, 8000, 8080, 8081, 8443, 8888, 9000, 9200, 9443, 10000, 
    11211, 27017
]

OS_FINGERPRINT_HINTS = {
    (22, 80): "Linux (SSH + HTTP)",
    (22, 443): "Linux (SSH + HTTPS)",
    (3389, 445): "Windows Server (RDP + SMB)",
    (3389,): "Windows (RDP enabled)",
    (3306, 22): "Linux/MySQL Server",
    (1433,): "Windows/MSSQL Server",
    (445, 135): "Windows (SMB/RPC)",
    (5900,): "macOS/Linux (VNC enabled)",
    (22, 2082): "Linux/cPanel Server",
}

def _get_os_by_ttl(ip: str) -> str | None:
    try:
        if platform.system().lower() == "windows":
            cmd = ["ping", "-n", "1", "-w", "1000", ip]
        else:
            cmd = ["ping", "-c", "1", "-W", "1", ip]
        output = subprocess.check_output(cmd, timeout=2).decode("utf-8", errors="ignore")
        match = re.search(r'(?i)ttl=(\d+)', output)
        if match:
            ttl = int(match.group(1))
            if ttl <= 64: return "Linux/Unix/macOS (TTL \u2264 64)"
            if ttl <= 128: return "Windows (TTL \u2264 128)"
            if ttl <= 255: return "Cisco/Router (TTL \u2264 255)"
    except Exception:
        pass
    return None


async def _check_port(ip: str, port: int, timeout: float = 1.5) -> bool:
    try:
        _, writer = await asyncio.wait_for(
            asyncio.open_connection(ip, port), timeout=timeout
        )
        writer.close()
        return True
    except Exception:
        return False


def _guess_os(ip: str, open_ports: list[int]) -> str:
    # 1. Try real TTL ping first
    ttl_guess = _get_os_by_ttl(ip)
    
    # 2. Try port heuristics
    port_guess = None
    for ports, guess in OS_FINGERPRINT_HINTS.items():
        if all(p in open_ports for p in ports):
            port_guess = guess
            break
            
    if ttl_guess and port_guess:
        return f"{ttl_guess} — {port_guess}"
    return ttl_guess or port_guess or "Unknown"


@router.post("/network-scan", response_model=NetworkScanResponse, summary="Network Scanner")
async def network_scan(
    request: NetworkScanRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Perform a network scan. Requires JWT auth and consent."""
    if not getattr(request, "consent_confirmed", False):
        raise HTTPException(status_code=403, detail="You must confirm authorization before scanning.")
    host = sanitize_host(request.host)
    ip = resolve_host(host)
    client_ip = http_request.client.host if http_request.client else "unknown"
    log_scan(current_user["email"], "network-scan", host, client_ip)

    if not ip:
        raise HTTPException(status_code=404, detail=f"Could not resolve host: {host}")

    start = time.monotonic()

    # Probe quick ports simultaneously
    tasks = [_check_port(ip, p) for p in QUICK_PORTS]
    results = await asyncio.gather(*tasks)

    latency_ms = round((time.monotonic() - start) * 1000, 2)
    open_ports = [QUICK_PORTS[i] for i, ok in enumerate(results) if ok]
    is_alive = len(open_ports) > 0

    return NetworkScanResponse(
        host=host,
        ip=ip,
        is_alive=is_alive,
        latency_ms=latency_ms,
        open_ports=open_ports,
        os_guess=_guess_os(ip, open_ports) if is_alive else None,
    )
