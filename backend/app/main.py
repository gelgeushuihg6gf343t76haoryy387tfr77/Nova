import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import auth, billing, businesses, categories, dashboard, expenses, income, invoices, reports, subscriptions, transactions
from app.core.config import settings
from app.core.rate_limit import limiter

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("nova")

app = FastAPI(title="Nova API", version="1.4.0", debug=settings.app_debug)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.on_event("startup")
def startup_event() -> None:
    logger.info("Starting %s in %s mode", settings.app_name, settings.app_env)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(status_code=exc.status_code, content={"error": "http_error", "detail": detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    errors = exc.errors()
    if not errors:
        return JSONResponse(status_code=422, content={"error": "validation_error", "detail": "Invalid request"})
    first = errors[0]
    loc = ".".join(str(x) for x in first.get("loc", []) if x != "body")
    msg = first.get("msg", "Invalid request")
    detail = f"{loc}: {msg}" if loc else msg
    return JSONResponse(status_code=422, content={"error": "validation_error", "detail": detail})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, __: Exception):
    logger.exception("Unhandled server exception")
    return JSONResponse(status_code=500, content={"error": "server_error", "detail": "Unexpected server error"})


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(businesses.router, prefix="/businesses", tags=["businesses"])
app.include_router(businesses.router, prefix="/business", tags=["businesses"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(income.router, prefix="/income", tags=["income"])
app.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
app.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
app.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])
app.include_router(transactions.router, prefix="/transactions", tags=["transactions"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}
