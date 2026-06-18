import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function useScrollReveal() {
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
      { threshold: 0.12 }
    );
    const els = document.querySelectorAll("[data-section]");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return visible;
}

function fadeInStyle(visible, key, delay = 0) {
  return {
    opacity: visible[key] ? 1 : 0,
    transform: visible[key] ? "translateY(0)" : "translateY(28px)",
    transition: `all 700ms cubic-bezier(0.34, 0.55, 0.22, 1) ${delay}ms`,
  };
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

const sectionStyle = {
  padding: "100px 24px",
  maxWidth: 1100,
  margin: "0 auto",
};

const centerStyle = { textAlign: "center" };

export default function LandingPage() {
  const visible = useScrollReveal();

  return (
    <div>
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <img src="/logo.png" alt="" />
            Nova
          </div>
          <div className="landing-nav-links">
            <Link to="/login" className="landing-nav-link">Sign in</Link>
            <Link to="/register" className="landing-cta-btn">Start Free</Link>
          </div>
        </div>
      </nav>

      <section data-section="hero" className="landing-hero">
        <div style={fadeInStyle(visible, "hero")}>
          <div className="landing-hero-badge">Simple finance for small businesses</div>
          <h1 className="landing-hero-title">
            Know where your<br />
            <span className="gradient-text">money goes.</span>
          </h1>
          <p className="landing-hero-sub">
            Track income, expenses, invoices, and growth in one simple place.<br />
            No accounting degree required.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="landing-primary-btn">
              Get Started Free
              <ArrowRight />
            </Link>
            <Link to="/login" className="landing-secondary-btn">
              Sign In
            </Link>
          </div>

          <svg className="landing-hero-mockup" viewBox="0 0 1100 520" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--card)" />
                <stop offset="100%" stopColor="var(--card-hover)" />
              </linearGradient>
            </defs>
            <rect width="1100" height="520" rx="16" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
            <rect x="0" y="0" width="1100" height="48" rx="16" fill="color-mix(in srgb, var(--border) 50%, var(--card))" />
            <rect x="0" y="24" width="1100" height="24" fill="color-mix(in srgb, var(--border) 50%, var(--card))" />
            <circle cx="20" cy="24" r="5" fill="#EF4444" opacity="0.7" />
            <circle cx="36" cy="24" r="5" fill="#F59E0B" opacity="0.7" />
            <circle cx="52" cy="24" r="5" fill="#10B981" opacity="0.7" />
            <text x="80" y="30" fill="var(--text)" fontSize="14" fontWeight="600" fontFamily="var(--font)">Nova Dashboard</text>

            <rect x="920" y="10" width="160" height="28" rx="6" fill="var(--btn-bg)" />
            <text x="940" y="29" fill="var(--btn-text)" fontSize="12" fontWeight="600" fontFamily="var(--font)">Start Free</text>

            <rect x="30" y="66" width="320" height="110" rx="12" fill="url(#cardBg)" stroke="var(--border)" strokeWidth="1" />
            <text x="50" y="90" fill="var(--muted)" fontSize="11" fontWeight="600" fontFamily="var(--font)">INCOME — LAST 30 DAYS</text>
            <text x="50" y="126" fill="var(--success)" fontSize="30" fontWeight="700" fontFamily="var(--font)">$4,280</text>
            <rect x="50" y="138" width="64" height="22" rx="20" fill="var(--success-bg)" />
            <text x="54" y="153" fill="var(--success)" fontSize="11" fontWeight="600" fontFamily="var(--font)">↑ 12%</text>

            <rect x="380" y="66" width="320" height="110" rx="12" fill="url(#cardBg)" stroke="var(--border)" strokeWidth="1" />
            <text x="400" y="90" fill="var(--muted)" fontSize="11" fontWeight="600" fontFamily="var(--font)">EXPENSES — LAST 30 DAYS</text>
            <text x="400" y="126" fill="var(--danger)" fontSize="30" fontWeight="700" fontFamily="var(--font)">$2,140</text>
            <rect x="400" y="138" width="64" height="22" rx="20" fill="var(--danger-bg)" />
            <text x="404" y="153" fill="var(--danger)" fontSize="11" fontWeight="600" fontFamily="var(--font)">↓ 5%</text>

            <rect x="730" y="66" width="340" height="110" rx="12" fill="url(#cardBg)" stroke="var(--border)" strokeWidth="1" />
            <text x="750" y="90" fill="var(--muted)" fontSize="11" fontWeight="600" fontFamily="var(--font)">PROFIT — LAST 30 DAYS</text>
            <text x="750" y="126" fill="var(--success)" fontSize="30" fontWeight="700" fontFamily="var(--font)">$2,140</text>
            <rect x="750" y="138" width="70" height="22" rx="20" fill="var(--success-bg)" />
            <text x="754" y="153" fill="var(--success)" fontSize="11" fontWeight="600" fontFamily="var(--font)">↑ 22%</text>

            <rect x="30" y="194" width="520" height="300" rx="12" fill="url(#cardBg)" stroke="var(--border)" strokeWidth="1" />
            <text x="50" y="222" fill="var(--text)" fontSize="16" fontWeight="600" fontFamily="var(--font)">Monthly Overview</text>
            <rect x="50" y="284" width="40" height="100" rx="4" fill="var(--success)" opacity="0.7" />
            <rect x="110" y="244" width="40" height="140" rx="4" fill="var(--success)" opacity="0.7" />
            <rect x="170" y="264" width="40" height="120" rx="4" fill="var(--success)" opacity="0.7" />
            <rect x="230" y="224" width="40" height="160" rx="4" fill="var(--success)" opacity="0.7" />
            <rect x="290" y="254" width="40" height="130" rx="4" fill="var(--success)" opacity="0.7" />
            <rect x="350" y="214" width="40" height="170" rx="4" fill="var(--success)" opacity="0.7" />
            <rect x="410" y="274" width="40" height="110" rx="4" fill="var(--success)" opacity="0.7" />
            <rect x="470" y="234" width="40" height="150" rx="4" fill="var(--success)" opacity="0.7" />
            <text x="60" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Jan</text>
            <text x="118" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Feb</text>
            <text x="178" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Mar</text>
            <text x="238" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Apr</text>
            <text x="298" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">May</text>
            <text x="358" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Jun</text>
            <text x="418" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Jul</text>
            <text x="478" y="420" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Aug</text>

            <rect x="580" y="194" width="490" height="300" rx="12" fill="url(#cardBg)" stroke="var(--border)" strokeWidth="1" />
            <text x="600" y="222" fill="var(--text)" fontSize="16" fontWeight="600" fontFamily="var(--font)">Recent Activity</text>
            <rect x="600" y="244" width="440" height="46" rx="8" fill="color-mix(in srgb, var(--text) 3%, var(--card))" />
            <circle cx="622" cy="267" r="7" fill="var(--success)" opacity="0.8" />
            <text x="642" y="271" fill="var(--text)" fontSize="13" fontFamily="var(--font)">Client payment received — $850</text>
            <text x="960" y="271" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Today</text>
            <rect x="600" y="298" width="440" height="46" rx="8" fill="color-mix(in srgb, var(--text) 3%, var(--card))" />
            <circle cx="622" cy="321" r="7" fill="var(--danger)" opacity="0.8" />
            <text x="642" y="325" fill="var(--text)" fontSize="13" fontFamily="var(--font)">Office supplies — $120</text>
            <text x="960" y="325" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">Yesterday</text>
            <rect x="600" y="352" width="440" height="46" rx="8" fill="color-mix(in srgb, var(--text) 3%, var(--card))" />
            <circle cx="622" cy="375" r="7" fill="var(--success)" opacity="0.8" />
            <text x="642" y="379" fill="var(--text)" fontSize="13" fontFamily="var(--font)">Freelance project — $2,400</text>
            <text x="950" y="379" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">2 days ago</text>
            <rect x="600" y="406" width="440" height="46" rx="8" fill="color-mix(in srgb, var(--text) 3%, var(--card))" />
            <circle cx="622" cy="429" r="7" fill="var(--danger)" opacity="0.8" />
            <text x="642" y="433" fill="var(--text)" fontSize="13" fontFamily="var(--font)">AWS hosting — $89</text>
            <text x="960" y="433" fill="var(--muted)" fontSize="11" fontFamily="var(--font)">3 days ago</text>
          </svg>
        </div>
      </section>

      <section data-section="simple" className="landing-section-alt">
        <div style={fadeInStyle(visible, "simple")}>
          <div className="landing-eyebrow">Simple by design</div>
          <h2 className="landing-section-title">
            Money should be simple.
          </h2>
          <p className="landing-section-sub">
            Most business software feels complicated. Nova helps you understand your business<br />
            without learning accounting.
          </p>
          <div className="landing-feature-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 7l-5-5-5 5" />
                  <path d="M4 20h16" opacity="0.4" />
                </svg>
              </div>
              <h4>Record income</h4>
              <p>Add payments in seconds. Categorize and track every source.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22V2M17 17l-5 5-5-5" />
                  <path d="M4 4h16" opacity="0.4" />
                </svg>
              </div>
              <h4>Track expenses</h4>
              <p>Know where your money goes. Never miss a deduction.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: "var(--primary-subtle)", color: "var(--primary)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4v16h16" />
                  <path d="M4 20l4.5-5.5 4 4L20 7" />
                </svg>
              </div>
              <h4>See insights</h4>
              <p>Understand your trends. Compare weeks and months.</p>
            </div>
          </div>
        </div>
      </section>

      <section data-section="glance" style={sectionStyle}>
        <div style={fadeInStyle(visible, "glance")}>
          <div className="landing-eyebrow" style={{ textAlign: "center" }}>Full visibility</div>
          <h2 className="landing-section-title" style={{ textAlign: "center" }}>
            See your business at a glance.
          </h2>
          <p className="landing-section-sub" style={{ textAlign: "center" }}>
            Everything you need to understand your finances, all in one dashboard.
          </p>
          <div className="landing-feature-grid" style={{ marginTop: 40 }}>
            {[
              {
                icon: "income",
                label: "Income tracking",
                desc: "Know what's growing. Track multiple income sources in any currency.",
              },
              {
                icon: "expense",
                label: "Expense management",
                desc: "See where your money goes. Categorize and analyze spending.",
              },
              {
                icon: "profit",
                label: "Profit & loss",
                desc: "Understand your bottom line. Compare periods and spot trends.",
              },
            ].map((item) => (
              <div key={item.label} className="landing-feature-card landing-feature-card-lg">
                <div className="landing-feature-svg">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    {item.icon === "income" && (
                      <>
                        <rect width="48" height="48" rx="14" fill="var(--success)" opacity="0.12" />
                        <path d="M16 32L24 20L30 26L36 16" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <path d="M30 16H36V22" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </>
                    )}
                    {item.icon === "expense" && (
                      <>
                        <rect width="48" height="48" rx="14" fill="var(--danger)" opacity="0.12" />
                        <path d="M16 16L24 28L30 22L36 32" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <path d="M30 32H36V26" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </>
                    )}
                    {item.icon === "profit" && (
                      <>
                        <rect width="48" height="48" rx="14" fill="var(--primary)" opacity="0.12" />
                        <circle cx="24" cy="24" r="11" stroke="var(--primary)" strokeWidth="2.5" fill="none" />
                        <path d="M24 17V24L28 28" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </>
                    )}
                  </svg>
                </div>
                <h4>{item.label}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-section="features" className="landing-section-alt">
        <div style={fadeInStyle(visible, "features")}>
          <div className="landing-eyebrow">Everything you need</div>
          <h2 className="landing-section-title">
            Built for real businesses.
          </h2>
          <p className="landing-section-sub">
            Whether you freelance, run a local shop, or sell online, Nova helps you stay organized.
          </p>
          <div className="landing-feature-grid landing-feature-grid-4">
            {[
              {
                label: "Multi-currency",
                desc: "Track in MMK, USD, THB, and more. Automatic conversion built in.",
                color: "var(--success)",
              },
              {
                label: "Invoicing",
                desc: "Create and manage invoices. Know who's paid and who hasn't.",
                color: "var(--primary)",
              },
              {
                label: "Subscriptions",
                desc: "Track recurring bills. Never miss a payment or renewal.",
                color: "var(--warning)",
              },
              {
                label: "Trends & reports",
                desc: "Compare this week with last week. Spot changes before they become problems.",
                color: "var(--danger)",
              },
            ].map((item) => (
              <div key={item.label} className="landing-feature-card">
                <div className="landing-feature-icon" style={{ background: `color-mix(in srgb, ${item.color} 12%, transparent)`, color: item.color }}>
                  <CheckIcon />
                </div>
                <h4>{item.label}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-section="testimonials" style={{ ...sectionStyle, ...centerStyle }}>
        <div style={fadeInStyle(visible, "testimonials")}>
          <div className="landing-eyebrow">Trusted by founders</div>
          <h2 className="landing-section-title">
            Loved by business owners.
          </h2>
          <div className="landing-testimonial-grid">
            <div className="landing-testimonial-card">
              <p className="landing-testimonial-text">
                "Nova completely replaced my spreadsheet chaos. I actually understand my numbers now."
              </p>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar" />
                <div>
                  <strong>Alex Chen</strong>
                  <span>Freelance Designer</span>
                </div>
              </div>
            </div>
            <div className="landing-testimonial-card">
              <p className="landing-testimonial-text">
                "Set up my entire business finances in 5 minutes. The multi-currency support is a lifesaver."
              </p>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar" />
                <div>
                  <strong>Sarah Kim</strong>
                  <span>E-commerce Founder</span>
                </div>
              </div>
            </div>
            <div className="landing-testimonial-card">
              <p className="landing-testimonial-text">
                "Finally, a finance tool that doesn't assume I have an accounting degree. Simple and beautiful."
              </p>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar" />
                <div>
                  <strong>Marcus Johnson</strong>
                  <span>Small Business Owner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-section="cta" className="landing-section-cta">
        <div style={fadeInStyle(visible, "cta")}>
          <div className="landing-cta-card">
            <h2>Simple from day one.</h2>
            <p>No accounting degree required. Start tracking your business in minutes.</p>
            <Link to="/register" className="landing-primary-btn landing-primary-btn-lg">
              Get Started Free
              <ArrowRight />
            </Link>
            <p className="landing-cta-footnote">Free forever, no credit card required.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        &copy; Nova {new Date().getFullYear()} — Know where your money goes.
      </footer>
    </div>
  );
}
