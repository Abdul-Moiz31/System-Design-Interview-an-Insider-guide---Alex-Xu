import React, { useState } from 'react';
import type { UrlHistory } from '../App';

interface UrlShortenerProps {
  canCreateUrl: boolean;
  onAddUrl: (url: UrlHistory) => void;
  onNavigateToSignup: () => void;
}

const API_BASE = '/api';

const UrlShortener: React.FC<UrlShortenerProps> = ({
  canCreateUrl,
  onAddUrl,
  onNavigateToSignup,
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UrlHistory | null>(null);
  const [copied, setCopied] = useState(false);

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
    setResult(null);

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

      setResult(newUrl);
      onAddUrl(newUrl);
      setUrl('');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = result.shortUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCopied(false);
  };

  return (
    <div className="card" style={styles.card}>
      {!result ? (
        <div style={styles.inputSection}>
          <div style={styles.inputWrapper}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleShorten()}
              placeholder="Enter your long URL here..."
              className="input"
              disabled={loading || !canCreateUrl}
              style={styles.input}
            />
            <button
              onClick={handleShorten}
              disabled={loading || !canCreateUrl || !url.trim()}
              className="btn btn-primary"
              style={styles.shortenBtn}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Shortening...</span>
                </>
              ) : (
                <>
                  <ArrowIcon />
                  <span>Shorten URL</span>
                </>
              )}
            </button>
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
                  Sign Up Now
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.resultSection} className="slide-up">
          <div style={styles.resultHeader}>
            <CheckCircleIcon />
            <span style={styles.resultTitle}>URL shortened successfully!</span>
          </div>

          <div style={styles.shortUrlBox}>
            <div style={styles.shortUrlContent}>
              <span style={styles.shortUrlLabel}>Your short URL</span>
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.shortUrl}
              >
                {result.shortUrl}
              </a>
            </div>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={copied ? styles.copiedBtn : {}}
            >
              {copied ? (
                <>
                  <CheckIcon />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div style={styles.originalUrlBox}>
            <span style={styles.originalUrlLabel}>Original URL</span>
            <span style={styles.originalUrl}>{result.originalUrl}</span>
          </div>

          <button onClick={handleReset} className="btn btn-ghost" style={styles.resetBtn}>
            <PlusIcon />
            <span>Shorten Another URL</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Icons
function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
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

function CheckCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2.5rem',
  },
  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  inputWrapper: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: '300px',
    fontSize: '1rem',
  },
  shortenBtn: {
    padding: '0.875rem 2rem',
    fontSize: '1rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
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
  resultSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: 'var(--color-success)',
    fontSize: '1.125rem',
    fontWeight: 600,
  },
  resultTitle: {},
  shortUrlBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    padding: '1.5rem',
    background: 'var(--color-primary-light)',
    border: '2px solid var(--color-primary)',
    borderRadius: 'var(--radius-xl)',
    flexWrap: 'wrap',
  },
  shortUrlContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
    minWidth: 0,
  },
  shortUrlLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-subtle)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  shortUrl: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--color-primary)',
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  copiedBtn: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    borderColor: 'var(--color-success)',
  },
  originalUrlBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 1.25rem',
    background: 'var(--color-bg-secondary)',
    borderRadius: 'var(--radius-lg)',
  },
  originalUrlLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-subtle)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  originalUrl: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
    wordBreak: 'break-all',
  },
  resetBtn: {
    marginTop: '0.5rem',
  },
};

export default UrlShortener;

