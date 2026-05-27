import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const sectionStyle = {
  padding: "100px 24px",
  maxWidth: 1100,
  margin: "0 auto",
};

const centerStyle = { textAlign: "center" };

const headlineStyle = {
  fontSize: "clamp(36px, 6vw, 64px)",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  color: "var(--text)",
  margin: 0,
};

const subStyle = {
  fontSize: "clamp(18px, 2.5vw, 22px)",
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  maxWidth: 600,
  margin: "20px auto 0",
};

const ctaRow = { display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" };

const ctaBase = {
  padding: "14px 28px",
  borderRadius: 14,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  border: 0,
  textDecoration: "none",
  transition: "all 200ms cubic-bezier(0.4,0,0.2,1)",
};

export default function LandingPage() {
  const [visible, setVisible] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible((prev) => ({ ...prev, [entry.target.dataset.section]: true }));
          }
        }
      },
      { threshold: 0.15 }
    );
    const els = document.querySelectorAll("[data-section]");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const fadeIn = (key) => ({
    opacity: visible[key] ? 1 : 0,
    transform: visible[key] ? "translateY(0)" : "translateY(24px)",
    transition: "all 600ms cubic-bezier(0.34, 0.55, 0.22, 1)",
  });

  const cardStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: 32,
    transition: "all 200ms cubic-bezier(0.4,0,0.2,1)",
  };

  return (
    <div>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.jpg" alt="" style={{ height: 28, width: 28, borderRadius: 6, objectFit: "cover" }} />
          Nova
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/login" style={{ ...ctaBase, background: "transparent", color: "var(--text)", padding: "10px 20px", fontSize: 14 }}>
            Sign in
          </Link>
          <Link to="/register" style={{ ...ctaBase, background: "var(--btn-bg)", color: "var(--btn-text)", padding: "10px 20px", fontSize: 14 }}>
            Start Free
          </Link>
        </div>
      </nav>

      <section data-section="hero" style={{ ...sectionStyle, ...centerStyle, paddingTop: 80 }}>
        <div style={fadeIn("hero")}>
          <h1 style={headlineStyle}>Know where your<br />money goes.</h1>
          <p style={subStyle}>
            Track income, expenses, invoices, and growth in one simple place.
          </p>
          <div style={ctaRow}>
            <Link
              to="/register"
              style={{ ...ctaBase, background: "var(--btn-bg)", color: "var(--btn-text)" }}
            >
              Start Free
            </Link>
            <Link
              to="/login"
              style={{ ...ctaBase, background: "transparent", color: "var(--text)", border: "1.5px solid var(--border)" }}
            >
              Sign In
            </Link>
          </div>
          <svg viewBox="0 0 1100 520" style={{ marginTop: 60, width: "100%", height: "auto", borderRadius: 20, boxShadow: "var(--shadow-xl)" }}>
            <rect width="1100" height="520" rx="16" fill="var(--card)"/>
            <rect x="0" y="0" width="1100" height="48" rx="16" fill="var(--border)" opacity="0.3"/>
            <circle cx="20" cy="24" r="6" fill="#EF4444" opacity="0.6"/>
            <circle cx="40" cy="24" r="6" fill="#F59E0B" opacity="0.6"/>
            <circle cx="60" cy="24" r="6" fill="#10B981" opacity="0.6"/>
            <text x="110" y="30" fill="var(--text)" fontSize="14" fontWeight="600" fontFamily="var(--font)">Nova Dashboard</text>
            <rect x="920" y="12" width="160" height="28" rx="6" fill="var(--btn-bg)" opacity="0.9"/>
            <text x="940" y="31" fill="var(--btn-text)" fontSize="13" fontWeight="600" fontFamily="var(--font)">Start Free</text>
            <rect x="30" y="70" width="320" height="100" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1"/>
            <text x="50" y="96" fill="var(--muted)" fontSize="11" fontWeight="500" fontFamily="var(--font)">INCOME — LAST 30 DAYS</text>
            <text x="50" y="130" fill="var(--success)" fontSize="28" fontWeight="700" fontFamily="var(--font)">$4,280</text>
            <text x="50" y="152" fill="var(--text-secondary)" fontSize="12" fontFamily="var(--font)">↑ 12% vs last month</text>
            <rect x="380" y="70" width="320" height="100" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1"/>
            <text x="400" y="96" fill="var(--muted)" fontSize="11" fontWeight="500" fontFamily="var(--font)">EXPENSES — LAST 30 DAYS</text>
            <text x="400" y="130" fill="var(--danger)" fontSize="28" fontWeight="700" fontFamily="var(--font)">$2,140</text>
            <text x="400" y="152" fill="var(--text-secondary)" fontSize="12" fontFamily="var(--font)">↓ 5% vs last month</text>
            <rect x="730" y="70" width="340" height="100" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1"/>
            <text x="750" y="96" fill="var(--muted)" fontSize="11" fontWeight="500" fontFamily="var(--font)">PROFIT — LAST 30 DAYS</text>
            <text x="750" y="130" fill="var(--success)" fontSize="28" fontWeight="700" fontFamily="var(--font)">$2,140</text>
            <text x="750" y="152" fill="var(--text-secondary)" fontSize="12" fontFamily="var(--font)">↑ 22% vs last month</text>
            <rect x="30" y="190" width="520" height="300" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1"/>
            <text x="50" y="218" fill="var(--text)" fontSize="16" fontWeight="600" fontFamily="var(--font)">Monthly Overview</text>
            <rect x="50" y="280" width="40" height="100" rx="4" fill="var(--success)" opacity="0.7"/>
            <rect x="110" y="240" width="40" height="140" rx="4" fill="var(--success)" opacity="0.7"/>
            <rect x="170" y="260" width="40" height="120" rx="4" fill="var(--success)" opacity="0.7"/>
            <rect x="230" y="220" width="40" height="160" rx="4" fill="var(--success)" opacity="0.7"/>
            <rect x="290" y="250" width="40" height="130" rx="4" fill="var(--success)" opacity="0.7"/>
            <rect x="350" y="210" width="40" height="170" rx="4" fill="var(--success)" opacity="0.7"/>
            <rect x="410" y="270" width="40" height="110" rx="4" fill="var(--success)" opacity="0.7"/>
            <rect x="470" y="230" width="40" height="150" rx="4" fill="var(--success)" opacity="0.7"/>
            <text x="60" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Jan</text>
            <text x="118" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Feb</text>
            <text x="178" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Mar</text>
            <text x="238" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Apr</text>
            <text x="298" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">May</text>
            <text x="358" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Jun</text>
            <text x="418" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Jul</text>
            <text x="478" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Aug</text>
            <rect x="580" y="190" width="490" height="300" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1"/>
            <text x="600" y="218" fill="var(--text)" fontSize="16" fontWeight="600" fontFamily="var(--font)">Recent Activity</text>
            <rect x="600" y="240" width="440" height="44" rx="8" fill="var(--card-hover)" opacity="0.5"/>
            <circle cx="620" cy="262" r="8" fill="var(--success)" opacity="0.8"/>
            <text x="640" y="266" fill="var(--text)" fontSize="13" fontFamily="var(--font)">Client payment received — $850</text>
            <text x="960" y="266" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Today</text>
            <rect x="600" y="292" width="440" height="44" rx="8" fill="var(--card-hover)" opacity="0.5"/>
            <circle cx="620" cy="314" r="8" fill="var(--danger)" opacity="0.8"/>
            <text x="640" y="318" fill="var(--text)" fontSize="13" fontFamily="var(--font)">Office supplies — $120</text>
            <text x="960" y="318" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Yesterday</text>
            <rect x="600" y="344" width="440" height="44" rx="8" fill="var(--card-hover)" opacity="0.5"/>
            <circle cx="620" cy="366" r="8" fill="var(--success)" opacity="0.8"/>
            <text x="640" y="370" fill="var(--text)" fontSize="13" fontFamily="var(--font)">Freelance project — $2,400</text>
            <text x="950" y="370" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">2 days ago</text>
            <rect x="600" y="396" width="440" height="44" rx="8" fill="var(--card-hover)" opacity="0.5"/>
            <circle cx="620" cy="418" r="8" fill="var(--danger)" opacity="0.8"/>
            <text x="640" y="422" fill="var(--text)" fontSize="13" fontFamily="var(--font)">AWS hosting — $89</text>
            <text x="960" y="422" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">3 days ago</text>
          </svg>
        </div>
      </section>

      <section data-section="simple" style={{ ...sectionStyle, ...centerStyle }}>
        <div style={fadeIn("simple")}>
          <h2 style={{ ...headlineStyle, fontSize: "clamp(28px, 4vw, 44px)" }}>
            Money should be simple.
          </h2>
          <p style={{ ...subStyle, maxWidth: 500 }}>
            Most business software feels complicated. Nova helps you understand your business without learning accounting.
          </p>
          <svg viewBox="0 0 1100 320" style={{ marginTop: 48, width: "100%", height: "auto", borderRadius: 20, boxShadow: "var(--shadow-lg)" }}>
            <rect width="1100" height="320" rx="16" fill="var(--card)"/>
            <rect x="40" y="40" width="320" height="240" rx="16" fill="var(--bg)" stroke="var(--border)" strokeWidth="1"/>
            <rect x="60" y="60" width="280" height="200" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1" strokeDasharray="4"/>
            <text x="120" y="140" fill="var(--muted)" fontSize="14" fontFamily="var(--font)">Add income</text>
            <rect x="100" y="160" width="200" height="36" rx="8" fill="var(--btn-bg)" opacity="0.8"/>
            <text x="140" y="184" fill="var(--btn-text)" fontSize="13" fontWeight="600" fontFamily="var(--font)">+ Record payment</text>
            <rect x="400" y="40" width="320" height="240" rx="16" fill="var(--bg)" stroke="var(--border)" strokeWidth="1"/>
            <rect x="420" y="60" width="280" height="200" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1" strokeDasharray="4"/>
            <text x="460" y="140" fill="var(--muted)" fontSize="14" fontFamily="var(--font)">Track expenses</text>
            <rect x="460" y="160" width="200" height="36" rx="8" fill="var(--btn-bg)" opacity="0.8"/>
            <text x="495" y="184" fill="var(--btn-text)" fontSize="13" fontWeight="600" fontFamily="var(--font)">+ Add expense</text>
            <rect x="760" y="40" width="300" height="240" rx="16" fill="var(--bg)" stroke="var(--border)" strokeWidth="1"/>
            <rect x="780" y="60" width="260" height="200" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1" strokeDasharray="4"/>
            <text x="830" y="120" fill="var(--muted)" fontSize="14" fontFamily="var(--font)">See your</text>
            <text x="830" y="140" fill="var(--muted)" fontSize="14" fontFamily="var(--font)">dashboard</text>
            <rect x="820" y="160" width="180" height="36" rx="8" fill="var(--btn-bg)" opacity="0.8"/>
            <text x="845" y="184" fill="var(--btn-text)" fontSize="13" fontWeight="600" fontFamily="var(--font)">View insights</text>
            <text x="80" y="310" fill="var(--text-secondary)" fontSize="13" textAnchor="middle" fontFamily="var(--font)">
              <tspan x="200">Record income in seconds</tspan>
            </text>
            <text x="560" y="310" fill="var(--text-secondary)" fontSize="13" textAnchor="middle" fontFamily="var(--font)">
              <tspan x="560">Track every expense</tspan>
            </text>
            <text x="910" y="310" fill="var(--text-secondary)" fontSize="13" textAnchor="middle" fontFamily="var(--font)">
              <tspan x="910">Understand your numbers</tspan>
            </text>
          </svg>
        </div>
      </section>

      <section data-section="glance" style={{ ...sectionStyle }}>
        <div style={fadeIn("glance")}>
          <h2 style={{ ...headlineStyle, fontSize: "clamp(28px, 4vw, 44px)", textAlign: "center", marginBottom: 48 }}>
            See your business at a glance.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { icon: "income", label: "Income", desc: "Know what's growing" },
              { icon: "expense", label: "Expenses", desc: "See where your money goes" },
              { icon: "profit", label: "Profit", desc: "Understand your bottom line" },
            ].map((item) => (
              <div key={item.label} style={cardStyle}>
                <svg width="44" height="44" viewBox="0 0 44 44" style={{ marginBottom: 12 }}>
                  {item.icon === "income" && (
                    <>
                      <rect width="44" height="44" rx="12" fill="var(--success)" opacity="0.12"/>
                      <path d="M14 28L22 18L28 24L34 14" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <path d="M28 14H34V20" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </>
                  )}
                  {item.icon === "expense" && (
                    <>
                      <rect width="44" height="44" rx="12" fill="var(--danger)" opacity="0.12"/>
                      <path d="M14 16L22 26L28 20L34 30" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <path d="M28 30H34V24" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </>
                  )}
                  {item.icon === "profit" && (
                    <>
                      <rect width="44" height="44" rx="12" fill="var(--primary)" opacity="0.12"/>
                      <circle cx="22" cy="22" r="10" stroke="var(--primary)" strokeWidth="2.5" fill="none"/>
                      <path d="M22 16V22L26 26" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </>
                  )}
                </svg>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 6px", color: "var(--text)" }}>{item.label}</h3>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 15 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-section="real" style={{ ...sectionStyle, ...centerStyle }}>
        <div style={fadeIn("real")}>
          <h2 style={{ ...headlineStyle, fontSize: "clamp(28px, 4vw, 44px)" }}>
            Built for real businesses.
          </h2>
          <p style={{ ...subStyle, maxWidth: 500 }}>
            Whether you freelance, run a local shop, or sell online, Nova helps you stay organized.
          </p>
          <div
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              textAlign: "left",
            }}
          >
            {[
              { label: "Multi-currency", desc: "Track in MMK, USD, THB, and more. Automatic conversion." },
              { label: "Invoicing", desc: "Create and manage invoices. Know who's paid and who hasn't." },
              { label: "Subscriptions", desc: "Track recurring bills. Never miss a payment." },
              { label: "Trends", desc: "Compare this week with last week. Spot changes early." },
            ].map((item) => (
              <div key={item.label} style={cardStyle}>
                <h4 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 6px", color: "var(--text)" }}>{item.label}</h4>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 14, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-section="trends" style={{ ...sectionStyle }}>
        <div style={fadeIn("trends")}>
          <h2 style={{ ...headlineStyle, fontSize: "clamp(28px, 4vw, 44px)", textAlign: "center" }}>
            Know what's changing.
          </h2>
          <p style={{ ...subStyle, textAlign: "center", maxWidth: 500 }}>
            Compare this week with last week. Compare this month with last month. Spot trends before they become problems.
          </p>
          <div
            style={{
              marginTop: 40,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {[
              { arrow: "↑", color: "#10B981", label: "Income", change: "up 25%" },
              { arrow: "↓", color: "#EF4444", label: "Expenses", change: "down 10%" },
              { arrow: "↑", color: "#10B981", label: "Profit", change: "up 40%" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  ...cardStyle,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 700, color: item.color }}>{item.arrow}</div>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "8px 0 2px" }}>{item.label}</p>
                <p style={{ color: item.color, fontSize: 18, fontWeight: 600, margin: 0 }}>{item.change}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-section="cta" style={{ ...sectionStyle, ...centerStyle, paddingBottom: 120 }}>
        <div style={fadeIn("cta")}>
          <h2 style={{ ...headlineStyle, fontSize: "clamp(28px, 4vw, 44px)" }}>
            Simple from day one.
          </h2>
          <p style={{ ...subStyle, maxWidth: 420 }}>
            No accounting degree required. Start tracking your business in minutes.
          </p>
          <div style={ctaRow}>
            <Link
              to="/register"
              style={{ ...ctaBase, background: "var(--btn-bg)", color: "var(--btn-text)", fontSize: 17, padding: "16px 36px" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <footer
        style={{
          textAlign: "center",
          padding: "32px 24px",
          borderTop: "1px solid var(--border)",
          color: "var(--muted)",
          fontSize: 13,
        }}
      >
        &copy; Nova {new Date().getFullYear()} — Know where your money goes.
      </footer>
    </div>
  );
}
