import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  ArrowLeft,
  Zap,
  AlertCircle,
  Briefcase,
  MapPin,
  Link,
  ClipboardPaste,
  Plus,
  User
} from 'lucide-react';
import { Button, Card, Input, Textarea } from '../ui';
import { useStore, generateId } from '../../store/useStore';
import { useResponsive } from '../../hooks/useResponsive';
import { colors, fonts, radius, fontWeights } from '../../styles/design-system';
import type { CSSProperties } from 'react';

type InputMethod = 'upload' | 'url' | 'paste';

interface PastedCV {
  id: string;
  name: string;
  content: string;
  source: 'url' | 'paste';
}

export function UploadScreen() {
  const { setScreen, currentJob, uploadedCVs, addCVs, removeCVs, clearCVs, startScreening } = useStore();
  const [method, setMethod] = useState<InputMethod>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Responsive
  const { isMobile } = useResponsive();

  // URL input state
  const [cvUrl, setCvUrl] = useState('');
  const [cvName, setCvName] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  // Paste input state
  const [pastedText, setPastedText] = useState('');
  const [pasteName, setPasteName] = useState('');

  // Pasted CVs list
  const [pastedCVs, setPastedCVs] = useState<PastedCV[]>([]);

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
      ? `radial-gradient(ellipse 100% 50% at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)`
      : `
        radial-gradient(ellipse 60% 40% at 70% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse 50% 50% at 30% 70%, rgba(0, 240, 255, 0.05) 0%, transparent 50%)
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

  const stepCircleStyle = (active: boolean, completed: boolean): CSSProperties => ({
    width: isMobile ? '28px' : '32px',
    height: isMobile ? '28px' : '32px',
    borderRadius: radius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: fontWeights.semibold,
    backgroundColor: active ? colors.cyan : completed ? colors.emerald : colors.graphite,
    color: active || completed ? colors.void : colors.silver,
    border: active || completed ? 'none' : `1px solid ${colors.steel}`,
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

  const jobCardStyle: CSSProperties = {
    backgroundColor: 'rgba(26, 26, 36, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: radius.xl,
    padding: isMobile ? '12px' : '20px',
    marginBottom: isMobile ? '16px' : '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: isMobile ? '12px' : '16px',
    flexWrap: 'wrap',
  };

  const tabsStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: isMobile ? '16px' : '24px',
    flexWrap: 'wrap',
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: isMobile ? '10px 14px' : '12px 20px',
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

  const dropzoneStyle = (isDragOver: boolean): CSSProperties => ({
    position: 'relative',
    padding: isMobile ? '32px 16px' : '48px',
    border: `2px dashed ${isDragOver ? colors.cyan : colors.steel}`,
    borderRadius: radius.xl,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isDragOver ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
  });

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

  const fileItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '10px' : '12px',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(26, 26, 36, 0.5)',
    marginBottom: '8px',
    gap: '12px',
  };

  const actionsStyle: CSSProperties = {
    marginTop: sectionGap,
    display: 'flex',
    gap: '16px',
    justifyContent: isMobile ? 'stretch' : 'flex-end',
    flexDirection: isMobile ? 'column' : 'row',
  };

  // Handle file selection
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      const ext = file.name.toLowerCase().split('.').pop();
      if (['pdf', 'doc', 'docx', 'txt', 'html', 'htm'].includes(ext || '')) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid: ${invalidFiles.slice(0, 2).join(', ')}${invalidFiles.length > 2 ? '...' : ''}`);
      setTimeout(() => setError(null), 5000);
    }

    if (validFiles.length > 0) {
      addCVs(validFiles);
    }
  }, [addCVs]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // Handle URL fetch
  const handleFetchUrl = useCallback(async () => {
    if (!cvUrl) {
      setError('Please enter a URL');
      return;
    }

    setUrlLoading(true);
    setError(null);

    try {
      const proxies = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?'
      ];

      let content = null;
      for (const proxy of proxies) {
        try {
          const res = await fetch(proxy + encodeURIComponent(cvUrl));
          if (res.ok) {
            content = await res.text();
            break;
          }
        } catch {
          continue;
        }
      }

      if (!content) {
        throw new Error('Could not fetch URL');
      }

      const div = document.createElement('div');
      div.innerHTML = content;
      ['script', 'style', 'nav', 'footer', 'header', 'aside'].forEach(tag => {
        div.querySelectorAll(tag).forEach(el => el.remove());
      });
      const text = (div.textContent || '').replace(/\s+/g, ' ').trim();

      if (text.length < 50) {
        throw new Error('No content found at URL');
      }

      const name = cvName || `CV from ${new URL(cvUrl).hostname}`;
      setPastedCVs(prev => [...prev, {
        id: generateId(),
        name,
        content: text,
        source: 'url'
      }]);

      setCvUrl('');
      setCvName('');
      setUrlLoading(false);

    } catch (err) {
      setError((err as Error).message || 'Failed to fetch URL');
      setUrlLoading(false);
    }
  }, [cvUrl, cvName]);

  // Handle paste text
  const handleAddPastedCV = useCallback(() => {
    if (!pastedText.trim()) {
      setError('Please paste CV content');
      return;
    }

    if (pastedText.trim().length < 50) {
      setError('CV content seems too short');
      return;
    }

    const name = pasteName || `Candidate ${pastedCVs.length + 1}`;
    setPastedCVs(prev => [...prev, {
      id: generateId(),
      name,
      content: pastedText.trim(),
      source: 'paste'
    }]);

    setPastedText('');
    setPasteName('');
    setError(null);
  }, [pastedText, pasteName, pastedCVs.length]);

  const removePastedCV = useCallback((id: string) => {
    setPastedCVs(prev => prev.filter(cv => cv.id !== id));
  }, []);

  const clearPastedCVs = useCallback(() => {
    setPastedCVs([]);
  }, []);

  const handleStartScreening = useCallback(() => {
    const totalCVs = uploadedCVs.length + pastedCVs.length;
    if (totalCVs === 0) {
      setError('Please add at least one CV');
      return;
    }

    const pastedFiles = pastedCVs.map(cv => {
      const blob = new Blob([cv.content], { type: 'text/plain' });
      return new File([blob], `${cv.name}.txt`, { type: 'text/plain' });
    });

    if (pastedFiles.length > 0) {
      addCVs(pastedFiles);
    }

    startScreening();
  }, [uploadedCVs.length, pastedCVs, addCVs, startScreening]);

  const handleClearAll = useCallback(() => {
    clearCVs();
    clearPastedCVs();
  }, [clearCVs, clearPastedCVs]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const steps = [
    { step: 1, label: 'Job', active: false, completed: true },
    { step: 2, label: 'CVs', active: true, completed: false },
    { step: 3, label: 'Results', active: false, completed: false },
  ];

  const tabs = [
    { id: 'upload', label: 'Upload', Icon: Upload },
    { id: 'url', label: 'URL', Icon: Link },
    { id: 'paste', label: 'Paste', Icon: ClipboardPaste },
  ];

  const totalCVs = uploadedCVs.length + pastedCVs.length;

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
            onClick={() => setScreen('job')}
          >
            {!isMobile && 'Back'}
          </Button>
          <div style={{ height: '24px', width: '1px', backgroundColor: colors.steel }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={h1Style}>Upload CVs</h1>
            <p style={{ fontSize: fontSize.small, color: colors.silver, margin: 0 }}>Step 2 of 3</p>
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
              <div style={stepCircleStyle(item.active, item.completed)}>
                {item.completed ? '✓' : item.step}
              </div>
              <span style={stepLabelStyle(item.active)}>{item.label}</span>
              {i < 2 && <div style={stepLineStyle} />}
            </div>
          ))}
        </motion.div>

        {/* Current Job Info */}
        {currentJob && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={jobCardStyle}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px', flex: 1, minWidth: 0 }}>
              <div style={{
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                borderRadius: radius.lg,
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Briefcase style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24, color: colors.violet }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontFamily: fonts.display, fontWeight: fontWeights.semibold, color: colors.snow, fontSize: isMobile ? '14px' : '16px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentJob.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: fontSize.xs, color: colors.silver, marginTop: '2px', flexWrap: 'wrap' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentJob.company}</span>
                  {currentJob.location && !isMobile && (
                    <>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: colors.silver, flexShrink: 0 }} />
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin style={{ width: 12, height: 12 }} />
                        {currentJob.location}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setScreen('job')}>
              Edit
            </Button>
          </motion.div>
        )}

        {/* Input Method Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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
              {/* Upload Files Tab */}
              {method === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={dropzoneStyle(dragOver)}
                  >
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.html,.htm"
                      onChange={(e) => handleFiles(e.target.files)}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />

                    <div style={{ pointerEvents: 'none' }}>
                      <div style={{
                        width: isMobile ? '48px' : '64px',
                        height: isMobile ? '48px' : '64px',
                        borderRadius: radius.xl,
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        marginBottom: '16px',
                      }}>
                        <Upload style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, color: dragOver ? colors.cyan : colors.silver }} />
                      </div>
                      <h3 style={{ fontFamily: fonts.display, fontSize: isMobile ? '16px' : '20px', fontWeight: fontWeights.semibold, color: colors.snow, marginBottom: '8px' }}>
                        {dragOver ? 'Drop files here' : 'Drag & drop CVs'}
                      </h3>
                      <p style={{ color: colors.silver, fontSize: fontSize.body, marginBottom: '16px' }}>
                        or tap to browse files
                      </p>
                      <p style={{ fontSize: fontSize.xs, color: 'rgba(136, 136, 160, 0.6)' }}>
                        PDF, DOC, DOCX, TXT, HTML
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* URL Input Tab */}
              {method === 'url' && (
                <motion.div
                  key="url"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Input
                      label="CV/Profile URL"
                      placeholder="https://linkedin.com/in/..."
                      value={cvUrl}
                      onChange={(e) => setCvUrl(e.target.value)}
                      icon={<Link style={{ width: 16, height: 16 }} />}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <Input
                      label="Candidate Name (Optional)"
                      placeholder="e.g., John Smith"
                      value={cvName}
                      onChange={(e) => setCvName(e.target.value)}
                      icon={<User style={{ width: 16, height: 16 }} />}
                    />
                  </div>
                  <Button
                    onClick={handleFetchUrl}
                    disabled={!cvUrl || urlLoading}
                    loading={urlLoading}
                    icon={<Plus style={{ width: 16, height: 16 }} />}
                    fullWidth
                  >
                    {urlLoading ? 'Fetching...' : 'Add CV from URL'}
                  </Button>
                </motion.div>
              )}

              {/* Paste Text Tab */}
              {method === 'paste' && (
                <motion.div
                  key="paste"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Input
                      label="Candidate Name"
                      placeholder="e.g., John Smith"
                      value={pasteName}
                      onChange={(e) => setPasteName(e.target.value)}
                      icon={<User style={{ width: 16, height: 16 }} />}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <Textarea
                      label="CV Content"
                      placeholder="Paste CV content here..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      style={{ minHeight: isMobile ? '150px' : '200px', fontFamily: fonts.mono, fontSize: fontSize.small }}
                    />
                  </div>
                  <Button
                    onClick={handleAddPastedCV}
                    disabled={!pastedText.trim()}
                    icon={<Plus style={{ width: 16, height: 16 }} />}
                    fullWidth
                  >
                    Add CV
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={errorBoxStyle}
            >
              <AlertCircle style={{ width: 20, height: 20, color: colors.coral, flexShrink: 0 }} />
              <span style={{ fontSize: fontSize.small, color: colors.coral }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CVs List */}
        <AnimatePresence>
          {totalCVs > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ marginTop: isMobile ? '16px' : '24px' }}
            >
              <Card variant="glass" padding={isMobile ? 'sm' : 'md'}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: fonts.display, fontWeight: fontWeights.semibold, color: colors.snow, fontSize: fontSize.body, margin: 0 }}>
                    {totalCVs} CV{totalCVs !== 1 ? 's' : ''} Ready
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    style={{ color: colors.coral }}
                  >
                    Clear
                  </Button>
                </div>

                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {/* Uploaded Files */}
                  {uploadedCVs.map((file, index) => (
                    <motion.div
                      key={`file-${file.name}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      style={fileItemStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: isMobile ? '32px' : '40px',
                          height: isMobile ? '32px' : '40px',
                          borderRadius: radius.md,
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <FileText style={{ width: isMobile ? 16 : 20, height: isMobile ? 16 : 20, color: colors.violet }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: fontSize.small, color: colors.snow, fontWeight: fontWeights.medium, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </p>
                          <p style={{ fontSize: fontSize.xs, color: colors.silver, margin: 0 }}>
                            {formatSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCVs(index)}
                        style={{
                          padding: '8px',
                          borderRadius: radius.md,
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: colors.silver,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X style={{ width: 16, height: 16 }} />
                      </button>
                    </motion.div>
                  ))}

                  {/* Pasted CVs */}
                  {pastedCVs.map((cv, index) => (
                    <motion.div
                      key={`pasted-${cv.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: (uploadedCVs.length + index) * 0.02 }}
                      style={fileItemStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: isMobile ? '32px' : '40px',
                          height: isMobile ? '32px' : '40px',
                          borderRadius: radius.md,
                          backgroundColor: cv.source === 'url' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0, 255, 136, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {cv.source === 'url' ? (
                            <Link style={{ width: isMobile ? 16 : 20, height: isMobile ? 16 : 20, color: colors.cyan }} />
                          ) : (
                            <ClipboardPaste style={{ width: isMobile ? 16 : 20, height: isMobile ? 16 : 20, color: colors.emerald }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: fontSize.small, color: colors.snow, fontWeight: fontWeights.medium, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cv.name}
                          </p>
                          <p style={{ fontSize: fontSize.xs, color: colors.silver, margin: 0 }}>
                            {cv.content.length.toLocaleString()} chars
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removePastedCV(cv.id)}
                        style={{
                          padding: '8px',
                          borderRadius: radius.md,
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: colors.silver,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X style={{ width: 16, height: 16 }} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={actionsStyle}
        >
          <Button
            size={isMobile ? 'md' : 'lg'}
            icon={<Zap style={{ width: 20, height: 20 }} />}
            onClick={handleStartScreening}
            disabled={totalCVs === 0}
            fullWidth={isMobile}
          >
            Start AI Screening ({totalCVs})
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
