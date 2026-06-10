from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum


# ─── Password Strength Checker ────────────────────────────────────────────────

class PasswordStrength(str, Enum):
    VERY_WEAK = "Very Weak"
    WEAK = "Weak"
    MODERATE = "Moderate"
    STRONG = "Strong"
    VERY_STRONG = "Very Strong"


class PasswordRequest(BaseModel):
    password: str = Field(..., min_length=1, max_length=128, example="P@ssw0rd123!")


class PasswordResponse(BaseModel):
    strength: PasswordStrength
    score: int                    # 0–100
    entropy_bits: float
    suggestions: List[str]
    checks: Dict[str, bool]       # has_upper, has_digit, has_symbol, etc.
    crack_time_estimate: str


# ─── Website Scanner ──────────────────────────────────────────────────────────

class WebsiteScanRequest(BaseModel):
    url: str = Field(..., example="https://example.com")
    consent_confirmed: bool = Field(False, description="User confirms authorization to scan")


class HeaderAnalysis(BaseModel):
    header: str
    present: bool
    value: Optional[str] = None
    severity: str        # "info" | "warning" | "critical"
    recommendation: str


class SSLInfo(BaseModel):
    valid: bool
    issuer: Optional[str] = None
    subject: Optional[str] = None
    expires_on: Optional[str] = None
    days_remaining: Optional[int] = None
    protocols: Optional[List[str]] = None
    grade: str   # "A+" | "B" | "C" | "F" | "N/A"


class WebsiteScanResponse(BaseModel):
    url: str
    status_code: Optional[int] = None
    server: Optional[str] = None
    technologies: List[str] = []
    headers: List[HeaderAnalysis]
    ssl: SSLInfo
    risk_score: int               # 0–100
    summary: str


# ─── WordPress Scanner ────────────────────────────────────────────────────────

class WordPressScanRequest(BaseModel):
    url: str = Field(..., example="https://wordpress-site.com")
    consent_confirmed: bool = Field(False, description="User confirms authorization to scan")


class WPFinding(BaseModel):
    type: str         # "plugin" | "theme" | "version" | "config"
    name: str
    severity: str     # "low" | "medium" | "high" | "critical"
    detail: str


class WPPlugin(BaseModel):
    slug: str         # plugin directory name
    readme_accessible: bool  # True if readme.txt is publicly readable (info leak)


class WordPressScanResponse(BaseModel):
    url: str
    is_wordpress: bool
    wp_version: Optional[str] = None
    login_page_exposed: bool
    xmlrpc_enabled: bool
    readme_exposed: bool
    findings: List[WPFinding]
    plugins_found: List[WPPlugin] = []
    risk_score: int
