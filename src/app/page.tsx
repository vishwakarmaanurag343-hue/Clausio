'use client'

import Link from 'next/link'

const features = [
  {
    icon: "ti-scale",
    title: "Case Intelligence",
    desc:
      "Upload pleadings, evidence and case papers to instantly generate timelines, identify contradictions, surface key legal issues and understand your case before stepping into court.",
  },
  {
    icon: "ti-file-pencil",
    title: "AI Drafting",
    desc:
      "Generate petitions, written statements, affidavits, notices, replies and legal drafts tailored to your matter using AI-assisted legal reasoning.",
  },
  {
    icon: "ti-target-arrow",
    title: "Legal Strategy",
    desc:
      "Receive strategic recommendations, arguments, counter-arguments and actionable next steps based on the facts and procedural stage of your case.",
  },
  {
    icon: "ti-calendar-time",
    title: "Practice Management",
    desc:
      "Manage hearings, deadlines, clients, matters and documents from one organized legal workspace built specifically for advocates.",
  },
  {
    icon: "ti-chart-donut",
    title: "Business Analytics",
    desc:
      "Track revenue, active matters, practice growth, readiness scores and firm performance through intelligent analytics dashboards.",
  },
  {
    icon: "ti-brain",
    title: "AI Legal Workspace",
    desc:
      "Clausio combines analysis, drafting, strategy, hearing preparation and client management into one unified AI-powered legal operating system.",
  },
]

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'Inter', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* NAVBAR */}

      <nav
        className="glass-toolbar"
        style={{
          position: "fixed",
          top: 18,
          left: 24,
          right: 24,
          zIndex: 100,

          height: 72,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          padding: "0 22px",

          borderRadius: 22,

          boxShadow: "0 8px 32px rgba(15,23,42,.06)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            color: "#0f172a",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,

              background:
                "linear-gradient(135deg,#2563eb,#3b82f6)",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              color: "white",
              fontWeight: 700,
              fontSize: 18,

              boxShadow:
                "0 8px 20px rgba(37,99,235,.18)",
            }}
          >
            C
          </div>

          <div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: "-0.4px",
                color: "#0f172a",
              }}
            >
              Clausio
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                marginTop: 2,
              }}
            >
              AI Legal Operating System
            </div>
          </div>
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Link
            href="/login"
            className="glass-button"
            style={{
              padding: "10px 18px",
              textDecoration: "none",
              color: "#334155",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Log in
          </Link>

          <Link
            href="/register"
            style={{
              padding: "11px 22px",

              borderRadius: 16,

              background: "#2563eb",

              color: "#fff",

              fontWeight: 600,

              textDecoration: "none",

              boxShadow:
                "0 10px 24px rgba(37,99,235,.22)",

              transition: ".2s",
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}

      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "170px 32px 120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Ambient Glow */}

        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 50% 15%, rgba(37,99,235,.08), transparent 45%)",
          }}
        />

        {/* Badge */}

        <div
          className="glass-pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 18px",
            color: "#2563eb",
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 34,
          }}
        >
          <i className="ti ti-sparkles" />
          AI-Native Legal Operating System
        </div>

        {/* Heading */}

        <h1
          style={{
            margin: 0,
            maxWidth: 920,
            textAlign: "center",
            fontSize: "clamp(52px,7vw,74px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            color: "#0f172a",
          }}
        >
          The Operating System
          <br />
          for Modern Legal Practice.
        </h1>

        {/* Description */}

        <p
          style={{
            maxWidth: 760,
            textAlign: "center",
            marginTop: 28,
            fontSize: 18,
            color: "#475569",
            lineHeight: 1.9,
          }}
        >
          Analyse cases, generate legal strategy, draft documents,
          prepare for hearings, manage clients and grow your practice—
          all from one intelligent AI-powered legal workspace.
        </p>

        {/* Buttons */}

        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 44,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/register"
            style={{
              padding: "14px 28px",
              borderRadius: 16,
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 10px 24px rgba(37,99,235,.18)",
            }}
          >
            Start Building →
          </Link>

          <Link
            href="/login"
            className="glass-button"
            style={{
              padding: "14px 28px",
              textDecoration: "none",
              color: "#334155",
              fontWeight: 600,
            }}
          >
            Sign In
          </Link>
        </div>

        {/* Dashboard Preview */}

        <div
          className="glass-panel"
          style={{
            width: "100%",
            maxWidth: 1080,
            marginTop: 90,
            padding: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 22,
                  color: "#0f172a",
                }}
              >
                Clausio Workspace
              </div>

              <div
                style={{
                  color: "#64748b",
                  marginTop: 6,
                }}
              >
                Everything you need for your legal practice.
              </div>
            </div>

            <div
              className="glass-pill"
              style={{
                padding: "8px 16px",
                color: "#2563eb",
                fontWeight: 600,
              }}
            >
              AI Ready
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 18,
            }}
          >
            {[
              ["Cases", "12 Active"],
              ["Drafting", "3 Ready"],
              ["Hearings", "Tomorrow"],
              ["Analytics", "91% Score"],
            ].map(([title, value]) => (
              <div
                key={title}
                className="glass-card"
                style={{
                  padding: 22,
                }}
              >
                <div
                  style={{
                    color: "#64748b",
                    fontSize: 14,
                  }}
                >
                  {title}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontWeight: 700,
                    fontSize: 22,
                    color: "#0f172a",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div
            className="glass-card"
            style={{
              marginTop: 22,
              padding: 26,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  AI Analysis Complete
                </div>

                <div
                  style={{
                    color: "#64748b",
                    marginTop: 6,
                  }}
                >
                  Chronology generated • Contradictions detected • Draft suggestions available
                </div>
              </div>

              <div
                style={{
                  color: "#16a34a",
                  fontWeight: 700,
                }}
              >
                ✓ Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CLAUSIO */}

      <section
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "40px 32px 120px",
        }}
      >
        {/* Heading */}

        <div
          style={{
            textAlign: "center",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          <div
            className="glass-pill"
            style={{
              display: "inline-flex",
              padding: "8px 18px",
              color: "#2563eb",
              fontWeight: 600,
              marginBottom: 26,
            }}
          >
            WHY CLAUSIO
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "clamp(34px,5vw,48px)",
              fontWeight: 800,
              letterSpacing: "-1.5px",
              color: "#0f172a",
            }}
          >
            Legal software manages data.
            <br />
            Clausio understands it.
          </h2>

          <p
            style={{
              marginTop: 26,
              fontSize: 18,
              lineHeight: 1.9,
              color: "#475569",
            }}
          >
            Traditional practice management software stores documents,
            calendars and clients.
            Clausio understands your cases, reasons over legal
            information and actively helps you throughout every stage of
            litigation.
          </p>
        </div>

        {/* Glass Highlight */}

        <div
          className="glass-panel"
          style={{
            marginTop: 70,
            padding: 42,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr .8fr",
              gap: 50,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 18,
                }}
              >
                AI becomes your legal associate.
              </div>

              <p
                style={{
                  color: "#475569",
                  lineHeight: 1.9,
                  fontSize: 16,
                }}
              >
                Upload case files, contracts, evidence or pleadings.
                Clausio analyses everything, builds chronology,
                identifies contradictions, generates legal strategies,
                drafts documents and prepares you for hearings—all
                inside one unified workspace.
              </p>
            </div>

            <div
              className="glass-card"
              style={{
                padding: 24,
              }}
            >
              {[
                "✓ Case chronology generated",
                "✓ Contradictions detected",
                "✓ Draft suggestions ready",
                "✓ Hearing strategy prepared",
              ].map(item => (
                <div
                  key={item}
                  style={{
                    padding: "12px 0",
                    color: "#334155",
                    fontWeight: 600,
                    borderBottom:
                      "1px solid rgba(226,232,240,.6)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}

        <div
          style={{
            marginTop: 90,
            marginBottom: 70,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: 36,
              fontWeight: 800,
              marginBottom: 18,
            }}
          >
            One continuous workflow.
          </h2>

          <p
            style={{
              color: "#64748b",
              maxWidth: 650,
              margin: "0 auto",
              lineHeight: 1.8,
            }}
          >
            Clausio accompanies every stage of your legal workflow,
            from the moment documents are uploaded until the hearing
            concludes.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 22,
            marginBottom: 100,
          }}
        >
          {[
            ["01", "Upload"],
            ["02", "Analyse"],
            ["03", "Strategise"],
            ["04", "Draft"],
            ["05", "Appear"],
          ].map(([number, label]) => (
            <div
              key={label}
              className="glass-card"
              style={{
                padding: 28,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#2563eb",
                  fontWeight: 700,
                  fontSize: 13,
                  marginBottom: 18,
                }}
              >
                {number}
              </div>

              <div
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Workspace */}

        <div
          style={{
            textAlign: "center",
            marginBottom: 55,
          }}
        >
          <h2
            style={{
              fontSize: 40,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            Everything in one workspace.
          </h2>

          <p
            style={{
              color: "#64748b",
              maxWidth: 680,
              margin: "0 auto",
              lineHeight: 1.8,
            }}
          >
            Built specifically for advocates, litigation teams and law
            firms—not adapted from generic project management software.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
            gap: 26,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-card"
              style={{
                padding: 30,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background: "rgba(37,99,235,.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 22,
                }}
              >
                <i
                  className={`ti ${f.icon}`}
                  style={{
                    color: "#2563eb",
                    fontSize: 24,
                  }}
                />
              </div>

              <h3
                style={{
                  margin: 0,
                  fontSize: 20,
                  color: "#0f172a",
                }}
              >
                {f.title}
              </h3>

              <p
                style={{
                  marginTop: 14,
                  color: "#475569",
                  lineHeight: 1.8,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
      {/* AI CAPABILITIES */}
      <section
        style={{
          maxWidth: 1240,
          margin: "0 auto 140px",
          padding: "0 32px",
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: "56px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: 760,
              margin: "0 auto 56px",
            }}
          >
            <div
              className="glass-pill"
              style={{
                display: "inline-flex",
                padding: "8px 18px",
                color: "#2563eb",
                fontWeight: 600,
                marginBottom: 22,
              }}
            >
              AI CAPABILITIES
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(34px,5vw,48px)",
                fontWeight: 800,
                letterSpacing: "-1.5px",
                color: "#0f172a",
              }}
            >
              Intelligence built specifically
              <br />
              for legal professionals.
            </h2>

            <p
              style={{
                marginTop: 24,
                color: "#475569",
                fontSize: 17,
                lineHeight: 1.9,
              }}
            >
              Clausio continuously assists throughout the lifecycle of every
              matter—from understanding complex case records to preparing you
              for the courtroom.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 22,
            }}
          >
            {[
              {
                icon: "ti-route",
                title: "Case Chronology",
                desc: "Automatically reconstruct timelines from scattered case records."
              },
              {
                icon: "ti-alert-triangle",
                title: "Contradiction Detection",
                desc: "Highlight inconsistencies across pleadings, evidence and statements."
              },
              {
                icon: "ti-file-pencil",
                title: "AI Drafting",
                desc: "Generate petitions, notices, affidavits and legal documents."
              },
              {
                icon: "ti-target-arrow",
                title: "Strategic Guidance",
                desc: "Receive arguments, counter-arguments and litigation strategies."
              },
              {
                icon: "ti-gavel",
                title: "Hearing Preparation",
                desc: "Prepare with AI-generated notes, issues and courtroom readiness."
              },
              {
                icon: "ti-chart-bar",
                title: "Practice Insights",
                desc: "Track firm performance, revenue, workload and readiness scores."
              },
            ].map((item) => (
              <div
                key={item.title}
                className="glass-card"
                style={{
                  padding: 28,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 18,
                    background: "rgba(37,99,235,.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 22,
                  }}
                >
                  <i
                    className={`ti ${item.icon}`}
                    style={{
                      fontSize: 24,
                      color: "#2563eb",
                    }}
                  />
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    marginTop: 14,
                    color: "#475569",
                    lineHeight: 1.8,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Divider */}

          <div
            style={{
              height: 1,
              background: "rgba(226,232,240,.8)",
              margin: "70px 0",
            }}
          />

          {/* CTA */}

          <div
            style={{
              maxWidth: 760,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(34px,5vw,50px)",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-1.5px",
              }}
            >
              Built for modern legal practice.
            </h2>

            <p
              style={{
                marginTop: 24,
                color: "#475569",
                fontSize: 18,
                lineHeight: 1.9,
              }}
            >
              Whether you're an independent advocate, a growing law firm or
              an enterprise legal team, Clausio becomes the intelligent
              operating system that powers every stage of your practice.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginTop: 42,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/register"
                style={{
                  padding: "15px 28px",
                  borderRadius: 16,
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 10px 24px rgba(37,99,235,.18)",
                }}
              >
                Create Your Workspace
              </Link>

              <Link
                href="/login"
                className="glass-button"
                style={{
                  padding: "15px 28px",
                  textDecoration: "none",
                  color: "#334155",
                  fontWeight: 600,
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* FOOTER */}

      <footer
        style={{
          padding: "0 32px 48px",
        }}
      >
        <div
          className="glass-panel"
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "42px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 48,
            }}
          >
            {/* Brand */}

            <div
              style={{
                maxWidth: 420,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 18,
                    boxShadow: "0 8px 18px rgba(37,99,235,.18)",
                  }}
                >
                  C
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Clausio
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                    }}
                  >
                    AI Legal Operating System
                  </div>
                </div>
              </div>

              <p
                style={{
                  margin: 0,
                  color: "#475569",
                  lineHeight: 1.9,
                  fontSize: 15,
                }}
              >
                Clausio empowers advocates, litigation teams and law firms
                with AI-assisted case analysis, legal drafting, hearing
                preparation, client management and practice intelligence—
                all from one unified workspace.
              </p>
            </div>

            {/* Links */}

            <div
              style={{
                display: "flex",
                gap: 70,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 18,
                    color: "#0f172a",
                  }}
                >
                  Workspace
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    color: "#64748b",
                  }}
                >
                  <span>Case Analysis</span>
                  <span>Drafting</span>
                  <span>Hearings</span>
                  <span>Analytics</span>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 18,
                    color: "#0f172a",
                  }}
                >
                  Account
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <Link
                    href="/login"
                    style={{
                      color: "#64748b",
                      textDecoration: "none",
                    }}
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/register"
                    style={{
                      color: "#64748b",
                      textDecoration: "none",
                    }}
                  >
                    Create Workspace
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}

          <div
            style={{
              marginTop: 42,
              paddingTop: 28,
              borderTop: "1px solid rgba(226,232,240,.9)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 18,
            }}
          >
            <span
              style={{
                color: "#64748b",
                fontSize: 14,
              }}
            >
              © 2026 Clausio. All rights reserved.
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              <span>Built for Modern Legal Practice</span>

              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#2563eb",
                }}
              />

              <span>Powered by AI</span>
            </div>
          </div>
        </div>
      </footer>
      </div> )}