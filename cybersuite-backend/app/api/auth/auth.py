"""
B1 + B2 — JWT Authentication & Auth Endpoint
Demo user: admin@cybersuite.io / demo1234
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
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
USERS_DB = {
    "admin@cybersuite.com": {
        "email": "admin@cybersuite.com",
        "hashed_password": pwd_context.hash("admin123"),
        "role": "admin",
    },
    "demo@cybersuite.com": {
        "email": "demo@cybersuite.com",
        "hashed_password": pwd_context.hash("demo1234"),
        "role": "user",
    },
}


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
async def login(req: LoginRequest):
    email = req.email.strip().lower()
    user = USERS_DB.get(email)
    if not user or not verify_password(req.password, user["hashed_password"]):
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
