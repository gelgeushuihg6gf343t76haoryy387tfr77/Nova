import logging
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.exchange_rates import ExchangeRate

logger = logging.getLogger("nova")

FALLBACK_RATES: dict[str, float] = {
    "USD": 1.0,
    "MMK": 2100.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "SGD": 1.35,
    "THB": 36.5,
    "INR": 83.5,
    "JPY": 155.0,
    "CNY": 7.25,
    "AUD": 1.54,
    "CAD": 1.37,
    "KRW": 1370.0,
    "MYR": 4.72,
    "VND": 25450.0,
    "PHP": 57.5,
    "TWD": 32.3,
    "AED": 3.67,
    "SAR": 3.75,
    "BDT": 117.0,
    "PKR": 278.0,
    "LKR": 300.0,
    "NPR": 133.0,
    "KHR": 4100.0,
    "LAK": 20700.0,
    "IDR": 16200.0,
    "HKD": 7.82,
    "NZD": 1.66,
    "CHF": 0.89,
    "SEK": 10.6,
    "NOK": 10.8,
    "DKK": 6.9,
    "PLN": 4.0,
    "CZK": 23.0,
    "HUF": 365.0,
    "TRY": 32.3,
    "ZAR": 18.4,
    "MXN": 17.1,
    "BRL": 5.1,
    "NGN": 1480.0,
    "KES": 130.0,
    "EGP": 48.0,
}


class ExchangeRateProvider:
    def fetch_rates(self, base_currency: str = "USD") -> dict[str, float]:
        raise NotImplementedError


class ExchangeRateAPIDotIOProvider(ExchangeRateProvider):
    BASE_URL = "https://api.exchangerate-api.com/v4/latest"

    def fetch_rates(self, base_currency: str = "USD") -> dict[str, float]:
        import urllib.request
        import json

        url = f"{self.BASE_URL}/{base_currency}"
        try:
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                rates = data.get("rates", {})
                if base_currency != "USD":
                    usd_rate = rates.get("USD", 1.0)
                    rates = {k: v / usd_rate for k, v in rates.items()}
                    rates["USD"] = 1.0
                return rates
        except Exception as exc:
            logger.warning("Failed to fetch rates from exchangerate-api.com: %s", exc)
            return {}


class ExchangeRateService:
    def __init__(self, provider: ExchangeRateProvider | None = None):
        self._provider = provider or ExchangeRateAPIDotIOProvider()

    def _rate_key(self, from_currency: str, to_currency: str) -> str:
        return f"{from_currency}_{to_currency}"

    def get_rate(self, db: Session, from_currency: str, to_currency: str, rate_date: date | None = None) -> float:
        if from_currency == to_currency:
            return 1.0

        rate_date = rate_date or date.today()

        self._refresh_rates(db, from_currency.upper())

        cached = db.scalar(
            select(ExchangeRate).where(
                ExchangeRate.from_currency == from_currency.upper(),
                ExchangeRate.to_currency == to_currency.upper(),
                ExchangeRate.rate_date == rate_date,
            )
        )
        if cached:
            return cached.rate

        return self._fallback_rate(from_currency.upper(), to_currency.upper())

    def convert(self, db: Session, amount_cents: int, from_currency: str, to_currency: str, rate_date: date | None = None) -> tuple[int, float]:
        if from_currency == to_currency:
            return amount_cents, 1.0

        rate = self.get_rate(db, from_currency, to_currency, rate_date)
        converted = round(amount_cents / rate) if rate > 0 else amount_cents
        return converted, rate

    def _refresh_rates(self, db: Session, base_currency: str = "USD") -> None:
        today = date.today()
        existing = db.scalar(
            select(ExchangeRate).where(
                ExchangeRate.from_currency == base_currency,
                ExchangeRate.rate_date == today,
            ).limit(1)
        )
        if existing:
            return

        rates = self._provider.fetch_rates(base_currency)
        if not rates:
            logger.info("No remote rates, using fallback for %s", base_currency)
            rates = {}
            if base_currency == "USD":
                for code, rate in FALLBACK_RATES.items():
                    if code != "USD":
                        rates[code] = rate

        for to_currency, rate in rates.items():
            if to_currency == base_currency:
                continue
            if not isinstance(rate, (int, float)) or rate <= 0:
                continue
            row = ExchangeRate(
                from_currency=base_currency,
                to_currency=to_currency,
                rate=round(float(rate), 6),
                rate_date=today,
            )
            db.add(row)
        db.commit()
        logger.info("Cached %d exchange rates for %s", len(rates), base_currency)

    def _fallback_rate(self, from_currency: str, to_currency: str) -> float:
        from_rate = FALLBACK_RATES.get(from_currency.upper(), 1.0)
        to_rate = FALLBACK_RATES.get(to_currency.upper(), 1.0)
        if to_rate == 0:
            return 1.0
        return from_rate / to_rate


exchange_service = ExchangeRateService()
