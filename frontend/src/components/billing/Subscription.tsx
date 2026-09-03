'use client'

import { useState, useEffect } from 'react'
import { subscriptionApi } from '@/lib/billingApi'

export default function Subscription() {
  const [status, setStatus] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAnnual, setIsAnnual] = useState(false)
  const [processingPlan, setProcessingPlan] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [s, p, h] = await Promise.all([
        subscriptionApi.getStatus(),
        subscriptionApi.getPlans(),
        subscriptionApi.getBillingHistory(),
      ])
      setStatus(s)
      setPlans(p)
      setHistory(h)
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  async function handleChoosePlan(planName: string) {
    if (planName === 'Enterprise') {
      window.open('mailto:sales@clausio.io?subject=Enterprise Plan Enquiry', '_blank')
      return
    }
    try {
      setProcessingPlan(planName)
      const order = await subscriptionApi.createOrder({
        planName,
        isAnnual
      })

      // Test mode — no payment gateway configured on the backend.
      // Activate the plan directly (still written to the database).
      if (!order.razorpayKeyId) {
        await subscriptionApi.verifyPayment({
          razorpayOrderId: order.orderId || '',
          razorpayPaymentId: '',
          razorpaySignature: '',
          planName: order.planName,
          isAnnual
        })
        await loadAll()
        alert(`✅ ${order.planName} plan activated.\n\n(Test mode — no payment gateway is configured. Add live Razorpay keys in appsettings.json to take real payments.)`)
        return
      }

      // Load Razorpay script dynamically
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
      script.onload = () => {
        const options = {
          key: order.razorpayKeyId,
          amount: order.amount * 100,
          currency: order.currency,
          name: 'Clausio Technologies Pvt. Ltd.',
          description: `${order.planName} Plan — ${isAnnual ? 'Annual' : 'Monthly'}`,
          order_id: order.orderId,
          prefill: {
            name: order.userName,
            email: order.userEmail,
          },
          theme: { color: '#2563eb' },
          handler: async function(response: any) {
            try {
              await subscriptionApi.verifyPayment({
                razorpayOrderId: order.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                planName: order.planName,
                isAnnual
              })
              await loadAll()
              alert(`✅ ${order.planName} plan activated successfully!`)
            } catch {
              alert('Payment verified but activation failed. Contact support@clausio.io')
            }
          },
        }
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initiate payment')
    } finally {
      setProcessingPlan('')
    }
  }

  async function handleCancel() {
    try {
      await subscriptionApi.cancel('User requested cancellation')
      setShowCancelConfirm(false)
      await loadAll()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscription')
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1073741824)
      return `${(bytes / 1048576).toFixed(1)} MB`
    return `${(bytes / 1073741824).toFixed(1)} GB`
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\//g, '.')
  }

  function formatINR(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-IN')}/-`
  }

  function usagePct(used: number, max: number): number {
    if (max >= 999999) return 0
    return Math.min(100, Math.round((used / max) * 100))
  }

  function usageColor(pct: number): string {
    if (pct >= 100) return '#dc2626'
    if (pct >= 80) return '#d97706'
    return '#2563eb'
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <i className="ti ti-loader animate-spin"
           style={{ fontSize: 32, color: '#2563eb' }} />
        <p style={{ color: '#64748b', marginTop: 12 }}>
          Loading subscription details...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '20px', background: '#fef2f2',
        border: '1px solid #fca5a5', borderRadius: 12,
        color: '#dc2626', textAlign: 'center'
      }}>
        {error}
        <button onClick={loadAll} style={{
          display: 'block', margin: '12px auto 0',
          padding: '8px 16px', background: '#dc2626',
          color: '#fff', border: 'none', borderRadius: 8,
          cursor: 'pointer', fontFamily: 'inherit',
          fontWeight: 600
        }}>Retry</button>
      </div>
    )
  }

  const statusColor = status?.status === 'Active' ? '#16a34a'
    : status?.status === 'Trial' ? '#d97706'
    : '#dc2626'

  const faqs = [
    {
      q: 'Can I upgrade or downgrade anytime?',
      a: 'Yes. Upgrade takes effect immediately with prorated billing. Downgrade at next billing cycle.'
    },
    {
      q: 'Is my data safe if I cancel?',
      a: 'Yes. Data stored 90 days after cancellation. Export all data anytime.'
    },
    {
      q: 'Do I get a GST invoice for every payment?',
      a: 'Yes. GST-compliant invoice from Clausio Technologies Private Limited in Billing History.'
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes. 14-day free trial on Professional plan. No credit card required.'
    },
    {
      q: 'What payment methods are accepted?',
      a: 'UPI, Credit card, Debit card, Net banking, bank transfer via Razorpay.'
    },
    {
      q: 'Can I add team members later?',
      a: 'Yes. Add or remove from Masters section anytime.'
    },
    {
      q: 'What happens when I reach usage limits?',
      a: 'Notification at 80%. Upgrade or wait for next billing cycle at 100%.'
    },
    {
      q: 'Is Clausio compliant with Indian data laws?',
      a: 'Yes. Data stored in AWS Mumbai ap-south-1. Complies with Indian IT Act.'
    },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 32
    }}>

      {/* ── SECTION 1: CURRENT PLAN BANNER ── */}
      <div style={{
        padding: '24px 28px',
        background: status?.status === 'Expired'
          ? '#fef2f2'
          : status?.status === 'Trial'
          ? '#fffbeb'
          : '#eff6ff',
        border: `1px solid ${
          status?.status === 'Expired' ? '#fca5a5'
          : status?.status === 'Trial' ? '#fde68a'
          : '#bfdbfe'}`,
        borderRadius: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 24 }}>
              {status?.status === 'Trial' ? '🎁'
               : status?.status === 'Expired' ? '⚠️'
               : '⭐'}
            </span>
            <h2 style={{
              margin: 0, fontSize: 20, fontWeight: 700,
              color: '#0f172a'
            }}>
              {status?.planName}
            </h2>
            <span style={{
              padding: '3px 10px',
              background: statusColor + '20',
              color: statusColor,
              borderRadius: 20, fontSize: 11,
              fontWeight: 700
            }}>
              {status?.status?.toUpperCase()}
            </span>
          </div>
          <p style={{
            margin: '8px 0 0', color: '#64748b', fontSize: 13
          }}>
            {status?.status === 'Expired'
              ? `Your plan expired on ${formatDate(status?.endDate)}. Your data is safe. Reactivate to continue.`
              : status?.status === 'Trial'
              ? `Trial ends ${formatDate(status?.endDate)} · ${status?.daysRemaining} days remaining. Upgrade to keep your work.`
              : `Renews on ${formatDate(status?.endDate)} · ${status?.daysRemaining} days remaining`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {status?.status === 'Expired' ? (
            <button
              onClick={() => handleChoosePlan('Professional')}
              style={{
                padding: '10px 20px',
                background: '#dc2626', color: '#fff',
                border: 'none', borderRadius: 10,
                fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13
              }}>
              Reactivate Now
            </button>
          ) : status?.status === 'Trial' ? (
            <button
              onClick={() => handleChoosePlan('Professional')}
              style={{
                padding: '10px 20px',
                background: '#d97706', color: '#fff',
                border: 'none', borderRadius: 10,
                fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13
              }}>
              Upgrade Now — Don't lose your work
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowCancelConfirm(true)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  borderRadius: 10, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13
                }}>
                Cancel Plan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cancel Confirm Dialog */}
      {showCancelConfirm && (
        <div style={{
          padding: 20, background: '#fef2f2',
          border: '1px solid #fca5a5', borderRadius: 12
        }}>
          <p style={{
            margin: '0 0 12px', fontWeight: 600,
            color: '#0f172a'
          }}>
            Are you sure you want to cancel?
          </p>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>
            Your access continues until {formatDate(status?.endDate)}.
            Your data is kept for 90 days after cancellation.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleCancel} style={{
              padding: '8px 16px', background: '#dc2626',
              color: '#fff', border: 'none', borderRadius: 8,
              fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit'
            }}>
              Yes, Cancel
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              style={{
                padding: '8px 16px', background: '#f1f5f9',
                color: '#0f172a', border: 'none',
                borderRadius: 8, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
              Keep My Plan
            </button>
          </div>
        </div>
      )}

      {/* ── SECTION 2: USAGE METERS ── */}
      {status && (
        <div>
          <h3 style={{
            margin: '0 0 16px', fontSize: 15,
            fontWeight: 700, color: '#0f172a'
          }}>
            Current Usage
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}>
            {[
              {
                label: 'Active Cases',
                used: status.activeCasesCount,
                max: status.maxCases,
                display: status.maxCases >= 999999
                  ? `${status.activeCasesCount} / Unlimited`
                  : `${status.activeCasesCount} / ${status.maxCases}`
              },
              {
                label: 'AI Drafts This Month',
                used: status.draftsThisMonth,
                max: status.maxDraftsPerMonth,
                display: status.maxDraftsPerMonth >= 999999
                  ? `${status.draftsThisMonth} / Unlimited`
                  : `${status.draftsThisMonth} / ${status.maxDraftsPerMonth}`
              },
              {
                label: 'Team Members',
                used: status.teamMembersCount,
                max: status.maxTeamMembers,
                display: status.maxTeamMembers >= 999999
                  ? `${status.teamMembersCount} / Unlimited`
                  : `${status.teamMembersCount} / ${status.maxTeamMembers}`
              },
              {
                label: 'Document Storage',
                used: status.storageUsedBytes,
                max: status.maxStorageBytes,
                display: `${formatBytes(status.storageUsedBytes)} / ${formatBytes(status.maxStorageBytes)}`
              },
            ].map(meter => {
              const pct = usagePct(meter.used, meter.max)
              const color = usageColor(pct)
              return (
                <div key={meter.label} style={{
                  padding: '16px 20px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8
                  }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: '#475569'
                    }}>
                      {meter.label}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color
                    }}>
                      {meter.max >= 999999 ? '∞' : `${pct}%`}
                    </span>
                  </div>
                  <div style={{
                    height: 6, background: '#f1f5f9',
                    borderRadius: 99, overflow: 'hidden',
                    marginBottom: 8
                  }}>
                    {meter.max < 999999 && (
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: color,
                        borderRadius: 99,
                        transition: 'width 0.5s ease'
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, color: '#64748b'
                  }}>
                    {meter.display}
                  </span>
                  {pct >= 100 && meter.max < 999999 && (
                    <div style={{
                      marginTop: 6, fontSize: 10,
                      color: '#dc2626', fontWeight: 600
                    }}>
                      Limit reached — upgrade to get more
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 3: PRICING PLANS ── */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <h3 style={{
            margin: 0, fontSize: 15, fontWeight: 700,
            color: '#0f172a'
          }}>
            Plans
          </h3>
          {/* Annual / Monthly toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: !isAnnual ? '#0f172a' : '#94a3b8'
            }}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              style={{
                width: 44, height: 24,
                borderRadius: 99,
                background: isAnnual ? '#2563eb' : '#e2e8f0',
                border: 'none', cursor: 'pointer',
                position: 'relative', transition: '.2s'
              }}>
              <span style={{
                position: 'absolute', top: 2,
                left: isAnnual ? 22 : 2,
                width: 20, height: 20,
                background: '#fff', borderRadius: '50%',
                transition: '.2s', display: 'block'
              }} />
            </button>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: isAnnual ? '#0f172a' : '#94a3b8'
            }}>
              Annual
              <span style={{
                marginLeft: 6, padding: '2px 6px',
                background: '#dcfce7', color: '#16a34a',
                borderRadius: 20, fontSize: 10,
                fontWeight: 700
              }}>
                SAVE 20%
              </span>
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20
        }}>
          {plans.map(plan => {
            const isComingSoon = plan.name === 'Starter' || plan.name === 'Professional'

            return (
            <div key={plan.name} style={{
              padding: '24px 20px',
              background: plan.isRecommended
                ? '#eff6ff' : '#fff',
              border: plan.isRecommended
                ? '2px solid #2563eb'
                : '1px solid #e2e8f0',
              borderRadius: 16,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {isComingSoon && (
                <div style={{
                  alignSelf: 'flex-start',
                  marginBottom: 12,
                  padding: '4px 10px',
                  background: '#fef3c7',
                  color: '#b45309',
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                  textTransform: 'uppercase'
                }}>
                  Coming soon
                </div>
              )}
              {plan.isRecommended && (
                <div style={{
                  position: 'absolute', top: -12,
                  left: '50%', transform: 'translateX(-50%)',
                  background: '#2563eb', color: '#fff',
                  padding: '4px 14px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}>
                  MOST POPULAR
                </div>
              )}

              <h3 style={{
                margin: '0 0 4px', fontSize: 18,
                fontWeight: 700, color: '#0f172a'
              }}>
                {plan.name}
              </h3>
              <p style={{
                margin: '0 0 16px', fontSize: 12,
                color: '#64748b'
              }}>
                {plan.description}
              </p>

              <div style={{ marginBottom: 20 }}>
                {plan.monthlyPrice === 0 ? (
                  <div style={{
                    fontSize: 22, fontWeight: 800,
                    color: '#0f172a'
                  }}>
                    Custom Pricing
                  </div>
                ) : (
                  <>
                    <div style={{
                      fontSize: 28, fontWeight: 800,
                      color: '#0f172a'
                    }}>
                      Rs. {(isAnnual
                        ? Math.round(plan.annualPrice / 12)
                        : plan.monthlyPrice
                      ).toLocaleString('en-IN')}
                      <span style={{
                        fontSize: 13, fontWeight: 500,
                        color: '#64748b'
                      }}>/month</span>
                    </div>
                    {isAnnual && (
                      <div style={{
                        fontSize: 11, color: '#16a34a',
                        fontWeight: 600, marginTop: 4
                      }}>
                        Rs. {plan.annualPrice.toLocaleString('en-IN')}/year
                        · Save Rs. {(plan.monthlyPrice * 12 - plan.annualPrice).toLocaleString('en-IN')}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{
                flex: 1, display: 'flex',
                flexDirection: 'column', gap: 8,
                marginBottom: 20
              }}>
                {plan.features?.map((f: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start',
                    gap: 8, fontSize: 13
                  }}>
                    <span style={{
                      color: f.included ? '#16a34a' : '#94a3b8',
                      fontSize: 16, lineHeight: 1,
                      flexShrink: 0
                    }}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    <span style={{
                      color: f.included ? '#374151' : '#94a3b8'
                    }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleChoosePlan(plan.name)}
                disabled={isComingSoon || processingPlan === plan.name ||
                  status?.planName === plan.name}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: isComingSoon || status?.planName === plan.name
                    ? '#e2e8f0'
                    : plan.isRecommended
                    ? '#2563eb' : '#0f172a',
                  color: isComingSoon || status?.planName === plan.name
                    ? '#94a3b8' : '#fff',
                  border: 'none', borderRadius: 10,
                  fontWeight: 700, fontSize: 14,
                  cursor: isComingSoon || status?.planName === plan.name
                    ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  transition: '.2s'
                }}>
                {isComingSoon
                  ? 'Coming soon'
                  : processingPlan === plan.name
                  ? 'Processing...'
                  : status?.planName === plan.name
                  ? 'Current Plan'
                  : plan.monthlyPrice === 0
                  ? 'Contact Sales'
                  : `Choose ${plan.name}`}
              </button>
            </div>
            )
          })}
        </div>
      </div>

      {/* ── SECTION 4: BILLING HISTORY ── */}
      <div>
        <h3 style={{
          margin: '0 0 16px', fontSize: 15,
          fontWeight: 700, color: '#0f172a'
        }}>
          Billing History
        </h3>

        {history.length === 0 ? (
          <div style={{
            padding: '32px 20px', textAlign: 'center',
            background: '#f8fafc',
            border: '1px solid #e2e8f0', borderRadius: 12,
            color: '#64748b', fontSize: 13
          }}>
            No billing history yet.
            Payments will appear here after your first purchase.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontSize: 13
            }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Date', 'Invoice No.', 'Plan',
                    'Amount', 'GST', 'Total',
                    'Status'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 700, color: '#475569',
                      fontSize: 11,
                      textTransform: 'uppercase' as const,
                      border: '1px solid #e2e8f0'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => {
                  const paid = row.status === 'Paid'
                  const pillBg = paid ? '#dcfce7' : '#fef2f2'
                  const pillColor = paid ? '#16a34a' : '#dc2626'
                  return (
                    <tr key={row.id} style={{
                      background: i % 2 === 0 ? '#fff' : '#f8fafc'
                    }}>
                      <td style={{
                        padding: '10px 14px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {formatDate(row.paymentDate)}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        border: '1px solid #e2e8f0',
                        fontFamily: 'monospace',
                        fontSize: 12
                      }}>
                        {row.invoiceNumber}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {row.planName}
                        {row.isAnnual ? ' (Annual)' : ' (Monthly)'}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {formatINR(row.amount)}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {formatINR(row.gstAmount)}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        border: '1px solid #e2e8f0',
                        fontWeight: 700
                      }}>
                        {formatINR(row.totalAmount)}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <span style={{
                          padding: '3px 10px',
                          background: pillBg,
                          color: pillColor,
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700
                        }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 5: FAQ ── */}
      <div>
        <h3 style={{
          margin: '0 0 16px', fontSize: 15,
          fontWeight: 700, color: '#0f172a'
        }}>
          Frequently Asked Questions
        </h3>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          {faqs.map((faq, i) => {
            const open = openFaq === i
            return (
              <div key={i} style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#fff'
              }}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 18px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0f172a'
                  }}>
                  {faq.q}
                  <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`}
                     style={{ fontSize: 16, color: '#94a3b8', flexShrink: 0 }} />
                </button>
                {open && (
                  <div style={{
                    padding: '0 18px 16px',
                    fontSize: 13,
                    color: '#475569',
                    lineHeight: 1.6
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
