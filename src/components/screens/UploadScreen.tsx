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
import { colors, fonts, spacing, radius, fontSizes, fontWeights } from '../../styles/design-system';
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

  // URL input state
  const [cvUrl, setCvUrl] = useState('');
  const [cvName, setCvName] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  // Paste input state
  const [pastedText, setPastedText] = useState('');
  const [pasteName, setPasteName] = useState('');

  // Pasted CVs list (stored separately from files)
  const [pastedCVs, setPastedCVs] = useState<PastedCV[]>([]);

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
      radial-gradient(ellipse 60% 40% at 70% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse 50% 50% at 30% 70%, rgba(0, 240, 255, 0.05) 0%, transparent 50%)
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

  const stepCircleStyle = (active: boolean, completed: boolean): CSSProperties => ({
    width: '32px',
    height: '32px',
    borderRadius: radius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    backgroundColor: active ? colors.cyan : completed ? colors.emerald : colors.graphite,
    color: active || completed ? colors.void : colors.silver,
    border: active || completed ? 'none' : `1px solid ${colors.steel}`,
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

  const jobCardStyle: CSSProperties = {
    backgroundColor: 'rgba(26, 26, 36, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[6],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  };

  const jobInfoStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    flex: 1,
    minWidth: 0,
  };

  const jobIconStyle: CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const tabsStyle: CSSProperties = {
    display: 'flex',
    gap: spacing[2],
    marginBottom: spacing[6],
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[3]} ${spacing[5]}`,
    borderRadius: radius.lg,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: active ? 'rgba(0, 240, 255, 0.1)' : colors.graphite,
    color: active ? colors.cyan : colors.silver,
    border: active ? `1px solid rgba(0, 240, 255, 0.3)` : '1px solid transparent',
  });

  const dropzoneStyle = (isDragOver: boolean): CSSProperties => ({
    position: 'relative',
    padding: spacing[12],
    border: `2px dashed ${isDragOver ? colors.cyan : colors.steel}`,
    borderRadius: radius.xl,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isDragOver ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
  });

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

  const fileListHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  };

  const fileItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(26, 26, 36, 0.5)',
    marginBottom: spacing[2],
  };

  const fileIconStyle: CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: radius.md,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const actionsStyle: CSSProperties = {
    marginTop: spacing[8],
    display: 'flex',
    gap: spacing[4],
    justifyContent: 'flex-end',
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
      setError(`Invalid files skipped: ${invalidFiles.slice(0, 3).join(', ')}${invalidFiles.length > 3 ? '...' : ''}`);
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
      // Try to fetch the URL content
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

      // Extract text from HTML
      const div = document.createElement('div');
      div.innerHTML = content;
      ['script', 'style', 'nav', 'footer', 'header', 'aside'].forEach(tag => {
        div.querySelectorAll(tag).forEach(el => el.remove());
      });
      const text = (div.textContent || '').replace(/\s+/g, ' ').trim();

      if (text.length < 50) {
        throw new Error('No content found at URL');
      }

      // Add to pasted CVs
      const name = cvName || `CV from ${new URL(cvUrl).hostname}`;
      setPastedCVs(prev => [...prev, {
        id: generateId(),
        name,
        content: text,
        source: 'url'
      }]);

      // Clear inputs
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
      setError('CV content seems too short. Please paste the full CV.');
      return;
    }

    const name = pasteName || `Candidate ${pastedCVs.length + 1}`;
    setPastedCVs(prev => [...prev, {
      id: generateId(),
      name,
      content: pastedText.trim(),
      source: 'paste'
    }]);

    // Clear inputs
    setPastedText('');
    setPasteName('');
    setError(null);
  }, [pastedText, pasteName, pastedCVs.length]);

  // Remove pasted CV
  const removePastedCV = useCallback((id: string) => {
    setPastedCVs(prev => prev.filter(cv => cv.id !== id));
  }, []);

  // Clear all pasted CVs
  const clearPastedCVs = useCallback(() => {
    setPastedCVs([]);
  }, []);

  // Start screening with all CVs
  const handleStartScreening = useCallback(() => {
    const totalCVs = uploadedCVs.length + pastedCVs.length;
    if (totalCVs === 0) {
      setError('Please add at least one CV');
      return;
    }

    // Convert pasted CVs to File objects for unified handling
    const pastedFiles = pastedCVs.map(cv => {
      const blob = new Blob([cv.content], { type: 'text/plain' });
      return new File([blob], `${cv.name}.txt`, { type: 'text/plain' });
    });

    if (pastedFiles.length > 0) {
      addCVs(pastedFiles);
    }

    startScreening();
  }, [uploadedCVs.length, pastedCVs, addCVs, startScreening]);

  // Clear all CVs
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
    { step: 1, label: 'Job Description', active: false, completed: true },
    { step: 2, label: 'Upload CVs', active: true, completed: false },
    { step: 3, label: 'Results', active: false, completed: false },
  ];

  const tabs = [
    { id: 'upload', label: 'Upload Files', Icon: Upload },
    { id: 'url', label: 'From URL', Icon: Link },
    { id: 'paste', label: 'Paste Text', Icon: ClipboardPaste },
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
            Back
          </Button>
          <div style={dividerStyle} />
          <div style={{ flex: 1 }}>
            <h1 style={h1Style}>Upload CVs</h1>
            <p style={stepTextStyle}>Step 2 of 3</p>
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
            <div style={jobInfoStyle}>
              <div style={jobIconStyle}>
                <Briefcase style={{ width: 24, height: 24, color: colors.violet }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontFamily: fonts.display, fontWeight: fontWeights.semibold, color: colors.snow, fontSize: fontSizes.base, margin: 0 }}>
                  {currentJob.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], fontSize: fontSizes.sm, color: colors.silver, marginTop: spacing[1] }}>
                  <span>{currentJob.company}</span>
                  {currentJob.location && (
                    <>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: colors.silver }} />
                      <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
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
          <Card variant="glass" padding="md">
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
                        width: '64px',
                        height: '64px',
                        borderRadius: radius.xl,
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        marginBottom: spacing[4],
                      }}>
                        <Upload style={{ width: 32, height: 32, color: dragOver ? colors.cyan : colors.silver }} />
                      </div>
                      <h3 style={{ fontFamily: fonts.display, fontSize: fontSizes.xl, fontWeight: fontWeights.semibold, color: colors.snow, marginBottom: spacing[2] }}>
                        {dragOver ? 'Drop files here' : 'Drag & drop CVs here'}
                      </h3>
                      <p style={{ color: colors.silver, fontSize: fontSizes.base, marginBottom: spacing[4] }}>
                        or click to browse files
                      </p>
                      <p style={{ fontSize: fontSizes.xs, color: 'rgba(136, 136, 160, 0.6)' }}>
                        Supports PDF, DOC, DOCX, TXT, HTML
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
                  <div style={{ marginBottom: spacing[4] }}>
                    <Input
                      label="CV/Profile URL"
                      placeholder="https://linkedin.com/in/... or any CV URL"
                      value={cvUrl}
                      onChange={(e) => setCvUrl(e.target.value)}
                      icon={<Link style={{ width: 16, height: 16 }} />}
                    />
                  </div>
                  <div style={{ marginBottom: spacing[4] }}>
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
                  <p style={{ fontSize: fontSizes.xs, color: colors.silver, marginTop: spacing[3], textAlign: 'center' }}>
                    Works with LinkedIn profiles, online CVs, and portfolio pages
                  </p>
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
                  <div style={{ marginBottom: spacing[4] }}>
                    <Input
                      label="Candidate Name"
                      placeholder="e.g., John Smith"
                      value={pasteName}
                      onChange={(e) => setPasteName(e.target.value)}
                      icon={<User style={{ width: 16, height: 16 }} />}
                    />
                  </div>
                  <div style={{ marginBottom: spacing[4] }}>
                    <Textarea
                      label="CV Content"
                      placeholder="Paste the candidate's CV or resume content here..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      style={{ minHeight: '200px', fontFamily: fonts.mono, fontSize: fontSizes.sm }}
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
              <span style={{ fontSize: fontSizes.sm, color: colors.coral }}>{error}</span>
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
              style={{ marginTop: spacing[6] }}
            >
              <Card variant="glass" padding="md">
                <div style={fileListHeaderStyle}>
                  <h3 style={{ fontFamily: fonts.display, fontWeight: fontWeights.semibold, color: colors.snow, fontSize: fontSizes.base, margin: 0 }}>
                    {totalCVs} CV{totalCVs !== 1 ? 's' : ''} Ready
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    style={{ color: colors.coral }}
                  >
                    Clear All
                  </Button>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], minWidth: 0, flex: 1 }}>
                        <div style={fileIconStyle}>
                          <FileText style={{ width: 20, height: 20, color: colors.violet }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: fontSizes.sm, color: colors.snow, fontWeight: fontWeights.medium, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </p>
                          <p style={{ fontSize: fontSizes.xs, color: colors.silver, margin: 0 }}>
                            {formatSize(file.size)} • File Upload
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCVs(index)}
                        style={{
                          padding: spacing[2],
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], minWidth: 0, flex: 1 }}>
                        <div style={{
                          ...fileIconStyle,
                          backgroundColor: cv.source === 'url' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0, 255, 136, 0.1)'
                        }}>
                          {cv.source === 'url' ? (
                            <Link style={{ width: 20, height: 20, color: colors.cyan }} />
                          ) : (
                            <ClipboardPaste style={{ width: 20, height: 20, color: colors.emerald }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: fontSizes.sm, color: colors.snow, fontWeight: fontWeights.medium, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cv.name}
                          </p>
                          <p style={{ fontSize: fontSizes.xs, color: colors.silver, margin: 0 }}>
                            {cv.content.length.toLocaleString()} chars • {cv.source === 'url' ? 'From URL' : 'Pasted'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removePastedCV(cv.id)}
                        style={{
                          padding: spacing[2],
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
            size="lg"
            icon={<Zap style={{ width: 20, height: 20 }} />}
            onClick={handleStartScreening}
            disabled={totalCVs === 0}
          >
            Start AI Screening ({totalCVs})
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
