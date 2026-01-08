import React, { useState } from 'react';
import type { UrlHistory } from '../App';

interface UrlHistorySectionProps {
  urlHistory: UrlHistory[];
  onDeleteUrl: (id: string) => void;
  onClearHistory: () => void;
}

const UrlHistorySection: React.FC<UrlHistorySectionProps> = ({
  urlHistory,
  onDeleteUrl,
  onClearHistory,
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Your Shortened URLs</h2>
          <p style={styles.subtitle}>
            {urlHistory.length} {urlHistory.length === 1 ? 'link' : 'links'} created
          </p>
        </div>
        <button onClick={onClearHistory} className="btn btn-ghost" style={styles.clearBtn}>
          <TrashIcon />
          <span>Clear All</span>
        </button>
      </div>

      <div style={styles.list}>
        {urlHistory.map((item, index) => (
          <div
            key={item.id}
            className="card"
            style={{
              ...styles.historyCard,
              animationDelay: `${index * 0.05}s`,
            }}
          >
            <div style={styles.cardContent}>
              <div style={styles.urlInfo}>
                <div style={styles.shortUrlSection}>
                  <span style={styles.label}>Short URL</span>
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.shortUrl}
                  >
                    {item.shortUrl}
                  </a>
                </div>

                <div style={styles.originalUrlSection}>
                  <span style={styles.label}>Original URL</span>
                  <span style={styles.originalUrl}>{item.originalUrl}</span>
                </div>
              </div>

              <div style={styles.actions}>
                <span style={styles.timestamp}>{formatDate(item.createdAt)}</span>
                <button
                  onClick={() => handleCopy(item.shortUrl, item.id)}
                  className="btn btn-secondary"
                  style={styles.actionBtn}
                  title="Copy to clipboard"
                >
                  {copied === item.id ? <CheckIcon /> : <CopyIcon />}
                </button>
                <button
                  onClick={() => onDeleteUrl(item.id)}
                  className="btn btn-ghost"
                  style={styles.actionBtn}
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Icons
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

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
  },
  clearBtn: {
    color: 'var(--color-error)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  historyCard: {
    padding: '1.5rem',
    animation: 'slideUp 0.3s ease forwards',
    opacity: 0,
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  urlInfo: {
    flex: 1,
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  shortUrlSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  originalUrlSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-subtle)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  shortUrl: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: 'var(--color-primary)',
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  originalUrl: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
    wordBreak: 'break-all',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  timestamp: {
    fontSize: '0.875rem',
    color: 'var(--color-text-subtle)',
    whiteSpace: 'nowrap',
  },
  actionBtn: {
    minWidth: 'auto',
    padding: '0.5rem',
  },
};

export default UrlHistorySection;

