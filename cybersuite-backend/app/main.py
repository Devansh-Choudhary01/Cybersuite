from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings

# ─── Rate Limiter (B2) ────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_STRING])

# ─── Route Imports ────────────────────────────────────────────────────────────
from app.api.auth import auth
from app.api.recon import port_scanner, subdomain_finder, whois_lookup, dns_lookup, network_scanner, ssl_checker
from app.api.vulnscan import password_checker, website_scanner, wordpress_scanner
from app.api.exploits import sqli_tester, xss_tester
from app.api.ai import assistant
from app.api.reports import report_generator

# ─── App Init ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="CyberSuite — Production Cybersecurity Platform API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ─── Attach Limiter State (B2) ────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Security Headers Middleware ─────────────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response

# ─── Routers ──────────────────────────────────────────────────────────────────
# Auth (B1)
app.include_router(auth.router,              prefix="/api/auth",    tags=["Auth"])

# Recon Tools
app.include_router(port_scanner.router,      prefix="/api/recon",   tags=["Recon"])
app.include_router(subdomain_finder.router,  prefix="/api/recon",   tags=["Recon"])
app.include_router(whois_lookup.router,      prefix="/api/recon",   tags=["Recon"])
app.include_router(dns_lookup.router,        prefix="/api/recon",   tags=["Recon"])
app.include_router(network_scanner.router,   prefix="/api/recon",   tags=["Recon"])
app.include_router(ssl_checker.router,       prefix="/api/recon",   tags=["Recon"])

# Vulnerability Scanners
app.include_router(password_checker.router,  prefix="/api/vulnscan", tags=["VulnScan"])
app.include_router(website_scanner.router,   prefix="/api/vulnscan", tags=["VulnScan"])
app.include_router(wordpress_scanner.router, prefix="/api/vulnscan", tags=["VulnScan"])

# Exploit Simulations (SAFE)
app.include_router(sqli_tester.router,       prefix="/api/exploits", tags=["Exploits"])
app.include_router(xss_tester.router,        prefix="/api/exploits", tags=["Exploits"])

# AI Assistant
app.include_router(assistant.router, prefix="/api/ai", tags=["AI"])

# Report Generator
app.include_router(report_generator.router,  prefix="/api/reports",  tags=["Reports"])


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
