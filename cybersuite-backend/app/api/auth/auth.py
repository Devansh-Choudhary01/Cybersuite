"""
B1 + B2 — JWT Authentication & Auth Endpoint
Demo user: admin@cybersuite.io / demo1234
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import settings

# ─── Config ───────────────────────────────────────────────────────────────────
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

router = APIRouter()

# ─── Password Hashing ─────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pre-hashed bcrypt of "demo1234"
DEMO_USER = {
    "email": "admin@cybersuite.io",
    "hashed_password": pwd_context.hash("demo1234"),
}

# ─── OAuth2 Scheme ────────────────────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ─── Models ───────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


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
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"email": payload.get("sub")}


# ─── Login Endpoint ───────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    email = req.email.strip().lower()
    if email != DEMO_USER["email"] or not pwd_context.verify(req.password, DEMO_USER["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    token = create_access_token({"sub": email})
    return TokenResponse(access_token=token)
