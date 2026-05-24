from pydantic import BaseModel


class DashboardSummary(BaseModel):
    month_income_cents: int
    month_expense_cents: int
    month_profit_cents: int
    unpaid_invoice_cents: int
    unpaid_invoice_count: int
    upcoming_subscription_cents: int


class MonthlyPoint(BaseModel):
    month: str
    income_cents: int
    expense_cents: int
    profit_cents: int


class CategoryBreakdownItem(BaseModel):
    category: str
    total_cents: int


class ActivityItem(BaseModel):
    id: str
    type: str
    title: str
    amount_cents: int
    occurred_on: str
    created_at: str


class TrendData(BaseModel):
    direction: str
    percentage: float
    label: str


class DashboardInsights(BaseModel):
    week_expense_cents: int
    prev_week_expense_cents: int
    top_expense_category_name: str | None = None
    top_expense_category_cents: int = 0


class BusinessTrends(BaseModel):
    income: TrendData
    expense: TrendData
    profit: TrendData


class DashboardResponse(BaseModel):
    summary: DashboardSummary
    insights: DashboardInsights
    trends: BusinessTrends | None = None
    trends_month: BusinessTrends | None = None
    recent_income: list[dict]
    recent_expenses: list[dict]
    recent_invoices: list[dict]
    recent_subscriptions: list[dict]
    category_breakdown: list[CategoryBreakdownItem]
    top_expense_categories: list[CategoryBreakdownItem]
    recent_activity: list[ActivityItem]


class ReportsResponse(BaseModel):
    monthly: list[MonthlyPoint]
    category_breakdown: list[CategoryBreakdownItem]
