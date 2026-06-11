"""
B1 + B2 — JWT Authentication & Auth Endpoint
Demo user: admin@cybersuite.io / demo1234
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
# pyrefly: ignore [missing-import]
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import settings

# ─── Config ───────────────────────────────────────────────────────────────────
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

router = APIRouter()

# ─── Password Hashing ─────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Regenerate these hashes fresh at startup using the installed bcrypt implementation
# Load demo/admin credentials from environment variables to avoid hardcoding
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@cybersuite.local").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
DEMO_EMAIL = os.getenv("DEMO_EMAIL", "demo@cybersuite.local").strip().lower()
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "demo1234")

USERS_DB = {
    ADMIN_EMAIL: {
        "email": ADMIN_EMAIL,
        "hashed_password": pwd_context.hash(ADMIN_PASSWORD),
        "role": "admin",
    },
    DEMO_EMAIL: {
        "email": DEMO_EMAIL,
        "hashed_password": pwd_context.hash(DEMO_PASSWORD),
        "role": "user",
    },
}

# Failed login attempt tracking (in-memory)
failed_attempts = defaultdict(list)

def is_rate_limited(ip: str) -> bool:
    now = datetime.utcnow()
    attempts = [t for t in failed_attempts[ip] if now - t < timedelta(minutes=15)]
    failed_attempts[ip] = attempts
    return len(attempts) >= 5

def record_failed_attempt(ip: str):
    failed_attempts[ip].append(datetime.utcnow())


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
# ─── OAuth2 Scheme ────────────────────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ─── Models ───────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Login Endpoint ───────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request):
    # Determine client IP (respect X-Forwarded-For if present)
    xff = request.headers.get("x-forwarded-for")
    if xff:
        client_ip = xff.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    # Rate-limit check
    if is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Try again later.",
        )

    email = req.email.strip().lower()
    user = USERS_DB.get(email)
    if not user or not verify_password(req.password, user["hashed_password"]):
        # Record failed attempt for this IP and return 401
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({"sub": email})
    return TokenResponse(access_token=token)


# ─── JWT helpers ──────────────────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ─── Dependency ───────────────────────────────────────────────────────────────
async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    # Authentication disabled: allow anonymous access when no token
    # or when token is invalid. Returns a lightweight user dict.
    if not token:
        return {"email": "anonymous@local"}
    payload = verify_token(token)
    if not payload:
        return {"email": "anonymous@local"}
    return {"email": payload.get("sub")}
