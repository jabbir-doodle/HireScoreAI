import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, RefreshCw, AlertCircle } from 'lucide-react';
import { getCredits, type CreditsInfo } from '../../services/api';
import { colors, fonts, fontWeights, radius } from '../../styles/design-system';

export function CreditsDisplay() {
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchCredits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCredits();
      if (response?.success && response.credits) {
        setCredits(response.credits);
      } else {
        setError(response?.error || 'Failed to fetch credits');
      }
    } catch {
      setError('Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
    // Refresh every 5 minutes
    const interval = setInterval(fetchCredits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCredits = (value: number | null): string => {
    if (value === null) return 'Unlimited';
    return `$${value.toFixed(2)}`;
  };

  // Determine color based on remaining credits
  const getStatusColor = (): string => {
    if (!credits || credits.isUnlimited) return colors.emerald;
    if (credits.remaining === null) return colors.emerald;
    if (credits.remaining < 1) return colors.coral;
    if (credits.remaining < 5) return colors.amber;
    return colors.emerald;
  };

  const statusColor = getStatusColor();

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 100,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: radius.lg,
          backgroundColor: 'rgba(26, 26, 36, 0.95)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${statusColor}33`,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <RefreshCw
            style={{
              width: 16,
              height: 16,
              color: colors.silver,
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : error ? (
          <AlertCircle style={{ width: 16, height: 16, color: colors.coral }} />
        ) : (
          <Coins style={{ width: 16, height: 16, color: statusColor }} />
        )}

        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: '13px',
            fontWeight: fontWeights.medium,
            color: error ? colors.coral : colors.snow,
          }}
        >
          {loading
            ? '...'
            : error
            ? 'Error'
            : credits?.isUnlimited
            ? 'Unlimited'
            : formatCredits(credits?.remaining ?? null)}
        </span>
      </motion.div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && credits && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              padding: '16px',
              borderRadius: radius.lg,
              backgroundColor: 'rgba(26, 26, 36, 0.98)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              minWidth: '200px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: fonts.display,
                  fontSize: '14px',
                  fontWeight: fontWeights.semibold,
                  color: colors.snow,
                }}
              >
                OpenRouter Credits
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchCredits();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RefreshCw
                  style={{
                    width: 14,
                    height: 14,
                    color: colors.silver,
                    animation: loading ? 'spin 1s linear infinite' : 'none',
                  }}
                />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: colors.silver }}>Remaining</span>
                <span
                  style={{
                    color: statusColor,
                    fontFamily: fonts.mono,
                    fontWeight: fontWeights.medium,
                  }}
                >
                  {credits.isUnlimited ? 'Unlimited' : formatCredits(credits.remaining)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: colors.silver }}>Used</span>
                <span
                  style={{
                    color: colors.snow,
                    fontFamily: fonts.mono,
                  }}
                >
                  {formatCredits(credits.used)}
                </span>
              </div>

              {!credits.isUnlimited && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: colors.silver }}>Limit</span>
                  <span
                    style={{
                      color: colors.snow,
                      fontFamily: fonts.mono,
                    }}
                  >
                    {formatCredits(credits.limit)}
                  </span>
                </div>
              )}

              {credits.isFreeTier && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    borderRadius: radius.md,
                    backgroundColor: 'rgba(0, 240, 255, 0.1)',
                    fontSize: '11px',
                    color: colors.cyan,
                    textAlign: 'center',
                  }}
                >
                  Free Tier
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
