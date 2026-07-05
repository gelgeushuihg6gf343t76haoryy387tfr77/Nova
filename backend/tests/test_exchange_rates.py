from datetime import date, datetime, timezone as tz

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.models.exchange_rates import ExchangeRate
from app.services.exchange_rates import FALLBACK_RATES, ExchangeRateService
from app.db.base import Base


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def svc():
    return ExchangeRateService()


class TestConvert:
    def test_usd_to_mmk(self, db_session, svc):
        from app.models.exchange_rates import ExchangeRate
        db_session.add(ExchangeRate(
            from_currency="USD", to_currency="MMK",
            rate=2100.0, rate_date=date.today()
        ))
        db_session.commit()
        converted, rate = svc.convert(db_session, 50000, "USD", "MMK")
        assert converted == 105000000
        assert rate == 2100.0

    def test_mmk_to_usd(self, db_session, svc):
        from app.models.exchange_rates import ExchangeRate
        db_session.add(ExchangeRate(
            from_currency="MMK", to_currency="USD",
            rate=1.0 / 2100.0, rate_date=date.today()
        ))
        db_session.commit()
        converted, rate = svc.convert(db_session, 21000000, "MMK", "USD")
        expected = round(21000000 * (1.0 / 2100.0))
        assert converted == expected
        assert rate == pytest.approx(1.0 / 2100.0, rel=1e-6)

    def test_usd_to_eur(self, db_session, svc):
        db_session.add(ExchangeRate(
            from_currency="USD", to_currency="EUR",
            rate=0.92, rate_date=date.today()
        ))
        db_session.commit()
        converted, rate = svc.convert(db_session, 10000, "USD", "EUR")
        assert converted == 9200
        assert rate == 0.92

    def test_eur_to_usd(self, db_session, svc):
        db_session.add(ExchangeRate(
            from_currency="EUR", to_currency="USD",
            rate=1.086957, rate_date=date.today()
        ))
        db_session.commit()
        converted, rate = svc.convert(db_session, 5000, "EUR", "USD")
        expected = round(5000 * 1.086957)
        assert converted == expected

    def test_same_currency(self, db_session, svc):
        converted, rate = svc.convert(db_session, 50000, "USD", "USD")
        assert converted == 50000
        assert rate == 1.0

    def test_missing_rate_fallback(self, db_session, svc):
        converted, rate = svc.convert(db_session, 100, "USD", "MMK")
        assert rate > 0
        assert converted == round(100 * rate)

    def test_unknown_currency_fallback(self, db_session, svc):
        converted, rate = svc.convert(db_session, 1000, "XYZ", "ABC")
        assert rate == 1.0
        assert converted == 1000

    def test_cache_is_used(self, db_session, svc):
        db_session.add(ExchangeRate(
            from_currency="USD", to_currency="GBP",
            rate=0.79, rate_date=date.today()
        ))
        db_session.commit()
        converted, rate = svc.convert(db_session, 20000, "USD", "GBP")
        assert converted == 15800
        assert rate == 0.79
        count = db_session.query(ExchangeRate).filter(
            ExchangeRate.from_currency == "USD",
            ExchangeRate.to_currency == "GBP",
        ).count()
        assert count == 1

    def test_convert_with_different_rate_date(self, db_session, svc):
        yesterday = date(2024, 1, 1)
        db_session.add(ExchangeRate(
            from_currency="USD", to_currency="JPY",
            rate=150.0, rate_date=yesterday
        ))
        db_session.commit()
        converted, rate = svc.convert(db_session, 10000, "USD", "JPY", yesterday)
        assert converted == 1500000
        assert rate == 150.0


class TestFallbackRate:
    def test_usd_to_mmk(self, svc):
        rate = svc._fallback_rate("USD", "MMK")
        assert rate == pytest.approx(2100.0, rel=1e-4)

    def test_mmk_to_usd(self, svc):
        rate = svc._fallback_rate("MMK", "USD")
        assert rate == pytest.approx(1.0 / 2100.0, rel=1e-4)

    def test_usd_to_eur(self, svc):
        rate = svc._fallback_rate("USD", "EUR")
        assert rate == pytest.approx(0.92, rel=1e-4)

    def test_eur_to_usd(self, svc):
        rate = svc._fallback_rate("EUR", "USD")
        assert rate == pytest.approx(1.0 / 0.92, rel=1e-4)

    def test_usd_to_thb(self, svc):
        rate = svc._fallback_rate("USD", "THB")
        assert rate == pytest.approx(36.5, rel=1e-4)

    def test_thb_to_mmk(self, svc):
        rate = svc._fallback_rate("THB", "MMK")
        assert rate == pytest.approx(2100.0 / 36.5, rel=1e-4)

    def test_unknown_currency(self, svc):
        rate = svc._fallback_rate("XYZ", "USD")
        assert rate == pytest.approx(1.0, rel=1e-4)


class TestGetRate:
    def test_returns_cached_rate(self, db_session, svc):
        db_session.add(ExchangeRate(
            from_currency="USD", to_currency="SGD",
            rate=1.35, rate_date=date.today()
        ))
        db_session.commit()
        rate = svc.get_rate(db_session, "USD", "SGD")
        assert rate == pytest.approx(1.35, rel=1e-4)

    def test_returns_fallback_when_not_cached(self, db_session, svc):
        rate = svc.get_rate(db_session, "USD", "SGD")
        assert rate > 0

    def test_same_currency(self, db_session, svc):
        rate = svc.get_rate(db_session, "USD", "USD")
        assert rate == 1.0
