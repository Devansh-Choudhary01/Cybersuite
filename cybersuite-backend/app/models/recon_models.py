from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum


# ─── Port Scanner ─────────────────────────────────────────────────────────────

class PortScanRequest(BaseModel):
    host: str = Field(..., example="scanme.nmap.org", description="Target hostname or IP")
    protocol: str = Field("TCP", pattern="^(TCP|UDP)$")
    start_port: Optional[int] = Field(None, ge=1, le=65535, example=1)
    end_port: Optional[int] = Field(None, ge=1, le=65535, example=1024)
    ports: Optional[List[int]] = Field(None, description="List of specific ports to scan")
    consent_confirmed: bool = Field(False, description="User confirms authorization to scan")



class PortResult(BaseModel):
    port: int
    status: str           # "open" | "closed"
    service: Optional[str] = None
    banner: Optional[str] = None


class PortScanResponse(BaseModel):
    host: str
    ip: Optional[str]
    start_port: int
    end_port: int
    open_ports: List[PortResult]
    total_scanned: int
    scan_duration_seconds: float


# ─── Subdomain Finder ─────────────────────────────────────────────────────────

class SubdomainRequest(BaseModel):
    domain: str = Field(..., example="example.com")
    consent_confirmed: bool = Field(False, description="User confirms authorization to scan")

    @field_validator("domain")
    @classmethod
    def clean_domain(cls, v: str) -> str:
        import re
        v = re.sub(r'^https?://', '', v.strip()).split('/')[0]
        if not v:
            raise ValueError("Domain cannot be empty.")
        return v.lower()


class SubdomainResult(BaseModel):
    subdomain: str
    ip: Optional[str] = None
    status: str   # "alive" | "dead"
    source: str = "wordlist"  # "wordlist" | "crt.sh"


class SubdomainResponse(BaseModel):
    domain: str
    found: List[SubdomainResult]
    total_checked: int
    total_found: int
    total_from_crt: int = 0  # subdomains discovered via certificate transparency


# ─── WHOIS Lookup ─────────────────────────────────────────────────────────────

class WHOISRequest(BaseModel):
    domain: str = Field(..., example="example.com")
    consent_confirmed: bool = Field(False, description="User confirms authorization to scan")


class WHOISResponse(BaseModel):
    domain: str
    registrar: Optional[str] = None
    creation_date: Optional[str] = None
    expiration_date: Optional[str] = None
    updated_date: Optional[str] = None
    name_servers: Optional[List[str]] = None
    status: Optional[List[str]] = None
    emails: Optional[List[str]] = None
    country: Optional[str] = None
    raw: Optional[str] = None
    is_mocked: bool = False  # True when live WHOIS query failed and data is simulated


# ─── DNS Lookup ───────────────────────────────────────────────────────────────

class DNSRequest(BaseModel):
    domain: str = Field(..., example="example.com")
    record_type: Optional[str] = Field("ALL", example="A")
    consent_confirmed: bool = Field(False, description="User confirms authorization to scan")


class DNSRecord(BaseModel):
    type: str
    value: str
    ttl: Optional[int] = None


class DNSResponse(BaseModel):
    domain: str
    records: List[DNSRecord]


# ─── Network Scanner ──────────────────────────────────────────────────────────

class NetworkScanRequest(BaseModel):
    host: str = Field(..., example="8.8.8.8")
    consent_confirmed: bool = Field(False, description="User confirms authorization to scan")

class NetworkScanResponse(BaseModel):
    host: str
    ip: Optional[str]
    is_alive: bool
    latency_ms: Optional[float] = None
    open_ports: List[int] = []
    os_guess: Optional[str] = None
