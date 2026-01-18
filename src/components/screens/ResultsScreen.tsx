import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  Star,
  ThumbsUp,
  ThumbsDown,
  Download,
  Search,
  ArrowLeft,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  TrendingUp,
  Target,
  Award,
  Briefcase,
  Brain,
  Heart,
  Zap,
  FileText,
  Mail,
  SortDesc,
  Eye,
  Calendar,
  GraduationCap,
  Shield
} from 'lucide-react';
import { Button } from '../ui';
import { useStore } from '../../store/useStore';
import { colors, fonts, spacing, radius, fontSizes, fontWeights } from '../../styles/design-system';
import type { Candidate } from '../../types';
import type { CSSProperties } from 'react';

// ============================================
// Score Breakdown Categories (Enterprise 2026)
// ============================================
interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  icon: typeof Brain;
  color: string;
}

const generateScoreBreakdown = (candidate: Candidate): ScoreCategory[] => {
  // Use actual scoreBreakdown from AI if available, otherwise estimate from total score
  const breakdown = candidate.scoreBreakdown;

  if (breakdown) {
    // Convert actual breakdown to display format
    return [
      { name: 'Technical Skills', score: breakdown.technicalSkills, maxScore: 35, percentage: Math.round((breakdown.technicalSkills / 35) * 100), icon: Brain, color: colors.cyan },
      { name: 'Experience', score: breakdown.experience, maxScore: 25, percentage: Math.round((breakdown.experience / 25) * 100), icon: Briefcase, color: colors.violet },
      { name: 'Education', score: breakdown.education, maxScore: 15, percentage: Math.round((breakdown.education / 15) * 100), icon: GraduationCap, color: colors.coral },
      { name: 'Career Growth', score: breakdown.careerProgression, maxScore: 15, percentage: Math.round((breakdown.careerProgression / 15) * 100), icon: TrendingUp, color: colors.emerald },
      { name: 'Communication', score: breakdown.communication, maxScore: 10, percentage: Math.round((breakdown.communication / 10) * 100), icon: MessageSquare, color: colors.amber },
    ];
  }

  // Fallback: Estimate breakdown from total score
  const baseScore = candidate.score;
  return [
    { name: 'Technical Skills', score: Math.round(baseScore * 0.35), maxScore: 35, percentage: baseScore, icon: Brain, color: colors.cyan },
    { name: 'Experience', score: Math.round(baseScore * 0.25), maxScore: 25, percentage: baseScore, icon: Briefcase, color: colors.violet },
    { name: 'Education', score: Math.round(baseScore * 0.15), maxScore: 15, percentage: baseScore, icon: GraduationCap, color: colors.coral },
    { name: 'Career Growth', score: Math.round(baseScore * 0.15), maxScore: 15, percentage: baseScore, icon: TrendingUp, color: colors.emerald },
    { name: 'Communication', score: Math.round(baseScore * 0.10), maxScore: 10, percentage: baseScore, icon: MessageSquare, color: colors.amber },
  ];
};

// ============================================
// SVG Donut Chart Component
// ============================================
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}

function DonutChart({ data, size = 160, strokeWidth = 24 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colors.graphite}
        strokeWidth={strokeWidth}
      />
      {data.map((segment, i) => {
        const percentage = total > 0 ? segment.value / total : 0;
        const dashLength = circumference * percentage;
        const dashOffset = circumference * currentOffset;
        currentOffset += percentage;

        return (
          <motion.circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={-dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dashLength} ${circumference - dashLength}` }}
            transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
          />
        );
      })}
      <text
        x={size / 2}
        y={size / 2 - 8}
        textAnchor="middle"
        style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: fontWeights.bold, fill: colors.snow }}
      >
        {total}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 14}
        textAnchor="middle"
        style={{ fontSize: '12px', fill: colors.silver }}
      >
        Candidates
      </text>
    </svg>
  );
}

// ============================================
// Horizontal Bar Chart
// ============================================
interface BarChartData {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

function HorizontalBarChart({ data }: { data: BarChartData[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
      {data.map((item, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[1] }}>
            <span style={{ fontSize: fontSizes.sm, color: colors.silver }}>{item.label}</span>
            <span style={{ fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.snow }}>{item.value}%</span>
          </div>
          <div style={{ height: '8px', backgroundColor: colors.graphite, borderRadius: radius.full, overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', backgroundColor: item.color, borderRadius: radius.full }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / item.maxValue) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Score Ring Component
// ============================================
function ScoreRing({ score, size = 80, recommendation }: { score: number; size?: number; recommendation: string }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const colorMap: Record<string, string> = {
    interview: colors.emerald,
    maybe: colors.amber,
    pass: colors.coral,
  };
  const color = colorMap[recommendation] || colors.silver;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.graphite}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontFamily: fonts.display, fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color }}>{score}</span>
      </div>
    </div>
  );
}

// ============================================
// Main Results Screen
// ============================================
export function ResultsScreen() {
  const { setScreen, currentJob, currentSession } = useStore();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [filter, setFilter] = useState<'all' | 'interview' | 'maybe' | 'pass'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'experience'>('score');

  // ============================================
  // Styles
  // ============================================
  const pageStyle: CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: colors.void,
  };

  const bgEffectStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    opacity: 0.4,
    background: `
      radial-gradient(ellipse 60% 40% at 20% 10%, rgba(0, 255, 136, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse 50% 50% at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse 40% 30% at 50% 50%, rgba(0, 240, 255, 0.05) 0%, transparent 50%)
    `,
  };

  const containerStyle: CSSProperties = {
    position: 'relative',
    zIndex: 10,
    padding: `${spacing[6]} ${spacing[6]} ${spacing[12]}`,
    maxWidth: '1400px',
    margin: '0 auto',
  };

  // ============================================
  // Data Processing
  // ============================================
  const candidates = currentSession?.candidates || [];

  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        if (filter !== 'all' && c.recommendation !== filter) return false;
        if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.score - a.score;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'experience') return (b.experience || 0) - (a.experience || 0);
        return 0;
      });
  }, [candidates, filter, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const interview = candidates.filter((c) => c.recommendation === 'interview').length;
    const maybe = candidates.filter((c) => c.recommendation === 'maybe').length;
    const pass = candidates.filter((c) => c.recommendation === 'pass').length;
    const avgScore = candidates.length > 0
      ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length)
      : 0;
    const topScore = candidates.length > 0 ? Math.max(...candidates.map(c => c.score)) : 0;
    const avgExperience = candidates.length > 0
      ? Math.round(candidates.reduce((sum, c) => sum + (c.experience || 0), 0) / candidates.length)
      : 0;
    return { interview, maybe, pass, avgScore, topScore, avgExperience, total: candidates.length };
  }, [candidates]);

  const scoreDistribution = useMemo(() => {
    const ranges = [
      { label: '90-100', min: 90, max: 100, color: colors.emerald },
      { label: '80-89', min: 80, max: 89, color: '#4ade80' },
      { label: '70-79', min: 70, max: 79, color: colors.amber },
      { label: '60-69', min: 60, max: 69, color: '#fbbf24' },
      { label: 'Below 60', min: 0, max: 59, color: colors.coral },
    ];
    return ranges.map(r => ({
      ...r,
      count: candidates.filter(c => c.score >= r.min && c.score <= r.max).length
    }));
  }, [candidates]);

  // ============================================
  // Helpers
  // ============================================
  const getRecStyle = (rec: string) => {
    switch (rec) {
      case 'interview':
        return { color: colors.emerald, bgColor: 'rgba(0, 255, 136, 0.1)', label: 'Interview', icon: Star, description: 'Strong match - Schedule interview' };
      case 'maybe':
        return { color: colors.amber, bgColor: 'rgba(255, 170, 0, 0.1)', label: 'Maybe', icon: ThumbsUp, description: 'Potential fit - Review further' };
      default:
        return { color: colors.coral, bgColor: 'rgba(255, 107, 107, 0.1)', label: 'Pass', icon: ThumbsDown, description: 'Not a match - Skip' };
    }
  };

  const exportResults = () => {
    const csv = [
      ['Name', 'Score', 'Recommendation', 'Experience (yrs)', 'Summary', 'Matched Skills', 'Missing Skills', 'Concerns'],
      ...candidates.map((c) => [
        c.name,
        c.score.toString(),
        c.recommendation,
        (c.experience || 0).toString(),
        c.summary,
        c.matchedSkills.join('; '),
        c.missingSkills.join('; '),
        c.concerns.join('; ')
      ])
    ].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hirescore-${currentJob?.title || 'results'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // ============================================
  // Render
  // ============================================
  return (
    <div style={pageStyle}>
      <div style={bgEffectStyle} />

      <div style={containerStyle}>
        {/* ============================================ */}
        {/* Executive Header */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: spacing[6],
            marginBottom: spacing[8],
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft style={{ width: 16, height: 16 }} />}
              onClick={() => setScreen('landing')}
            >
              Home
            </Button>
            <div style={{ height: '32px', width: '1px', backgroundColor: colors.steel }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                <h1 style={{
                  fontFamily: fonts.display,
                  fontSize: fontSizes['3xl'],
                  fontWeight: fontWeights.bold,
                  color: colors.snow,
                  margin: 0,
                }}>
                  Talent Pipeline
                </h1>
                <span style={{
                  padding: `${spacing[1]} ${spacing[3]}`,
                  borderRadius: radius.full,
                  fontSize: fontSizes.xs,
                  fontWeight: fontWeights.semibold,
                  backgroundColor: 'rgba(0, 240, 255, 0.1)',
                  color: colors.cyan,
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                }}>
                  AI Screened
                </span>
              </div>
              <p style={{ fontSize: fontSizes.base, color: colors.silver, margin: 0 }}>
                {currentJob?.title} {currentJob?.company ? `at ${currentJob.company}` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileText style={{ width: 16, height: 16 }} />}
              onClick={exportResults}
            >
              Export Report
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download style={{ width: 16, height: 16 }} />}
              onClick={exportResults}
            >
              Download CSV
            </Button>
            <Button size="sm" icon={<Zap style={{ width: 16, height: 16 }} />} onClick={() => setScreen('upload')}>
              Screen More CVs
            </Button>
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* Executive Dashboard */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: spacing[6],
            marginBottom: spacing[8],
          }}
        >
          {/* Pipeline Overview Card */}
          <div style={{
            backgroundColor: 'rgba(26, 26, 36, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: radius['2xl'],
            padding: spacing[6],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[6] }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: radius.lg,
                background: `linear-gradient(135deg, ${colors.cyan}, ${colors.violet})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Target style={{ width: 22, height: 22, color: colors.void }} />
              </div>
              <div>
                <h3 style={{ fontFamily: fonts.display, fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.snow, margin: 0 }}>
                  Pipeline Overview
                </h3>
                <p style={{ fontSize: fontSizes.sm, color: colors.silver, margin: 0 }}>Candidate distribution</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[6] }}>
              <DonutChart
                data={[
                  { label: 'Interview', value: stats.interview, color: colors.emerald },
                  { label: 'Maybe', value: stats.maybe, color: colors.amber },
                  { label: 'Pass', value: stats.pass, color: colors.coral },
                ]}
              />
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Interview', count: stats.interview, color: colors.emerald, percent: stats.total > 0 ? Math.round((stats.interview / stats.total) * 100) : 0 },
                  { label: 'Maybe', count: stats.maybe, color: colors.amber, percent: stats.total > 0 ? Math.round((stats.maybe / stats.total) * 100) : 0 },
                  { label: 'Pass', count: stats.pass, color: colors.coral, percent: stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0 },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color }} />
                      <span style={{ fontSize: fontSizes.sm, color: colors.snow }}>{item.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <span style={{ fontSize: fontSizes.sm, color: colors.silver }}>{item.percent}%</span>
                      <span style={{ fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.snow, minWidth: '24px', textAlign: 'right' }}>{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score Distribution Card */}
          <div style={{
            backgroundColor: 'rgba(26, 26, 36, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: radius['2xl'],
            padding: spacing[6],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[6] }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: radius.lg,
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <BarChart3 style={{ width: 22, height: 22, color: colors.violet }} />
              </div>
              <div>
                <h3 style={{ fontFamily: fonts.display, fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.snow, margin: 0 }}>
                  Score Distribution
                </h3>
                <p style={{ fontSize: fontSizes.sm, color: colors.silver, margin: 0 }}>Quality breakdown</p>
              </div>
            </div>

            <HorizontalBarChart
              data={scoreDistribution.map(d => ({
                label: d.label,
                value: stats.total > 0 ? Math.round((d.count / stats.total) * 100) : 0,
                maxValue: 100,
                color: d.color,
              }))}
            />
          </div>

          {/* Key Metrics Card */}
          <div style={{
            backgroundColor: 'rgba(26, 26, 36, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: radius['2xl'],
            padding: spacing[6],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[6] }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: radius.lg,
                backgroundColor: 'rgba(0, 255, 136, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Award style={{ width: 22, height: 22, color: colors.emerald }} />
              </div>
              <div>
                <h3 style={{ fontFamily: fonts.display, fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.snow, margin: 0 }}>
                  Key Metrics
                </h3>
                <p style={{ fontSize: fontSizes.sm, color: colors.silver, margin: 0 }}>Performance indicators</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing[4] }}>
              {[
                { label: 'Avg Score', value: stats.avgScore, suffix: '/100', color: colors.cyan },
                { label: 'Top Score', value: stats.topScore, suffix: '/100', color: colors.emerald },
                { label: 'Avg Experience', value: stats.avgExperience, suffix: ' yrs', color: colors.violet },
                { label: 'Interview Rate', value: stats.total > 0 ? Math.round((stats.interview / stats.total) * 100) : 0, suffix: '%', color: colors.amber },
              ].map((metric, i) => (
                <div key={i} style={{
                  padding: spacing[4],
                  borderRadius: radius.lg,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  <div style={{ fontSize: fontSizes.xs, color: colors.silver, marginBottom: spacing[1] }}>{metric.label}</div>
                  <div style={{ fontFamily: fonts.display, fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: metric.color }}>
                    {metric.value}<span style={{ fontSize: fontSizes.sm, fontWeight: fontWeights.normal, color: colors.silver }}>{metric.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* Filters & Search Bar */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[4],
            marginBottom: spacing[6],
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
            <Search style={{ position: 'absolute', left: spacing[4], top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: colors.silver }} />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: `${spacing[3]} ${spacing[4]}`,
                paddingLeft: '44px',
                backgroundColor: colors.graphite,
                border: `1px solid ${colors.steel}`,
                borderRadius: radius.lg,
                color: colors.snow,
                fontSize: fontSizes.sm,
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: spacing[2] }}>
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'interview', label: 'Interview', count: stats.interview, color: colors.emerald },
              { key: 'maybe', label: 'Maybe', count: stats.maybe, color: colors.amber },
              { key: 'pass', label: 'Pass', count: stats.pass, color: colors.coral },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: radius.lg,
                  fontSize: fontSizes.sm,
                  fontWeight: fontWeights.medium,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: filter === f.key ? (f.color ? `${f.color}15` : 'rgba(0, 240, 255, 0.1)') : colors.graphite,
                  color: filter === f.key ? (f.color || colors.cyan) : colors.silver,
                  border: filter === f.key ? `1px solid ${f.color || colors.cyan}40` : '1px solid transparent',
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  padding: `1px ${spacing[2]}`,
                  borderRadius: radius.full,
                  fontSize: fontSizes.xs,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <SortDesc style={{ width: 16, height: 16, color: colors.silver }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                backgroundColor: colors.graphite,
                border: `1px solid ${colors.steel}`,
                borderRadius: radius.lg,
                color: colors.snow,
                fontSize: fontSizes.sm,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Name</option>
              <option value="experience">Sort by Experience</option>
            </select>
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* Candidates List */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{
            backgroundColor: 'rgba(26, 26, 36, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: radius['2xl'],
            overflow: 'hidden',
          }}>
            {/* List Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 120px 140px 200px 80px',
              gap: spacing[4],
              padding: `${spacing[3]} ${spacing[5]}`,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: fontSizes.xs,
              fontWeight: fontWeights.semibold,
              color: colors.silver,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <span>Score</span>
              <span>Candidate</span>
              <span>Experience</span>
              <span>Recommendation</span>
              <span>Key Strengths</span>
              <span></span>
            </div>

            {/* Candidate Rows */}
            {filteredCandidates.map((candidate, i) => {
              const recStyle = getRecStyle(candidate.recommendation);

              return (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * Math.min(i, 15) }}
                  onClick={() => setSelectedCandidate(candidate)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 120px 140px 200px 80px',
                    gap: spacing[4],
                    padding: `${spacing[4]} ${spacing[5]}`,
                    alignItems: 'center',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Score */}
                  <ScoreRing score={candidate.score} size={52} recommendation={candidate.recommendation} />

                  {/* Candidate Info */}
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{
                      fontFamily: fonts.display,
                      fontWeight: fontWeights.semibold,
                      color: colors.snow,
                      fontSize: fontSizes.base,
                      margin: 0,
                      marginBottom: spacing[1],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {candidate.name}
                    </h4>
                    <p style={{
                      fontSize: fontSizes.sm,
                      color: colors.silver,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {candidate.summary.substring(0, 60)}...
                    </p>
                  </div>

                  {/* Experience */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <Clock style={{ width: 14, height: 14, color: colors.silver }} />
                    <span style={{ fontSize: fontSizes.sm, color: colors.snow }}>{candidate.experience || 0} years</span>
                  </div>

                  {/* Recommendation */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: radius.full,
                    backgroundColor: recStyle.bgColor,
                    border: `1px solid ${recStyle.color}30`,
                  }}>
                    <recStyle.icon style={{ width: 14, height: 14, color: recStyle.color }} />
                    <span style={{ fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: recStyle.color }}>
                      {recStyle.label}
                    </span>
                  </div>

                  {/* Key Strengths */}
                  <div style={{ display: 'flex', gap: spacing[1], flexWrap: 'wrap' }}>
                    {candidate.matchedSkills.slice(0, 2).map((skill, j) => (
                      <span
                        key={j}
                        style={{
                          padding: `2px ${spacing[2]}`,
                          borderRadius: radius.md,
                          fontSize: fontSizes.xs,
                          backgroundColor: 'rgba(0, 255, 136, 0.1)',
                          color: colors.emerald,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.matchedSkills.length > 2 && (
                      <span style={{ fontSize: fontSizes.xs, color: colors.silver }}>
                        +{candidate.matchedSkills.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[1],
                        padding: `${spacing[2]} ${spacing[3]}`,
                        borderRadius: radius.lg,
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                        border: 'none',
                        color: colors.cyan,
                        fontSize: fontSizes.xs,
                        fontWeight: fontWeights.medium,
                        cursor: 'pointer',
                      }}
                    >
                      <Eye style={{ width: 12, height: 12 }} />
                      View
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {filteredCandidates.length === 0 && (
              <div style={{ padding: spacing[12], textAlign: 'center', color: colors.silver }}>
                <Users style={{ width: 48, height: 48, margin: '0 auto', marginBottom: spacing[4], opacity: 0.5 }} />
                <p style={{ fontSize: fontSizes.base, marginBottom: spacing[2] }}>No candidates match your filters</p>
                <p style={{ fontSize: fontSizes.sm }}>Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ============================================ */}
      {/* Candidate Detail Modal */}
      {/* ============================================ */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing[4],
              backgroundColor: 'rgba(6, 6, 10, 0.85)',
              backdropFilter: 'blur(12px)',
            }}
            onClick={() => setSelectedCandidate(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              style={{
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflow: 'auto',
                backgroundColor: colors.slate,
                borderRadius: radius['2xl'],
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const recStyle = getRecStyle(selectedCandidate.recommendation);
                const scoreBreakdown = generateScoreBreakdown(selectedCandidate);

                return (
                  <>
                    {/* Modal Header */}
                    <div style={{
                      padding: spacing[6],
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: 'linear-gradient(to right, rgba(0, 240, 255, 0.05), rgba(139, 92, 246, 0.05))',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[5] }}>
                          <ScoreRing score={selectedCandidate.score} size={100} recommendation={selectedCandidate.recommendation} />
                          <div>
                            <h2 style={{
                              fontFamily: fonts.display,
                              fontSize: fontSizes['2xl'],
                              fontWeight: fontWeights.bold,
                              color: colors.snow,
                              margin: 0,
                              marginBottom: spacing[2],
                            }}>
                              {selectedCandidate.name}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], flexWrap: 'wrap' }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: spacing[2],
                                padding: `${spacing[1]} ${spacing[3]}`,
                                borderRadius: radius.full,
                                backgroundColor: recStyle.bgColor,
                                border: `1px solid ${recStyle.color}30`,
                              }}>
                                <recStyle.icon style={{ width: 14, height: 14, color: recStyle.color }} />
                                <span style={{ fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: recStyle.color }}>
                                  {recStyle.label}
                                </span>
                              </div>
                              {selectedCandidate.confidence && (
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: spacing[1],
                                  padding: `${spacing[1]} ${spacing[3]}`,
                                  borderRadius: radius.full,
                                  backgroundColor: 'rgba(0, 240, 255, 0.1)',
                                  border: '1px solid rgba(0, 240, 255, 0.2)',
                                }}>
                                  <Shield style={{ width: 12, height: 12, color: colors.cyan }} />
                                  <span style={{ fontSize: fontSizes.xs, fontWeight: fontWeights.medium, color: colors.cyan }}>
                                    {Math.round(selectedCandidate.confidence * 100)}% confidence
                                  </span>
                                </div>
                              )}
                              <span style={{ fontSize: fontSizes.sm, color: colors.silver }}>
                                {selectedCandidate.experience || 0} years experience
                              </span>
                            </div>
                            <p style={{ fontSize: fontSizes.sm, color: colors.silver, marginTop: spacing[2], marginBottom: 0, maxWidth: '400px' }}>
                              {recStyle.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCandidate(null)}
                          style={{
                            padding: spacing[2],
                            borderRadius: radius.lg,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            color: colors.silver,
                            cursor: 'pointer',
                          }}
                        >
                          <X style={{ width: 20, height: 20 }} />
                        </button>
                      </div>
                    </div>

                    {/* Modal Body */}
                    <div style={{ padding: spacing[6] }}>
                      {/* Score Breakdown */}
                      <div style={{ marginBottom: spacing[8] }}>
                        <h3 style={{
                          fontFamily: fonts.display,
                          fontSize: fontSizes.lg,
                          fontWeight: fontWeights.semibold,
                          color: colors.snow,
                          marginBottom: spacing[4],
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[2],
                        }}>
                          <BarChart3 style={{ width: 20, height: 20, color: colors.cyan }} />
                          Score Breakdown
                        </h3>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: spacing[4],
                        }}>
                          {scoreBreakdown.map((category, i) => (
                            <div
                              key={i}
                              style={{
                                padding: spacing[4],
                                borderRadius: radius.lg,
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                                  <category.icon style={{ width: 16, height: 16, color: category.color }} />
                                  <span style={{ fontSize: fontSizes.sm, color: colors.snow }}>{category.name}</span>
                                </div>
                                <span style={{ fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: category.color }}>
                                  {category.score}/{category.maxScore}
                                </span>
                              </div>
                              <div style={{ height: '6px', backgroundColor: colors.graphite, borderRadius: radius.full, overflow: 'hidden' }}>
                                <motion.div
                                  style={{ height: '100%', backgroundColor: category.color, borderRadius: radius.full }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${category.percentage}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                />
                              </div>
                              <div style={{ fontSize: fontSizes.xs, color: colors.silver, marginTop: spacing[1] }}>
                                {category.percentage}% match
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Executive Summary */}
                      <div style={{ marginBottom: spacing[8] }}>
                        <h3 style={{
                          fontFamily: fonts.display,
                          fontSize: fontSizes.lg,
                          fontWeight: fontWeights.semibold,
                          color: colors.snow,
                          marginBottom: spacing[3],
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[2],
                        }}>
                          <FileText style={{ width: 20, height: 20, color: colors.violet }} />
                          Executive Summary
                        </h3>
                        <p style={{
                          fontSize: fontSizes.base,
                          color: colors.silver,
                          lineHeight: 1.7,
                          padding: spacing[4],
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: radius.lg,
                          borderLeft: `3px solid ${recStyle.color}`,
                          margin: 0,
                        }}>
                          {selectedCandidate.summary}
                        </p>
                      </div>

                      {/* Pros & Cons Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing[6], marginBottom: spacing[8] }}>
                        {/* Strengths (Pros) */}
                        <div style={{
                          padding: spacing[5],
                          borderRadius: radius.xl,
                          backgroundColor: 'rgba(0, 255, 136, 0.05)',
                          border: '1px solid rgba(0, 255, 136, 0.15)',
                        }}>
                          <h4 style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            fontWeight: fontWeights.semibold,
                            color: colors.emerald,
                            fontSize: fontSizes.base,
                            marginBottom: spacing[4],
                          }}>
                            <CheckCircle style={{ width: 18, height: 18 }} />
                            Strengths (Why Hire)
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: spacing[5] }}>
                            {selectedCandidate.matchedSkills.map((skill, i) => (
                              <li key={i} style={{ color: colors.snow, fontSize: fontSizes.sm, marginBottom: spacing[2], lineHeight: 1.5 }}>
                                {skill}
                              </li>
                            ))}
                            {selectedCandidate.matchedSkills.length === 0 && (
                              <li style={{ color: colors.silver, fontSize: fontSizes.sm }}>No specific strengths identified</li>
                            )}
                          </ul>
                        </div>

                        {/* Gaps (Cons) */}
                        <div style={{
                          padding: spacing[5],
                          borderRadius: radius.xl,
                          backgroundColor: 'rgba(255, 107, 107, 0.05)',
                          border: '1px solid rgba(255, 107, 107, 0.15)',
                        }}>
                          <h4 style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            fontWeight: fontWeights.semibold,
                            color: colors.coral,
                            fontSize: fontSizes.base,
                            marginBottom: spacing[4],
                          }}>
                            <XCircle style={{ width: 18, height: 18 }} />
                            Gaps (Concerns)
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: spacing[5] }}>
                            {selectedCandidate.missingSkills.map((skill, i) => (
                              <li key={i} style={{ color: colors.snow, fontSize: fontSizes.sm, marginBottom: spacing[2], lineHeight: 1.5 }}>
                                {skill}
                              </li>
                            ))}
                            {selectedCandidate.concerns.map((concern, i) => (
                              <li key={`c-${i}`} style={{ color: colors.snow, fontSize: fontSizes.sm, marginBottom: spacing[2], lineHeight: 1.5 }}>
                                {concern}
                              </li>
                            ))}
                            {selectedCandidate.missingSkills.length === 0 && selectedCandidate.concerns.length === 0 && (
                              <li style={{ color: colors.silver, fontSize: fontSizes.sm }}>No significant gaps identified</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Risk Assessment */}
                      {selectedCandidate.concerns.length > 0 && (
                        <div style={{
                          marginBottom: spacing[8],
                          padding: spacing[5],
                          borderRadius: radius.xl,
                          backgroundColor: 'rgba(255, 170, 0, 0.05)',
                          border: '1px solid rgba(255, 170, 0, 0.15)',
                        }}>
                          <h4 style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            fontWeight: fontWeights.semibold,
                            color: colors.amber,
                            fontSize: fontSizes.base,
                            marginBottom: spacing[3],
                          }}>
                            <AlertTriangle style={{ width: 18, height: 18 }} />
                            Risk Assessment
                          </h4>
                          <p style={{ fontSize: fontSizes.sm, color: colors.silver, margin: 0, lineHeight: 1.6 }}>
                            This candidate has {selectedCandidate.concerns.length} potential concern(s) that should be addressed during the interview process.
                            Consider probing deeper on: {selectedCandidate.concerns.join(', ')}.
                          </p>
                        </div>
                      )}

                      {/* Interview Questions */}
                      <div style={{ marginBottom: spacing[6] }}>
                        <h3 style={{
                          fontFamily: fonts.display,
                          fontSize: fontSizes.lg,
                          fontWeight: fontWeights.semibold,
                          color: colors.snow,
                          marginBottom: spacing[4],
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[2],
                        }}>
                          <MessageSquare style={{ width: 20, height: 20, color: colors.cyan }} />
                          Recommended Interview Questions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                          {selectedCandidate.interviewQuestions.map((q, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: spacing[3],
                                padding: spacing[4],
                                borderRadius: radius.lg,
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: radius.full,
                                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: fontSizes.sm,
                                fontWeight: fontWeights.semibold,
                                color: colors.cyan,
                              }}>
                                {i + 1}
                              </div>
                              <p style={{ fontSize: fontSizes.sm, color: colors.snow, margin: 0, lineHeight: 1.6 }}>{q}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div style={{
                      padding: spacing[6],
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      gap: spacing[3],
                      justifyContent: 'flex-end',
                      flexWrap: 'wrap',
                    }}>
                      <Button variant="secondary" icon={<FileText style={{ width: 16, height: 16 }} />}>
                        View Full CV
                      </Button>
                      <Button variant="secondary" icon={<Mail style={{ width: 16, height: 16 }} />}>
                        Send Email
                      </Button>
                      <Button icon={<Calendar style={{ width: 16, height: 16 }} />}>
                        Schedule Interview
                      </Button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
