import uuid
from pydantic import BaseModel, EmailStr, Field

from app.models import PlanTier
from app.schemas.common import ORMModel


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=6)


class SendResetCodeRequest(BaseModel):
    email: EmailStr


class ResetWithCodeRequest(BaseModel):
    code: str
    email: EmailStr
    password: str = Field(min_length=6)


class ClerkLoginRequest(BaseModel):
    email: str | None = None
    token: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMe(ORMModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    plan: PlanTier
    subscription_status: str
    provider: str | None
