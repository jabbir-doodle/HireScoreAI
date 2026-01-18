import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  FileText,
  Zap,
  Copy,
  AlertTriangle,
  RefreshCw,
  Server,
  ChevronDown,
  Sparkles,
  Brain,
  FileSearch,
  Cpu,
  ShieldCheck,
  Clock
} from 'lucide-react';

// Processing stage type for enterprise-grade progress tracking
type ProcessingStage = 'reading' | 'validating' | 'analyzing' | 'scoring' | 'complete';
import { Button } from '../ui';
import { useStore, generateId } from '../../store/useStore';
import { api, readFileAsText, type AIModel } from '../../services/api';
import { colors, fonts, spacing, radius, fontSizes, fontWeights } from '../../styles/design-system';
import type { Candidate } from '../../types';
import type { CSSProperties } from 'react';

export function ScreeningScreen() {
  const {
    setScreen,
    currentJob,
    uploadedCVs,
    currentSession,
    updateSession
  } = useStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  // Enterprise progress tracking - shows exactly what's happening
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('reading');
  const [stageStartTime, setStageStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Model selection state
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('z-ai/glm-4.7');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Real-time elapsed time counter
  useEffect(() => {
    if (currentSession?.status === 'processing') {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - stageStartTime) / 1000));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentSession?.status, stageStartTime]);

  // Stage descriptions for user feedback
  const stageInfo: Record<ProcessingStage, { label: string; icon: React.ReactNode; color: string }> = {
    reading: { label: 'Reading Document', icon: <FileSearch style={{ width: 20, height: 20 }} />, color: colors.cyan },
    validating: { label: 'Validating Content', icon: <ShieldCheck style={{ width: 20, height: 20 }} />, color: colors.violet },
    analyzing: { label: 'AI Analyzing CV', icon: <Brain style={{ width: 20, height: 20 }} />, color: colors.amber },
    scoring: { label: 'Calculating Score', icon: <Cpu style={{ width: 20, height: 20 }} />, color: colors.emerald },
    complete: { label: 'Complete', icon: <CheckCircle style={{ width: 20, height: 20 }} />, color: colors.emerald },
  };

  // Styles
  const pageStyle: CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: colors.void,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  };

  const bgEffectStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    opacity: 0.5,
    background: `
      radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0, 240, 255, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse 60% 50% at 30% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
    `,
  };

  const containerStyle: CSSProperties = {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '560px',
    margin: '0 auto',
  };

  const cardStyle: CSSProperties = {
    backgroundColor: 'rgba(26, 26, 36, 0.6)',
    border: '1px solid rgba(0, 240, 255, 0.2)',
    borderRadius: radius['2xl'],
    padding: spacing[8],
    boxShadow: '0 0 40px rgba(0, 240, 255, 0.1)',
    textAlign: 'center',
  };

  const logoContainerStyle: CSSProperties = {
    position: 'relative',
    width: '96px',
    height: '96px',
    margin: '0 auto',
    marginBottom: spacing[8],
  };

  const progressContainerStyle: CSSProperties = {
    height: '12px',
    backgroundColor: colors.graphite,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing[4],
  };

  const statsGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing[4],
  };

  const statBoxStyle: CSSProperties = {
    padding: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(26, 26, 36, 0.5)',
  };

  const promptPreviewStyle: CSSProperties = {
    padding: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: colors.obsidian,
    border: `1px solid ${colors.steel}`,
    fontSize: fontSizes.sm,
    color: colors.silver,
    fontFamily: fonts.mono,
    overflow: 'auto',
    maxHeight: '300px',
    textAlign: 'left',
    position: 'relative',
  };

  // Pre-generate particle positions
  const particlePositions = useMemo(() =>
    Array.from({ length: 10 }).map((_, i) => ({
      x: (i * 137.5) % 100,
      y: (i * 61.8) % 100,
      duration: 3 + (i * 0.2),
      delay: i * 0.2
    })), []);

  // Generate the screening prompt (for manual use)
  const generatedPrompt = useMemo(() => {
    if (!currentJob) return '';

    return `You are screening CVs for: ${currentJob.title} at ${currentJob.company}

JOB DESCRIPTION:
${currentJob.rawText}

CANDIDATE CV:
{{CV_CONTENT}}

---

Please review this CV and give me a simple report:

1. RECOMMENDATION (pick one):
   INTERVIEW - Great match, schedule interview
   MAYBE - Could work, review further
   PASS - Not a good fit

2. SCORE: __/100

3. QUICK SUMMARY (2-3 sentences):
   Why should we interview or pass on this candidate?

4. WHAT THEY HAVE:
   - List matching skills and experience

5. WHAT'S MISSING:
   - List required things they don't have

6. CONCERNS:
   - Any red flags? (job gaps, job hopping, etc.)

7. INTERVIEW QUESTIONS:
   - 2-3 questions to ask if we interview them

Keep it simple and easy to read. No technical jargon.`;
  }, [currentJob]);

  // Check if backend is available and fetch models
  useEffect(() => {
    const init = async () => {
      const healthy = await api.checkHealth();
      setBackendAvailable(healthy);

      if (healthy) {
        // Fetch available models
        const modelsResponse = await api.getModels();
        if (modelsResponse?.models) {
          setModels(modelsResponse.models);
          // Set default to first recommended model
          const recommended = modelsResponse.models.find(m => m.recommended);
          if (recommended) {
            setSelectedModel(recommended.id);
          }
        }
        setModelsLoading(false);
        setShowModelSelector(true); // Show model selector before processing
      }
    };
    init();
  }, []);

  // Process CVs with AI - Enterprise-grade with stage tracking
  const processWithAI = useCallback(async () => {
    if (!currentJob || uploadedCVs.length === 0) return;

    setError(null);
    setCompletedCount(0);
    setStageStartTime(Date.now());
    updateSession({ status: 'processing' });

    const candidates: Candidate[] = [];

    try {
      for (let i = 0; i < uploadedCVs.length; i++) {
        const file = uploadedCVs[i];
        setCurrentIndex(i);
        updateSession({
          progress: Math.round((i / uploadedCVs.length) * 100),
          currentCandidate: file.name
        });

        try {
          // STAGE 1: Reading document
          setProcessingStage('reading');
          setStageStartTime(Date.now());
          const cvContent = await readFileAsText(file);

          // STAGE 2: Validating content
          setProcessingStage('validating');
          setStageStartTime(Date.now());

          // CHECK FOR PARSE ERROR - Don't send garbage to AI
          if (cvContent.startsWith('[PARSE_ERROR]')) {
            console.error(`Document parsing failed for ${file.name}`);
            candidates.push({
              id: generateId(),
              name: file.name.replace(/\.(pdf|doc|docx|txt)$/i, '').replace(/[-_]/g, ' '),
              fileName: file.name,
              rawText: cvContent,
              score: 0,
              confidence: 0,
              recommendation: 'pass',
              summary: `⚠️ DOCUMENT PARSING FAILED - ${cvContent.replace('[PARSE_ERROR] ', '')}`,
              matchedSkills: [],
              missingSkills: [],
              concerns: ['Document could not be parsed - please paste content manually or use a different file format'],
              interviewQuestions: [],
              experience: 0,
              processedAt: new Date()
            });
            continue; // Skip AI processing for this file
          }

          // Validate content quality
          const validation = api.validateExtractedContent(cvContent, file.name);
          if (!validation.valid) {
            console.error(`Content validation failed for ${file.name}: ${validation.reason}`);
            candidates.push({
              id: generateId(),
              name: file.name.replace(/\.(pdf|doc|docx|txt)$/i, '').replace(/[-_]/g, ' '),
              fileName: file.name,
              rawText: cvContent,
              score: 0,
              confidence: 0,
              recommendation: 'pass',
              summary: `⚠️ INSUFFICIENT CONTENT - ${validation.reason}`,
              matchedSkills: [],
              missingSkills: [],
              concerns: [validation.reason || 'Content validation failed'],
              interviewQuestions: [],
              experience: 0,
              processedAt: new Date()
            });
            setCompletedCount(prev => prev + 1);
            continue; // Skip AI processing
          }

          // STAGE 3: AI Analysis (the main processing stage)
          setProcessingStage('analyzing');
          setStageStartTime(Date.now());

          // Call backend API with selected model
          const response = await api.screenCandidate(
            currentJob.rawText,
            cvContent,
            selectedModel
          );

          // STAGE 4: Scoring and finalizing
          setProcessingStage('scoring');
          setStageStartTime(Date.now());

          const result = response.result;

          // Check if AI returned a parse error indicator
          const hasWarning = validation.warning;

          const candidate: Candidate = {
            id: generateId(),
            name: file.name.replace(/\.(pdf|doc|docx|txt)$/i, '').replace(/[-_]/g, ' '),
            fileName: file.name,
            rawText: cvContent,
            score: result.score,
            confidence: result.confidence,
            recommendation: result.recommendation,
            summary: hasWarning ? `⚠️ ${validation.warning}\n\n${result.summary}` : result.summary,
            scoreBreakdown: result.scoreBreakdown,
            matchedSkills: result.matchedSkills || [],
            missingSkills: result.missingSkills || [],
            partialMatches: result.partialMatches || [],
            concerns: hasWarning
              ? [...(result.concerns || []), validation.warning!]
              : (result.concerns || []),
            strengths: result.strengths || [],
            interviewQuestions: result.interviewQuestions || [],
            experience: result.experienceYears || 0,
            skillMatchPercent: result.skillMatchPercent,
            educationMatch: result.educationMatch,
            processedAt: new Date()
          };

          candidates.push(candidate);
          setCompletedCount(prev => prev + 1);
          setProcessingStage('complete');
        } catch (err) {
          // If one file fails, continue with others
          console.error(`Failed to process ${file.name}:`, err);
          setCompletedCount(prev => prev + 1);
          candidates.push({
            id: generateId(),
            name: file.name.replace(/\.(pdf|doc|docx|txt)$/i, '').replace(/[-_]/g, ' '),
            fileName: file.name,
            rawText: '',
            score: 0,
            confidence: 0,
            recommendation: 'pass',
            summary: `⚠️ PROCESSING ERROR - ${(err as Error).message}`,
            matchedSkills: [],
            missingSkills: [],
            concerns: ['Processing failed - ' + (err as Error).message],
            interviewQuestions: [],
            experience: 0,
            processedAt: new Date()
          });
        }
      }

      updateSession({
        status: 'completed',
        progress: 100,
        candidates,
        completedAt: new Date()
      });

      setScreen('results');
    } catch (err) {
      setError((err as Error).message);
      updateSession({ status: 'error' });
    }
  }, [currentJob, uploadedCVs, updateSession, setScreen, selectedModel]);

  // Start screening when user clicks the start button
  const handleStartScreening = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setShowModelSelector(false);
    processWithAI();
  }, [processWithAI]);

  // Copy prompt to clipboard
  const copyPrompt = useCallback(() => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedPrompt]);

  // Retry connection
  const retryConnection = useCallback(async () => {
    setBackendAvailable(null);
    setModelsLoading(true);

    const healthy = await api.checkHealth();
    setBackendAvailable(healthy);

    if (healthy) {
      const modelsResponse = await api.getModels();
      if (modelsResponse?.models) {
        setModels(modelsResponse.models);
        const recommended = modelsResponse.models.find(m => m.recommended);
        if (recommended) {
          setSelectedModel(recommended.id);
        }
      }
      setModelsLoading(false);
      setShowModelSelector(true);
    }
  }, []);

  const progress = currentSession?.progress || 0;

  return (
    <div style={pageStyle}>
      <div style={bgEffectStyle} />

      {/* Animated particles */}
      {particlePositions.map((pos, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 240, 255, 0.3)',
            left: `${pos.x}%`,
            top: `${pos.y}%`,
          }}
          animate={{
            y: [0, -100],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: pos.duration,
            repeat: Infinity,
            delay: pos.delay
          }}
        />
      ))}

      <div style={containerStyle}>
        <AnimatePresence mode="wait">
          {/* Model Selection Screen */}
          {backendAvailable && showModelSelector && currentSession?.status !== 'processing' && (
            <motion.div
              key="model-selector"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ ...cardStyle, maxWidth: '640px' }}
            >
              {/* Header */}
              <div style={{ marginBottom: spacing[8] }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: radius.xl,
                  background: `linear-gradient(135deg, ${colors.cyan}, ${colors.violet})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  marginBottom: spacing[4],
                }}>
                  <Brain style={{ width: 40, height: 40, color: colors.void }} />
                </div>
                <h2 style={{ fontFamily: fonts.display, fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.snow, marginBottom: spacing[2] }}>
                  Choose AI Model
                </h2>
                <p style={{ color: colors.silver, fontSize: fontSizes.base }}>
                  Select which AI model to use for screening {uploadedCVs.length} CVs
                </p>
              </div>

              {/* Model Selector Dropdown */}
              <div style={{ marginBottom: spacing[6], position: 'relative' }}>
                <label style={{ display: 'block', fontSize: fontSizes.sm, color: colors.silver, marginBottom: spacing[2], textAlign: 'left' }}>
                  AI Model
                </label>
                <button
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: `${spacing[4]} ${spacing[4]}`,
                    backgroundColor: colors.obsidian,
                    border: `1px solid ${modelDropdownOpen ? colors.cyan : colors.steel}`,
                    borderRadius: radius.lg,
                    color: colors.snow,
                    fontSize: fontSizes.base,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <Sparkles style={{ width: 18, height: 18, color: colors.cyan }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: fontWeights.medium }}>
                        {models.find(m => m.id === selectedModel)?.name || selectedModel}
                      </div>
                      <div style={{ fontSize: fontSizes.xs, color: colors.silver }}>
                        {models.find(m => m.id === selectedModel)?.category || 'AI Provider'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown style={{
                    width: 20,
                    height: 20,
                    color: colors.silver,
                    transform: modelDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }} />
                </button>

                {/* Dropdown Menu */}
                {modelDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: spacing[2],
                      backgroundColor: colors.obsidian,
                      border: `1px solid ${colors.steel}`,
                      borderRadius: radius.lg,
                      maxHeight: '320px',
                      overflowY: 'auto',
                      zIndex: 50,
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {/* Recommended Models */}
                    {models.filter(m => m.recommended).length > 0 && (
                      <>
                        <div style={{ padding: `${spacing[2]} ${spacing[4]}`, fontSize: fontSizes.xs, color: colors.silver, backgroundColor: 'rgba(0, 240, 255, 0.05)', fontWeight: fontWeights.semibold }}>
                          ⭐ RECOMMENDED
                        </div>
                        {models.filter(m => m.recommended).map(model => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setModelDropdownOpen(false);
                            }}
                            style={{
                              width: '100%',
                              padding: `${spacing[3]} ${spacing[4]}`,
                              backgroundColor: selectedModel === model.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                              border: 'none',
                              borderBottom: `1px solid ${colors.graphite}`,
                              color: colors.snow,
                              fontSize: fontSizes.sm,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              textAlign: 'left',
                              transition: 'background 0.15s',
                            }}
                            onMouseOver={(e) => { if (selectedModel !== model.id) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)' }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = selectedModel === model.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent' }}
                          >
                            <div>
                              <div style={{ fontWeight: fontWeights.medium }}>{model.name}</div>
                              <div style={{ fontSize: fontSizes.xs, color: colors.silver }}>{model.category}</div>
                            </div>
                            {selectedModel === model.id && (
                              <CheckCircle style={{ width: 16, height: 16, color: colors.cyan }} />
                            )}
                          </button>
                        ))}
                      </>
                    )}

                    {/* All Models by Category */}
                    {['Anthropic', 'OpenAI', 'Google', 'Meta', 'Mistral', 'Other'].map(category => {
                      const categoryModels = models.filter(m => m.category === category && !m.recommended);
                      if (categoryModels.length === 0) return null;
                      return (
                        <div key={category}>
                          <div style={{ padding: `${spacing[2]} ${spacing[4]}`, fontSize: fontSizes.xs, color: colors.silver, backgroundColor: 'rgba(255, 255, 255, 0.02)', fontWeight: fontWeights.semibold }}>
                            {category.toUpperCase()}
                          </div>
                          {categoryModels.slice(0, 5).map(model => (
                            <button
                              key={model.id}
                              onClick={() => {
                                setSelectedModel(model.id);
                                setModelDropdownOpen(false);
                              }}
                              style={{
                                width: '100%',
                                padding: `${spacing[3]} ${spacing[4]}`,
                                backgroundColor: selectedModel === model.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                                border: 'none',
                                borderBottom: `1px solid ${colors.graphite}`,
                                color: colors.snow,
                                fontSize: fontSizes.sm,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                textAlign: 'left',
                                transition: 'background 0.15s',
                              }}
                              onMouseOver={(e) => { if (selectedModel !== model.id) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)' }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = selectedModel === model.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent' }}
                            >
                              <div>
                                <div style={{ fontWeight: fontWeights.medium }}>{model.name}</div>
                              </div>
                              {selectedModel === model.id && (
                                <CheckCircle style={{ width: 16, height: 16, color: colors.cyan }} />
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </div>

              {/* Info Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing[4], marginBottom: spacing[6] }}>
                <div style={{
                  padding: spacing[4],
                  borderRadius: radius.lg,
                  backgroundColor: 'rgba(26, 26, 36, 0.5)',
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: fontSizes.xs, color: colors.silver, marginBottom: spacing[1] }}>CVs to Screen</div>
                  <div style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.snow }}>{uploadedCVs.length}</div>
                </div>
                <div style={{
                  padding: spacing[4],
                  borderRadius: radius.lg,
                  backgroundColor: 'rgba(26, 26, 36, 0.5)',
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: fontSizes.xs, color: colors.silver, marginBottom: spacing[1] }}>Est. Time</div>
                  <div style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.snow }}>~{Math.ceil(uploadedCVs.length * 5)}s</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: spacing[4] }}>
                <Button
                  variant="secondary"
                  onClick={() => setScreen('upload')}
                  style={{ flex: 1 }}
                >
                  Go Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleStartScreening}
                  icon={<Zap style={{ width: 18, height: 18 }} />}
                  style={{ flex: 2 }}
                  disabled={modelsLoading}
                >
                  Start AI Screening
                </Button>
              </div>
            </motion.div>
          )}

          {/* Processing State - Enterprise-Grade Progress UI */}
          {currentSession?.status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ ...cardStyle, maxWidth: '640px' }}
            >
              {/* Live Processing Indicator */}
              <div style={{ marginBottom: spacing[6] }}>
                <motion.div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: radius.xl,
                    background: `linear-gradient(135deg, ${stageInfo[processingStage].color}, ${colors.violet})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    position: 'relative',
                  }}
                >
                  {/* Pulse ring animation */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: -8,
                      borderRadius: radius.xl,
                      border: `2px solid ${stageInfo[processingStage].color}`,
                    }}
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeOut'
                    }}
                  />
                  <motion.div
                    animate={{ rotate: processingStage === 'analyzing' ? 360 : 0 }}
                    transition={{ duration: 2, repeat: processingStage === 'analyzing' ? Infinity : 0, ease: 'linear' }}
                  >
                    {stageInfo[processingStage].icon}
                  </motion.div>
                </motion.div>
              </div>

              {/* Current Stage Label */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing[2],
                padding: `${spacing[2]} ${spacing[4]}`,
                backgroundColor: `${stageInfo[processingStage].color}20`,
                border: `1px solid ${stageInfo[processingStage].color}40`,
                borderRadius: radius.full,
                marginBottom: spacing[4],
              }}>
                <motion.div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: stageInfo[processingStage].color,
                  }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span style={{ color: stageInfo[processingStage].color, fontSize: fontSizes.sm, fontWeight: fontWeights.semibold }}>
                  {stageInfo[processingStage].label}
                </span>
                <span style={{ color: colors.silver, fontSize: fontSizes.xs, fontFamily: fonts.mono }}>
                  {elapsedTime}s
                </span>
              </div>

              <h2 style={{ fontFamily: fonts.display, fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.snow, marginBottom: spacing[2] }}>
                Screening CV {currentIndex + 1} of {uploadedCVs.length}
              </h2>
              <p style={{ color: colors.silver, fontSize: fontSizes.base, marginBottom: spacing[6], maxWidth: '320px', margin: '0 auto' }}>
                <span style={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: spacing[6]
                }}>
                  {currentSession.currentCandidate || 'Processing...'}
                </span>
              </p>

              {/* Progress Bar with Segments */}
              <div style={{ marginBottom: spacing[4] }}>
                <div style={progressContainerStyle}>
                  <motion.div
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${colors.emerald}, ${colors.cyan}, ${colors.violet})`,
                      borderRadius: radius.full,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing[2], fontSize: fontSizes.xs }}>
                  <span style={{ color: colors.silver }}>
                    <Clock style={{ width: 12, height: 12, display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    {completedCount} completed
                  </span>
                  <span style={{ color: colors.cyan, fontFamily: fonts.mono, fontWeight: fontWeights.bold }}>
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Stage Pipeline Visualization */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: spacing[4],
                backgroundColor: 'rgba(26, 26, 36, 0.5)',
                borderRadius: radius.lg,
                marginBottom: spacing[6],
              }}>
                {(['reading', 'validating', 'analyzing', 'scoring'] as ProcessingStage[]).map((stage, idx) => (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <motion.div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: processingStage === stage
                          ? stageInfo[stage].color
                          : (['reading', 'validating', 'analyzing', 'scoring'].indexOf(processingStage) > idx
                            ? colors.emerald
                            : colors.graphite),
                        transition: 'background-color 0.3s',
                      }}
                      animate={processingStage === stage ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: processingStage === stage ? Infinity : 0 }}
                    >
                      {(['reading', 'validating', 'analyzing', 'scoring'].indexOf(processingStage) > idx) ? (
                        <CheckCircle style={{ width: 14, height: 14, color: colors.void }} />
                      ) : (
                        <span style={{ fontSize: fontSizes.xs, color: colors.void, fontWeight: fontWeights.bold }}>
                          {idx + 1}
                        </span>
                      )}
                    </motion.div>
                    {idx < 3 && (
                      <div style={{
                        width: 20,
                        height: 2,
                        backgroundColor: (['reading', 'validating', 'analyzing', 'scoring'].indexOf(processingStage) > idx)
                          ? colors.emerald
                          : colors.graphite,
                        transition: 'background-color 0.3s',
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Stats Grid */}
              <div style={statsGridStyle}>
                <div style={statBoxStyle}>
                  <div style={{ fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.emerald, fontFamily: fonts.display }}>
                    {completedCount}
                  </div>
                  <div style={{ fontSize: fontSizes.xs, color: colors.silver }}>Done</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={{ fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.amber, fontFamily: fonts.display }}>
                    {uploadedCVs.length - completedCount}
                  </div>
                  <div style={{ fontSize: fontSizes.xs, color: colors.silver }}>Remaining</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={{ fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.cyan, fontFamily: fonts.display }}>
                    ~{Math.max(1, Math.ceil((uploadedCVs.length - completedCount) * 4))}s
                  </div>
                  <div style={{ fontSize: fontSizes.xs, color: colors.silver }}>Est. Time</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={cardStyle}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: radius.xl,
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing[4],
              }}>
                <AlertTriangle style={{ width: 32, height: 32, color: colors.coral }} />
              </div>
              <h2 style={{ fontFamily: fonts.display, fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.snow, marginBottom: spacing[2] }}>
                Screening Failed
              </h2>
              <p style={{ color: colors.coral, fontSize: fontSizes.sm, marginBottom: spacing[6] }}>
                {error}
              </p>
              <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'center' }}>
                <Button variant="secondary" onClick={() => setScreen('upload')}>
                  Go Back
                </Button>
                <Button onClick={retryConnection} icon={<RefreshCw style={{ width: 16, height: 16 }} />}>
                  Retry
                </Button>
              </div>
            </motion.div>
          )}

          {/* Backend Not Available - Show Manual Prompt */}
          {backendAvailable === false && !error && currentSession?.status !== 'processing' && (
            <motion.div
              key="no-backend"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={cardStyle}
            >
              <div style={{ marginBottom: spacing[8] }}>
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
                  <FileText style={{ width: 32, height: 32, color: colors.cyan }} />
                </div>
                <h2 style={{ fontFamily: fonts.display, fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.snow, marginBottom: spacing[2] }}>
                  Ready to Screen
                </h2>
                <p style={{ color: colors.silver, fontSize: fontSizes.base }}>
                  Copy the prompt below to use with your preferred AI assistant
                </p>
              </div>

              {/* Server Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[2],
                padding: spacing[3],
                backgroundColor: 'rgba(255, 170, 0, 0.1)',
                borderRadius: radius.lg,
                marginBottom: spacing[4],
              }}>
                <Server style={{ width: 16, height: 16, color: colors.amber }} />
                <span style={{ fontSize: fontSizes.sm, color: colors.amber }}>
                  AI server offline - using manual mode
                </span>
                <button
                  onClick={retryConnection}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.amber,
                    cursor: 'pointer',
                    padding: spacing[1],
                  }}
                >
                  <RefreshCw style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* Prompt Preview */}
              <div style={{ position: 'relative', marginBottom: spacing[6] }}>
                <pre style={promptPreviewStyle}>
                  {generatedPrompt.substring(0, 500)}...
                </pre>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(10, 10, 15, 1) 0%, transparent 100%)',
                  pointerEvents: 'none',
                  borderRadius: radius.lg,
                }} />
              </div>

              <div style={{ marginBottom: spacing[6] }}>
                <Button
                  variant="primary"
                  fullWidth
                  icon={copied ? <CheckCircle style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
                  onClick={copyPrompt}
                >
                  {copied ? 'Copied!' : 'Copy Full Prompt'}
                </Button>
              </div>

              <div style={{ paddingTop: spacing[6], borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <p style={{ fontSize: fontSizes.sm, color: colors.silver, marginBottom: spacing[4] }}>
                  Start the AI server for automatic screening:
                  <code style={{ display: 'block', marginTop: spacing[2], padding: spacing[2], backgroundColor: colors.obsidian, borderRadius: radius.md, fontFamily: fonts.mono, fontSize: fontSizes.xs }}>
                    bun run dev
                  </code>
                </p>
                <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'center' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScreen('results')}
                  >
                    View Demo Results
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading/Checking State */}
          {backendAvailable === null && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={cardStyle}
            >
              <div style={logoContainerStyle}>
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: '16px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.cyan}, ${colors.violet})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap style={{ width: 32, height: 32, color: colors.void }} />
                </motion.div>
              </div>
              <h2 style={{ fontFamily: fonts.display, fontSize: fontSizes.xl, fontWeight: fontWeights.semibold, color: colors.snow }}>
                Connecting to AI Server...
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
