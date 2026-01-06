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
import { api } from '../../services/api';
import { colors, fonts, spacing, radius, fontSizes, fontWeights } from '../../styles/design-system';
import type { JobDescription } from '../../types';
import type { CSSProperties } from 'react';

type InputMethod = 'paste' | 'url' | 'file';

export function JobScreen() {
  const { setScreen, addJob, currentJob } = useStore();
  const [method, setMethod] = useState<InputMethod>('paste');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(currentJob?.title || '');
  const [company, setCompany] = useState(currentJob?.company || '');
  const [location, setLocation] = useState(currentJob?.location || '');
  const [experience, setExperience] = useState(currentJob?.experience || '');
  const [rawText, setRawText] = useState(currentJob?.rawText || '');
  const [url, setUrl] = useState('');

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
    background: `
      radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0, 240, 255, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse 50% 50% at 70% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
    `,
  };

  const containerStyle: CSSProperties = {
    position: 'relative',
    zIndex: 10,
    padding: `${spacing[8]} ${spacing[6]}`,
    maxWidth: '800px',
    margin: '0 auto',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[8],
  };

  const dividerStyle: CSSProperties = {
    height: '24px',
    width: '1px',
    backgroundColor: colors.steel,
  };

  const headerTextStyle: CSSProperties = {
    flex: 1,
  };

  const h1Style: CSSProperties = {
    fontFamily: fonts.display,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.snow,
    margin: 0,
    marginBottom: spacing[1],
  };

  const stepTextStyle: CSSProperties = {
    fontSize: fontSizes.sm,
    color: colors.silver,
  };

  const progressStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[8],
  };

  const stepCircleStyle = (active: boolean): CSSProperties => ({
    width: '32px',
    height: '32px',
    borderRadius: radius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    backgroundColor: active ? colors.cyan : colors.graphite,
    color: active ? colors.void : colors.silver,
    border: active ? 'none' : `1px solid ${colors.steel}`,
  });

  const stepLabelStyle = (active: boolean): CSSProperties => ({
    marginLeft: spacing[2],
    fontSize: fontSizes.sm,
    color: active ? colors.snow : colors.silver,
  });

  const stepLineStyle: CSSProperties = {
    width: '48px',
    height: '1px',
    backgroundColor: colors.steel,
    margin: `0 ${spacing[4]}`,
  };

  const tabsStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[6],
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[4]}`,
    borderRadius: radius.lg,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: active ? 'rgba(0, 240, 255, 0.1)' : colors.graphite,
    color: active ? colors.cyan : colors.silver,
    border: active ? `1px solid rgba(0, 240, 255, 0.3)` : '1px solid transparent',
  });

  const dropzoneStyle: CSSProperties = {
    border: `2px dashed ${colors.steel}`,
    borderRadius: radius.xl,
    padding: spacing[12],
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const successBoxStyle: CSSProperties = {
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  };

  const errorBoxStyle: CSSProperties = {
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    border: '1px solid rgba(255, 107, 107, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  };

  const detailsHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  };

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: spacing[4],
  };

  const footerStyle: CSSProperties = {
    marginTop: spacing[8],
    display: 'flex',
    justifyContent: 'flex-end',
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
      // Use backend proxy to avoid CORS issues
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
    { step: 1, label: 'Job Description', active: true },
    { step: 2, label: 'Upload CVs', active: false },
    { step: 3, label: 'Results', active: false },
  ];

  const tabs = [
    { id: 'paste', label: 'Paste Text', Icon: FileText },
    { id: 'url', label: 'From URL', Icon: Link },
    { id: 'file', label: 'Upload File', Icon: Upload },
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
            Back
          </Button>
          <div style={dividerStyle} />
          <div style={headerTextStyle}>
            <h1 style={h1Style}>Add Job Description</h1>
            <p style={stepTextStyle}>Step 1 of 3</p>
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
          <Card variant="glass" padding="md">
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
                    style={{ minHeight: '250px', fontFamily: fonts.mono, fontSize: fontSizes.sm }}
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
                  <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[4] }}>
                    <div style={{ flex: 1 }}>
                      <Input
                        label="Job Posting URL"
                        placeholder="https://company.breezy.hr/p/job-id"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        icon={<Link style={{ width: 16, height: 16 }} />}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <Button onClick={handleUrlFetch} loading={loading} disabled={!url}>
                        Fetch
                      </Button>
                    </div>
                  </div>
                  {rawText && (
                    <div style={successBoxStyle}>
                      <CheckCircle style={{ width: 20, height: 20, color: colors.emerald, flexShrink: 0 }} />
                      <span style={{ fontSize: fontSizes.sm, color: colors.emerald }}>
                        Job description loaded ({rawText.length.toLocaleString()} characters)
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
                      <Upload style={{ width: 40, height: 40, color: colors.silver, margin: '0 auto', marginBottom: spacing[4] }} />
                      <p style={{ color: colors.snow, fontWeight: fontWeights.medium, marginBottom: spacing[1], fontSize: fontSizes.base }}>
                        Drop file here or click to browse
                      </p>
                      <p style={{ fontSize: fontSizes.sm, color: colors.silver }}>
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
                      <span style={{ fontSize: fontSizes.sm, color: colors.emerald }}>
                        File loaded successfully ({rawText.length.toLocaleString()} characters)
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
                <span style={{ fontSize: fontSizes.sm, color: colors.coral }}>{error}</span>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Job Details Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="glass" padding="md">
            <div style={detailsHeaderStyle}>
              <Sparkles style={{ width: 20, height: 20, color: colors.cyan }} />
              <h3 style={{ fontFamily: fonts.display, fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.snow, margin: 0 }}>
                Job Details
              </h3>
              <span style={{ fontSize: fontSizes.xs, color: colors.silver, marginLeft: spacing[2] }}>
                (Auto-filled from description)
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
                placeholder="e.g., Doodle Labs"
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
            size="lg"
            icon={<ArrowRight style={{ width: 20, height: 20 }} />}
            iconPosition="right"
            onClick={handleContinue}
            disabled={!title || !rawText}
          >
            Continue to Upload CVs
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
