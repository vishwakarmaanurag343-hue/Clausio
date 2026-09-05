"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import Lenis from "lenis";

import {
  Briefcase,
  Search,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Sparkles,
  FileUp,
  Check,
  Users2,
  ShieldCheck,
  Scale,
  MessageCircle,
  X,
  Send,
  Gavel,
  Calculator,
  Clock,
  BookOpen,
  ChevronRight,
  Play,
  Pause,
  Sliders,
  Award,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Copy,
  Sparkle,
} from "lucide-react";

/* Contact emails — configured via env (see .env.local) */
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@clausiotech.com";
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@clausiotech.com";
const SALES_EMAIL = process.env.NEXT_PUBLIC_SALES_EMAIL || "sales@clausiotech.com";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@clausiotech.com";

/* Auth pages live on this landing site (they talk to the shared backend) */
const SIGNUP_URL = "/signup";
const SIGNIN_URL = "/login";

const sidebarNavItems = [

  { id: "hero", label: "Start" },
  { id: "intro", label: "Overview" },
  { id: "features", label: "Features" },
  { id: "demo", label: "Product Tour" },
  { id: "intelligence", label: "Intelligence" },
  { id: "how-it-works", label: "How It Works" },
  { id: "why-clausio", label: "Why Clausio" },
  { id: "pricing", label: "Pricing" },
  { id: "team", label: "Our Team" },
  { id: "about", label: "Built for Advocates" },
  { id: "cta", label: "Get Started" },
];

/* ============================================================= */
/* HERO FLOATING PARTICLES (subtle depth)                        */
/* ============================================================= */
const HERO_PARTICLES = [
  { x: 8, y: 20, size: 4, opacity: 0.14, dur: 4, delay: 0 },
  { x: 15, y: 60, size: 5, opacity: 0.18, dur: 6, delay: 1 },
  { x: 22, y: 35, size: 6, opacity: 0.12, dur: 5, delay: 2 },
  { x: 30, y: 75, size: 4, opacity: 0.2, dur: 7, delay: 0.5 },
  { x: 40, y: 15, size: 7, opacity: 0.15, dur: 4.5, delay: 1.5 },
  { x: 48, y: 55, size: 5, opacity: 0.22, dur: 6.5, delay: 0.2 },
  { x: 58, y: 30, size: 6, opacity: 0.13, dur: 5.5, delay: 2.5 },
  { x: 65, y: 70, size: 4, opacity: 0.17, dur: 8, delay: 1 },
  { x: 72, y: 20, size: 5, opacity: 0.19, dur: 4, delay: 0 },
  { x: 80, y: 50, size: 6, opacity: 0.12, dur: 6, delay: 1.8 },
  { x: 88, y: 65, size: 5, opacity: 0.16, dur: 7, delay: 0.7 },
  { x: 93, y: 35, size: 4, opacity: 0.21, dur: 5, delay: 2.2 },
];

/* ============================================================= */
/* HOW IT WORKS — three-step workflow                            */
/* ============================================================= */
const WORKFLOW_STEPS = [
  {
    icon: FileUp,
    tag: "STEP 01",
    title: "Upload Your Case",
    color: "#2563eb",
    desc: "Add your FIR, pleadings, agreements, and documents. Clausio reads and understands every page.",
  },
  {
    icon: Sparkles,
    tag: "STEP 02",
    title: "AI Analyses Everything",
    color: "#7c3aed",
    desc: "Clausio identifies contradictions, builds timelines, finds relevant SC judgments from the eCourts database, and flags risks.",
  },
  {
    icon: FileText,
    tag: "STEP 03",
    title: "Generate Court Documents",
    color: "#16a34a",
    desc: "One click produces bail applications, plaints, written statements, maintenance applications — ready to file.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-30 bg-[#f8fafc] py-24 px-6 border-t border-[#3A2E26]/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-[#2563eb] mb-3">
            02.5 / WORKFLOW
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#0f172a] leading-[1.1]">
            Three steps to a
            <br />
            court-ready case
          </h2>
        </motion.div>

        <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-3">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.tag}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  viewport={{ once: false, amount: 0.3 }}
                  className="flex-1 bg-white rounded-2xl p-8 border-l-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)]"
                  style={{ borderLeftColor: step.color }}
                >
                  <Icon className="w-8 h-8" style={{ color: step.color }} />
                  <div
                    className="mt-4 text-[11px] uppercase tracking-[0.2em] font-mono font-bold"
                    style={{ color: step.color }}
                  >
                    {step.tag}
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-[#0f172a]">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-600" style={{ lineHeight: 1.7 }}>
                    {step.desc}
                  </p>
                </motion.div>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div className="hidden md:flex items-center justify-center text-3xl text-[#94a3b8] shrink-0 select-none">
                    →
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================= */
/* PRICING — monthly / annual toggle, three plans               */
/* ============================================================= */
const PRICING_PLANS = [
  {
    name: "Starter",
    monthly: "Rs. 1,999/mo",
    annual: "Rs. 1,599/mo",
    annualBilled: "billed Rs. 19,190/yr",
    description: "Perfect for solo advocates",
    features: [
      "Up to 10 active cases",
      "20 AI document drafts per month",
      "Basic legal research",
      "Hearing calendar",
      "Client management",
      "Email support",
    ],
    cta: "Coming Soon",
    comingSoon: true,
    highlighted: false,
  },
  {
    name: "Professional",
    monthly: "Rs. 4,999/mo",
    annual: "Rs. 3,999/mo",
    annualBilled: "billed Rs. 47,990/yr",
    description: "For established advocates",
    features: [
      "Unlimited active cases",
      "Unlimited AI document drafts",
      "RAG judgment search (eCourts database)",
      "Advanced legal research",
      "Evidence graph",
      "Cross-examination preparation",
      "Financial calculators",
      "Up to 3 team members",
      "Priority support",
    ],
    cta: "Coming Soon",
    comingSoon: true,
    highlighted: true,
  },
  {
    name: "Enterprise",
    monthly: "Custom",
    annual: "Custom",
    annualBilled: "",
    description: "For law firms and legal teams",
    features: [
      "Everything in Professional",
      "Unlimited team members",
      "White label option",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    comingSoon: false,
    highlighted: false,
  },
];

function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section
      id="pricing"
      className="relative z-30 min-h-screen py-24 px-8 md:px-16 xl:pl-56 xl:pr-24 border-t border-[#3A2E26]/10 flex flex-col justify-center"
    >
      <div className="max-w-6xl mx-auto w-full space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false, amount: 0.3 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#fef9c3",
              border: "1px solid #fde047",
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 700,
              color: "#a16207",
              marginBottom: 16,
            }}
          >
            🚀 Free access available during launch — paid plans coming soon
          </div>
          <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-[#6B5A4B] flex items-center justify-center space-x-2">
            <span className="px-2 py-0.5 rounded skeuo-inset text-[10px]">05</span>
            <span>PRICING</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-serif tracking-tight text-[#1E1712] skeuo-text-embossed">
            Simple, transparent pricing
          </h2>
          <p className="text-base font-sans text-[#4A3D33] leading-relaxed">
            Start free. Upgrade when you&apos;re ready.
          </p>

          {/* Monthly / Annual toggle */}
          <div className="flex items-center space-x-3 pt-2">
            <div className="flex items-center space-x-1 p-1 rounded-full skeuo-inset">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] font-semibold transition-all ${
                  !isAnnual ? "skeuo-btn-primary" : "text-[#5C4D3F] hover:text-[#1E1712]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] font-semibold transition-all ${
                  isAnnual ? "skeuo-btn-primary" : "text-[#5C4D3F] hover:text-[#1E1712]"
                }`}
              >
                Annual
              </button>
            </div>
            <span className="px-3 py-1 rounded-full skeuo-inset text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-[#0369A1]">
              Save 20%
            </span>
          </div>
        </motion.div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PRICING_PLANS.map((plan, idx) => {
            const price = isAnnual ? plan.annual : plan.monthly;
            const featured = plan.highlighted;
            return (
              <div
                key={plan.name}
                className={featured ? "relative rounded-3xl p-[2px] md:-mt-4 md:mb-[-1rem]" : "h-full"}
                style={
                  featured
                    ? {
                        background:
                          "linear-gradient(135deg, #2563eb, #818cf8, #38bdf8, #2563eb)",
                        backgroundSize: "300% 300%",
                        animation: "gradient-border 4s ease infinite",
                      }
                    : undefined
                }
              >
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: false }}
                className={`relative p-8 rounded-2xl skeuo-card flex flex-col h-full ${
                  featured
                    ? "shadow-[0_28px_60px_-12px_rgba(2,132,199,0.35)]"
                    : ""
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] skeuo-btn-primary">
                    Most Popular
                  </span>
                )}

                <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-[#6B5A4B] mb-4">
                  {plan.name}
                </div>

                <div className="flex items-end space-x-1">
                  <span className="text-4xl font-serif font-bold text-[#1E1712] skeuo-text-embossed leading-none">
                    {price}
                  </span>
                </div>
                {isAnnual && plan.annualBilled && (
                  <div className="mt-2 text-[11px] font-mono text-[#7A6959]">{plan.annualBilled}</div>
                )}

                <p className="mt-3 text-xs text-[#524337] font-sans leading-relaxed">
                  {plan.description}
                </p>

                <div className="my-6 h-px bg-[#3A2E26]/10" />

                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs text-[#3C2F25] font-sans leading-relaxed">
                      <span className="mt-[1px] w-4 h-4 rounded-full skeuo-inset flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-[#0369A1]" />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() =>
                    window.open(
                      plan.comingSoon
                        ? `mailto:${SUPPORT_EMAIL}?subject=Early Access Request — Clausio`
                        : `mailto:${SALES_EMAIL}?subject=Enterprise Plan Enquiry`,
                      "_blank"
                    )
                  }
                  title={plan.comingSoon ? "Paid plans coming soon" : undefined}
                  className={`mt-8 w-full px-6 py-3 rounded-full text-[11px] font-mono uppercase tracking-[0.2em] font-semibold ${
                    plan.comingSoon
                      ? "text-white"
                      : featured
                      ? "skeuo-btn-primary"
                      : "skeuo-btn-secondary"
                  }`}
                  style={
                    plan.comingSoon
                      ? { background: "#64748b", opacity: 0.7, cursor: "default" }
                      : undefined
                  }
                >
                  {plan.cta}
                </button>
              </motion.div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] font-mono text-[#7A6959] leading-relaxed">
          All prices include 18% GST. Cancel anytime. Data stored in AWS Mumbai.
        </p>
      </div>
    </section>
  );
}

/* ============================================================= */
/* LEGAL DOCUMENT TICKER (hero) + COURTS MARQUEE (post how-it-works) */
/* ============================================================= */
const TICKER_ITEMS = [
  "Bail Application",
  "Anticipatory Bail",
  "Written Statement",
  "Legal Notice",
  "Consumer Complaint",
  "Writ Petition",
  "GST Appeal",
  "Divorce Petition",
  "Arbitration Notice",
  "RERA Complaint",
  "Maintenance Application",
  "Plaint",
  "Section 138 Complaint",
  "Affidavit",
  "Stay Application",
  "Contempt Petition",
];

const COURT_PILLS_ROW1 = [
  "Case Management",
  "Legal Research",
  "AI Document Drafting",
  "Hearing Preparation",
  "Evidence Analysis",
  "Financial Calculators",
  "Contradiction Detection",
  "Risk Assessment",
  "Client Management",
  "Billing & Invoicing",
];

const COURT_PILLS_ROW2 = [
  "Bail Applications",
  "Divorce Petitions",
  "Maintenance Applications",
  "Legal Notices",
  "Consumer Complaints",
  "GST Appeals",
  "Writ Petitions",
  "Arbitration Notices",
  "RERA Complaints",
  "Cheque Bounce Cases",
];

function CourtsMarquee() {
  const pill =
    "shrink-0 rounded-full bg-white border border-[#e2e8f0] px-4 py-1.5 text-xs font-medium text-[#374151] shadow-[0_1px_4px_rgba(0,0,0,0.06)]";
  return (
    <section className="relative z-30 bg-[#f8fafc] border-y border-[#e2e8f0] py-12 overflow-hidden">
      <p className="text-[#64748b] text-sm text-center mb-8">
        Every document type. Every case category. One platform.
      </p>
      <div className="space-y-4">
        <div className="overflow-hidden">
          <div className="row-left flex gap-3 w-max">
            {[...COURT_PILLS_ROW1, ...COURT_PILLS_ROW1].map((c, i) => (
              <span key={i} className={pill}>
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="row-right flex gap-3 w-max">
            {[...COURT_PILLS_ROW2, ...COURT_PILLS_ROW2].map((c, i) => (
              <span key={i} className={pill}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================= */
/* TYPEWRITER DOCUMENT WINDOW (features)                          */
/* ============================================================= */
const DRAFT_DOCS = [
  `IN THE HON'BLE SESSIONS COURT
Bail Application No. ___ of 2026

APPLICATION UNDER SECTION 439 CrPC

The Applicant is in custody since
DD.MM.YYYY. The triple test is satisfied:
(i) No flight risk — permanent resident...
(ii) No tampering risk — charge sheet filed...
(iii) No repeat offence — clean record...`,
  `LEGAL NOTICE

Under instructions from my client,
you are hereby called upon to pay
Rs. 4,50,000/- (Rupees Four Lakhs
Fifty Thousand Only) within 15 days
of receipt of this notice.

Failing which, legal proceedings shall
be initiated without further notice...`,
  `APPLICATION UNDER SECTION 24 HMA

The Respondent earns Rs. 1,20,000/-
per month. Applying Rajnesh v. Neha,
(2020) 14 SCC 1:
Minimum maintenance: Rs. 30,000/-
Recommended: Rs. 48,000/-
The Applicant prays for Rs. 45,000/-
per month pending disposal...`,
];

const DOC_LABELS = [
  "Bail Application · Sessions Court",
  "Legal Notice · Pre-Litigation",
  "Maintenance Application · Section 24 HMA",
];

const DOC_DURATION = 8000;
const TYPE_SPEED = 30;

function TypewriterWindow() {
  const [currentDoc, setCurrentDoc] = useState(0);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    const full = DRAFT_DOCS[currentDoc];
    setDisplayedText("");
    let i = 0;
    const typer = setInterval(() => {
      i += 1;
      setDisplayedText(full.slice(0, i));
      if (i >= full.length) clearInterval(typer);
    }, TYPE_SPEED);
    return () => clearInterval(typer);
  }, [currentDoc]);

  useEffect(() => {
    const cycle = setInterval(() => {
      setCurrentDoc((d) => (d + 1) % DRAFT_DOCS.length);
    }, DOC_DURATION);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div className="mt-12 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-[#2563eb]">
          DRAFTING NOW
        </span>
        <span className="font-mono text-[11px] text-[#64748b] font-medium">
          {DOC_LABELS[currentDoc]}
        </span>
      </div>
      <div className="rounded-2xl bg-white border border-[#e2e8f0] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28ca41" }} />
          </div>
          <div className="flex-1 text-center font-mono text-[11px] text-[#64748b]">
            Clausio · AI Draft Studio
          </div>
          <div className="w-[54px]" />
        </div>
        {/* Content */}
        <div className="p-6 bg-white">
          <pre
            className="font-mono text-[13px] text-[#374151] whitespace-pre-wrap min-h-[240px] m-0"
            style={{ lineHeight: 1.8 }}
          >
            {displayedText}
            <span className="doc-cursor text-[#2563eb]">|</span>
          </pre>
        </div>
        {/* Progress bar */}
        <div className="h-[3px] w-full bg-[#e2e8f0]">
          <div key={currentDoc} className="doc-progress h-full bg-[#2563eb]" />
        </div>
      </div>
      <p className="text-[#64748b] text-xs text-center mt-3">
        Watching Clausio draft in real time ↑
      </p>
    </div>
  );
}

/* ============================================================= */
/* SCRAMBLE TEXT (CTA heading)                                    */
/* ============================================================= */
function ScrambleText({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false, margin: "-100px" });
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  useEffect(() => {
    if (!inView) return;
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, idx) => {
            if (idx < iteration) return char;
            if (char === " " || char === ".") return char;
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      iteration += 0.5;
      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplay(text);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [inView, text]);

  return <span ref={ref}>{display}</span>;
}

/* ============================================================= */
/* ANIMATED WHY-CLAUSIO CARD ICONS                                */
/* ============================================================= */
function WhyClausioIcon({ idx }: { idx: number }) {
  const box: React.CSSProperties = { width: 40, height: 40, marginBottom: 12 };

  if (idx === 0) {
    return (
      <div style={box}>
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="22" width="24" height="4" rx="2" fill="#2563eb" opacity="0.3" />
          <rect
            x="8"
            y="16"
            width="24"
            height="4"
            rx="2"
            fill="#2563eb"
            opacity="0.6"
            style={{ animation: "stack-files 2s ease-in-out infinite" }}
          />
          <rect
            x="8"
            y="10"
            width="24"
            height="4"
            rx="2"
            fill="#2563eb"
            style={{ animation: "stack-files 2s ease-in-out 0.3s infinite" }}
          />
        </svg>
      </div>
    );
  }

  if (idx === 1) {
    return (
      <div style={box}>
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <line
            x1="20"
            y1="20"
            x2="20"
            y2="8"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transformOrigin: "20px 20px",
              animation: "sweep-needle 1.5s ease-in-out infinite alternate",
            }}
          />
          <circle cx="20" cy="20" r="2.5" fill="#2563eb" />
        </svg>
      </div>
    );
  }

  if (idx === 2) {
    return (
      <div style={box}>
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          {[
            { x1: 8, y1: 20, x2: 14, y2: 26, delay: "0s" },
            { x1: 14, y1: 26, x2: 24, y2: 14, delay: "0.3s" },
          ].map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#16a34a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="30"
              strokeDashoffset="30"
              style={{ animation: `check-appear 0.6s ease ${line.delay} infinite alternate` }}
            />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div style={box}>
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="8" fill="none" stroke="#7c3aed" strokeWidth="2" />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <rect
            key={i}
            x="19"
            y="5"
            width="2"
            height="6"
            rx="1"
            fill="#7c3aed"
            opacity="0.6"
            style={{
              transformOrigin: "20px 20px",
              transform: `rotate(${angle}deg)`,
              animation: "gear-spin 4s linear infinite",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ============================================================= */
/* FLOATING FAQ CHAT — rule-based, answers common questions       */
/* ============================================================= */
type Faq = { q: string; a: string; keywords: string[] };

const FAQS: Faq[] = [
  {
    q: "What is Clausio?",
    a: "Clausio is an AI litigation workspace built for Indian advocates. It brings your cases, hearings, legal research, document drafting and client records into one place, and uses AI to draft court-ready documents, build timelines and flag contradictions.",
    keywords: ["what is", "what does", "about clausio", "explain", "overview"],
  },
  {
    q: "Who is Clausio for?",
    a: "Practising advocates enrolled with Bar Councils across India — solo practitioners, chamber juniors and small firms handling criminal, civil, family, consumer, cheque-bounce and matrimonial matters.",
    keywords: ["who is it for", "who can use", "eligible", "bar council", "students", "for whom"],
  },
  {
    q: "Is my client data safe and confidential?",
    a: "Yes. Data is encrypted in transit and at rest and stored in AWS Mumbai (ap-south-1), aligned with the Information Technology Act, 2000. You control who has access, and your files are never sold or shared. You remain responsible for your own privilege and confidentiality obligations.",
    keywords: ["data", "safe", "secure", "security", "privacy", "confidential", "encrypt", "gdpr", "server", "store"],
  },
  {
    q: "Does the AI give legal advice?",
    a: "No. Clausio drafts, summarises and surfaces material to speed up your work. Every output must be checked and settled by the advocate — it does not replace professional judgement and does not create an advocate–client relationship with Clausio.",
    keywords: ["legal advice", "advice", "reliable", "accurate", "trust", "hallucinate", "wrong", "mistake", "replace lawyer"],
  },
  {
    q: "Which courts and matters are supported?",
    a: "High Courts and District/Sessions Courts, Family Courts, Consumer Commissions, and tribunals such as NCLT, ITAT, GST and RERA. Drafts follow Indian High Court and District Court filing standards.",
    keywords: ["court", "tribunal", "jurisdiction", "matter", "high court", "district", "sessions", "family", "consumer", "nclt", "supreme"],
  },
  {
    q: "What documents can it draft?",
    a: "Bail and anticipatory-bail applications, plaints, written statements, legal notices, Section 138 NI Act complaints, maintenance applications (Section 24 HMA / Section 125 CrPC), writ petitions, affidavits, arbitration notices and more — all editable before you file.",
    keywords: ["draft", "document", "bail", "notice", "plaint", "petition", "affidavit", "138", "maintenance", "written statement", "generate"],
  },
  {
    q: "Does it do legal research and judgment search?",
    a: "Yes — fast case-law, precedent and citation search. Judgment search over the eCourts database is available on the Professional and Enterprise plans.",
    keywords: ["research", "judgment", "judgement", "precedent", "citation", "ecourts", "case law", "rag"],
  },
  {
    q: "Can it read my existing case files?",
    a: "Yes. Upload FIRs, pleadings, orders, agreements and exhibits — Clausio reads every page, builds a timeline, cross-references marked exhibits and flags evidentiary contradictions.",
    keywords: ["upload", "read", "pdf", "fir", "existing", "import", "scan", "bundle", "file"],
  },
  {
    q: "How much does Clausio cost?",
    a: "Starter is Rs. 1,999/mo, Professional is Rs. 4,999/mo, and Enterprise is custom-priced. Annual billing saves about 20%. All prices include 18% GST. Open the Pricing section for the full breakdown.",
    keywords: ["price", "cost", "pricing", "plan", "subscription", "fee", "gst", "how much", "charges", "rupees"],
  },
  {
    q: "Is there a free trial?",
    a: `You can start free and upgrade when you are ready. For a guided walkthrough, book a demo at ${DEMO_EMAIL}.`,
    keywords: ["free", "trial", "demo", "try", "test drive"],
  },
  {
    q: "Can my team use it?",
    a: "The Professional plan includes up to 3 team members. Enterprise adds unlimited members, white-label options, a dedicated account manager and an SLA.",
    keywords: ["team", "firm", "members", "colleagues", "seats", "juniors", "office", "multiple users"],
  },
  {
    q: "How do I get started?",
    a: "Click \"Get Started\" anywhere on this page to open the signup form — you get 50 free AI credits instantly, no card needed. Already have an account? Use the \"Sign In\" link in the top bar.",
    keywords: ["get started", "start", "login", "log in", "sign up", "signup", "register", "account", "onboard"],
  },
  {
    q: "Is Clausio a law firm?",
    a: "No. Clausio is a software tool, not a law firm. It does not practise law or represent clients, and the advocate remains solely responsible for every filing and every piece of advice given to a client.",
    keywords: ["law firm", "represent", "liability", "responsible", "who is liable", "practise law"],
  },
];

type ChatMsg = { role: "bot" | "user"; text: string };

function FaqChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "bot",
      text: "Hi — I'm the Clausio assistant. Ask me a common question, or pick one below.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const answerFor = (text: string) => {
    const t = text.toLowerCase();
    const exact = FAQS.find((f) => f.q.toLowerCase() === t);
    if (exact) return exact.a;
    const hit = FAQS.find((f) => f.keywords.some((k) => t.includes(k)));
    return (
      hit?.a ??
      `I can help with what Clausio is, pricing, data security, supported courts, document drafting, research and getting started. For anything else, email ${CONTACT_EMAIL}.`
    );
  };

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }, { role: "bot", text: answerFor(q) }]);
    setInput("");
  };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close help chat" : "Open help chat"}
        className="fixed bottom-6 right-6 z-[55] w-14 h-14 rounded-full skeuo-btn-primary flex items-center justify-center hidden md:flex"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-24 right-6 z-[55] w-[min(92vw,380px)] max-h-[72vh] rounded-2xl skeuo-card flex flex-col overflow-hidden hidden md:flex"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3A2E26]/10 bg-[#F5FAFF]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full skeuo-inset flex items-center justify-center text-[#0369A1]">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div className="leading-tight">
                  <div className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#1E1712]">
                    Clausio · Help
                  </div>
                  <div className="text-[10px] font-mono text-[#7A6959]">Answers to common questions</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-[#7A6959] hover:text-[#1E1712]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              data-lenis-prevent
              className="flex-1 min-h-0 h-[46vh] overflow-y-auto overscroll-contain px-4 py-4 space-y-2.5 bg-white"
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[86%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed font-sans shadow-sm ${
                      m.role === "user"
                        ? "bg-[#2563eb] text-white rounded-br-sm"
                        : "bg-[#f1f5f9] text-[#0f172a] border border-[#e2e8f0] rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Common questions */}
            <div className="border-t border-[#e2e8f0] bg-[#F5FAFF] px-4 pt-2.5 pb-2">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold text-[#7A6959] mb-1.5">
                Common questions
              </div>
              <div
                data-lenis-prevent
                className="flex flex-wrap gap-1.5 max-h-[92px] overflow-y-auto overscroll-contain"
              >
                {FAQS.map((f) => (
                  <button
                    key={f.q}
                    onClick={() => ask(f.q)}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#e2e8f0] text-[10px] font-medium text-[#334155] hover:border-[#2563eb]/40 hover:text-[#2563eb] transition-colors text-left"
                  >
                    {f.q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex items-center gap-2 px-4 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a question…"
                className="flex-1 px-3 py-2 rounded-full skeuo-inset text-xs font-sans text-[#1E1712] placeholder:text-[#9A8B7B] outline-none"
              />
              <button
                type="submit"
                aria-label="Send"
                className="w-9 h-9 rounded-full skeuo-btn-primary flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="px-4 pb-3 text-[9px] font-mono text-[#9A8B7B] leading-relaxed">
              Clausio is a software tool, not a law firm. Responses here are general information, not legal advice.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================= */
/* TEAM AVATAR — photo from /public/team, falls back to initials  */
/* ============================================================= */
function TeamAvatar({
  member,
}: {
  member: { name: string; initials: string; color: string; photo?: string };
}) {
  const [imgError, setImgError] = useState(false);
  const showImg = Boolean(member.photo) && !imgError;

  return (
    <div className="relative mb-4">
      {/* Outer gradient ring */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          padding: 3,
          background: `linear-gradient(135deg, ${member.color}, ${member.color}88)`,
        }}
      >
        {showImg ? (
          <img
            src={member.photo}
            alt={member.name}
            onError={() => setImgError(true)}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid #fff",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${member.color}22, ${member.color}44)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              color: member.color,
              fontFamily: "serif",
              border: "3px solid #fff",
            }}
          >
            {member.initials}
          </div>
        )}
      </div>

      {/* Online dot */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 4,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#22c55e",
          border: "2px solid #fff",
        }}
      />
    </div>
  );
}

/* ============================================================= */
/* PRODUCT TOUR — animated live-mockup demo with interactive legal tools */
/* ============================================================= */

const DEMO_FEATURES = [
  {
    id: 'dashboard',
    icon: '🏠',
    label: 'Dashboard',
    color: '#2563eb',
    title: 'Smart Case Dashboard',
    stamp: 'ADVOCATE SUITE',
    description:
      'See all your cases, upcoming hearings, pending deadlines and credit balance — all in one place.',
    mockup: [
      { type: 'stat', label: 'Active Cases', value: '12', color: '#2563eb', trend: '+2 this month' },
      { type: 'stat', label: 'This Week', value: '3', color: '#7c3aed', trend: 'High Court & Sessions' },
      { type: 'stat', label: 'AI Credits', value: '47', color: '#16a34a', trend: 'Refreshes Oct 1' },
      { type: 'hearing', text: 'Sharma vs State — Sessions Court', date: 'Tomorrow 10:30 AM', urgency: 'High' },
      { type: 'hearing', text: 'Gupta Divorce — Family Court', date: 'Sep 18, 2026', urgency: 'Normal' },
      { type: 'hearing', text: 'Tax Appeal — ITAT Mumbai', date: 'Sep 22, 2026', urgency: 'Normal' },
    ]
  },
  {
    id: 'drafting',
    icon: '📄',
    label: 'AI Drafting',
    color: '#7c3aed',
    title: '45+ Legal Document Templates',
    stamp: 'AI DRAFTED',
    description:
      'Bail applications, plaints, divorce petitions, legal notices — drafted in seconds with real case facts.',
    mockup: [
      { type: 'template', text: 'Bail Application u/s 439 CrPC', tag: 'Criminal', active: true },
      { type: 'template', text: 'Maintenance Application u/s 24 HMA', tag: 'Family', active: false },
      { type: 'template', text: 'Reply to Legal Notice', tag: 'Civil', active: false },
      { type: 'template', text: 'Consumer Complaint u/s 35', tag: 'Consumer', active: false },
      { type: 'typing', text: 'The Applicant respectfully submits that the triple test under Arnesh Kumar v. State of Bihar (2014) 8 SCC 273 is fully satisfied. The applicant has cooperated throughout the investigation...' },
    ]
  },
  {
    id: 'analysis',
    icon: '🔍',
    label: 'Case Analysis',
    color: '#0891b2',
    title: 'Deep Case Intelligence',
    stamp: 'VERIFIED ANALYSIS',
    description:
      'Case summary, chronology of events, and evidence analysis — all generated from your uploaded documents.',
    mockup: [
      { type: 'tab', text: 'Case Summary', active: true },
      { type: 'tab', text: 'Chronology', active: false },
      { type: 'tab', text: 'Evidence Intelligence', active: false },
      { type: 'summary', label: 'Case Type', value: 'Divorce Petition — HMA Section 13' },
      { type: 'summary', label: 'Court', value: 'Family Court, Bandra, Mumbai' },
      { type: 'summary', label: 'Stage', value: 'Evidence & Interim Relief Stage' },
      { type: 'summary', label: 'Key Strength', value: 'Salary slip confirms Rs. 1.8L income vs Rs. 35k claimed' },
    ]
  },
  {
    id: 'chronology',
    icon: '📅',
    label: 'Chronology',
    color: '#059669',
    title: 'Auto Event Timeline',
    stamp: 'COURT CHRONOLOGY',
    description:
      'AI extracts every dated event from all case documents and arranges them in a clickable timeline.',
    mockup: [
      { type: 'timeline', date: '12.02.2018', event: 'Marriage solemnised at Hotel Grand, Mumbai', tag: 'Key Event' },
      { type: 'timeline', date: '05.09.2019', event: 'Daughter Aanya born from wedlock', tag: 'Key Event' },
      { type: 'timeline', date: '15.06.2023', event: 'Petitioner thrown out of matrimonial home', tag: 'Incident' },
      { type: 'timeline', date: '22.07.2023', event: 'FIR filed at Bandra Police Station u/s 498A', tag: 'Procedural' },
      { type: 'timeline', date: '15.03.2024', event: 'Divorce petition filed before Family Court', tag: 'Procedural' },
    ]
  },
  {
    id: 'hearings',
    icon: '⚖️',
    label: 'Hearing Prep',
    color: '#d97706',
    title: 'AI Hearing Brief',
    stamp: 'URGENT HEARING',
    description:
      'Get a complete hearing brief — arguments, counter-arguments, documents to carry, and opening statement.',
    mockup: [
      { type: 'brief', label: "Today's Objective", value: 'Secure interim maintenance order under Section 24 HMA' },
      { type: 'argument', text: 'Respondent earns Rs. 1.8L/month per salary slip — maintenance must be 25-30% per Rajnesh v. Neha' },
      { type: 'argument', text: 'Petitioner earning Rs. 35,000 insufficient for herself and minor daughter' },
      { type: 'risk', text: '⚠️ Respondent may produce lower net salary — counter with gross CTC & bank credits' },
      { type: 'opening', text: '"My Lord, this is an application under Section 24 for interim maintenance. The respondent earns Rs. 1.8 Lakhs..."' },
    ]
  },
  {
    id: 'research',
    icon: '📚',
    label: 'Legal Research',
    color: '#dc2626',
    title: 'SC Judgment Research',
    stamp: '65,000+ SC CITATIONS',
    description:
      'Search 65,000+ Supreme Court judgments from eCourts. Get verified citations you can use in court.',
    mockup: [
      { type: 'search', text: 'maintenance wife working Section 24 HMA quantum' },
      { type: 'judgment', case: 'Rajnesh v. Neha', citation: '(2020) 14 SCC 1', relevance: 'Sets 25-30% of net income as maintenance standard across India' },
      { type: 'judgment', case: 'Manokaran v Devaki', citation: '(2018) 3 MLJ 476', relevance: 'Child maintenance must cover education and medical expenses' },
      { type: 'judgment', case: 'Shantha v. B.G. Srikanteswara', citation: 'AIR 1999 Ker 316', relevance: 'Working wife entitled to maintenance if income is insufficient' },
    ]
  },
  {
    id: 'client',
    icon: '💬',
    label: 'Client Updates',
    color: '#16a34a',
    title: 'WhatsApp & Email Updates',
    stamp: 'CLIENT CONNECT',
    description:
      'Generate professional case update messages in Hindi, Hinglish or English. Send directly to client.',
    mockup: [
      { type: 'channel', label: 'WhatsApp', active: true },
      { type: 'channel', label: 'Email', active: false },
      { type: 'message', text: 'Namaste Priya ji 🙏\n\nAapki Family Court mein sunwai aaj achi rahi. Judge ne respondent ko salary slip submit karne ka order diya hai.\n\nAgla date: 22 September 2026\n\n— Adv. Sharma' },
    ]
  },
  {
    id: 'financial',
    icon: '💰',
    label: 'Financial Tools',
    color: '#7c3aed',
    title: 'Legal Financial Calculators',
    stamp: 'LAW CALCULATOR',
    description:
      'Maintenance calculator, interest on decree, NI Act penalties — all calculated as per Indian law.',
    mockup: [
      { type: 'calc', label: 'Husband Net Income', value: 'Rs. 1,52,000/month' },
      { type: 'calc', label: 'Wife Income', value: 'Rs. 35,000/month' },
      { type: 'calc', label: 'Recommended Maintenance', value: 'Rs. 38,000/month', highlight: true },
      { type: 'calc', label: 'Child Maintenance', value: 'Rs. 15,000/month', highlight: true },
      { type: 'calc', label: 'Total Monthly', value: 'Rs. 53,000/month', highlight: true },
    ]
  },
];

/* ============================================================= */
/* PRODUCT TOUR — Dignified Advocate Legal Workspace Showcase */
/* ============================================================= */

/* Animated SVG Scales of Justice Graphic */
function AnimatedScalesOfJustice({ color = '#b45309', activeIndex = 0 }: { color?: string; activeIndex?: number }) {
  const tilt = (activeIndex % 2 === 0 ? 1 : -1) * 6;
  return (
    <div className="relative w-11 h-11 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible relative z-10">
        {/* Base Pillar */}
        <path d="M45 88 H55 V92 H45 Z M48 30 H52 V88 H48 Z" fill={color} opacity={0.9} />
        {/* Beam Top Circle */}
        <circle cx="50" cy="26" r="4" fill={color} />
        
        {/* Tilting Beam & Pans */}
        <motion.g
          animate={{ rotate: tilt }}
          transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          style={{ transformOrigin: '50px 26px' }}
        >
          {/* Main Horizontal Beam */}
          <path d="M15 26 Q50 20 85 26" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          
          {/* Left Pan Chains & Bowl */}
          <line x1="18" y1="26" x2="10" y2="52" stroke={color} strokeWidth="1.5" opacity={0.7} />
          <line x1="18" y1="26" x2="26" y2="52" stroke={color} strokeWidth="1.5" opacity={0.7} />
          <path d="M8 52 Q18 64 28 52 Z" fill={color} opacity={0.9} />
          
          {/* Right Pan Chains & Bowl */}
          <line x1="82" y1="26" x2="74" y2="52" stroke={color} strokeWidth="1.5" opacity={0.7} />
          <line x1="82" y1="26" x2="90" y2="52" stroke={color} strokeWidth="1.5" opacity={0.7} />
          <path d="M72 52 Q82 64 92 52 Z" fill={color} opacity={0.9} />
        </motion.g>
      </svg>
    </div>
  );
}

/* Elegant Court Rubber Stamp Badge */
function LegalStampBadge({ text, color }: { text: string; color: string }) {
  return (
    <motion.div
      initial={{ scale: 1.8, rotate: -15, opacity: 0 }}
      animate={{ scale: 1, rotate: -4, opacity: 0.95 }}
      transition={{ type: 'spring', stiffness: 280, damping: 18 }}
      className="absolute top-4 right-4 pointer-events-none select-none z-20"
    >
      <div
        className="px-3.5 py-1 text-[10px] font-serif font-bold tracking-widest uppercase border-2 rounded-sm"
        style={{
          color: color,
          borderColor: color,
          background: 'rgba(255, 255, 255, 0.92)',
          boxShadow: `0 2px 10px ${color}20`,
        }}
      >
        {text}
      </div>
    </motion.div>
  );
}

function ProductDemo() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [autoSpeed] = useState(4000);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Interactive state for financial calculator slider
  const [husbandIncome, setHusbandIncome] = useState(150000);
  const [wifeIncome, setWifeIncome] = useState(35000);

  // Interactive state for legal research query
  const [searchQuery, setSearchQuery] = useState('Section 24 HMA maintenance quantum');

  // Interactive state for AI drafting document template
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Typewriter animated string for drafting
  const [typedChars, setTypedChars] = useState(0);
  const fullText = "The Applicant respectfully submits that the triple test under Arnesh Kumar v. State of Bihar (2014) 8 SCC 273 is fully satisfied. The applicant has cooperated throughout the investigation and no further custodial interrogation is required...";

  useEffect(() => {
    if (activeFeature === 1) {
      setTypedChars(0);
      const timer = setInterval(() => {
        setTypedChars((prev) => {
          if (prev >= fullText.length) {
            clearInterval(timer);
            return prev;
          }
          return prev + 4;
        });
      }, 25);
      return () => clearInterval(timer);
    }
  }, [activeFeature]);

  // Auto advance timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setProgress(0);
      setActiveFeature((prev) => (prev + 1) % DEMO_FEATURES.length);
    }, autoSpeed);
    const stepMs = 100;
    const increment = (stepMs / autoSpeed) * 100;
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + increment));
    }, stepMs);
    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isAutoPlaying, activeFeature, autoSpeed]);

  const feature = DEMO_FEATURES[activeFeature];

  // Dynamic calculation for Financial Calculator
  const calculatedMaintenance = Math.max(0, Math.round(husbandIncome * 0.25 - wifeIncome * 0.1));
  const childSupport = Math.round(husbandIncome * 0.1);
  const totalMonthlyCalc = calculatedMaintenance + childSupport;

  // RAG Judgment filtering
  const judgments = [
    { case: 'Rajnesh v. Neha', citation: '(2020) 14 SCC 1', relevance: 'Sets 25-30% of net income as maintenance standard across India', tags: ['maintenance', 'quantum', 'section 24'] },
    { case: 'Manokaran v. Devaki', citation: '(2018) 3 MLJ 476', relevance: 'Child maintenance must cover education and medical expenses', tags: ['child', 'education', 'maintenance'] },
    { case: 'Shantha v. B.G. Srikanteswara', citation: 'AIR 1999 Ker 316', relevance: 'Working wife entitled to maintenance if income is insufficient', tags: ['wife', 'working', 'insufficient'] },
    { case: 'Arnesh Kumar v. State of Bihar', citation: '(2014) 8 SCC 273', relevance: 'Mandatory guidelines before arrest u/s 498A CrPC', tags: ['bail', '498a', 'crpc'] },
  ];
  const filteredJudgments = judgments.filter(j => 
    !searchQuery || 
    j.case.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.relevance.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.tags.some(t => searchQuery.toLowerCase().includes(t))
  );

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 items-stretch">
      {/* LEFT — Feature Navigation Sidebar */}
      <div className="w-full xl:w-72 flex flex-col gap-2 shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Header with animated scales */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 mb-1">
          <AnimatedScalesOfJustice color={feature.color} activeIndex={activeFeature} />
          <div>
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-800/70">
              ADVOCATE MODULES
            </div>
            <div className="text-xs font-serif font-bold text-slate-900">
              8 Core Legal Tools
            </div>
          </div>
        </div>

        {/* Feature Buttons List */}
        <div className="flex flex-row xl:flex-col gap-1.5 overflow-x-auto xl:overflow-visible pb-2 xl:pb-0 scrollbar-none">
          {DEMO_FEATURES.map((f, i) => {
            const isActive = activeFeature === i;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFeature(i);
                  setProgress(0);
                  setIsAutoPlaying(false);
                }}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-800 shadow-md font-semibold'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 font-medium'
                }`}
              >
                {/* Accent indicator dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200"
                  style={{
                    backgroundColor: f.color,
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  }}
                />

                <span className="text-base leading-none">{f.icon}</span>

                <span className="text-xs tracking-tight flex-1 whitespace-nowrap">
                  {f.label}
                </span>

                {/* Progress bar inside active feature */}
                {isActive && isAutoPlaying && (
                  <div className="ml-auto w-6 h-1.5 bg-slate-700 rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full transition-all duration-100 ease-linear"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: f.color,
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Playback Controls */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs font-mono">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-all shadow-2xs"
          >
            {isAutoPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-600" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <span>Auto-play</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                setActiveFeature((prev) => (prev - 1 + DEMO_FEATURES.length) % DEMO_FEATURES.length);
                setProgress(0);
                setIsAutoPlaying(false);
              }}
              className="p-1 rounded-md hover:bg-white text-slate-600 font-bold"
              title="Previous Feature"
            >
              ←
            </button>
            <span className="text-[11px] text-slate-500 font-bold px-1.5 font-mono">
              {activeFeature + 1}/{DEMO_FEATURES.length}
            </span>
            <button
              onClick={() => {
                setActiveFeature((prev) => (prev + 1) % DEMO_FEATURES.length);
                setProgress(0);
                setIsAutoPlaying(false);
              }}
              className="p-1 rounded-md hover:bg-white text-slate-600 font-bold"
              title="Next Feature"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT — Dignified Advocate Workspace Canvas Mockup */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl flex flex-col relative min-h-[460px]">
        {/* Court Stamp Badge */}
        <AnimatePresence mode="wait">
          <LegalStampBadge key={feature.id + '-stamp'} text={feature.stamp} color={feature.color} />
        </AnimatePresence>

        {/* Clean Application Chrome Top Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/90" />
              <div className="w-3 h-3 rounded-full bg-amber-500/90" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/90" />
            </div>
            <div className="ml-3 flex items-center gap-2 bg-slate-800/90 rounded-lg px-3 py-1 text-[11px] text-slate-300 font-mono border border-slate-700/80">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-400">app.clausio.io/</span>
              <span className="text-amber-300 font-semibold">{feature.id}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ADVOCATE WORKSPACE • eCOURTS SYNCED</span>
          </div>
        </div>

        {/* Feature Header Banner */}
        <div
          className="p-5 sm:p-6 border-b border-slate-100 transition-colors duration-300"
          style={{ backgroundColor: `${feature.color}08` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        </div>

        {/* Feature Workspace Body */}
        <div className="flex-1 p-5 sm:p-6 bg-slate-50/60 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full"
            >
              {/* FEATURE 0: DASHBOARD */}
              {feature.id === 'dashboard' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {feature.mockup.filter(m => m.type === 'stat').map((item: any, i) => (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col gap-1"
                      >
                        <span className="text-xs font-medium text-slate-500">{item.label}</span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-black font-mono" style={{ color: item.color }}>
                            {item.value}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                            {item.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" /> Upcoming Court Hearings
                      </span>
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                        3 Scheduled
                      </span>
                    </div>
                    {feature.mockup.filter(m => m.type === 'hearing').map((item: any, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <Gavel className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-800">{item.text}</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200">
                          {item.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FEATURE 1: AI DRAFTING (High Court Paper) */}
              {feature.id === 'drafting' && (
                <div className="flex flex-col gap-3">
                  {/* Template Picker */}
                  <div className="flex flex-wrap gap-2">
                    {feature.mockup.filter(m => m.type === 'template').map((item: any, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTemplate(i)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all flex items-center gap-2 ${
                          selectedTemplate === i
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <span>{item.text}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase ${selectedTemplate === i ? 'bg-purple-900 text-purple-100' : 'bg-slate-100 text-slate-500'}`}>
                          {item.tag}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Parchment Court Document Previewer */}
                  <div className="bg-[#fcfbfa] border border-[#e2d9cd] rounded-xl p-4 sm:p-5 shadow-inner relative overflow-hidden font-serif">
                    {/* Red Margin Line */}
                    <div className="absolute top-0 bottom-0 left-8 w-[1.5px] bg-rose-400/60" />
                    
                    <div className="pl-6 space-y-3 text-slate-800 text-xs sm:text-sm leading-relaxed">
                      <div className="text-center font-bold tracking-wider text-slate-900 border-b border-amber-900/10 pb-2 uppercase text-xs">
                        IN THE HIGH COURT OF JUDICATURE AT BOMBAY
                      </div>
                      <div className="text-[11px] font-mono text-purple-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        CLAUSIO ADVOCATE DRAFTING ENGINE
                      </div>
                      <p className="font-mono text-xs text-slate-800 bg-purple-50/60 p-3.5 rounded-lg border border-purple-200/60 leading-relaxed">
                        {fullText.slice(0, typedChars)}
                        <span className="inline-block w-1.5 h-3.5 bg-purple-700 ml-1 animate-pulse" />
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
                      <span className="text-[10px] text-slate-500">Court Ready Format • Citation Verified</span>
                      <button
                        onClick={() => {
                          setCopiedIndex(1);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold transition-colors flex items-center gap-1 text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedIndex === 1 ? 'Copied to Clipboard!' : 'Copy Draft'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FEATURE 2: CASE ANALYSIS */}
              {feature.id === 'analysis' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <div className="flex gap-2">
                        {feature.mockup.filter(m => m.type === 'tab').map((tab: any, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-3 py-1 rounded-md font-bold transition-colors ${
                              tab.active ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {tab.text}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        <CheckCircle2 className="w-3 h-3" /> 98.4% Accuracy Score
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {feature.mockup.filter(m => m.type === 'summary').map((item: any, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-xs font-mono font-semibold text-slate-500 w-32">{item.label}</span>
                          <span className="text-xs font-bold text-slate-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FEATURE 3: CHRONOLOGY */}
              {feature.id === 'chronology' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> EXTRACTED MATRIMONIAL CHRONOLOGY
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      5 Events Identified
                    </span>
                  </div>

                  <div className="relative pl-5 space-y-3 border-l-2 border-emerald-400">
                    {feature.mockup.filter(m => m.type === 'timeline').map((item: any, idx) => (
                      <div key={idx} className="relative flex items-start justify-between gap-3 text-xs">
                        <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white" />
                        <div>
                          <span className="font-mono text-[11px] font-bold text-emerald-700">{item.date}</span>
                          <p className="text-slate-800 font-semibold">{item.event}</p>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                          {item.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FEATURE 4: HEARING PREP */}
              {feature.id === 'hearings' && (
                <div className="flex flex-col gap-3">
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Gavel className="w-4 h-4 text-amber-600" />
                      {(feature.mockup.find(m => m.type === 'brief') as any)?.label}: {(feature.mockup.find(m => m.type === 'brief') as any)?.value}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl space-y-2">
                      <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Primary Arguments
                      </div>
                      {feature.mockup.filter(m => m.type === 'argument').map((item: any, i) => (
                        <div key={i} className="text-xs text-emerald-950 font-medium leading-relaxed bg-white p-2 rounded border border-emerald-100">
                          {item.text}
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-2">
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Strategic Warning
                      </div>
                      {feature.mockup.filter(m => m.type === 'risk').map((item: any, i) => (
                        <div key={i} className="text-xs text-amber-950 font-medium leading-relaxed bg-white p-2 rounded border border-amber-200">
                          {item.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FEATURE 5: LEGAL RESEARCH */}
              {feature.id === 'research' && (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search 65,000+ Supreme Court Judgments..."
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-red-500 shadow-2xs"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                    {filteredJudgments.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 hover:border-red-300 transition-colors shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-serif font-bold text-slate-900">{item.case}</span>
                          <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            {item.citation}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-snug">{item.relevance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FEATURE 6: CLIENT UPDATES */}
              {feature.id === 'client' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">WhatsApp Client Update Generator</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      Hinglish • Format Ready
                    </span>
                  </div>

                  <div className="bg-[#e5ddd5] p-4 rounded-xl border border-[#d1c7bd] flex flex-col">
                    <div className="bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-none text-xs text-slate-900 font-sans leading-relaxed shadow-sm max-w-[90%] self-end">
                      {(feature.mockup.find(m => m.type === 'message') as any)?.text}
                      <div className="text-[9px] text-slate-500 font-mono text-right mt-1 flex items-center justify-end gap-1">
                        <span>10:42 AM</span>
                        <span className="text-blue-500 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FEATURE 7: FINANCIAL TOOLS */}
              {feature.id === 'financial' && (
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-slate-800">Interactive Maintenance Calculator</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">
                      Rajnesh v. Neha (2020) 14 SCC 1
                    </span>
                  </div>

                  {/* Interactive Dual Sliders */}
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-600">Husband Net Income (Drag Slider):</span>
                        <span className="font-mono font-bold text-purple-700">₹{husbandIncome.toLocaleString()}/mo</span>
                      </div>
                      <input
                        type="range"
                        min="50000"
                        max="400000"
                        step="10000"
                        value={husbandIncome}
                        onChange={(e) => setHusbandIncome(Number(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-200/60">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-600">Wife Net Income:</span>
                        <span className="font-mono font-bold text-slate-700">₹{wifeIncome.toLocaleString()}/mo</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="150000"
                        step="5000"
                        value={wifeIncome}
                        onChange={(e) => setWifeIncome(Number(e.target.value))}
                        className="w-full accent-purple-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Dynamic Calculation Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                      <span className="text-[10px] text-purple-600 font-bold block uppercase">Spouse Maintenance</span>
                      <span className="text-lg font-black font-mono text-purple-900">₹{calculatedMaintenance.toLocaleString()}/mo</span>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                      <span className="text-[10px] text-purple-600 font-bold block uppercase">Child Support</span>
                      <span className="text-lg font-black font-mono text-purple-900">₹{childSupport.toLocaleString()}/mo</span>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-700 text-white shadow-md">
                      <span className="text-[10px] text-purple-200 font-bold block uppercase">Total Monthly Order</span>
                      <span className="text-lg font-black font-mono text-white">₹{totalMonthlyCalc.toLocaleString()}/mo</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function LandingPageUI() {
  const [activeSection, setActiveSection] = useState("hero");
  const [isScrolled, setIsScrolled] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [torchPos, setTorchPos] = useState({ x: 0, y: 0, opacity: 0 });
  const rippleFiredRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Window scroll tracking for smooth statue slide from center to right
  const { scrollY, scrollYProgress } = useScroll();
  // Left-rail vertical beam fill + top scroll-progress bar
  const lineHeight = useTransform(scrollYProgress, [0.15, 0.95], ["0%", "100%"]);

  // Smooth scroll transformation from 0px -> 700px scroll:
  // At 0px (Hero): statue is in Center (0vw)
  // At Section 2: statue sits on the right (30vw) alongside the held laptop screen
  // Page 1: slide center → right. Page 2 (intro): LOCK at right. Page 3+: exit.
  const statueX = useTransform(
    scrollY,
    [0, 400, 401, 1400, 1600],
    ["0vw", "28vw", "28vw", "28vw", "65vw"]
  );
  const statueScale = useTransform(
    scrollY,
    [0, 400, 401, 1400, 1600],
    [1, 0.88, 0.88, 0.88, 0.65]
  );
  const statueOpacity = useTransform(
    scrollY,
    [0, 400, 1300, 1600],
    [1, 1, 1, 0]
  );
  const textOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const textY = useTransform(scrollY, [0, 300], [0, -60]);

  // Halo aura transforms behind statue head when in Section 2
  const glowOpacity = useTransform(scrollY, [250, 600], [0, 0.95]);
  const glowScale = useTransform(scrollY, [250, 600], [0.4, 1]);









  const heroRef = useRef<HTMLDivElement>(null);
  const twoSectionsRef = useRef<HTMLDivElement>(null);





  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!twoSectionsRef.current) return;
    const rect = twoSectionsRef.current.getBoundingClientRect();
    setTorchPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  const handleHeroMouseLeave = () => {
    setTorchPos((prev) => ({ ...prev, opacity: 0 }));
  };



  useEffect(() => {
    audioRef.current = new Audio("/ambient.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.15;
    const el = audioRef.current;
    return () => {
      el?.pause();
    };
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (soundOn) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setSoundOn(!soundOn);
  };

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Scroll listener for Navbar blur glass effect & section tracking
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 40);

      // Ripple once when the statue locks (~400px), re-arm after leaving the band
      if (scrollY > 380 && scrollY < 420 && !rippleFiredRef.current) {
        rippleFiredRef.current = true;
        setRipple(true);
        setTimeout(() => setRipple(false), 1200);
      }
      if (scrollY < 250 || scrollY > 550) {
        rippleFiredRef.current = false;
      }

      // Simple active section detector based on scroll position
      const sections = sidebarNavItems.map((item) => document.getElementById(item.id));
      const scrollPosition = scrollY + window.innerHeight / 3;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sidebarNavItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      lenis.destroy();
    };
  }, []);


  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F0F6FC] text-[#0F172A] font-sans selection:bg-[#0284C7] selection:text-[#FFFFFF]">
      {/* SCROLL PROGRESS INDICATOR (top of page) */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[60] h-[3px] origin-left"
        style={{
          scaleX: scrollYProgress,
          background: "linear-gradient(to right, #2563eb, #818cf8, #38bdf8)",
        }}
      />

      {/* TOP SKEUOMORPHIC FLOATING NAVIGATION BAR */}

      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 md:py-6 pointer-events-none transition-all duration-500">
        <header
          className={`pointer-events-auto flex items-center justify-between transition-all duration-500 rounded-full ${
            isScrolled
              ? "w-full max-w-5xl px-7 py-3 skeuo-nav-scrolled"
              : "w-full max-w-6xl px-8 py-3 skeuo-nav-initial"
          }`}
        >
          {/* Logo / Brand Name */}
          <div className="flex items-center space-x-3">
            <a
              href="/"
              className="flex items-center space-x-2.5 group transition-opacity hover:opacity-90"
            >
              <img
                src="/logo-1-transperent.png"
                alt="Clausio Logo"
                className="h-7 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
              />
              <span className="text-xs tracking-[0.28em] uppercase font-mono font-bold text-[#231B15] skeuo-text-embossed">
                CLAUSIO
              </span>
            </a>
          </div>


          {/* Center Nav Links — active-aware with animated underline */}
          <nav className="hidden md:flex items-center space-x-9 text-[11px] uppercase tracking-[0.2em] font-mono font-medium text-[#4A3D33]">
            {[
              { id: "intro", label: "PLATFORM" },
              { id: "features", label: "FEATURES" },
              { id: "intelligence", label: "INTELLIGENCE" },
              { id: "why-clausio", label: "WHY CLAUSIO" },
              { id: "about", label: "ABOUT" },
            ].map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`relative py-1 transition-colors skeuo-text-engraved after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:rounded-full after:bg-[#0284C7] after:transition-all after:duration-300 ${
                    isActive
                      ? "text-[#0284C7] after:w-full"
                      : "hover:text-[#18120E] after:w-0 hover:after:w-full"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Tactile Skeuomorphic CTA Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                window.location.href = SIGNIN_URL;
              }}
              className="hidden sm:block text-[11px] uppercase tracking-[0.2em] font-mono font-medium text-[#4A3D33] hover:text-[#18120E] transition-colors skeuo-text-engraved"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                window.location.href = SIGNUP_URL;
              }}
              className="px-5 py-2.5 rounded-full text-[11px] uppercase tracking-[0.2em] font-mono font-medium skeuo-btn-primary"
            >
              GET STARTED
            </button>
          </div>
        </header>
      </div>

      {/* LEFT SIDEBAR NAVIGATION ("ON THIS PAGE") */}
      <aside className="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col space-y-6">
        <div className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[#5C4D3F] skeuo-text-engraved mb-2">
          ON THIS PAGE
        </div>
        <ul className="flex flex-col space-y-2 text-[11px] font-mono">
          {sidebarNavItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <li
                key={item.id}
                className="flex items-center space-x-3 group cursor-pointer"
                onClick={() => scrollTo(item.id)}
              >
                <span
                  className={`h-[2px] rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-6 bg-[#2B2017] shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                      : "w-2 bg-[#8C7B6B]/40 group-hover:w-4 group-hover:bg-[#5C4D3F]"
                  }`}
                />
                <span
                  className={`transition-all duration-300 font-medium ${
                    isActive
                      ? "text-[#1E1712] font-bold skeuo-text-embossed translate-x-1"
                      : "text-[#6B5A4B] group-hover:text-[#2B2017]"
                  }`}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ========================================================= */}
      {/* COMBINED HERO + OVERVIEW SECTION WRAPPER */}
      {/* ========================================================= */}
      <div
        ref={twoSectionsRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative w-full"
      >
        {/* Interactive Torchlight Masked Court Background */}
        <div
          className="absolute inset-x-0 top-0 h-screen pointer-events-none z-0 transition-opacity duration-300 ease-out flex items-center justify-center"
          style={{
            opacity: torchPos.opacity > 0 ? 0.85 : 0.15,
            WebkitMaskImage: torchPos.opacity > 0
              ? `radial-gradient(circle 540px at ${torchPos.x}px ${torchPos.y}px, black 0%, rgba(0,0,0,0.5) 55%, transparent 100%)`
              : `none`,
            maskImage: torchPos.opacity > 0
              ? `radial-gradient(circle 540px at ${torchPos.x}px ${torchPos.y}px, black 0%, rgba(0,0,0,0.5) 55%, transparent 100%)`
              : `none`,
          }}
        >
          <img
            src="/court.png"
            alt="Supreme Court Architecture"
            className="w-full h-full object-fill md:object-cover object-center opacity-45 mix-blend-multiply"
          />
        </div>

        {/* STICKY SMOOTH SCROLLING LADY JUSTICE STATUE + SUNRISE GLOW */}
        <div className="sticky top-0 h-screen w-full pointer-events-none z-20 flex items-end justify-center">
          <motion.div
            style={{
              x: statueX,
              scale: statueScale,
              opacity: statueOpacity,
            }}
            className="relative w-full flex items-end justify-center pb-0"
          >
            {/* Golden rotating sunrays behind the statue */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 5 }}
              aria-hidden="true"
            >
              <div className="sunrays-outer absolute" style={{ width: "140%", height: "140%", top: "5%" }}>
                <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
                  {Array.from({ length: 16 }).map((_, i) => {
                    const angle = (i * 360) / 16;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 200 + Math.cos(rad) * 80;
                    const y1 = 200 + Math.sin(rad) * 80;
                    const x2 = 200 + Math.cos(rad) * 200;
                    const y2 = 200 + Math.sin(rad) * 200;
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="rgba(251,191,36,0.18)"
                        strokeWidth={i % 2 === 0 ? 3 : 1.5}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="sunrays-inner absolute" style={{ width: "110%", height: "110%", top: "10%" }}>
                <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 360) / 12 + 15;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 200 + Math.cos(rad) * 70;
                    const y1 = 200 + Math.sin(rad) * 70;
                    const x2 = 200 + Math.cos(rad) * 160;
                    const y2 = 200 + Math.sin(rad) * 160;
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="rgba(251,191,36,0.10)"
                        strokeWidth={1}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Sacred Celestial Light-Blue Halo Aura */}
            <motion.div
              style={{
                opacity: glowOpacity,
                scale: glowScale,
              }}
              className="absolute top-[4vh] md:top-[6vh] lg:top-[7vh] w-[260px] md:w-[340px] lg:w-[400px] h-[260px] md:h-[340px] lg:h-[400px] rounded-full pointer-events-none -z-10 flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-[#38BDF8]/40 via-[#60A5FA]/30 to-transparent blur-[70px]" />
              <div className="w-3/4 h-3/4 rounded-full bg-gradient-to-tr from-[#0284C7]/35 via-[#38BDF8]/45 to-[#BAE6FD]/60 blur-[45px]" />
              <div className="w-1/2 h-1/2 rounded-full bg-gradient-to-t from-[#0EA5E9]/55 to-[#F0F9FF]/90 blur-[25px]" />
            </motion.div>


            {/* Statue Image with bottom gradient fade */}
            <img
              src="/jsutice-lady.png"
              alt="Lady Justice — Nyaya Devi"
              className="relative z-10 h-[72vh] md:h-[80vh] lg:h-[84vh] max-w-none object-contain drop-shadow-[0_24px_48px_rgba(40,25,15,0.25)]"
              style={{
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 80%, rgba(0,0,0,0.4) 92%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, black 0%, black 80%, rgba(0,0,0,0.4) 92%, transparent 100%)",
              }}
            />

            {/* Ripple rings emitted when the statue locks */}
            {ripple && (
              <div style={{ position: "absolute", top: "40%", left: "50%", zIndex: 50, pointerEvents: "none" }}>
                {[0, 200, 400].map((delay, i) => (
                  <div
                    key={i}
                    className="ripple-ring"
                    style={{ width: 120, height: 120, animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* SECTION 1: HERO (INDIAN LITIGATION) */}
        <section
          id="hero"
          ref={heroRef}
          className="relative z-10 -mt-[100vh] min-h-screen flex items-center justify-end px-6 md:px-12 cursor-default select-none w-full"
        >
          {/* Floating dot particles — subtle background depth */}
          <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden" aria-hidden="true">
            {HERO_PARTICLES.map((p, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-[#2563eb]"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  opacity: p.opacity,
                  animation: `float-particle ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
                }}
              />
            ))}
          </div>

          {/* Right-Aligned High-Fashion / Skeuomorphic Editorial Headline */}
          <motion.div
            style={{ opacity: textOpacity, y: textY }}
            className="absolute right-6 md:right-12 lg:right-16 xl:right-24 top-[50%] -translate-y-1/2 z-30 flex flex-col items-end text-right max-w-md lg:max-w-xl xl:max-w-2xl"
          >
            {/* Skeuomorphic Embossed Tag */}
            <div className="flex items-center space-x-3 px-3 py-1 rounded-full skeuo-inset text-[10px] md:text-[11px] font-mono uppercase tracking-[0.32em] font-semibold text-[#5A4839] mb-3">
              <span>SPECIAL EDITION</span>
              <span>·</span>
              <span>EST. 2026</span>
            </div>

            {/* Giant Title "INDIAN" with rich text depth */}
            <motion.h1
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="text-7xl sm:text-8xl md:text-9xl lg:text-[120px] xl:text-[142px] font-serif font-normal tracking-tight text-[#1E1712] skeuo-text-embossed leading-[0.84] select-none"
            >
              Indian
            </motion.h1>

            {/* Subtitle "L I T I G A T I O N" */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
              className="text-2xl sm:text-3xl md:text-5xl lg:text-5xl xl:text-6xl font-sans font-light tracking-[0.42em] uppercase text-[#3C2F25] pl-[0.42em] leading-tight mt-1"
            >
              Litigation
            </motion.div>

            {/* Caption in tactile parchment card styling */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
              className="mt-6 p-4 rounded-xl skeuo-card max-w-sm text-right"
            >
              <p className="text-xs md:text-sm font-sans text-[#4A3B30] leading-relaxed">
                The intelligent workspace unifying cases, hearings, research, and daily practice for modern advocates.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
              className="flex items-center space-x-4 mt-6 pt-4 border-t border-[#3A2E26]/15"
            >
              <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.25em] font-medium text-[#5C4D3F] skeuo-text-engraved">
                SCROLL TO EXPLORE
              </span>
              <div className="w-12 h-[2px] rounded-full bg-[#3A2E26]/30 shadow-[0_1px_1px_rgba(255,255,255,0.8)]" />
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION 2: INTRO / OVERVIEW (3D CONVERGENT TUBES → FROSTED CAPSULE → LUMINOUS LIGHT BEAM → LADY JUSTICE) */}
        <section
          id="intro"
          className="relative z-30 h-screen w-full flex items-center justify-between px-0 pointer-events-none pb-0 overflow-hidden"
        >
          {/* Subtle Ambient Atmosphere Glow at Center Convergence */}
          <div className="absolute left-[54%] top-[48vh] -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-[#38BDF8]/20 via-[#60A5FA]/12 to-transparent blur-[120px] pointer-events-none -z-10" />

          {/* 3D Volumetric Tubes & Light Beam System (Exact Reference Design Translation) */}
          {/* Elegant Thin Neon Connection Lines (Gyanaguru 2.0 Style Reference) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-visible hidden md:block"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="neonGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#818CF8" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#2DD4BF" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* LINE 1: Top */}
            <path
              vectorEffect="non-scaling-stroke"
              d="M 45 35 C 46.5 35, 46 48, 48 48"
              fill="none"
              stroke="url(#neonGradient)"
              strokeWidth="1.75"
              filter="url(#neonGlowFilter)"
            />
            <path
              vectorEffect="non-scaling-stroke"
              d="M 45 35 C 46.5 35, 46 48, 48 48"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.5"
              strokeOpacity="0.8"
            />

            {/* LINE 2: Upper Middle */}
            <path
              vectorEffect="non-scaling-stroke"
              d="M 45 41 C 46.5 41, 46 48, 48 48"
              fill="none"
              stroke="url(#neonGradient)"
              strokeWidth="1.75"
              filter="url(#neonGlowFilter)"
            />
            <path
              vectorEffect="non-scaling-stroke"
              d="M 45 41 C 46.5 41, 46 48, 48 48"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.5"
              strokeOpacity="0.8"
            />

            {/* LINE 3: Direct Middle */}
            <path
              vectorEffect="non-scaling-stroke"
              d="M 45 47 C 46.5 47, 46 48, 48 48"
              fill="none"
              stroke="url(#neonGradient)"
              strokeWidth="1.75"
              filter="url(#neonGlowFilter)"
            />
            <path
              vectorEffect="non-scaling-stroke"
              d="M 45 47 C 46.5 47, 46 48, 48 48"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.5"
              strokeOpacity="0.8"
            />

            {/* LINE 4: Lower Middle */}
            <path
              vectorEffect="non-scaling-stroke"
              d="M 45 53 C 46.5 53, 46 48, 48 48"
              fill="none"
              stroke="url(#neonGradient)"
              strokeWidth="1.75"
              filter="url(#neonGlowFilter)"
            />
            <path
              vectorEffect="non-scaling-stroke"
              d="M 45 53 C 46.5 53, 46 48, 48 48"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.5"
              strokeOpacity="0.8"
            />

            {/* LINE 5: Bottom */}
            <path
              vectorEffect="non-scaling-stroke"
              d="M 45 59 C 46.5 59, 46 48, 48 48"
              fill="none"
              stroke="url(#neonGradient)"
              strokeWidth="1.75"
              filter="url(#neonGlowFilter)"
            />
            <path
              vectorEffect="non-scaling-stroke"
              d="M 45 59 C 46.5 59, 46 48, 48 48"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.5"
              strokeOpacity="0.8"
            />
          </svg>

          {/* Laser Beam & Particles (Uses vw/vh coordinates for circles/lines without viewBox) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-visible hidden md:block"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="beamLaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="laserBlur" />
                <feMerge>
                  <feMergeNode in="laserBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="nodeBlur" />
                <feMerge>
                  <feMergeNode in="nodeBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="laserBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="20%" stopColor="#BAE6FD" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="laserBeamConeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="35%" stopColor="#7DD3FC" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Expanding Ambient Laser Flare Cone */}
            <polygon
              points="60vw,48vh 73vw,45vh 73vw,51vh"
              fill="url(#laserBeamConeGrad)"
              style={{ mixBlendMode: 'plus-lighter' }}
            />

            {/* High-Intensity Laser Beam Line entering Statue */}
            <line
              x1="60vw"
              y1="48vh"
              x2="73vw"
              y2="48vh"
              stroke="url(#laserBeamGrad)"
              strokeWidth="9"
              strokeLinecap="round"
              filter="url(#beamLaserGlow)"
            />

            {/* Laser White Core */}
            <line
              x1="60vw"
              y1="48vh"
              x2="72.5vw"
              y2="48vh"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Convergence Emitter Node Bead on Left of Capsule */}
            <circle cx="48vw" cy="48vh" r="4.5" fill="#2DD4BF" fillOpacity="0.8" filter="url(#nodeGlow)" />
            <circle cx="48vw" cy="48vh" r="2" fill="#FFFFFF" />

            {/* Start Nodes (Laptop Side) */}
            <circle cx="45vw" cy="35vh" r="2.5" fill="#4ADE80" filter="url(#nodeGlow)" />
            <circle cx="45vw" cy="35vh" r="1" fill="#FFFFFF" />
            
            <circle cx="45vw" cy="41vh" r="2.5" fill="#4ADE80" filter="url(#nodeGlow)" />
            <circle cx="45vw" cy="41vh" r="1" fill="#FFFFFF" />
            
            <circle cx="45vw" cy="47vh" r="2.5" fill="#4ADE80" filter="url(#nodeGlow)" />
            <circle cx="45vw" cy="47vh" r="1" fill="#FFFFFF" />
            
            <circle cx="45vw" cy="53vh" r="2.5" fill="#4ADE80" filter="url(#nodeGlow)" />
            <circle cx="45vw" cy="53vh" r="1" fill="#FFFFFF" />
            
            <circle cx="45vw" cy="59vh" r="2.5" fill="#4ADE80" filter="url(#nodeGlow)" />
            <circle cx="45vw" cy="59vh" r="1" fill="#FFFFFF" />

            {/* Radiant Emitter Node Bead on Right of Capsule */}
            <circle cx="60.5vw" cy="48vh" r="11" fill="#38BDF8" fillOpacity="0.6" filter="url(#beamLaserGlow)" />
            <circle cx="60.5vw" cy="48vh" r="6.5" fill="#FFFFFF" filter="url(#beamLaserGlow)" />
            <circle cx="60.5vw" cy="48vh" r="4" fill="#FFFFFF" />
          </svg>

          {/* LEFT: Enlarged, Dominant Laptop Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1.04 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            viewport={{ once: false, amount: 0.15 }}
            className="w-[95vw] sm:w-[85vw] md:w-[60vw] lg:w-[55vw] xl:w-[50vw] pointer-events-auto flex items-center justify-start pl-3 sm:pl-6 md:pl-8 lg:pl-10 xl:pl-12 translate-y-[-1.5vh] md:translate-y-[-3.5vh]"
          >
            <div
              className="relative w-full"
              style={{
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 76%, rgba(0,0,0,0.65) 88%, rgba(0,0,0,0.15) 97%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, black 0%, black 76%, rgba(0,0,0,0.65) 88%, rgba(0,0,0,0.15) 97%, transparent 100%)",
              }}
            >
              <img
                src="/laptop.png"
                alt="Clausio Practice Workspace"
                className="w-full h-auto max-h-[97vh] object-contain drop-shadow-[0_32px_64px_rgba(2,132,199,0.25)] origin-bottom-left"
              />
            </div>
          </motion.div>

          {/* CENTER: FROSTED GLASS SEARCH CAPSULE PILL (Iligation Platform) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: false }}
            className="absolute left-[54vw] top-[48vh] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto flex items-center justify-center select-none group"
          >
            {/* AI Glowing Aura (Animated) */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#4ADE80] via-[#818CF8] to-[#2DD4BF] blur-md opacity-50 group-hover:opacity-75 transition duration-1000 animate-pulse" />
            
            {/* Thin Glassmorphism Pill */}
            <div className="relative px-7 py-3 rounded-full bg-[#0F172A]/40 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_1px_rgba(255,255,255,0.15)_inset] flex items-center space-x-3">
              {/* AI Pulse Indicator Dot */}
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]"></span>
              </div>

              <span className="text-xs md:text-sm font-sans font-medium tracking-[0.06em] text-white whitespace-nowrap drop-shadow-sm">
                Litigation Platform
              </span>
            </div>
          </motion.div>

        </section>
      </div>

      {/* ========================================================= */}
      {/* LEGAL DOCUMENT TICKER — standalone band after hero+intro wrapper */}
      {/* ========================================================= */}
      <div className="relative z-30 w-full overflow-hidden border-y border-[#2563eb]/12 bg-[#2563eb]/[0.06] py-3">
        <div className="ticker-animate flex w-max whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span
              key={i}
              className="font-mono text-[11px] tracking-[0.15em] uppercase font-bold text-[#2563eb] px-4"
            >
              {item}
              <span className="text-[#94a3b8] mx-3">·</span>
            </span>
          ))}
        </div>
      </div>











      {/* ========================================================= */}



      {/* ========================================================= */}
      {/* SECTION 3: FEATURES (SKEUOMORPHIC BENTO GRID WORKBENCH) */}
      {/* ========================================================= */}
      <section
        id="features"
        className="relative z-30 min-h-screen py-24 px-8 md:px-16 xl:pl-56 xl:pr-24 border-t border-[#3A2E26]/10 flex flex-col justify-center overflow-hidden"
      >
        {/* Scrolling legal-document background texture */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.025] select-none"
          aria-hidden="true"
          style={{ zIndex: 0 }}
        >
          <div className="legal-text-scroll font-mono text-[10px] text-[#0f172a] leading-6 whitespace-pre-wrap w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <p key={i} className="mb-0">
                {`IN THE HON'BLE HIGH COURT OF JUDICATURE    CRIMINAL MISCELLANEOUS PETITION NO. ___    APPLICATION UNDER SECTION 439 CrPC    THE APPLICANT MOST RESPECTFULLY SHOWETH    WHEREAS THE APPLICANT IS IN CUSTODY    WHEREAS THE TRIPLE TEST IS SATISFIED    PERMANENT ADDRESS IS WITHIN JURISDICTION    CHARGE SHEET HAS BEEN FILED ON RECORD    NO DANGER OF TAMPERING WITH EVIDENCE    THE APPLICANT PRAYS FOR BAIL AS UNDER    IN THE COURT OF THE SESSIONS JUDGE    MAINTENANCE APPLICATION SECTION 24 HMA    RESPONDENT EARNS RS. 1,20,000 PER MONTH    APPLYING RAJNESH V. NEHA 2020 14 SCC 1    MINIMUM MAINTENANCE RS. 30,000 PER MONTH    `}
              </p>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false, amount: 0.15 }}
          className="relative z-10 space-y-12 max-w-6xl mx-auto w-full"
        >
          <div className="flex flex-col items-center text-center">
            <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-[#6B5A4B] flex items-center justify-center space-x-2 mb-3">
              <span className="px-2 py-0.5 rounded skeuo-inset text-[10px]">02</span>
              <span>CORE CAPABILITIES</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif tracking-tight text-[#1E1712] skeuo-text-embossed">
              Features crafted for modern advocates
            </h2>
          </div>

          {/* SKEUOMORPHIC BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[220px]">
            {/* Bento Card 1 (Wide 2-Column Hero Card: Case Management) */}
            <div className="feature-card-3d md:col-span-2 lg:col-span-2 row-span-1 cursor-pointer">
            <div className="feature-card-inner h-full">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: false }}
              className="h-full p-7 rounded-2xl skeuo-card flex flex-col justify-between group relative overflow-hidden transition-[box-shadow,border-color] duration-300 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] hover:border-[#2563eb]/30"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl skeuo-icon-badge flex items-center justify-center text-[#2E2219] group-hover:text-[#2563eb] group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.45)] transition-all duration-300">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full skeuo-inset text-[10px] font-mono font-semibold text-[#5A4839]">
                  PRIMARY CONSOLE
                </span>
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1E1712] mb-1 skeuo-text-embossed">Case Management</h3>
                <p className="text-xs text-[#524337] font-sans leading-relaxed max-w-md">
                  Manage ongoing litigation, docket entries, linked hearings, and critical limitation periods without misplacing records.
                </p>
              </div>
            </motion.div>
            </div>
            </div>

            {/* Bento Card 2 (Single Box: Legal Research) */}
            <div className="feature-card-3d md:col-span-1 lg:col-span-1 row-span-1 cursor-pointer">
            <div className="feature-card-inner h-full">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              viewport={{ once: false }}
              className="h-full p-7 rounded-2xl skeuo-card flex flex-col justify-between group transition-[box-shadow,border-color] duration-300 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] hover:border-[#2563eb]/30"
            >
              <div className="w-12 h-12 rounded-xl skeuo-icon-badge flex items-center justify-center text-[#2E2219] group-hover:text-[#2563eb] group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.45)] transition-all duration-300">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1E1712] mb-1 skeuo-text-embossed">Legal Research</h3>
                <p className="text-xs text-[#524337] font-sans leading-relaxed">
                  Fast Indian case law precedents and citations.
                </p>
              </div>
            </motion.div>
            </div>
            </div>

            {/* Bento Card 3 (Single Box: Hearing Preparation) */}
            <div className="feature-card-3d md:col-span-1 lg:col-span-1 row-span-1 cursor-pointer">
            <div className="feature-card-inner h-full">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              viewport={{ once: false }}
              className="h-full p-7 rounded-2xl skeuo-card flex flex-col justify-between group transition-[box-shadow,border-color] duration-300 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] hover:border-[#2563eb]/30"
            >
              <div className="w-12 h-12 rounded-xl skeuo-icon-badge flex items-center justify-center text-[#2E2219] group-hover:text-[#2563eb] group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.45)] transition-all duration-300">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1E1712] mb-1 skeuo-text-embossed">Hearing Prep</h3>
                <p className="text-xs text-[#524337] font-sans leading-relaxed">
                  Daily causelists, bench notes, and judge arguments.
                </p>
              </div>
            </motion.div>
            </div>
            </div>

            {/* Bento Card 4 (Single Box: Document Drafting) */}
            <div className="feature-card-3d md:col-span-1 lg:col-span-1 row-span-1 cursor-pointer">
            <div className="feature-card-inner h-full">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              viewport={{ once: false }}
              className="h-full p-7 rounded-2xl skeuo-card flex flex-col justify-between group transition-[box-shadow,border-color] duration-300 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] hover:border-[#2563eb]/30"
            >
              <div className="w-12 h-12 rounded-xl skeuo-icon-badge flex items-center justify-center text-[#2E2219] group-hover:text-[#2563eb] group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.45)] transition-all duration-300">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1E1712] mb-1 skeuo-text-embossed">Draft Studio</h3>
                <p className="text-xs text-[#524337] font-sans leading-relaxed">
                  Structured pleadings, petitions, and notices.
                </p>
              </div>
            </motion.div>
            </div>
            </div>

            {/* Bento Card 5 (Single Box: Client Management) */}
            <div className="feature-card-3d md:col-span-1 lg:col-span-1 row-span-1 cursor-pointer">
            <div className="feature-card-inner h-full">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.32 }}
              viewport={{ once: false }}
              className="h-full p-7 rounded-2xl skeuo-card flex flex-col justify-between group transition-[box-shadow,border-color] duration-300 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] hover:border-[#2563eb]/30"
            >
              <div className="w-12 h-12 rounded-xl skeuo-icon-badge flex items-center justify-center text-[#2E2219] group-hover:text-[#2563eb] group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.45)] transition-all duration-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1E1712] mb-1 skeuo-text-embossed">Client Records</h3>
                <p className="text-xs text-[#524337] font-sans leading-relaxed">
                  Client history, briefs, and fee tracking.
                </p>
              </div>
            </motion.div>
            </div>
            </div>

            {/* Bento Card 6 (Wide 2-Column Hero Card: Practice Insights & Analytics) */}
            <div className="feature-card-3d md:col-span-2 lg:col-span-2 row-span-1 cursor-pointer">
            <div className="feature-card-inner h-full">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: false }}
              className="h-full p-7 rounded-2xl skeuo-card flex flex-col justify-between group relative overflow-hidden transition-[box-shadow,border-color] duration-300 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] hover:border-[#2563eb]/30"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl skeuo-icon-badge flex items-center justify-center text-[#2E2219] group-hover:text-[#2563eb] group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.45)] transition-all duration-300">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="flex space-x-2">
                  <span className="px-3 py-1 rounded-full skeuo-inset text-[10px] font-mono font-semibold text-[#5A4839]">
                    LIVE TELEMETRY
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1E1712] mb-1 skeuo-text-embossed">Practice Insights</h3>
                <p className="text-xs text-[#524337] font-sans leading-relaxed max-w-md">
                  Real-time visibility into active cases, hearing success rates, and courtroom workload across high courts and district forums.
                </p>
              </div>
            </motion.div>
            </div>
            </div>
          </div>

          {/* TYPEWRITER DOCUMENT WINDOW — Clausio drafting in real time */}
          <TypewriterWindow />
        </motion.div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 3.5: PRODUCT TOUR (animated live-mockup demo) */}
      {/* ========================================================= */}
      <section
        id="demo"
        className="relative z-30 py-24 px-8 md:px-16 xl:pl-56 xl:pr-24 border-t border-[#3A2E26]/10"
      >
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.3 }}
            className="text-center mb-12"
          >
            <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-[#6B5A4B] flex items-center justify-center space-x-2 mb-3">
              <span className="px-2 py-0.5 rounded skeuo-inset text-[10px]">02.5</span>
              <span>PRODUCT TOUR</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1E1712] skeuo-text-embossed mb-4">
              See Clausio in action
            </h2>
            <p className="text-sm font-sans text-[#4A3D33] max-w-xl mx-auto leading-relaxed">
              8 core features. Every one of them built for the way Indian advocates
              actually work. Click any feature to explore it.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: false }}
          >
            <ProductDemo />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: false }}
            className="text-center text-xs font-mono text-[#8C7B6B] mt-10 tracking-widest uppercase"
          >
            22 features · 45 document types · 65,000+ SC judgments
          </motion.p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 4: INTELLIGENCE (BENTO INTELLIGENCE MATRIX) */}
      {/* ========================================================= */}
      <section
        id="intelligence"
        className="relative z-30 min-h-screen py-24 px-8 md:px-16 xl:pl-56 xl:pr-24 border-t border-[#3A2E26]/10 flex flex-col justify-center"
      >
        <div className="max-w-6xl mx-auto w-full space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.3 }}
            className="space-y-4 max-w-2xl mx-auto flex flex-col items-center text-center"
          >
            <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-[#6B5A4B] flex items-center justify-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span className="px-2 py-0.5 rounded skeuo-inset text-[10px]">03</span>
              <span>AI &amp; INTELLIGENCE</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif tracking-tight text-[#1E1712] skeuo-text-embossed">
              Intelligence built for legal work
            </h2>
            <p className="text-base font-sans text-[#4A3D33] leading-relaxed">
              Clausio brings intelligent neural indexing into legal workflows so advocates spend less time on repetitive drafting and more time on argument strategy.
            </p>
          </motion.div>

          {/* Neural network connector lines */}
          <div className="relative w-full h-24 mb-8 hidden md:block" aria-hidden="true">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="netGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
                  <stop offset="30%" stopColor="#2563eb" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                id="line1"
                d="M 100 50 Q 300 20 500 50 Q 700 80 900 50"
                fill="none"
                stroke="url(#netGrad)"
                strokeWidth="1.5"
              />
              <path
                id="line2"
                d="M 100 50 Q 300 70 500 50 Q 700 30 900 50"
                fill="none"
                stroke="url(#netGrad)"
                strokeWidth="1"
              />
              {[100, 300, 500, 700, 900].map((x, i) => (
                <circle key={i} cx={x} cy="50" r="4" fill="#2563eb" opacity="0.3" />
              ))}
              {[0, 1, 2].map((i) => (
                <circle
                  key={`d${i}`}
                  r="4"
                  fill="#2563eb"
                  style={
                    {
                      offsetPath: 'path("M 100 50 Q 300 20 500 50 Q 700 80 900 50")',
                      offsetDistance: "0%",
                      animation: `dot-travel 3s linear ${i * 1}s infinite`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </svg>
          </div>

          {/* SKEUOMORPHIC INTELLIGENCE BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bento Intelligence 1 (Large Feature Card) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: false }}
              className="lg:col-span-2 p-8 rounded-3xl skeuo-card flex flex-col justify-between space-y-6 group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(37,99,235,0.12)] hover:border-[#2563eb]/25"
            >
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="px-3 py-1 rounded-md skeuo-inset font-bold text-[#3A2E26]">MODULE 01</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-[#0284C7] font-mono font-semibold">NEURAL REASONING</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-[#38BDF8] to-[#0284C7] shadow-[0_1px_4px_rgba(2,132,199,0.5)] border border-[#BAE6FD]/80" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-serif font-bold text-[#1E1712] skeuo-text-embossed">Evidence &amp; Exhibit Intelligence</h3>
                <p className="text-sm text-[#524337] font-sans leading-relaxed max-w-xl">
                  Quickly synthesize multi-thousand page case bundles, spot evidentiary contradictions across depositions, and cross-reference marked exhibits in courtroom briefs with sub-second accuracy.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs">
                <div className="p-3 rounded-xl skeuo-inset text-[#3C2F25]">
                  <div className="font-bold text-[#1E1712]">Cross-Exhibit Indexing</div>
                  <div className="text-[11px] text-[#7A6959] mt-0.5">Automated pagination &amp; citations</div>
                </div>
                <div className="p-3 rounded-xl skeuo-inset text-[#3C2F25]">
                  <div className="font-bold text-[#1E1712]">Inconsistency Spotter</div>
                  <div className="text-[11px] text-[#7A6959] mt-0.5">Affidavit disparity checks</div>
                </div>
              </div>
            </motion.div>

            {/* Bento Intelligence 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: false }}
              className="p-8 rounded-3xl skeuo-card flex flex-col justify-between space-y-6 group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(37,99,235,0.12)] hover:border-[#2563eb]/25"
            >
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="px-3 py-1 rounded-md skeuo-inset font-bold text-[#3A2E26]">MODULE 02</span>
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-[#38BDF8] to-[#0284C7] shadow-[0_1px_4px_rgba(2,132,199,0.5)] border border-[#BAE6FD]/80" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1E1712] mb-2 skeuo-text-embossed">Mediation Intelligence</h3>
                <p className="text-xs text-[#524337] font-sans leading-relaxed">
                  Formulate strategic settlement terms, analyze dispute contours, and evaluate compromise risks based on judicial precedents.
                </p>
              </div>
              <div className="p-3 rounded-xl skeuo-inset font-mono text-[11px] text-[#5C4D3F]">
                Settlement Contour Analysis
              </div>
            </motion.div>

            {/* Bento Intelligence 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: false }}
              className="p-8 rounded-3xl skeuo-card flex flex-col justify-between space-y-6 group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(37,99,235,0.12)] hover:border-[#2563eb]/25"
            >
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="px-3 py-1 rounded-md skeuo-inset font-bold text-[#3A2E26]">MODULE 03</span>
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-[#38BDF8] to-[#0284C7] shadow-[0_1px_4px_rgba(2,132,199,0.5)] border border-[#BAE6FD]/80" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1E1712] mb-2 skeuo-text-embossed">Maintenance Metrics</h3>
                <p className="text-xs text-[#524337] font-sans leading-relaxed">
                  Calculate statutory disclosures, evaluate financial statements under Rajnesh v. Neha guidelines, and formulate maintenance arguments.
                </p>
              </div>
              <div className="p-3 rounded-xl skeuo-inset font-mono text-[11px] text-[#5C4D3F]">
                Rajnesh v. Neha Metric Engine
              </div>
            </motion.div>

            {/* Bento Intelligence 4 (Wide Feature Card) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: false }}
              className="lg:col-span-2 p-8 rounded-3xl skeuo-card flex flex-col justify-between space-y-6 group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(37,99,235,0.12)] hover:border-[#2563eb]/25"
            >
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="px-3 py-1 rounded-md skeuo-inset font-bold text-[#3A2E26]">MODULE 04</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-[#0284C7] font-mono font-semibold">AUTOMATED COMPILATION</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-[#38BDF8] to-[#0284C7] shadow-[0_1px_4px_rgba(2,132,199,0.5)] border border-[#BAE6FD]/80" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-serif font-bold text-[#1E1712] skeuo-text-embossed">Intelligent Draft Builder</h3>
                <p className="text-sm text-[#524337] font-sans leading-relaxed max-w-xl">
                  Generate court-ready legal petitions, bail applications, affidavits, written statements, and notices formatted to Indian High Court and District Court filing standards.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 font-mono text-xs">
                <span className="px-3 py-1.5 rounded-lg skeuo-inset text-[#3C2F25] font-medium">Bail Petitions</span>
                <span className="px-3 py-1.5 rounded-lg skeuo-inset text-[#3C2F25] font-medium">Writ Petitions</span>
                <span className="px-3 py-1.5 rounded-lg skeuo-inset text-[#3C2F25] font-medium">Commercial Suits</span>
                <span className="px-3 py-1.5 rounded-lg skeuo-inset text-[#3C2F25] font-medium">Arbitration Notices</span>
              </div>
            </motion.div>
          </div>

        </div>
      </section>


      {/* ========================================================= */}
      {/* HOW IT WORKS (moved: after intelligence) */}
      {/* ========================================================= */}
      <HowItWorksSection />

      {/* ========================================================= */}
      {/* COURTS MARQUEE (kept directly after how-it-works) */}
      {/* ========================================================= */}
      <CourtsMarquee />

      {/* ========================================================= */}
      {/* SECTION 5: WHY CLAUSIO (ENGRAVED LEATHER FOLIOS) */}
      {/* ========================================================= */}
      <section
        id="why-clausio"
        className="relative z-30 min-h-screen py-24 px-8 md:px-16 xl:pl-56 xl:pr-24 border-t border-[#3A2E26]/10 flex flex-col justify-center"
      >
        <div className="max-w-5xl mx-auto w-full space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-[#6B5A4B] flex items-center justify-center space-x-2 mb-3">
              <span className="px-2 py-0.5 rounded skeuo-inset text-[10px]">04</span>
              <span>ADVANTAGES</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif tracking-tight text-[#1E1712] skeuo-text-embossed">
              Why Clausio?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Organized",
                tagline: "All important information at one place.",
                desc: "Stop hunting across folders, messaging apps, and physical registers. Clausio connects every docket, document, and date.",
              },
              {
                title: "Faster",
                tagline: "Less time spent searching and managing things.",
                desc: "Instant search and indexed files get you what you need during preparation or courtroom emergencies in seconds.",
              },
              {
                title: "Better Preparation",
                tagline: "Everything needed for a case can be accessed easily.",
                desc: "Review past proceedings, orders, and key briefs with clarity and confidence before entering the courtroom.",
              },
              {
                title: "Simple Workflow",
                tagline: "Makes day to day legal work easier to manage.",
                desc: "An interface designed for clarity without bloated configuration or unnecessary complexities.",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: false }}
                className="p-8 rounded-2xl skeuo-card space-y-3"
              >
                <WhyClausioIcon idx={idx} />
                <h3 className="text-2xl font-serif font-bold text-[#1E1712] skeuo-text-embossed">{item.title}</h3>
                <p className="text-sm font-medium font-sans text-[#33251D]">
                  {item.tagline}
                </p>
                <p className="text-xs text-[#5C4D3F] font-sans leading-relaxed pt-1">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 5.5: PRICING (added after why-clausio, before about) */}
      {/* ========================================================= */}
      <PricingSection />

      {/* ========================================================= */}
      {/* SECTION 6: THE TEAM */}
      {/* ========================================================= */}
      <section
        id="team"
        className="relative z-30 py-24 px-8 md:px-16 xl:pl-56 xl:pr-24 border-t border-[#3A2E26]/10"
      >
        <div className="max-w-6xl mx-auto w-full">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.3 }}
            className="text-center mb-16"
          >
            <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-[#6B5A4B] flex items-center justify-center space-x-2 mb-3">
              <span className="px-2 py-0.5 rounded skeuo-inset text-[10px]">06</span>
              <span>THE TEAM</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1E1712] skeuo-text-embossed">
              Built by practitioners
            </h2>
            <p className="text-sm font-sans text-[#4A3D33] mt-4 max-w-xl mx-auto leading-relaxed">
              A team that combines legal intelligence, engineering depth, and product craft
              to build the future of Indian litigation.
            </p>
          </motion.div>

          {/* Team cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Parth Bindra",
                role: "Founder & Director",
                description:
                  "Visionary behind Clausio. Building the future of AI-powered legal practice in India.",
                initials: "PB",
                color: "#2563eb",
                photo: "/team/parth-bindra.jpg",
                delay: 0,
              },
              {
                name: "Anurag Vishwakarma",
                role: "Chief Technology Officer",
                description:
                  "Architects the Clausio platform. Expert in scalable systems and AI integration.",
                initials: "AV",
                color: "#0891b2",
                photo: "/team/anurag-vishwakarma.jpg",
                delay: 0.1,
              },
              {
                name: "Omkar Morvekar",
                role: "Backend Developer",
                description:
                  "Engineers the core backend infrastructure powering Clausio's litigation intelligence.",
                initials: "OM",
                color: "#059669",
                photo: "/team/omkar-morvekar.jpg",
                delay: 0.2,
              },
              {
                name: "Aashima Nigam",
                role: "Prompt Engineer",
                description:
                  "Crafts the AI prompts that make Clausio's legal reasoning accurate and reliable.",
                initials: "AN",
                color: "#d97706",
                photo: "/team/aashima-nigam.jpg",
                delay: 0.3,
              },
            ].map((member) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: member.delay }}
                viewport={{ once: false }}
                whileHover={{ y: -6, scale: 1.02 }}
                style={{ transition: "box-shadow 0.3s ease" }}
                className="p-6 rounded-2xl skeuo-card flex flex-col items-center text-center cursor-default group"
              >
                {/* Avatar — photo from /public/team, else initials */}
                <TeamAvatar member={member} />

                {/* Name */}
                <h3 className="font-serif font-bold text-[#1E1712] text-base skeuo-text-embossed mb-1">
                  {member.name}
                </h3>

                {/* Role badge */}
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    background: member.color + "15",
                    color: member.color,
                    border: `1px solid ${member.color}30`,
                    marginBottom: 10,
                  }}
                >
                  {member.role}
                </span>

                {/* Description */}
                <p className="text-xs text-[#5C4D3F] font-sans leading-relaxed">
                  {member.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Bottom note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: false }}
            className="text-center text-xs font-mono text-[#8C7B6B] mt-12 tracking-widest uppercase"
          >
            Clausio Technologies Private Limited · Mumbai, India · Est. 2026
          </motion.p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 7: ABOUT */}
      {/* ========================================================= */}
      <section
        id="about"
        className="relative z-30 min-h-screen py-24 px-8 md:px-16 xl:pl-56 xl:pr-32 border-t border-[#3A2E26]/10 flex flex-col justify-center overflow-hidden"
      >
        {/* Decorative floating scale-of-justice watermark */}
        <div
          className="float-scale pointer-events-none absolute right-[-40px] xl:right-0 top-1/2 w-[500px] h-[500px]"
          style={{ opacity: 0.04, zIndex: 0 }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#0f172a" className="w-full h-full">
            <rect x="49" y="10" width="2" height="75" />
            <rect x="35" y="83" width="30" height="3" rx="1.5" />
            <rect x="20" y="18" width="60" height="2" rx="1" />
            <circle cx="50" cy="14" r="4" />
            <line x1="30" y1="20" x2="22" y2="40" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="70" y1="20" x2="78" y2="40" stroke="#0f172a" strokeWidth="1.5" />
            <path d="M 14 40 Q 22 48 30 40" stroke="#0f172a" strokeWidth="1.5" fill="none" />
            <path d="M 70 40 Q 78 48 86 40" stroke="#0f172a" strokeWidth="1.5" fill="none" />
          </svg>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto w-full space-y-12">
          {/* Heading + mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.3 }}
            className="flex flex-col items-center text-center space-y-5 max-w-2xl mx-auto"
          >
            <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-[#6B5A4B] flex items-center justify-center space-x-2">
              <span className="px-2 py-0.5 rounded skeuo-inset text-[10px]">07</span>
              <span>OUR MISSION</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-serif tracking-tight text-[#1E1712] skeuo-text-embossed">
              Built for Advocates
            </h2>

            <p className="text-lg md:text-xl font-sans text-[#3C2E24] leading-relaxed">
              Clausio is being built to make legal practice more organized, simple
              and efficient for Indian advocates — one calm workspace for cases,
              hearings, research, drafting and the daily grind of litigation.
            </p>
          </motion.div>

          {/* What we believe — principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Users2,
                title: "Advocate-first",
                desc: "Every screen is shaped around how litigation actually runs in Indian courts — not a generic case tracker bent to fit.",
              },
              {
                icon: ShieldCheck,
                title: "Private by default",
                desc: "Your case files stay yours. Data is encrypted and stored in AWS Mumbai (ap-south-1), aligned with the Indian IT Act, 2000.",
              },
              {
                icon: Sparkles,
                title: "Practical, not flashy",
                desc: "Clarity over configuration. The tool should get out of the way so you can focus on argument and strategy.",
              },
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: false }}
                  className="p-7 rounded-2xl skeuo-card flex flex-col space-y-3"
                >
                  <div className="w-11 h-11 rounded-xl skeuo-icon-badge flex items-center justify-center text-[#0369A1]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#1E1712] skeuo-text-embossed">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#524337] font-sans leading-relaxed">
                    {p.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Manifesto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: false, amount: 0.4 }}
            className="p-8 md:p-12 rounded-3xl skeuo-card flex flex-col items-center text-center space-y-5"
          >
            <Scale className="w-6 h-6 text-[#0369A1]" />
            <p className="text-xl md:text-3xl font-serif text-[#1E1712] leading-snug skeuo-text-embossed max-w-3xl">
              &ldquo;Litigation in India runs on paper, memory and long hours.
              Clausio exists to give that time back to the advocate.&rdquo;
            </p>
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] font-bold text-[#6B5A4B]">
              — The Clausio Team
            </div>
          </motion.div>

          {/* Commitments */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: false }}
            className="flex flex-wrap justify-center gap-3 text-[11px] font-mono text-[#4A3B30]"
          >
            {[
              "Indian Court Frameworks",
              "Advocate-First Architecture",
              "Encrypted & Private",
              "AWS Mumbai · ap-south-1",
              "IT Act 2000 Compliant",
              "For Bar Council-Enrolled Advocates",
            ].map((c) => (
              <span key={c} className="px-4 py-2 rounded-xl skeuo-inset font-semibold">
                {c}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 7: FINAL CALL TO ACTION (CTA) */}
      {/* ========================================================= */}
      <section
        id="cta"
        className="relative z-30 min-h-screen py-24 px-8 md:px-16 xl:pl-56 xl:pr-24 border-t border-[#3A2E26]/10 flex flex-col justify-center items-center text-center overflow-hidden"
      >
        {/* Animated gradient mesh orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          {/* Blue orb */}
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "15%",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
              animation: "orb-1 8s ease-in-out infinite",
              filter: "blur(40px)",
            }}
          />
          {/* Purple orb */}
          <div
            style={{
              position: "absolute",
              bottom: "15%",
              right: "20%",
              width: 350,
              height: 350,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)",
              animation: "orb-2 10s ease-in-out infinite",
              filter: "blur(40px)",
            }}
          />
          {/* Cyan orb */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
              animation: "orb-3 12s ease-in-out infinite",
              filter: "blur(40px)",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false, amount: 0.4 }}
          className="relative z-10 max-w-2xl space-y-8 skeuo-card p-12 md:p-16 rounded-3xl shadow-[0_30px_70px_rgba(40,25,15,0.2)]"
        >
          <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-[#6B5A4B] flex items-center justify-center space-x-2">
            <span className="px-2 py-0.5 rounded skeuo-inset text-[10px]">08</span>
            <span>GET STARTED</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-serif tracking-tight text-[#1E1712] skeuo-text-embossed leading-[1.05]">
            <ScrambleText text="Your Practice." />
            <br />
            <ScrambleText text="One Workspace." />
          </h2>

          <p className="text-base md:text-lg font-sans text-[#4A3B30] leading-relaxed max-w-lg mx-auto">
            Bring your cases, documents, hearings and legal work together with
            Clausio.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#2563eb] via-[#818cf8] to-[#38bdf8] blur-md opacity-40 group-hover:opacity-70 transition duration-1000 animate-pulse" />
              <button
                onClick={() => {
                  window.location.href = SIGNUP_URL;
                }}
                className="relative px-8 py-4 rounded-full text-xs font-mono uppercase tracking-[0.2em] font-semibold skeuo-btn-primary"
              >
                Get Started
              </button>
            </div>
            <button
              onClick={() =>
                window.open(`mailto:${DEMO_EMAIL}?subject=Clausio Demo Request`, "_blank")
              }
              className="px-8 py-4 rounded-full text-xs font-mono uppercase tracking-[0.2em] font-semibold skeuo-btn-secondary"
            >
              Book a Demo
            </button>
          </div>
        </motion.div>
      </section>

      {/* ========================================================= */}
      {/* FOOTER (DARK NAVY — 4 COLUMN) */}
      {/* ========================================================= */}
      <footer className="relative z-30 bg-[#0f172a] text-white px-8 md:px-16 xl:px-24 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1 — Brand */}
          <div>
            <div className="flex items-center space-x-3">
              <img
                src="/logo-1-transperent.png"
                alt="Clausio Logo"
                className="h-8 w-auto object-contain"
              />
              <div className="text-xl tracking-[0.25em] uppercase font-mono font-bold text-white">
                CLAUSIO
              </div>
            </div>
            <p className="text-xs font-mono text-white/70 mt-3 uppercase tracking-widest font-semibold">
              Intelligent Legal. Simplified.
            </p>
            <p className="text-xs text-white/50 mt-3 leading-relaxed max-w-xs">
              Built exclusively for advocates enrolled with Bar Councils across India.
            </p>
            <a
              href="https://linkedin.com/company/clausio"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Clausio on LinkedIn"
              className="inline-flex mt-4 text-white/60 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
              </svg>
            </a>
          </div>

          {/* Column 2 — Product */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-white/40 mb-4">
              PRODUCT
            </div>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>
                <button onClick={() => scrollTo("features")} className="hover:text-white transition-colors">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("intelligence")} className="hover:text-white transition-colors">
                  Intelligence
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("pricing")} className="hover:text-white transition-colors">
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("how-it-works")} className="hover:text-white transition-colors">
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-white/40 mb-4">
              COMPANY
            </div>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>
                <button onClick={() => scrollTo("about")} className="hover:text-white transition-colors">
                  About
                </button>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 — Compliance */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-white/40 mb-4">
              COMPLIANCE
            </div>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>Data stored in AWS Mumbai (ap-south-1)</li>
              <li>Compliant with Indian IT Act 2000</li>
              <li>Secure · Encrypted · Private</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-[11px] font-mono text-white/50">
          <div>© 2026 Clausio Technologies Private Limited</div>
          <div className="mt-2 sm:mt-0">Made with ♥ for Indian Advocates</div>
        </div>
      </footer>

      {/* VERTICAL SCROLL-PROGRESS BEAM (left rail, features → cta) */}
      <div
        className="fixed left-8 hidden xl:block pointer-events-none z-30"
        style={{
          top: "15%",
          height: "70%",
          width: 2,
          background: "rgba(37,99,235,0.08)",
          borderRadius: 999,
        }}
      >
        <motion.div
          className="w-full rounded-full"
          style={{
            height: lineHeight,
            background: "linear-gradient(to bottom, #2563eb, #818cf8)",
          }}
        />
      </div>

      {/* FIXED BOTTOM LEFT — AMBIENT SOUND TOGGLE */}
      <div className="fixed bottom-6 left-8 z-40 hidden md:flex flex-col items-start gap-3">
        <button
          onClick={toggleSound}
          className="flex items-center gap-2 text-[10px] font-mono text-[#5C4D3F] hover:text-[#1E1712] transition-colors group"
          title={soundOn ? "Mute ambient sound" : "Play ambient sound"}
        >
          <span className="w-5 h-5 flex items-center justify-center rounded-full skeuo-inset text-[12px]">
            {soundOn ? "🔊" : "🔇"}
          </span>
          <span className="font-semibold">{soundOn ? "SOUND ON" : "AMBIENT"}</span>
        </button>
      </div>

      {/* FIXED BOTTOM RIGHT LANGUAGE (nudged left to clear the help launcher) */}
      <div className="fixed bottom-6 right-24 z-40 text-[10px] font-mono text-[#5C4D3F] space-x-2 hidden md:block">
        <span className="text-[#1E1712] font-bold px-2 py-1 rounded skeuo-inset cursor-pointer">EN</span>
      </div>

      {/* FLOATING FAQ CHAT */}
      <FaqChat />
    </div>
  );
}
