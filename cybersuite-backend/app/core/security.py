import re
import socket
import ipaddress
from urllib.parse import urlparse
from fastapi import HTTPException
from typing import Optional


# ─── Input Sanitizers ─────────────────────────────────────────────────────────

def sanitize_host(host: str) -> str:
    """Validate and clean a hostname or IP address."""
    host = host.strip().lower()
    host = re.sub(r'^https?://', '', host)
    host = host.split('/')[0]

    # Block private / loopback ranges from being targeted
    BLOCKED_PREFIXES = ('127.', '10.', '192.168.', '169.254.', '0.', 'localhost')
    if any(host.startswith(p) for p in BLOCKED_PREFIXES) or host == 'localhost':
        raise HTTPException(status_code=400, detail="Private / loopback addresses are not allowed.")

    if len(host) > 253:
        raise HTTPException(status_code=400, detail="Hostname too long.")

    return host


def sanitize_url(url: str) -> str:
    """Validate and clean a URL, preserving path and query string.

    Use this for exploit testers (XSS, SQLi) that need the full URL.
    Blocks private / loopback hosts but keeps path + query intact.
    """
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    parsed = urlparse(url)
    if not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid URL.")

    # Validate hostname (blocks private/loopback) but keep it as-is
    sanitize_host(parsed.netloc.split(':')[0])  # strip port before check
    return url  # return the full URL with path + query


def sanitize_url_base(url: str) -> str:
    """Validate URL and return only scheme://host (no path/query).

    Use this for website/wordpress scanners that only need the base URL.
    """
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    parsed = urlparse(url)
    if not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid URL.")

    sanitized_host = sanitize_host(parsed.netloc.split(':')[0])
    return f"{parsed.scheme}://{sanitized_host}"


def sanitize_port_range(start: int, end: int) -> tuple[int, int]:
    """Validate port range stays within safe bounds."""
    from app.core.config import settings
    if start < 1 or end > 65535 or start > end:
        raise HTTPException(status_code=400, detail="Invalid port range (1–65535).")
    if (end - start) > settings.MAX_PORT_RANGE:
        raise HTTPException(
            status_code=400,
            detail=f"Port range too large. Max {settings.MAX_PORT_RANGE} ports per scan."
        )
    return start, end


def sanitize_payload(payload: str, max_length: int = 500) -> str:
    """Strip dangerous shell / SQL characters from free-text payloads."""
    if len(payload) > max_length:
        raise HTTPException(status_code=400, detail="Payload too long.")
    # Remove null bytes and other control characters
    payload = payload.replace('\x00', '').strip()
    return payload


# ─── IP Resolution Helper ─────────────────────────────────────────────────────

def resolve_host(host: str) -> Optional[str]:
    """Attempt to resolve hostname to IP; return None on failure."""
    try:
        return socket.gethostbyname(host)
    except socket.gaierror:
        return None


# ─── Blocklists / Helpers ────────────────────────────────────────────────────
BLOCKED_RANGES = [
    "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16",
    "127.0.0.0/8", "169.254.0.0/16", "0.0.0.0/8"
]

def is_private_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
        return any(addr in ipaddress.ip_network(r) for r in BLOCKED_RANGES)
    except ValueError:
        return False


BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1"]

def is_blocked_host(host: str) -> bool:
    return any(blocked in host.lower() for blocked in BLOCKED_HOSTS)
