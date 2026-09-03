'use client'

import React from 'react'

const features = [
  {
    icon: '🤖',
    title: 'AI Drafting',
    description: 'Generate petitions, applications and legal notices in seconds.',
  },
  {
    icon: '⚖️',
    title: 'Legal Research',
    description: 'Search judgments, statutes and precedents using AI.',
  },
  {
    icon: '🧠',
    title: 'Judge Insights',
    description: 'Understand judicial trends and previous decisions.',
  },
  {
    icon: '📊',
    title: 'Financial Intelligence',
    description: 'Maintenance, settlement and financial analysis.',
  },
  {
    icon: '📂',
    title: 'Evidence Intelligence',
    description: 'OCR, timelines and contradiction detection.',
  },
  {
    icon: '💬',
    title: 'Client Communication',
    description: 'Automatic WhatsApp and email updates.',
  },
]

const stats = [
  {
    value: '500+',
    label: 'Draft Templates',
  },
  {
    value: '25K+',
    label: 'Judgments',
  },
  {
    value: '99%',
    label: 'AI Accuracy',
  },
  {
    value: '24×7',
    label: 'AI Assistant',
  },
]

export default function LoginBanner() {
  return (
    <div
      style={{
        position: 'relative',
        background:
          'linear-gradient(135deg,#0f172a 0%,#1e3a8a 45%,#2563eb 100%)',
        color: '#fff',
        padding: '70px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        minHeight: '100vh',
      }}
    >
      {/* Background Circles */}

      <div
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.06)',
          top: -180,
          right: -120,
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.05)',
          bottom: -100,
          left: -80,
        }}
      />

      {/* Hero */}

      <div
        style={{
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,.12)',
            padding: '8px 18px',
            borderRadius: 999,
            fontWeight: 600,
            marginBottom: 28,
          }}
        >
          AI Legal Operating System
        </div>

        <h1
          style={{
            fontSize: 50,
            lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          Build the Future
          <br />
          of Legal Practice
        </h1>

        <p
          style={{
            maxWidth: 520,
            fontSize: 18,
            lineHeight: 1.8,
            opacity: .92,
          }}
        >
          Clausio combines AI drafting, legal research,
          financial intelligence, judge insights,
          evidence analysis and complete case
          management into one platform.
        </p>

        {/* Feature Grid */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 18,
            marginTop: 40,
          }}
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              style={{
                background: 'rgba(255,255,255,.10)',
                border: '1px solid rgba(255,255,255,.15)',
                backdropFilter: 'blur(12px)',
                borderRadius: 18,
                padding: 20,
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  marginBottom: 14,
                }}
              >
                {feature.icon}
              </div>

              <h3
                style={{
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                {feature.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.7,
                  opacity: .9,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}

      <div
        style={{
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 18,
          }}
        >
          {stats.map((item) => (
            <div
              key={item.label}
              style={{
                background: 'rgba(255,255,255,.10)',
                borderRadius: 16,
                padding: 20,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {item.value}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  opacity: .85,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: 30,
            opacity: .9,
            fontSize: 15,
          }}
        >
          Trusted by advocates, chambers and modern law firms across India.
        </p>
      </div>
    </div>
  )
}