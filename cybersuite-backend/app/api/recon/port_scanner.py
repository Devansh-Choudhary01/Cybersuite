import socket
import asyncio
import time
from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.recon_models import PortScanRequest, PortScanResponse, PortResult
from app.core.security import sanitize_host, sanitize_port_range, resolve_host
from app.api.auth.auth import get_current_user
from app.core.audit import log_scan

router = APIRouter()

# Common service names for well-known ports
SERVICE_MAP = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 445: "SMB",
    554: "RTSP", 1433: "MSSQL", 1521: "Oracle", 3306: "MySQL", 
    3389: "RDP", 5000: "UPnP", 5432: "PostgreSQL", 5900: "VNC",
    6379: "Redis", 8000: "HTTP-Alt", 8080: "HTTP-Alt", 8081: "HTTP-Alt",
    8443: "HTTPS-Alt", 9000: "Watchtower", 27017: "MongoDB",
    
    # Games
    25565: "Minecraft", 27015: "Source Engine", 3074: "Xbox Live", 
    3478: "PlayStation", 1119: "Battle.net", 28015: "Rust",

    # Malicious / Vulnerability Targets
    135: "RPC", 137: "NetBIOS", 138: "NetBIOS", 139: "NetBIOS",
    2323: "Telnet-Alt (Mirai)", 11211: "Memcached", 32764: "Backdoor-Detection",
}


async def scan_port_tcp(host: str, port: int, timeout: float = 2.0) -> PortResult:
    """Attempt a TCP connection and grab banner if open."""
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port),
            timeout=timeout
        )
        
        banner = None
        try:
            # Send dummy data for HTTP/HTTPS to trigger response
            if port in (80, 443, 8080, 8443):
                writer.write(b"HEAD / HTTP/1.0\r\n\r\n")
                await writer.drain()
                
            banner_bytes = await asyncio.wait_for(reader.read(256), timeout=0.5)
            if banner_bytes:
                banner_raw = banner_bytes.decode('utf-8', errors='ignore').strip()
                banner = banner_raw.split('\n')[0][:50].strip()
        except Exception:
            pass

        writer.close()
        try:
            await writer.wait_closed()
        except Exception:
            pass
        return PortResult(
            port=port,
            status="open",
            service=SERVICE_MAP.get(port, "unknown"),
            banner=banner if banner else None
        )
    except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
        return PortResult(port=port, status="closed")


async def scan_port_udp(host: str, port: int, timeout: float = 1.0) -> PortResult:
    """Attempt a UDP probe (Simplified)."""
    # Real UDP scanning requires raw sockets for ICMP unreachable check.
    # We simulate/probe at app-level.
    loop = asyncio.get_event_loop()
    try:
        def probe():
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.settimeout(timeout)
                s.sendto(b'', (host, port))
                try:
                    s.recvfrom(1)
                    return "open"
                except socket.timeout:
                    return "open|filtered"
                except ConnectionRefusedError:
                    return "closed"
        
        status = await loop.run_in_executor(None, probe)
        return PortResult(port=port, status=status, service=SERVICE_MAP.get(port, "unknown"))
    except Exception:
        return PortResult(port=port, status="closed")


@router.post("/port-scan", response_model=PortScanResponse, summary="Port Scanner (TCP/UDP)")
async def port_scan(
    request: PortScanRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Scan target host for open ports.
    Requires JWT auth and consent confirmation.
    """
    if not getattr(request, "consent_confirmed", False):
        raise HTTPException(status_code=403, detail="You must confirm authorization before scanning.")

    host = sanitize_host(request.host)
    ip = resolve_host(host)

    client_ip = http_request.client.host if http_request.client else "unknown"
    log_scan(current_user["email"], "port-scan", host, client_ip)
    start_time = time.monotonic()

    # Determine ports to scan
    if request.ports:
        ports_to_scan = sorted(list(set(request.ports)))
    else:
        # Fallback to range
        start = request.start_port or 1
        end = request.end_port or 1024
        # Reuse security helper with optional handling
        start, end = sanitize_port_range(start, end)
        ports_to_scan = list(range(start, end + 1))

    # Limit total ports to prevent abuse/timeout
    if len(ports_to_scan) > 5000:
         ports_to_scan = ports_to_scan[:5000]

    semaphore = asyncio.Semaphore(100)
    protocol = request.protocol.upper()

    async def limited_scan(port: int) -> PortResult:
        async with semaphore:
            if protocol == "UDP":
                return await scan_port_udp(ip or host, port)
            return await scan_port_tcp(ip or host, port)

    tasks = [limited_scan(p) for p in ports_to_scan]
    results = await asyncio.gather(*tasks)

    elapsed = round(time.monotonic() - start_time, 2)
    open_ports = [r for r in results if r.status in ("open", "open|filtered")]

    return PortScanResponse(
        host=host,
        ip=ip,
        start_port=ports_to_scan[0] if ports_to_scan else 0,
        end_port=ports_to_scan[-1] if ports_to_scan else 0,
        open_ports=open_ports,
        total_scanned=len(results),
        scan_duration_seconds=elapsed,
    )
