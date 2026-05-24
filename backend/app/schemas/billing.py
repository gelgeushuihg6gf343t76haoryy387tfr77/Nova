from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    plan: str


class CheckoutResponse(BaseModel):
    checkout_url: str
