import { motion } from 'framer-motion';
import { Button } from '../ui';
import { useStore } from '../../store/useStore';
import { colors, fonts, spacing, radius, fontSizes, fontWeights } from '../../styles/design-system';
import type { CSSProperties } from 'react';
import {
  Zap,
  Target,
  Clock,
  Shield,
  Users,
  BarChart3,
  FileText,
  Brain,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';

export function LandingScreen() {
  const setScreen = useStore((s) => s.setScreen);

  // Base styles
  const pageStyle: CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: colors.void,
    color: colors.snow,
    overflowX: 'hidden',
  };

  return (
    <div style={pageStyle}>
      {/* Background Effects */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 100% 80% at 50% -20%, rgba(0, 240, 255, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse 80% 60% at 100% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 0% 80%, rgba(0, 255, 136, 0.05) 0%, transparent 50%)
        `,
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        backgroundColor: 'rgba(6, 6, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: `0 ${spacing[8]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '80px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: radius.xl,
              background: `linear-gradient(135deg, ${colors.cyan}, ${colors.violet})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
            }}>
              <Zap style={{ width: 24, height: 24, color: colors.void }} />
            </div>
            <div>
              <span style={{
                fontFamily: fonts.display,
                fontWeight: fontWeights.bold,
                fontSize: fontSizes.xl,
                color: colors.snow,
              }}>
                HireScore<span style={{ color: colors.cyan }}>AI</span>
              </span>
              <div style={{ fontSize: fontSizes.xs, color: colors.silver, marginTop: '-2px' }}>
                Enterprise Recruitment Intelligence
              </div>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: spacing[8] }}>
            <a href="#how-it-works" style={{ color: colors.silver, textDecoration: 'none', fontSize: fontSizes.sm, fontWeight: fontWeights.medium }}>How It Works</a>
            <a href="#features" style={{ color: colors.silver, textDecoration: 'none', fontSize: fontSizes.sm, fontWeight: fontWeights.medium }}>Features</a>
            <a href="#pricing" style={{ color: colors.silver, textDecoration: 'none', fontSize: fontSizes.sm, fontWeight: fontWeights.medium }}>Pricing</a>
            <Button variant="primary" size="sm" onClick={() => setScreen('job')}>
              Start Free Trial
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section - Problem-Focused */}
      <section style={{
        padding: `${spacing[20]} ${spacing[8]} ${spacing[16]}`,
        position: 'relative',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing[3],
              padding: `${spacing[2]} ${spacing[5]}`,
              borderRadius: radius.full,
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              marginBottom: spacing[8],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} style={{ width: 14, height: 14, fill: colors.amber, color: colors.amber }} />
              ))}
            </div>
            <span style={{ fontSize: fontSizes.sm, color: colors.emerald, fontWeight: fontWeights.medium }}>
              Trusted by 500+ HR Teams Worldwide
            </span>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[16], alignItems: 'center' }}>
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 style={{
                fontFamily: fonts.display,
                fontSize: 'clamp(42px, 5vw, 64px)',
                fontWeight: fontWeights.bold,
                lineHeight: 1.1,
                marginBottom: spacing[6],
                color: colors.snow,
              }}>
                Stop Drowning in
                <br />
                <span style={{
                  background: `linear-gradient(135deg, ${colors.cyan}, ${colors.violet})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Resume Chaos
                </span>
              </h1>

              <p style={{
                fontSize: fontSizes.xl,
                color: colors.silver,
                lineHeight: 1.7,
                marginBottom: spacing[8],
                maxWidth: '540px',
              }}>
                Your hiring team spends <strong style={{ color: colors.coral }}>23 hours per hire</strong> screening resumes.
                HireScore AI reduces that to <strong style={{ color: colors.emerald }}>23 minutes</strong> with
                AI-powered candidate matching that's more accurate than human review.
              </p>

              {/* Key Value Props */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[8] }}>
                {[
                  'Screen 1000+ CVs in under 10 minutes',
                  'AI-generated interview questions for each candidate',
                  'Bias-free scoring based on skills & experience',
                  'Works with any job description or CV format',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <CheckCircle style={{ width: 20, height: 20, color: colors.emerald, flexShrink: 0 }} />
                    <span style={{ fontSize: fontSizes.base, color: colors.silver }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div style={{ display: 'flex', gap: spacing[4], alignItems: 'center' }}>
                <Button size="lg" onClick={() => setScreen('job')} icon={<Zap style={{ width: 20, height: 20 }} />}>
                  Start Screening Free
                </Button>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  background: 'none',
                  border: 'none',
                  color: colors.silver,
                  fontSize: fontSizes.base,
                  cursor: 'pointer',
                  padding: spacing[3],
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Play style={{ width: 18, height: 18, color: colors.snow, marginLeft: '2px' }} />
                  </div>
                  <span>Watch 2-min Demo</span>
                </button>
              </div>

              {/* No Credit Card */}
              <p style={{ fontSize: fontSizes.sm, color: colors.steel, marginTop: spacing[4] }}>
                No credit card required • Free for up to 50 CVs/month
              </p>
            </motion.div>

            {/* Right - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{ position: 'relative' }}
            >
              {/* Dashboard Preview Card */}
              <div style={{
                backgroundColor: 'rgba(26, 26, 36, 0.8)',
                borderRadius: radius['2xl'],
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: spacing[6],
                boxShadow: '0 40px 80px rgba(0, 0, 0, 0.5)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[6] }}>
                  <div>
                    <div style={{ fontSize: fontSizes.sm, color: colors.silver }}>Screening Results</div>
                    <div style={{ fontFamily: fonts.display, fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.snow }}>Senior Developer Role</div>
                  </div>
                  <div style={{
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: radius.full,
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    color: colors.emerald,
                    fontSize: fontSizes.sm,
                    fontWeight: fontWeights.medium,
                  }}>
                    247 CVs Processed
                  </div>
                </div>

                {/* Sample Results */}
                {[
                  { name: 'Sarah Chen', score: 94, match: 'Excellent', color: colors.emerald },
                  { name: 'Marcus Johnson', score: 87, match: 'Strong', color: colors.cyan },
                  { name: 'Emily Rodriguez', score: 82, match: 'Good', color: colors.amber },
                ].map((candidate, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing[4],
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: radius.lg,
                    marginBottom: spacing[3],
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${colors.violet}, ${colors.cyan})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: fontWeights.bold,
                        fontSize: fontSizes.sm,
                      }}>
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: fontWeights.medium, color: colors.snow }}>{candidate.name}</div>
                        <div style={{ fontSize: fontSizes.xs, color: colors.silver }}>5+ years experience</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: fonts.display, fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: candidate.color }}>{candidate.score}</div>
                      <div style={{ fontSize: fontSizes.xs, color: candidate.color }}>{candidate.match} Match</div>
                    </div>
                  </div>
                ))}

                {/* View All Button */}
                <button style={{
                  width: '100%',
                  padding: spacing[3],
                  backgroundColor: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRadius: radius.lg,
                  color: colors.cyan,
                  fontSize: fontSizes.sm,
                  fontWeight: fontWeights.medium,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                }}>
                  View All 247 Candidates
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </div>

              {/* Floating Stats */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  padding: spacing[4],
                  backgroundColor: 'rgba(26, 26, 36, 0.95)',
                  borderRadius: radius.xl,
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <TrendingUp style={{ width: 20, height: 20, color: colors.emerald }} />
                  <span style={{ fontFamily: fonts.display, fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.emerald }}>85%</span>
                </div>
                <div style={{ fontSize: fontSizes.xs, color: colors.silver }}>Time Saved</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                style={{
                  position: 'absolute',
                  bottom: '40px',
                  left: '-30px',
                  padding: spacing[4],
                  backgroundColor: 'rgba(26, 26, 36, 0.95)',
                  borderRadius: radius.xl,
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Brain style={{ width: 20, height: 20, color: colors.violet }} />
                  <span style={{ fontFamily: fonts.display, fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.violet }}>AI Powered</span>
                </div>
                <div style={{ fontSize: fontSizes.xs, color: colors.silver }}>Claude, GPT-5, Gemini</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof - Logos */}
      <section style={{ padding: `${spacing[12]} ${spacing[8]}`, borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: fontSizes.sm, color: colors.steel, marginBottom: spacing[8], textTransform: 'uppercase', letterSpacing: '2px' }}>
            Trusted by Recruiting Teams at
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: spacing[16], flexWrap: 'wrap', opacity: 0.6 }}>
            {['TechCorp', 'Innovate Inc', 'Global Talent', 'Recruit Pro', 'HR Solutions'].map(company => (
              <div key={company} style={{ fontFamily: fonts.display, fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.silver }}>
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section style={{ padding: `${spacing[20]} ${spacing[8]}` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: fonts.display,
            fontSize: fontSizes['4xl'],
            fontWeight: fontWeights.bold,
            color: colors.snow,
            marginBottom: spacing[6],
          }}>
            The <span style={{ color: colors.coral }}>Hidden Cost</span> of Manual Screening
          </h2>
          <p style={{ fontSize: fontSizes.lg, color: colors.silver, marginBottom: spacing[12], maxWidth: '700px', margin: '0 auto' }}>
            Every open position costs your team valuable time and resources
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing[6], marginTop: spacing[12] }}>
            {[
              { value: '23 hrs', label: 'Avg. time to screen per role', icon: Clock, color: colors.coral },
              { value: '250+', label: 'Resumes per job posting', icon: FileText, color: colors.amber },
              { value: '75%', label: 'Candidates wrongly rejected', icon: Users, color: colors.violet },
              { value: '$4,700', label: 'Cost per bad hire', icon: TrendingUp, color: colors.coral },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                style={{
                  padding: spacing[8],
                  borderRadius: radius.xl,
                  backgroundColor: 'rgba(26, 26, 36, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <stat.icon style={{ width: 32, height: 32, color: stat.color, marginBottom: spacing[4] }} />
                <div style={{ fontFamily: fonts.display, fontSize: fontSizes['3xl'], fontWeight: fontWeights.bold, color: colors.snow, marginBottom: spacing[2] }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: fontSizes.sm, color: colors.silver }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: `${spacing[20]} ${spacing[8]}`, backgroundColor: 'rgba(26, 26, 36, 0.3)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing[16] }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: radius.full,
              backgroundColor: 'rgba(0, 240, 255, 0.1)',
              marginBottom: spacing[4],
            }}>
              <Sparkles style={{ width: 16, height: 16, color: colors.cyan }} />
              <span style={{ fontSize: fontSizes.sm, color: colors.cyan, fontWeight: fontWeights.medium }}>Simple 3-Step Process</span>
            </div>
            <h2 style={{
              fontFamily: fonts.display,
              fontSize: fontSizes['4xl'],
              fontWeight: fontWeights.bold,
              color: colors.snow,
              marginBottom: spacing[4],
            }}>
              From Job Post to Top Candidates
              <br />in <span style={{ color: colors.cyan }}>Minutes</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[8] }}>
            {[
              {
                step: '01',
                title: 'Paste Your Job Description',
                desc: 'Simply paste your job requirements or import from LinkedIn, Indeed, or any job board. Our AI understands any format.',
                icon: FileText,
                color: colors.cyan,
              },
              {
                step: '02',
                title: 'Upload Candidate CVs',
                desc: 'Drag and drop hundreds of resumes at once. Supports PDF, Word, and text files. Or paste CV content directly.',
                icon: Users,
                color: colors.violet,
              },
              {
                step: '03',
                title: 'Get Ranked Results',
                desc: 'AI analyzes each candidate against your requirements. Get match scores, skill breakdowns, and interview questions.',
                icon: BarChart3,
                color: colors.emerald,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                style={{
                  padding: spacing[8],
                  borderRadius: radius['2xl'],
                  backgroundColor: 'rgba(10, 10, 15, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: spacing[6],
                  right: spacing[6],
                  fontFamily: fonts.display,
                  fontSize: fontSizes['4xl'],
                  fontWeight: fontWeights.bold,
                  color: 'rgba(255, 255, 255, 0.05)',
                }}>
                  {item.step}
                </div>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: radius.xl,
                  backgroundColor: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing[6],
                }}>
                  <item.icon style={{ width: 28, height: 28, color: item.color }} />
                </div>
                <h3 style={{
                  fontFamily: fonts.display,
                  fontSize: fontSizes.xl,
                  fontWeight: fontWeights.semibold,
                  color: colors.snow,
                  marginBottom: spacing[3],
                }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: fontSizes.base, color: colors.silver, lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: `${spacing[20]} ${spacing[8]}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing[16] }}>
            <h2 style={{
              fontFamily: fonts.display,
              fontSize: fontSizes['4xl'],
              fontWeight: fontWeights.bold,
              color: colors.snow,
              marginBottom: spacing[4],
            }}>
              Enterprise-Grade Features
            </h2>
            <p style={{ fontSize: fontSizes.lg, color: colors.silver }}>
              Everything you need to transform your hiring process
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[6] }}>
            {[
              { icon: Brain, title: 'Multi-AI Models', desc: 'Choose from Claude, GPT-5, Gemini, and more. Use the best AI for your needs.', color: colors.violet },
              { icon: Target, title: 'Precision Matching', desc: '0-100 score for each candidate with detailed skill-by-skill breakdown.', color: colors.cyan },
              { icon: Clock, title: '10x Faster', desc: 'Screen 1000 CVs in the time it takes to review 10 manually.', color: colors.amber },
              { icon: Shield, title: 'Enterprise Security', desc: 'SOC 2 compliant. Your data never leaves your control.', color: colors.emerald },
              { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track hiring metrics, source quality, and team performance.', color: colors.coral },
              { icon: Award, title: 'Bias Detection', desc: 'AI-powered fairness checks to ensure equitable screening.', color: colors.violet },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                style={{
                  padding: spacing[8],
                  borderRadius: radius.xl,
                  backgroundColor: 'rgba(26, 26, 36, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: radius.lg,
                  backgroundColor: `${feature.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing[5],
                }}>
                  <feature.icon style={{ width: 26, height: 26, color: feature.color }} />
                </div>
                <h3 style={{
                  fontFamily: fonts.display,
                  fontSize: fontSizes.lg,
                  fontWeight: fontWeights.semibold,
                  color: colors.snow,
                  marginBottom: spacing[3],
                }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: fontSizes.sm, color: colors.silver, lineHeight: 1.7 }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: `${spacing[20]} ${spacing[8]}`, backgroundColor: 'rgba(26, 26, 36, 0.3)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing[12] }}>
            <h2 style={{
              fontFamily: fonts.display,
              fontSize: fontSizes['4xl'],
              fontWeight: fontWeights.bold,
              color: colors.snow,
              marginBottom: spacing[4],
            }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ fontSize: fontSizes.lg, color: colors.silver }}>
              Start free, scale as you grow
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[6] }}>
            {[
              { name: 'Starter', price: 'Free', period: 'forever', features: ['50 CVs/month', 'Basic AI models', 'Email support', 'Standard matching'], cta: 'Get Started', highlight: false },
              { name: 'Professional', price: '$49', period: '/month', features: ['500 CVs/month', 'All AI models', 'Priority support', 'Advanced analytics', 'Team collaboration'], cta: 'Start Free Trial', highlight: true },
              { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited CVs', 'Custom AI models', 'Dedicated support', 'API access', 'SSO & SAML', 'SLA guarantee'], cta: 'Contact Sales', highlight: false },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                style={{
                  padding: spacing[8],
                  borderRadius: radius['2xl'],
                  backgroundColor: plan.highlight ? 'rgba(0, 240, 255, 0.05)' : 'rgba(10, 10, 15, 0.8)',
                  border: `1px solid ${plan.highlight ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: `${spacing[1]} ${spacing[4]}`,
                    borderRadius: radius.full,
                    backgroundColor: colors.cyan,
                    color: colors.void,
                    fontSize: fontSizes.xs,
                    fontWeight: fontWeights.semibold,
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: spacing[6] }}>
                  <h3 style={{ fontFamily: fonts.display, fontSize: fontSizes.xl, fontWeight: fontWeights.semibold, color: colors.snow, marginBottom: spacing[2] }}>
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing[1] }}>
                    <span style={{ fontFamily: fonts.display, fontSize: fontSizes['4xl'], fontWeight: fontWeights.bold, color: colors.snow }}>{plan.price}</span>
                    <span style={{ fontSize: fontSizes.sm, color: colors.silver }}>{plan.period}</span>
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: spacing[8] }}>
                  {plan.features.map((feature, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
                      <CheckCircle style={{ width: 16, height: 16, color: colors.emerald }} />
                      <span style={{ fontSize: fontSizes.sm, color: colors.silver }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? 'primary' : 'secondary'}
                  fullWidth
                  onClick={() => setScreen('job')}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: `${spacing[20]} ${spacing[8]}` }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
          padding: spacing[16],
          borderRadius: radius['2xl'],
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(0, 240, 255, 0.2)',
        }}>
          <h2 style={{
            fontFamily: fonts.display,
            fontSize: fontSizes['4xl'],
            fontWeight: fontWeights.bold,
            color: colors.snow,
            marginBottom: spacing[4],
          }}>
            Ready to Hire Smarter?
          </h2>
          <p style={{ fontSize: fontSizes.xl, color: colors.silver, marginBottom: spacing[8], maxWidth: '600px', margin: '0 auto' }}>
            Join 500+ companies that have transformed their hiring with AI-powered screening.
          </p>
          <div style={{ marginTop: spacing[8] }}>
            <Button size="lg" onClick={() => setScreen('job')} icon={<Zap style={{ width: 20, height: 20 }} />}>
              Start Your Free Trial
            </Button>
          </div>
          <p style={{ fontSize: fontSizes.sm, color: colors.steel, marginTop: spacing[4] }}>
            No credit card required • Setup in 2 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: `${spacing[12]} ${spacing[8]}`,
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: radius.lg,
              background: `linear-gradient(135deg, ${colors.cyan}, ${colors.violet})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap style={{ width: 20, height: 20, color: colors.void }} />
            </div>
            <div>
              <span style={{ fontFamily: fonts.display, fontWeight: fontWeights.bold, color: colors.snow }}>
                HireScore<span style={{ color: colors.cyan }}>AI</span>
              </span>
              <div style={{ fontSize: fontSizes.xs, color: colors.steel }}>© 2026 All rights reserved</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: spacing[8] }}>
            {['Privacy', 'Terms', 'Security', 'Support', 'Contact'].map(link => (
              <a key={link} href="#" style={{ fontSize: fontSizes.sm, color: colors.silver, textDecoration: 'none' }}>
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
