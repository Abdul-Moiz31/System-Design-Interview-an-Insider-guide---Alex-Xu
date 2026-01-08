import React, { useState } from 'react';
import type { UrlHistory } from '../App';

interface UrlShortenerSectionProps {
  canCreateUrl: boolean;
  guestUrlCount: number;
  onAddUrl: (url: UrlHistory) => void;
  onNavigateToSignup: () => void;
}

const API_BASE = '/api';

const UrlShortenerSection: React.FC<UrlShortenerSectionProps> = ({
  canCreateUrl,
  guestUrlCount,
  onAddUrl,
  onNavigateToSignup,
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFromClipboard, setAutoFromClipboard] = useState(true);

  const handleShorten = async () => {
    if (!canCreateUrl) {
      return;
    }

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Rate limit exceeded. Try again in ${data.retryAfter} seconds.`);
        } else {
          setError(data.message || 'Failed to shorten URL');
        }
        return;
      }

      const newUrl: UrlHistory = {
        id: Date.now().toString(),
        shortCode: data.shortCode,
        shortUrl: data.shortUrl,
        originalUrl: data.originalUrl,
        createdAt: new Date().toISOString(),
      };

      onAddUrl(newUrl);
      setUrl('');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputWrapper}>
        <div style={styles.inputIcon}>
          <LinkIcon />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleShorten()}
          placeholder="Enter the link here"
          style={styles.input}
          disabled={loading || !canCreateUrl}
        />
        <button
          onClick={handleShorten}
          disabled={loading || !canCreateUrl || !url.trim()}
          style={{
            ...styles.shortenBtn,
            ...(loading || !canCreateUrl || !url.trim() ? styles.shortenBtnDisabled : {}),
          }}
        >
          {loading ? 'Shortening...' : 'Shorten Now!'}
        </button>
      </div>

      <div style={styles.options}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={autoFromClipboard}
            onChange={(e) => setAutoFromClipboard(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={styles.checkboxText}>Auto Paste from Clipboard</span>
        </label>
      </div>

      {error && (
        <div style={styles.errorBox} className="scale-in">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}

      {!canCreateUrl && (
        <div style={styles.limitBox} className="scale-in">
          <InfoIcon />
          <div style={styles.limitContent}>
            <p style={styles.limitTitle}>Free limit reached!</p>
            <p style={styles.limitDesc}>
              Sign up to create unlimited short URLs and access advanced features.
            </p>
            <button onClick={onNavigateToSignup} className="btn btn-primary" style={styles.signupBtn}>
              Register Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Icons
function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: '0.5rem 0.5rem 0.5rem 1.25rem',
    transition: 'all var(--transition-base)',
  },
  inputIcon: {
    color: 'var(--color-text-subtle)',
    display: 'flex',
    alignItems: 'center',
    marginRight: '0.75rem',
  },
  input: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: 'var(--color-text)',
    fontSize: '1rem',
    outline: 'none',
    padding: '0.5rem 0',
  },
  shortenBtn: {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    padding: '0.875rem 2rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    whiteSpace: 'nowrap',
  },
  shortenBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  options: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  checkboxText: {},
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    background: 'var(--color-error-bg)',
    border: '1px solid var(--color-error)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--color-error)',
    fontSize: '0.9375rem',
  },
  limitBox: {
    display: 'flex',
    gap: '1rem',
    padding: '1.5rem',
    background: 'var(--color-warning-bg)',
    border: '1px solid var(--color-warning)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--color-warning)',
  },
  limitContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  limitTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  limitDesc: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
  },
  signupBtn: {
    alignSelf: 'flex-start',
  },
};

export default UrlShortenerSection;

