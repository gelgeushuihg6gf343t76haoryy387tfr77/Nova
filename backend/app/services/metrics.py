from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models import Category, Expense, Income, Invoice, InvoiceStatus, Subscription
from app.schemas.dashboard import (
    ActivityItem,
    BusinessTrends,
    CategoryBreakdownItem,
    DashboardInsights,
    DashboardResponse,
    DashboardSummary,
    MonthlyPoint,
    ReportsResponse,
    TrendData,
)


def _total_cents(rows: list[dict], key: str = "converted_amount_cents") -> int:
    return sum(r.get(key) or r.get("amount_cents") or 0 for r in rows)


def _pct_change(current: int, previous: int) -> tuple[str, float]:
    if previous == 0:
        if current == 0:
            return "unchanged", 0.0
        return "up", 100.0
    change = ((current - previous) / previous) * 100
    if change > 1:
        return "up", round(change, 1)
    elif change < -1:
        return "down", round(abs(change), 1)
    return "unchanged", round(change, 1)


def _trend_label(direction: str, metric: str, pct: float) -> str:
    if direction == "up":
        return f"{metric} increased {pct}%"
    elif direction == "down":
        return f"{metric} decreased {pct}%"
    return f"{metric} unchanged"


def dashboard_data(db: Session, business_id) -> DashboardResponse:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=30)
    today = date.today()

    income_rows = db.execute(
        select(Income.amount_cents, Income.converted_amount_cents, Income.created_at)
        .where(and_(Income.business_id == business_id, Income.created_at >= window_start))
    ).all()
    expense_rows = db.execute(
        select(Expense.amount_cents, Expense.converted_amount_cents, Expense.created_at)
        .where(and_(Expense.business_id == business_id, Expense.created_at >= window_start))
    ).all()

    income_total = sum(
        (r.converted_amount_cents or r.amount_cents or 0) for r in income_rows
    )
    expense_total = sum(
        (r.converted_amount_cents or r.amount_cents or 0) for r in expense_rows
    )

    unpaid_invoice_total = db.scalar(
        select(func.coalesce(func.sum(Invoice.amount_cents), 0)).where(
            and_(Invoice.business_id == business_id, Invoice.status.in_([InvoiceStatus.sent, InvoiceStatus.overdue]))
        )
    ) or 0

    unpaid_invoice_count = db.scalar(
        select(func.count()).select_from(Invoice).where(
            and_(Invoice.business_id == business_id, Invoice.status.in_([InvoiceStatus.sent, InvoiceStatus.overdue]))
        )
    ) or 0

    month_start = today.replace(day=1)
    upcoming_subscriptions_total = db.scalar(
        select(func.coalesce(func.sum(Subscription.amount_cents), 0)).where(
            and_(
                Subscription.business_id == business_id,
                Subscription.is_active.is_(True),
                Subscription.next_billing_date >= month_start,
                Subscription.next_billing_date <= today,
            )
        )
    ) or 0

    recent_income = [
        {
            "id": str(item.id),
            "amount_cents": item.amount_cents,
            "occurred_on": item.occurred_on.isoformat(),
            "source": item.source,
            "created_at": item.created_at.isoformat(),
        }
        for item in db.scalars(
            select(Income)
            .where(and_(Income.business_id == business_id, Income.created_at >= window_start))
            .order_by(Income.created_at.desc())
            .limit(6)
        ).all()
    ]
    recent_expenses = [
        {
            "id": str(item.id),
            "amount_cents": item.amount_cents,
            "occurred_on": item.occurred_on.isoformat(),
            "vendor": item.vendor,
            "created_at": item.created_at.isoformat(),
        }
        for item in db.scalars(
            select(Expense)
            .where(and_(Expense.business_id == business_id, Expense.created_at >= window_start))
            .order_by(Expense.created_at.desc())
            .limit(6)
        ).all()
    ]
    recent_invoices = [
        {
            "id": str(item.id),
            "invoice_number": item.invoice_number,
            "client_name": item.client_name,
            "amount_cents": item.amount_cents,
            "status": item.status.value,
        }
        for item in db.scalars(
            select(Invoice)
            .where(and_(Invoice.business_id == business_id, Invoice.created_at >= window_start))
            .order_by(Invoice.created_at.desc())
            .limit(6)
        ).all()
    ]
    recent_subscriptions = [
        {
            "id": str(item.id),
            "vendor": item.vendor,
            "amount_cents": item.amount_cents,
            "next_billing_date": item.next_billing_date.isoformat(),
        }
        for item in db.scalars(
            select(Subscription)
            .where(and_(Subscription.business_id == business_id, Subscription.created_at >= window_start))
            .order_by(Subscription.created_at.desc())
            .limit(6)
        ).all()
    ]

    category_rows = db.execute(
        select(Category.name, func.coalesce(func.sum(Expense.amount_cents), 0).label("total"))
        .select_from(Expense)
        .join(Category, Category.id == Expense.category_id)
        .where(and_(Expense.business_id == business_id, Expense.created_at >= window_start))
        .group_by(Category.name)
        .order_by(func.coalesce(func.sum(Expense.amount_cents), 0).desc())
    ).all()
    category_breakdown = [CategoryBreakdownItem(category=name, total_cents=total or 0) for name, total in category_rows]
    top_expense_categories = category_breakdown[:5]

    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)
    week_rows = db.execute(
        select(Expense.amount_cents, Expense.converted_amount_cents)
        .where(and_(Expense.business_id == business_id, Expense.created_at >= week_start, Expense.created_at < now))
    ).all()
    prev_week_rows = db.execute(
        select(Expense.amount_cents, Expense.converted_amount_cents)
        .where(and_(Expense.business_id == business_id, Expense.created_at >= prev_week_start, Expense.created_at < week_start))
    ).all()

    week_expense_cents = sum((r.converted_amount_cents or r.amount_cents or 0) for r in week_rows)
    prev_week_expense_cents = sum((r.converted_amount_cents or r.amount_cents or 0) for r in prev_week_rows)

    top_name = top_expense_categories[0].category if top_expense_categories else None
    top_cents = top_expense_categories[0].total_cents if top_expense_categories else 0
    insights = DashboardInsights(
        week_expense_cents=week_expense_cents,
        prev_week_expense_cents=prev_week_expense_cents,
        top_expense_category_name=top_name,
        top_expense_category_cents=top_cents,
    )

    month_start = today.replace(day=1)
    prev_month_start = (month_start - timedelta(days=1)).replace(day=1)

    month_rows = db.execute(
        select(Income.amount_cents, Income.converted_amount_cents, Expense.amount_cents, Expense.converted_amount_cents)
        .where(
            and_(
                Income.business_id == business_id,
                Income.created_at >= month_start,
                Income.created_at < window_start + timedelta(days=1),
            )
        )
    ).all()
    prev_month_income_rows = db.execute(
        select(Income.amount_cents, Income.converted_amount_cents)
        .where(and_(Income.business_id == business_id, Income.created_at >= prev_month_start, Income.created_at < month_start))
    ).all()
    prev_month_expense_rows = db.execute(
        select(Expense.amount_cents, Expense.converted_amount_cents)
        .where(and_(Expense.business_id == business_id, Expense.created_at >= prev_month_start, Expense.created_at < month_start))
    ).all()

    current_income = sum((r.converted_amount_cents or r.amount_cents or 0) for r in month_rows)
    current_expense = sum((r.converted_amount_cents or r.amount_cents or 0) for r in month_rows)
    prev_income = sum((r.converted_amount_cents or r.amount_cents or 0) for r in prev_month_income_rows)
    prev_expense = sum((r.converted_amount_cents or r.amount_cents or 0) for r in prev_month_expense_rows)

    trends = BusinessTrends(
        income=TrendData(direction="unchanged", percentage=0.0, label="No data yet"),
        expense=TrendData(direction="unchanged", percentage=0.0, label="No data yet"),
        profit=TrendData(direction="unchanged", percentage=0.0, label="No data yet"),
    )

    if income_total > 0 or (prev_income > 0):
        inc_dir, inc_pct = _pct_change(income_total, prev_income)
        trends.income = TrendData(direction=inc_dir, percentage=inc_pct, label=_trend_label(inc_dir, "Income", inc_pct))

    if expense_total > 0 or (prev_expense > 0):
        exp_dir, exp_pct = _pct_change(expense_total, prev_expense)
        trends.expense = TrendData(direction=exp_dir, percentage=exp_pct, label=_trend_label(exp_dir, "Expenses", exp_pct))

    profit = income_total - expense_total
    prev_profit = prev_income - prev_expense
    if profit != 0 or prev_profit != 0:
        prof_dir, prof_pct = _pct_change(profit, prev_profit)
        trends.profit = TrendData(direction=prof_dir, percentage=prof_pct, label=_trend_label(prof_dir, "Profit", prof_pct))

    activity_rows = []
    activity_rows.extend(
        ActivityItem(
            id=str(x["id"]),
            type="income",
            title=x.get("source") or "Income",
            amount_cents=x["amount_cents"],
            occurred_on=x["occurred_on"],
            created_at=x["created_at"],
        )
        for x in recent_income
    )
    activity_rows.extend(
        ActivityItem(
            id=str(x["id"]),
            type="expense",
            title=x.get("vendor") or "Expense",
            amount_cents=x["amount_cents"],
            occurred_on=x["occurred_on"],
            created_at=x["created_at"],
        )
        for x in recent_expenses
    )
    activity_rows.sort(key=lambda row: row.created_at, reverse=True)

    return DashboardResponse(
        summary=DashboardSummary(
            month_income_cents=income_total,
            month_expense_cents=expense_total,
            month_profit_cents=income_total - expense_total,
            unpaid_invoice_cents=unpaid_invoice_total,
            unpaid_invoice_count=unpaid_invoice_count,
            upcoming_subscription_cents=upcoming_subscriptions_total,
        ),
        insights=insights,
        trends=trends,
        recent_income=recent_income,
        recent_expenses=recent_expenses,
        recent_invoices=recent_invoices,
        recent_subscriptions=recent_subscriptions,
        category_breakdown=category_breakdown,
        top_expense_categories=top_expense_categories,
        recent_activity=activity_rows[:8],
    )


def monthly_report(db: Session, business_id) -> ReportsResponse:
    income_rows = db.execute(select(Income.occurred_on, Income.amount_cents).where(Income.business_id == business_id)).all()
    expense_rows = db.execute(select(Expense.occurred_on, Expense.amount_cents).where(Expense.business_id == business_id)).all()

    income_by_month: dict[str, int] = defaultdict(int)
    expense_by_month: dict[str, int] = defaultdict(int)
    for occurred_on, amount in income_rows:
        income_by_month[occurred_on.strftime("%Y-%m")] += amount
    for occurred_on, amount in expense_rows:
        expense_by_month[occurred_on.strftime("%Y-%m")] += amount

    all_months = sorted(set(income_by_month) | set(expense_by_month))
    monthly = [
        MonthlyPoint(
            month=month,
            income_cents=income_by_month.get(month, 0),
            expense_cents=expense_by_month.get(month, 0),
            profit_cents=income_by_month.get(month, 0) - expense_by_month.get(month, 0),
        )
        for month in all_months
    ]

    category_rows = db.execute(
        select(Category.name, func.coalesce(func.sum(Expense.amount_cents), 0))
        .join(Expense, Expense.category_id == Category.id, isouter=True)
        .where(Category.business_id == business_id)
        .group_by(Category.name)
    ).all()

    category_breakdown = [CategoryBreakdownItem(category=name, total_cents=total or 0) for name, total in category_rows]

    return ReportsResponse(monthly=monthly, category_breakdown=category_breakdown)
