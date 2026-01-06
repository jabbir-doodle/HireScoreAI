import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui';
import { useStore } from '../../store/useStore';
import { useResponsive, useResponsiveSpacing, useResponsiveFonts, useResponsiveGrid } from '../../hooks/useResponsive';
import { colors, fonts, fontWeights } from '../../styles/design-system';
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
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export function LandingScreen() {
  const setScreen = useStore((s) => s.setScreen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Responsive hooks
  const { isMobile, isTablet, isDesktop, isLg } = useResponsive();
  const spacing = useResponsiveSpacing();
  const fontSizes = useResponsiveFonts();
  const grid = useResponsiveGrid();

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
      {/* Background Effects - Simplified on mobile for performance */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        background: isMobile
          ? `radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0, 240, 255, 0.08) 0%, transparent 50%)`
          : `
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
        backgroundColor: 'rgba(6, 6, 10, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: `0 ${spacing.pagePadding}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isMobile ? '60px' : '80px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
            <img
              src="/logo.svg"
              alt="HireScore AI"
              style={{
                width: isMobile ? '36px' : '48px',
                height: isMobile ? '36px' : '48px',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
              }}
            />
            <div>
              <span style={{
                fontFamily: fonts.display,
                fontWeight: fontWeights.bold,
                fontSize: isMobile ? '16px' : '20px',
                color: colors.snow,
              }}>
                HireScore<span style={{ color: colors.cyan }}>AI</span>
              </span>
              {!isMobile && (
                <div style={{ fontSize: '12px', color: colors.silver, marginTop: '-2px' }}>
                  Enterprise Recruitment Intelligence
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          {isDesktop && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <a href="#how-it-works" style={{ color: colors.silver, textDecoration: 'none', fontSize: '14px', fontWeight: fontWeights.medium }}>How It Works</a>
              <a href="#features" style={{ color: colors.silver, textDecoration: 'none', fontSize: '14px', fontWeight: fontWeights.medium }}>Features</a>
              <a href="#pricing" style={{ color: colors.silver, textDecoration: 'none', fontSize: '14px', fontWeight: fontWeights.medium }}>Pricing</a>
              <Button variant="primary" size="sm" onClick={() => setScreen('job')}>
                Start Free Trial
              </Button>
            </nav>
          )}

          {/* Mobile Menu Button */}
          {!isDesktop && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.snow,
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {!isDesktop && mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                overflow: 'hidden',
                backgroundColor: 'rgba(10, 10, 15, 0.98)',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <nav style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
                gap: '8px',
              }}>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: colors.silver, textDecoration: 'none', fontSize: '16px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)' }}>How It Works</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: colors.silver, textDecoration: 'none', fontSize: '16px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)' }}>Features</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} style={{ color: colors.silver, textDecoration: 'none', fontSize: '16px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)' }}>Pricing</a>
                <Button variant="primary" fullWidth onClick={() => { setScreen('job'); setMobileMenuOpen(false); }} style={{ marginTop: '8px' }}>
                  Start Free Trial
                </Button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: `${spacing.sectionPaddingY} ${spacing.pagePadding}`,
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
              gap: isMobile ? '8px' : '12px',
              padding: isMobile ? '6px 12px' : '8px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              marginBottom: isMobile ? '24px' : '32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} style={{ width: isMobile ? 12 : 14, height: isMobile ? 12 : 14, fill: colors.amber, color: colors.amber }} />
              ))}
            </div>
            <span style={{ fontSize: isMobile ? '12px' : '14px', color: colors.emerald, fontWeight: fontWeights.medium }}>
              Trusted by HR Teams Worldwide
            </span>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: grid.heroGrid,
            gap: isMobile ? '32px' : isTablet ? '40px' : '64px',
            alignItems: 'center',
          }}>
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 20 : 0, x: isMobile ? 0 : -30 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 style={{
                fontFamily: fonts.display,
                fontSize: fontSizes.h1,
                fontWeight: fontWeights.bold,
                lineHeight: 1.15,
                marginBottom: isMobile ? '16px' : '24px',
                color: colors.snow,
              }}>
                Stop Drowning in{' '}
                <span style={{
                  background: `linear-gradient(135deg, ${colors.cyan}, ${colors.violet})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: isMobile ? 'inline' : 'block',
                }}>
                  Resume Chaos
                </span>
              </h1>

              <p style={{
                fontSize: fontSizes.bodyLg,
                color: colors.silver,
                lineHeight: 1.7,
                marginBottom: isMobile ? '24px' : '32px',
              }}>
                Your hiring team spends <strong style={{ color: colors.coral }}>23 hours per hire</strong> screening resumes.
                HireScore AI reduces that to <strong style={{ color: colors.emerald }}>23 minutes</strong> with
                AI-powered candidate matching.
              </p>

              {/* Key Value Props */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '10px' : '12px',
                marginBottom: isMobile ? '24px' : '32px',
              }}>
                {[
                  'Screen 1000+ CVs in under 10 minutes',
                  'AI-generated interview questions',
                  'Bias-free scoring based on skills',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px' }}>
                    <CheckCircle style={{ width: isMobile ? 18 : 20, height: isMobile ? 18 : 20, color: colors.emerald, flexShrink: 0 }} />
                    <span style={{ fontSize: fontSizes.body, color: colors.silver }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '12px' : '16px',
                alignItems: isMobile ? 'stretch' : 'center',
              }}>
                <Button
                  size={isMobile ? 'md' : 'lg'}
                  onClick={() => setScreen('job')}
                  icon={<Zap style={{ width: isMobile ? 18 : 20, height: isMobile ? 18 : 20 }} />}
                  fullWidth={isMobile}
                >
                  Start Screening Free
                </Button>
                {!isMobile && (
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    color: colors.silver,
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '12px',
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Play style={{ width: 16, height: 16, color: colors.snow, marginLeft: '2px' }} />
                    </div>
                    <span>Watch Demo</span>
                  </button>
                )}
              </div>

              {/* No Credit Card */}
              <p style={{ fontSize: isMobile ? '12px' : '14px', color: colors.steel, marginTop: '16px', textAlign: isMobile ? 'center' : 'left' }}>
                No credit card required • Free for up to 50 CVs/month
              </p>
            </motion.div>

            {/* Right - Visual (Hidden on mobile, simplified on tablet) */}
            {!isMobile && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ position: 'relative' }}
              >
                {/* Dashboard Preview Card */}
                <div style={{
                  backgroundColor: 'rgba(26, 26, 36, 0.8)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: isTablet ? '16px' : '24px',
                  boxShadow: '0 40px 80px rgba(0, 0, 0, 0.5)',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: colors.silver }}>Screening Results</div>
                      <div style={{ fontFamily: fonts.display, fontSize: isTablet ? '16px' : '20px', fontWeight: fontWeights.bold, color: colors.snow }}>Senior Developer Role</div>
                    </div>
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(0, 255, 136, 0.1)',
                      color: colors.emerald,
                      fontSize: '13px',
                      fontWeight: fontWeights.medium,
                      whiteSpace: 'nowrap',
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
                      padding: isTablet ? '12px' : '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      marginBottom: '12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: isTablet ? '32px' : '40px',
                          height: isTablet ? '32px' : '40px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${colors.violet}, ${colors.cyan})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: fontWeights.bold,
                          fontSize: isTablet ? '11px' : '14px',
                          flexShrink: 0,
                        }}>
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: fontWeights.medium, color: colors.snow, fontSize: isTablet ? '13px' : '14px' }}>{candidate.name}</div>
                          <div style={{ fontSize: '12px', color: colors.silver }}>5+ years exp</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: fonts.display, fontSize: isTablet ? '18px' : '20px', fontWeight: fontWeights.bold, color: candidate.color }}>{candidate.score}</div>
                        <div style={{ fontSize: '11px', color: candidate.color }}>{candidate.match}</div>
                      </div>
                    </div>
                  ))}

                  {/* View All Button */}
                  <button style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    borderRadius: '12px',
                    color: colors.cyan,
                    fontSize: '14px',
                    fontWeight: fontWeights.medium,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}>
                    View All Candidates
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>

                {/* Floating Stats - Desktop only */}
                {isLg && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      style={{
                        position: 'absolute',
                        top: '-16px',
                        right: '-16px',
                        padding: '12px 16px',
                        backgroundColor: 'rgba(26, 26, 36, 0.95)',
                        borderRadius: '16px',
                        border: '1px solid rgba(0, 255, 136, 0.3)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp style={{ width: 18, height: 18, color: colors.emerald }} />
                        <span style={{ fontFamily: fonts.display, fontSize: '18px', fontWeight: fontWeights.bold, color: colors.emerald }}>85%</span>
                      </div>
                      <div style={{ fontSize: '11px', color: colors.silver }}>Time Saved</div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      style={{
                        position: 'absolute',
                        bottom: '40px',
                        left: '-24px',
                        padding: '12px 16px',
                        backgroundColor: 'rgba(26, 26, 36, 0.95)',
                        borderRadius: '16px',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Brain style={{ width: 18, height: 18, color: colors.violet }} />
                        <span style={{ fontFamily: fonts.display, fontSize: '16px', fontWeight: fontWeights.bold, color: colors.violet }}>AI Powered</span>
                      </div>
                      <div style={{ fontSize: '11px', color: colors.silver }}>50+ AI Models</div>
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof - Logos */}
      <section style={{
        padding: `${isMobile ? '32px' : '48px'} ${spacing.pagePadding}`,
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            fontSize: isMobile ? '11px' : '12px',
            color: colors.steel,
            marginBottom: isMobile ? '20px' : '32px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            Trusted by Recruiting Teams at
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? '16px' : '48px',
            flexWrap: 'wrap',
            opacity: 0.5,
          }}>
            {['TechCorp', 'Innovate', 'GlobalHR', 'RecruitPro'].slice(0, isMobile ? 3 : 4).map(company => (
              <div key={company} style={{
                fontFamily: fonts.display,
                fontSize: isMobile ? '14px' : '18px',
                fontWeight: fontWeights.bold,
                color: colors.silver,
              }}>
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section style={{ padding: `${spacing.sectionPaddingY} ${spacing.pagePadding}` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: fonts.display,
            fontSize: fontSizes.h2,
            fontWeight: fontWeights.bold,
            color: colors.snow,
            marginBottom: isMobile ? '12px' : '24px',
          }}>
            The <span style={{ color: colors.coral }}>Hidden Cost</span> of Manual Screening
          </h2>
          <p style={{
            fontSize: fontSizes.body,
            color: colors.silver,
            marginBottom: isMobile ? '24px' : '48px',
          }}>
            Every open position costs your team valuable time
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: grid.grid4,
            gap: isMobile ? '12px' : '24px',
          }}>
            {[
              { value: '23 hrs', label: 'Time to screen per role', icon: Clock, color: colors.coral },
              { value: '250+', label: 'Resumes per posting', icon: FileText, color: colors.amber },
              { value: '75%', label: 'Wrongly rejected', icon: Users, color: colors.violet },
              { value: '$4,700', label: 'Cost per bad hire', icon: TrendingUp, color: colors.coral },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true, margin: '-50px' }}
                style={{
                  padding: isMobile ? '16px' : '32px',
                  borderRadius: isMobile ? '12px' : '16px',
                  backgroundColor: 'rgba(26, 26, 36, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <stat.icon style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, color: stat.color, marginBottom: isMobile ? '8px' : '16px' }} />
                <div style={{
                  fontFamily: fonts.display,
                  fontSize: isMobile ? '20px' : '30px',
                  fontWeight: fontWeights.bold,
                  color: colors.snow,
                  marginBottom: '4px',
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: isMobile ? '11px' : '14px', color: colors.silver, lineHeight: 1.4 }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{
        padding: `${spacing.sectionPaddingY} ${spacing.pagePadding}`,
        backgroundColor: 'rgba(26, 26, 36, 0.3)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '64px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 240, 255, 0.1)',
              marginBottom: '16px',
            }}>
              <Sparkles style={{ width: 14, height: 14, color: colors.cyan }} />
              <span style={{ fontSize: '13px', color: colors.cyan, fontWeight: fontWeights.medium }}>Simple 3-Step Process</span>
            </div>
            <h2 style={{
              fontFamily: fonts.display,
              fontSize: fontSizes.h2,
              fontWeight: fontWeights.bold,
              color: colors.snow,
            }}>
              From Job Post to Top Candidates in <span style={{ color: colors.cyan }}>Minutes</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: grid.grid3,
            gap: isMobile ? '16px' : '32px',
          }}>
            {[
              {
                step: '01',
                title: 'Paste Job Description',
                desc: 'Import from LinkedIn, Indeed, or paste directly. Our AI understands any format.',
                icon: FileText,
                color: colors.cyan,
              },
              {
                step: '02',
                title: 'Upload CVs',
                desc: 'Drag and drop hundreds of resumes. Supports PDF, Word, and text files.',
                icon: Users,
                color: colors.violet,
              },
              {
                step: '03',
                title: 'Get Ranked Results',
                desc: 'AI scores each candidate with skill breakdowns and interview questions.',
                icon: BarChart3,
                color: colors.emerald,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true, margin: '-50px' }}
                style={{
                  padding: isMobile ? '20px' : '32px',
                  borderRadius: isMobile ? '16px' : '24px',
                  backgroundColor: 'rgba(10, 10, 15, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: isMobile ? '16px' : '24px',
                  right: isMobile ? '16px' : '24px',
                  fontFamily: fonts.display,
                  fontSize: isMobile ? '24px' : '36px',
                  fontWeight: fontWeights.bold,
                  color: 'rgba(255, 255, 255, 0.05)',
                }}>
                  {item.step}
                </div>
                <div style={{
                  width: isMobile ? '48px' : '64px',
                  height: isMobile ? '48px' : '64px',
                  borderRadius: '12px',
                  backgroundColor: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: isMobile ? '16px' : '24px',
                }}>
                  <item.icon style={{ width: isMobile ? 22 : 28, height: isMobile ? 22 : 28, color: item.color }} />
                </div>
                <h3 style={{
                  fontFamily: fonts.display,
                  fontSize: isMobile ? '16px' : '20px',
                  fontWeight: fontWeights.semibold,
                  color: colors.snow,
                  marginBottom: '8px',
                }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: isMobile ? '13px' : '16px', color: colors.silver, lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: `${spacing.sectionPaddingY} ${spacing.pagePadding}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '64px' }}>
            <h2 style={{
              fontFamily: fonts.display,
              fontSize: fontSizes.h2,
              fontWeight: fontWeights.bold,
              color: colors.snow,
              marginBottom: '12px',
            }}>
              Enterprise-Grade Features
            </h2>
            <p style={{ fontSize: fontSizes.body, color: colors.silver }}>
              Everything you need to transform hiring
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: grid.grid3,
            gap: isMobile ? '12px' : '24px',
          }}>
            {[
              { icon: Brain, title: 'Multi-AI Models', desc: 'Choose from 50+ AI models including latest 2026 releases.', color: colors.violet },
              { icon: Target, title: 'Precision Matching', desc: '0-100 score with skill-by-skill breakdown.', color: colors.cyan },
              { icon: Clock, title: '10x Faster', desc: 'Screen 1000 CVs in minutes, not days.', color: colors.amber },
              { icon: Shield, title: 'Enterprise Security', desc: 'SOC 2 compliant. Data never leaves your control.', color: colors.emerald },
              { icon: BarChart3, title: 'Analytics', desc: 'Track hiring metrics and team performance.', color: colors.coral },
              { icon: Award, title: 'Bias Detection', desc: 'AI-powered fairness checks built in.', color: colors.violet },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true, margin: '-50px' }}
                style={{
                  padding: isMobile ? '16px' : '32px',
                  borderRadius: isMobile ? '12px' : '16px',
                  backgroundColor: 'rgba(26, 26, 36, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{
                  width: isMobile ? '40px' : '56px',
                  height: isMobile ? '40px' : '56px',
                  borderRadius: '12px',
                  backgroundColor: `${feature.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: isMobile ? '12px' : '20px',
                }}>
                  <feature.icon style={{ width: isMobile ? 20 : 26, height: isMobile ? 20 : 26, color: feature.color }} />
                </div>
                <h3 style={{
                  fontFamily: fonts.display,
                  fontSize: isMobile ? '15px' : '18px',
                  fontWeight: fontWeights.semibold,
                  color: colors.snow,
                  marginBottom: '6px',
                }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: isMobile ? '12px' : '14px', color: colors.silver, lineHeight: 1.5 }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{
        padding: `${spacing.sectionPaddingY} ${spacing.pagePadding}`,
        backgroundColor: 'rgba(26, 26, 36, 0.3)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px' }}>
            <h2 style={{
              fontFamily: fonts.display,
              fontSize: fontSizes.h2,
              fontWeight: fontWeights.bold,
              color: colors.snow,
              marginBottom: '12px',
            }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ fontSize: fontSizes.body, color: colors.silver }}>
              Start free, scale as you grow
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: grid.grid3,
            gap: isMobile ? '16px' : '24px',
          }}>
            {[
              { name: 'Starter', price: 'Free', period: 'forever', features: ['50 CVs/month', 'Basic AI models', 'Email support'], cta: 'Get Started', highlight: false },
              { name: 'Professional', price: '$49', period: '/month', features: ['500 CVs/month', 'All AI models', 'Priority support', 'Team collaboration'], cta: 'Start Free Trial', highlight: true },
              { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited CVs', 'Custom AI', 'Dedicated support', 'API access'], cta: 'Contact Sales', highlight: false },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true, margin: '-50px' }}
                style={{
                  padding: isMobile ? '20px' : '32px',
                  borderRadius: isMobile ? '16px' : '24px',
                  backgroundColor: plan.highlight ? 'rgba(0, 240, 255, 0.05)' : 'rgba(10, 10, 15, 0.8)',
                  border: `1px solid ${plan.highlight ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: colors.cyan,
                    color: colors.void,
                    fontSize: '11px',
                    fontWeight: fontWeights.semibold,
                    whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                  <h3 style={{
                    fontFamily: fonts.display,
                    fontSize: isMobile ? '16px' : '20px',
                    fontWeight: fontWeights.semibold,
                    color: colors.snow,
                    marginBottom: '8px',
                  }}>
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? '28px' : '36px',
                      fontWeight: fontWeights.bold,
                      color: colors.snow,
                    }}>{plan.price}</span>
                    <span style={{ fontSize: '13px', color: colors.silver }}>{plan.period}</span>
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: isMobile ? '20px' : '32px' }}>
                  {plan.features.map((feature, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <CheckCircle style={{ width: 16, height: 16, color: colors.emerald, flexShrink: 0 }} />
                      <span style={{ fontSize: isMobile ? '13px' : '14px', color: colors.silver }}>{feature}</span>
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
      <section style={{ padding: `${spacing.sectionPaddingY} ${spacing.pagePadding}` }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          padding: isMobile ? '32px 20px' : '64px',
          borderRadius: isMobile ? '20px' : '24px',
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(0, 240, 255, 0.2)',
        }}>
          <h2 style={{
            fontFamily: fonts.display,
            fontSize: fontSizes.h2,
            fontWeight: fontWeights.bold,
            color: colors.snow,
            marginBottom: '12px',
          }}>
            Ready to Hire Smarter?
          </h2>
          <p style={{
            fontSize: fontSizes.body,
            color: colors.silver,
            marginBottom: isMobile ? '24px' : '32px',
          }}>
            Join companies transforming their hiring with AI
          </p>
          <Button
            size={isMobile ? 'md' : 'lg'}
            onClick={() => setScreen('job')}
            icon={<Zap style={{ width: isMobile ? 18 : 20, height: isMobile ? 18 : 20 }} />}
          >
            Start Your Free Trial
          </Button>
          <p style={{ fontSize: '12px', color: colors.steel, marginTop: '16px' }}>
            No credit card required • Setup in 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: `${isMobile ? '32px' : '48px'} ${spacing.pagePadding}`,
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'center' : 'center',
          gap: isMobile ? '24px' : '0',
          textAlign: isMobile ? 'center' : 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo.svg"
              alt="HireScore AI"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
              }}
            />
            <div>
              <span style={{ fontFamily: fonts.display, fontWeight: fontWeights.bold, color: colors.snow, fontSize: '16px' }}>
                HireScore<span style={{ color: colors.cyan }}>AI</span>
              </span>
              <div style={{ fontSize: '11px', color: colors.steel }}>2026 All rights reserved</div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: isMobile ? '16px' : '32px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {['Privacy', 'Terms', 'Support', 'Contact'].map(link => (
              <a key={link} href="#" style={{ fontSize: '13px', color: colors.silver, textDecoration: 'none' }}>
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
