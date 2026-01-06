import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Link,
  Upload,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Briefcase,
  MapPin,
  Clock
} from 'lucide-react';
import { Button, Card, Input, Textarea } from '../ui';
import { useStore, generateId } from '../../store/useStore';
import { useResponsive } from '../../hooks/useResponsive';
import { api } from '../../services/api';
import { colors, fonts, radius, fontWeights } from '../../styles/design-system';
import type { JobDescription } from '../../types';
import type { CSSProperties } from 'react';

type InputMethod = 'paste' | 'url' | 'file';

export function JobScreen() {
  const { setScreen, addJob, currentJob } = useStore();
  const [method, setMethod] = useState<InputMethod>('paste');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Responsive
  const { isMobile } = useResponsive();

  // Form state
  const [title, setTitle] = useState(currentJob?.title || '');
  const [company, setCompany] = useState(currentJob?.company || '');
  const [location, setLocation] = useState(currentJob?.location || '');
  const [experience, setExperience] = useState(currentJob?.experience || '');
  const [rawText, setRawText] = useState(currentJob?.rawText || '');
  const [url, setUrl] = useState('');

  // Responsive spacing
  const pagePadding = isMobile ? '16px' : '24px';
  const sectionGap = isMobile ? '20px' : '32px';
  const fontSize = {
    h1: isMobile ? '20px' : '24px',
    body: isMobile ? '14px' : '16px',
    small: isMobile ? '12px' : '14px',
    xs: isMobile ? '11px' : '12px',
  };

  // Styles
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
    background: isMobile
      ? `radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0, 240, 255, 0.08) 0%, transparent 50%)`
      : `
        radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0, 240, 255, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse 50% 50% at 70% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
      `,
  };

  const containerStyle: CSSProperties = {
    position: 'relative',
    zIndex: 10,
    padding: `${sectionGap} ${pagePadding}`,
    maxWidth: '800px',
    margin: '0 auto',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '12px' : '16px',
    marginBottom: sectionGap,
    flexWrap: 'wrap',
  };

  const h1Style: CSSProperties = {
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    fontWeight: fontWeights.bold,
    color: colors.snow,
    margin: 0,
    marginBottom: '4px',
  };

  const progressStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '16px',
    marginBottom: sectionGap,
    overflowX: 'auto',
    paddingBottom: '8px',
  };

  const stepCircleStyle = (active: boolean): CSSProperties => ({
    width: isMobile ? '28px' : '32px',
    height: isMobile ? '28px' : '32px',
    borderRadius: radius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: fontWeights.semibold,
    backgroundColor: active ? colors.cyan : colors.graphite,
    color: active ? colors.void : colors.silver,
    border: active ? 'none' : `1px solid ${colors.steel}`,
    flexShrink: 0,
  });

  const stepLabelStyle = (active: boolean): CSSProperties => ({
    marginLeft: '6px',
    fontSize: isMobile ? '12px' : '14px',
    color: active ? colors.snow : colors.silver,
    whiteSpace: 'nowrap',
  });

  const stepLineStyle: CSSProperties = {
    width: isMobile ? '20px' : '48px',
    height: '1px',
    backgroundColor: colors.steel,
    margin: isMobile ? '0 4px' : '0 16px',
    flexShrink: 0,
  };

  const tabsStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: isMobile ? '16px' : '24px',
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: isMobile ? '8px 12px' : '8px 16px',
    borderRadius: radius.lg,
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: fontWeights.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: active ? 'rgba(0, 240, 255, 0.1)' : colors.graphite,
    color: active ? colors.cyan : colors.silver,
    border: active ? `1px solid rgba(0, 240, 255, 0.3)` : '1px solid transparent',
    flex: isMobile ? '1 1 calc(50% - 4px)' : 'none',
    justifyContent: 'center',
  });

  const dropzoneStyle: CSSProperties = {
    border: `2px dashed ${colors.steel}`,
    borderRadius: radius.xl,
    padding: isMobile ? '32px 16px' : '48px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const successBoxStyle: CSSProperties = {
    marginTop: '16px',
    padding: isMobile ? '12px' : '16px',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const errorBoxStyle: CSSProperties = {
    marginTop: '16px',
    padding: isMobile ? '12px' : '16px',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    border: '1px solid rgba(255, 107, 107, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
    gap: isMobile ? '12px' : '16px',
  };

  const footerStyle: CSSProperties = {
    marginTop: sectionGap,
    display: 'flex',
    justifyContent: isMobile ? 'stretch' : 'flex-end',
  };

  // Extract job info from text
  const extractJobInfo = useCallback((text: string) => {
    const titlePatterns = [
      /^([A-Z][A-Za-z\s\-/]+(?:Engineer|Developer|Manager|Designer|Analyst|Specialist|Lead|Director|QA|DevOps|Architect))/m,
      /(?:Job Title|Position|Role)[\s:]+(.+)/i
    ];
    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && !title) {
        setTitle(match[1].trim());
        break;
      }
    }

    const companyPatterns = [
      /(?:Company|Organization|Employer)[\s:]+([A-Z][A-Za-z\s]+(?:LLC|Inc|Ltd|Corp|Labs)?)/i,
      /(?:at|@)\s+([A-Z][A-Za-z\s]+(?:LLC|Inc|Ltd|Labs)?)/i,
    ];
    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match && !company) {
        setCompany(match[1].trim());
        break;
      }
    }

    const locationMatch = text.match(/(?:Location|Based in|Office)[\s:]+([A-Za-z\s,]+)/i);
    if (locationMatch && !location) {
      setLocation(locationMatch[1].trim().substring(0, 50));
    }

    const expMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i);
    if (expMatch && !experience) {
      setExperience(expMatch[1] + '+ years');
    }
  }, [title, company, location, experience]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target?.result as string;

      if (file.name.match(/\.html?$/i)) {
        const div = document.createElement('div');
        div.innerHTML = text;
        text = div.textContent || '';
      }

      setRawText(text);
      extractJobInfo(text);
      setLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };

    if (file.type === 'application/pdf') {
      setError('PDF files not supported. Please copy/paste the text.');
      setLoading(false);
    } else {
      reader.readAsText(file);
    }
  }, [extractJobInfo]);

  // Handle URL fetch using backend proxy
  const handleUrlFetch = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.fetchUrl(url);

      if (!result.success) {
        throw new Error(result.error || 'Could not fetch URL');
      }

      const text = result.content;

      if (text.length < 100) {
        throw new Error('No content found at this URL');
      }

      setRawText(text);
      extractJobInfo(text);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch URL. Try copy/paste instead.');
      setLoading(false);
    }
  }, [url, extractJobInfo]);

  // Handle text paste
  const handleTextChange = useCallback((text: string) => {
    setRawText(text);
    if (text.length > 200) {
      extractJobInfo(text);
    }
  }, [extractJobInfo]);

  // Save and continue
  const handleContinue = useCallback(() => {
    if (!title || !rawText) {
      setError('Please provide job title and description');
      return;
    }

    const job: JobDescription = {
      id: generateId(),
      title,
      company,
      location,
      experience,
      rawText,
      requirements: [],
      niceToHave: [],
      createdAt: new Date(),
    };

    addJob(job);
    setScreen('upload');
  }, [title, company, location, experience, rawText, addJob, setScreen]);

  const steps = [
    { step: 1, label: 'Job', active: true },
    { step: 2, label: 'CVs', active: false },
    { step: 3, label: 'Results', active: false },
  ];

  const tabs = [
    { id: 'paste', label: 'Paste', Icon: FileText },
    { id: 'url', label: 'URL', Icon: Link },
    { id: 'file', label: 'Upload', Icon: Upload },
  ];

  return (
    <div style={pageStyle}>
      <div style={bgEffectStyle} />

      <div style={containerStyle}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={headerStyle}
        >
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft style={{ width: 16, height: 16 }} />}
            onClick={() => setScreen('landing')}
          >
            {!isMobile && 'Back'}
          </Button>
          <div style={{ height: '24px', width: '1px', backgroundColor: colors.steel }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={h1Style}>Add Job Description</h1>
            <p style={{ fontSize: fontSize.small, color: colors.silver, margin: 0 }}>Step 1 of 3</p>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={progressStyle}
        >
          {steps.map((item, i) => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={stepCircleStyle(item.active)}>{item.step}</div>
              <span style={stepLabelStyle(item.active)}>{item.label}</span>
              {i < 2 && <div style={stepLineStyle} />}
            </div>
          ))}
        </motion.div>

        {/* Input Method Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={tabsStyle}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethod(tab.id as InputMethod)}
              style={tabStyle(method === tab.id)}
            >
              <tab.Icon style={{ width: 16, height: 16 }} />
              <span>{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass" padding={isMobile ? 'sm' : 'md'}>
            <AnimatePresence mode="wait">
              {method === 'paste' && (
                <motion.div
                  key="paste"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Textarea
                    label="Job Description"
                    placeholder="Paste the complete job description here..."
                    value={rawText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    style={{ minHeight: isMobile ? '180px' : '250px', fontFamily: fonts.mono, fontSize: fontSize.small }}
                  />
                </motion.div>
              )}

              {method === 'url' && (
                <motion.div
                  key="url"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <Input
                        label="Job Posting URL"
                        placeholder="https://careers.company.com/jobs/123"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        icon={<Link style={{ width: 16, height: 16 }} />}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'flex-end' }}>
                      <Button onClick={handleUrlFetch} loading={loading} disabled={!url} fullWidth={isMobile}>
                        Fetch
                      </Button>
                    </div>
                  </div>
                  {rawText && (
                    <div style={successBoxStyle}>
                      <CheckCircle style={{ width: 20, height: 20, color: colors.emerald, flexShrink: 0 }} />
                      <span style={{ fontSize: fontSize.small, color: colors.emerald }}>
                        Loaded ({rawText.length.toLocaleString()} chars)
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {method === 'file' && (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <label>
                    <div style={dropzoneStyle}>
                      <Upload style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, color: colors.silver, margin: '0 auto', marginBottom: '16px' }} />
                      <p style={{ color: colors.snow, fontWeight: fontWeights.medium, marginBottom: '4px', fontSize: fontSize.body }}>
                        Drop file here or tap to browse
                      </p>
                      <p style={{ fontSize: fontSize.small, color: colors.silver }}>
                        Supports .txt, .html, .doc, .docx
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".txt,.html,.htm,.doc,.docx,.md"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {rawText && (
                    <div style={successBoxStyle}>
                      <CheckCircle style={{ width: 20, height: 20, color: colors.emerald, flexShrink: 0 }} />
                      <span style={{ fontSize: fontSize.small, color: colors.emerald }}>
                        File loaded ({rawText.length.toLocaleString()} chars)
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={errorBoxStyle}
              >
                <AlertCircle style={{ width: 20, height: 20, color: colors.coral, flexShrink: 0 }} />
                <span style={{ fontSize: fontSize.small, color: colors.coral }}>{error}</span>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Job Details Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginTop: isMobile ? '16px' : '24px' }}
        >
          <Card variant="glass" padding={isMobile ? 'sm' : 'md'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isMobile ? '12px' : '16px', flexWrap: 'wrap' }}>
              <Sparkles style={{ width: 18, height: 18, color: colors.cyan }} />
              <h3 style={{ fontFamily: fonts.display, fontSize: isMobile ? '15px' : '18px', fontWeight: fontWeights.semibold, color: colors.snow, margin: 0 }}>
                Job Details
              </h3>
              <span style={{ fontSize: fontSize.xs, color: colors.silver }}>
                (Auto-filled)
              </span>
            </div>

            <div style={gridStyle}>
              <Input
                label="Job Title"
                placeholder="e.g., Senior Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                icon={<Briefcase style={{ width: 16, height: 16 }} />}
              />
              <Input
                label="Company"
                placeholder="e.g., Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <Input
                label="Location"
                placeholder="e.g., Singapore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                icon={<MapPin style={{ width: 16, height: 16 }} />}
              />
              <Input
                label="Experience Required"
                placeholder="e.g., 3+ years"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                icon={<Clock style={{ width: 16, height: 16 }} />}
              />
            </div>
          </Card>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={footerStyle}
        >
          <Button
            size={isMobile ? 'md' : 'lg'}
            icon={<ArrowRight style={{ width: 20, height: 20 }} />}
            iconPosition="right"
            onClick={handleContinue}
            disabled={!title || !rawText}
            fullWidth={isMobile}
          >
            {isMobile ? 'Continue' : 'Continue to Upload CVs'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
