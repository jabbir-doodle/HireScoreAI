import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Key,
  Shield,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Trash2,
  ExternalLink,
  Cpu,
  Server,
  Sparkles
} from 'lucide-react';
import { Button, Input, Select } from '../ui';
import { useStore } from '../../store/useStore';
import { colors, fonts, spacing, radius, fontSizes, fontWeights } from '../../styles/design-system';
import type { AIProvider } from '../../types';
import type { CSSProperties } from 'react';

const AI_PROVIDERS: { value: AIProvider; label: string; models: string[]; docsUrl: string }[] = [
  {
    value: 'anthropic',
    label: 'Anthropic (Claude)',
    models: ['claude-sonnet-4-5-20250514', 'claude-opus-4-5-20250514', 'claude-3-5-sonnet-20241022'],
    docsUrl: 'https://console.anthropic.com/settings/keys'
  },
  {
    value: 'openai',
    label: 'OpenAI (GPT)',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4'],
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  {
    value: 'openrouter',
    label: 'OpenRouter (Recommended)',
    models: [
      'anthropic/claude-sonnet-4-5-20250514',  // Default - Best for CV screening
      'anthropic/claude-opus-4-5-20250514',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-001',
      'deepseek/deepseek-chat-v3-0324'
    ],
    docsUrl: 'https://openrouter.ai/keys'
  },
  {
    value: 'custom',
    label: 'Custom Endpoint',
    models: [],
    docsUrl: ''
  }
];

export function SettingsScreen() {
  const { setScreen, aiConfig, setAIConfig } = useStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const currentProvider = AI_PROVIDERS.find((p) => p.value === aiConfig.provider);
  const hasApiKey = !!aiConfig.apiKey;

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
      radial-gradient(ellipse 50% 40% at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse 60% 50% at 20% 80%, rgba(0, 240, 255, 0.05) 0%, transparent 50%)
    `,
  };

  const containerStyle: CSSProperties = {
    position: 'relative',
    zIndex: 10,
    padding: `${spacing[8]} ${spacing[6]}`,
    maxWidth: '640px',
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

  const subtitleStyle: CSSProperties = {
    fontSize: fontSizes.sm,
    color: colors.silver,
  };

  const cardStyle: CSSProperties = {
    backgroundColor: 'rgba(26, 26, 36, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: radius.xl,
    padding: spacing[6],
    marginBottom: spacing[6],
  };

  const sectionHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[6],
  };

  const iconContainerStyle = (color: string): CSSProperties => ({
    width: '40px',
    height: '40px',
    borderRadius: radius.lg,
    backgroundColor: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  const successBoxStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    marginBottom: spacing[4],
  };

  const warningBoxStyle: CSSProperties = {
    padding: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    border: '1px solid rgba(255, 170, 0, 0.2)',
    marginTop: spacing[4],
  };

  const securityItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[4],
  };

  const handleSaveApiKey = () => {
    if (tempApiKey) {
      setAIConfig({ apiKey: tempApiKey });
      setTempApiKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClearApiKey = () => {
    setAIConfig({ apiKey: '', encrypted: false });
  };

  const handleProviderChange = (provider: string) => {
    const p = provider as AIProvider;
    const providerConfig = AI_PROVIDERS.find((x) => x.value === p);
    setAIConfig({
      provider: p,
      model: providerConfig?.models[0] || ''
    });
  };

  const securityItems = [
    {
      icon: Shield,
      title: 'Browser-Only Storage',
      description: 'All data stays in your browser. Nothing is sent to our servers.'
    },
    {
      icon: Key,
      title: 'Encrypted API Keys',
      description: 'API keys are encrypted before storage using industry-standard encryption.'
    },
    {
      icon: Trash2,
      title: 'Clear Anytime',
      description: 'Delete all stored data with one click. No data retention.'
    },
    {
      icon: Sparkles,
      title: 'Direct API Calls',
      description: 'AI requests go directly from your browser to the AI provider.'
    }
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
          <div>
            <h1 style={h1Style}>Settings</h1>
            <p style={subtitleStyle}>Configure AI provider and security</p>
          </div>
        </motion.div>

        {/* AI Provider Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={cardStyle}
        >
          <div style={sectionHeaderStyle}>
            <div style={iconContainerStyle(colors.violet)}>
              <Cpu style={{ width: 20, height: 20, color: colors.violet }} />
            </div>
            <div>
              <h2 style={{ fontFamily: fonts.display, fontWeight: fontWeights.semibold, color: colors.snow, fontSize: fontSizes.base, margin: 0 }}>
                AI Provider
              </h2>
              <p style={{ fontSize: fontSizes.sm, color: colors.silver, margin: 0 }}>Choose your AI service</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            <Select
              label="Provider"
              value={aiConfig.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              options={AI_PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
            />

            {aiConfig.provider !== 'custom' && currentProvider && (
              <Select
                label="Model"
                value={aiConfig.model}
                onChange={(e) => setAIConfig({ model: e.target.value })}
                options={currentProvider.models.map((m) => ({ value: m, label: m }))}
              />
            )}

            {aiConfig.provider === 'custom' && (
              <Input
                label="Custom API Endpoint"
                placeholder="https://api.example.com/v1/chat"
                value={aiConfig.baseUrl || ''}
                onChange={(e) => setAIConfig({ baseUrl: e.target.value })}
                icon={<Server style={{ width: 16, height: 16 }} />}
              />
            )}

            {currentProvider?.docsUrl && (
              <a
                href={currentProvider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: spacing[2], fontSize: fontSizes.sm, color: colors.cyan, textDecoration: 'none' }}
              >
                <span>Get API key from {currentProvider.label}</span>
                <ExternalLink style={{ width: 12, height: 12 }} />
              </a>
            )}
          </div>
        </motion.div>

        {/* API Key Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={cardStyle}
        >
          <div style={sectionHeaderStyle}>
            <div style={iconContainerStyle(colors.cyan)}>
              <Key style={{ width: 20, height: 20, color: colors.cyan }} />
            </div>
            <div>
              <h2 style={{ fontFamily: fonts.display, fontWeight: fontWeights.semibold, color: colors.snow, fontSize: fontSizes.base, margin: 0 }}>
                API Key
              </h2>
              <p style={{ fontSize: fontSizes.sm, color: colors.silver, margin: 0 }}>Stored encrypted in your browser</p>
            </div>
          </div>

          {hasApiKey ? (
            <div>
              <div style={successBoxStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                  <Check style={{ width: 20, height: 20, color: colors.emerald }} />
                  <div>
                    <p style={{ fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.emerald, margin: 0 }}>API Key Configured</p>
                    <p style={{ fontSize: fontSizes.xs, color: 'rgba(0, 255, 136, 0.7)', margin: 0 }}>
                      Encrypted and stored locally
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 style={{ width: 16, height: 16 }} />}
                  onClick={handleClearApiKey}
                  style={{ color: colors.coral }}
                >
                  Remove
                </Button>
              </div>

              <p style={{ fontSize: fontSizes.xs, color: colors.silver, margin: 0 }}>
                Your API key is encrypted before storage. It never leaves your browser.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative', marginBottom: spacing[4] }}>
                <Input
                  label="API Key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  icon={<Key style={{ width: 16, height: 16 }} />}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: spacing[4],
                    top: '36px',
                    padding: spacing[1],
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: colors.silver,
                    cursor: 'pointer',
                  }}
                >
                  {showApiKey ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>

              <Button
                onClick={handleSaveApiKey}
                disabled={!tempApiKey}
                icon={saved ? <Check style={{ width: 16, height: 16 }} /> : <Shield style={{ width: 16, height: 16 }} />}
                fullWidth
              >
                {saved ? 'Saved!' : 'Save & Encrypt'}
              </Button>

              <div style={warningBoxStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[3] }}>
                  <AlertCircle style={{ width: 20, height: 20, color: colors.amber, flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.amber, margin: 0 }}>Optional</p>
                    <p style={{ fontSize: fontSizes.xs, color: 'rgba(255, 170, 0, 0.8)', margin: 0, marginTop: spacing[1] }}>
                      Without an API key, HireScore AI will generate prompts for you to use
                      manually with Claude, ChatGPT, or any AI assistant.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Security Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={cardStyle}
        >
          <div style={sectionHeaderStyle}>
            <div style={iconContainerStyle(colors.emerald)}>
              <Shield style={{ width: 20, height: 20, color: colors.emerald }} />
            </div>
            <div>
              <h2 style={{ fontFamily: fonts.display, fontWeight: fontWeights.semibold, color: colors.snow, fontSize: fontSizes.base, margin: 0 }}>
                Security
              </h2>
              <p style={{ fontSize: fontSizes.sm, color: colors.silver, margin: 0 }}>How we protect your data</p>
            </div>
          </div>

          <div>
            {securityItems.map((item, i) => (
              <div key={i} style={securityItemStyle}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: radius.md,
                  backgroundColor: colors.graphite,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <item.icon style={{ width: 16, height: 16, color: colors.emerald }} />
                </div>
                <div style={{ paddingTop: '2px' }}>
                  <p style={{ fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.snow, margin: 0 }}>{item.title}</p>
                  <p style={{ fontSize: fontSizes.xs, color: colors.silver, margin: 0, lineHeight: 1.5 }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: spacing[6], paddingTop: spacing[6], borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Button
              variant="danger"
              fullWidth
              icon={<Trash2 style={{ width: 16, height: 16 }} />}
              onClick={() => {
                if (confirm('Clear all stored data? This cannot be undone.')) {
                  localStorage.removeItem('hirescore-storage');
                  window.location.reload();
                }
              }}
            >
              Clear All Data
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
