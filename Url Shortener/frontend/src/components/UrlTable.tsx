import React, { useState, useEffect } from 'react';
import type { UrlHistory } from '../App';

interface UrlTableProps {
  urlHistory: UrlHistory[];
  onDeleteUrl: (id: string) => void;
  onClearHistory: () => void;
}

interface UrlStats {
  clickCount: number;
}

const API_BASE = '/api';

const UrlTable: React.FC<UrlTableProps> = ({
  urlHistory,
  onDeleteUrl,
  onClearHistory,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ shortCode: string; qrCode: string } | null>(null);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [loadingQr, setLoadingQr] = useState(false);

  // Fetch click counts for all URLs
  useEffect(() => {
    const fetchClickCounts = async () => {
      const counts: Record<string, number> = {};
      
      for (const url of urlHistory) {
        try {
          const response = await fetch(`${API_BASE}/stats/${url.shortCode}`);
          if (response.ok) {
            const data: UrlStats = await response.json();
            counts[url.shortCode] = data.clickCount;
          }
        } catch {
          counts[url.shortCode] = 0;
        }
      }
      
      setClickCounts(counts);
    };

    if (urlHistory.length > 0) {
      fetchClickCounts();
      
      // Refresh click counts every 5 seconds
      const interval = setInterval(fetchClickCounts, 5000);
      return () => clearInterval(interval);
    }
  }, [urlHistory]);

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

  const handleShowQr = async (shortCode: string) => {
    setLoadingQr(true);
    try {
      const response = await fetch(`${API_BASE}/qr/${shortCode}`);
      if (response.ok) {
        const data = await response.json();
        setQrModal({ shortCode, qrCode: data.qrCode });
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setLoadingQr(false);
    }
  };

  const downloadQr = () => {
    if (!qrModal) return;
    
    const link = document.createElement('a');
    link.href = qrModal.qrCode;
    link.download = `qr-${qrModal.shortCode}.png`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPlatformIcon = (url: string) => {
    if (url.includes('twitter.com') || url.includes('x.com')) return <TwitterIcon />;
    if (url.includes('youtube.com')) return <YoutubeIcon />;
    if (url.includes('github.com')) return <GithubIcon />;
    if (url.includes('linkedin.com')) return <LinkedInIcon />;
    return <LinkIcon />;
  };

  return (
    <>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            <span style={styles.count}>{urlHistory.length}</span> Links Created
          </h2>
          {urlHistory.length > 0 && (
            <button onClick={onClearHistory} style={styles.clearBtn}>
              <TrashIcon />
              Clear All
            </button>
          )}
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>SHORT LINK</th>
                <th style={styles.th}>ORIGINAL LINK</th>
                <th style={styles.th}>QR CODE</th>
                <th style={styles.th}>CLICKS</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>DATE</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {urlHistory.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    ...styles.tr,
                    animationDelay: `${index * 0.05}s`,
                  }}
                  className="slide-up"
                >
                  {/* Short Link */}
                  <td style={styles.td}>
                    <div style={styles.shortLinkCell}>
                      <div style={styles.platformIcon}>
                        {getPlatformIcon(item.originalUrl)}
                      </div>
                      <div style={styles.linkInfo}>
                        <a
                          href={item.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.shortLink}
                        >
                          {item.shortCode}
                        </a>
                        <button
                          onClick={() => handleCopy(item.shortUrl, item.id)}
                          style={styles.copyBtn}
                          title="Copy"
                        >
                          {copied === item.id ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Original Link */}
                  <td style={styles.td}>
                    <a
                      href={item.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.originalLink}
                      title={item.originalUrl}
                    >
                      {item.originalUrl.length > 50
                        ? item.originalUrl.substring(0, 47) + '...'
                        : item.originalUrl}
                    </a>
                  </td>

                  {/* QR Code */}
                  <td style={styles.td}>
                    <button
                      onClick={() => handleShowQr(item.shortCode)}
                      style={styles.qrCode}
                      disabled={loadingQr}
                      title="View QR Code"
                    >
                      {loadingQr ? <div className="spinner" /> : <QRIcon />}
                    </button>
                  </td>

                  {/* Clicks */}
                  <td style={styles.td}>
                    <span style={styles.clicks}>
                      {clickCounts[item.shortCode] ?? 0}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={styles.td}>
                    <span style={styles.statusBadge}>
                      <span style={styles.statusDot}></span>
                      Active
                    </span>
                  </td>

                  {/* Date */}
                  <td style={styles.td}>
                    <span style={styles.date}>{formatDate(item.createdAt)}</span>
                  </td>

                  {/* Actions */}
                  <td style={styles.td}>
                    <button
                      onClick={() => onDeleteUrl(item.id)}
                      style={styles.deleteBtn}
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModal && (
        <div style={styles.modalOverlay} onClick={() => setQrModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>QR Code</h3>
              <button onClick={() => setQrModal(null)} style={styles.closeBtn}>
                <CloseIcon />
              </button>
            </div>
            <div style={styles.modalBody}>
              <img src={qrModal.qrCode} alt="QR Code" style={styles.qrImage} />
              <p style={styles.qrCodeLabel}>Scan to visit: {qrModal.shortCode}</p>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={downloadQr} className="btn btn-primary">
                <DownloadIcon />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Icons
function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#000"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function QRIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    animation: 'fadeIn 0.5s ease forwards',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  count: {
    color: 'var(--color-text-muted)',
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--color-error)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
  },
  tableWrapper: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    overflow: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
  },
  th: {
    padding: '1rem 1.5rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-subtle)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
  },
  tr: {
    borderBottom: '1px solid var(--color-border)',
    transition: 'background var(--transition-base)',
    opacity: 0,
  },
  td: {
    padding: '1rem 1.5rem',
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
  },
  shortLinkCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  platformIcon: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-primary)',
    flexShrink: 0,
  },
  linkInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  shortLink: {
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color var(--transition-base)',
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-subtle)',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    transition: 'color var(--transition-base)',
  },
  originalLink: {
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
    transition: 'color var(--transition-base)',
  },
  qrCode: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-subtle)',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
  },
  clicks: {
    fontWeight: 500,
    color: 'var(--color-text)',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--color-success)',
  },
  date: {
    color: 'var(--color-text-muted)',
    fontSize: '0.875rem',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-subtle)',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    transition: 'color var(--transition-base)',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    maxWidth: '400px',
    width: '90%',
    animation: 'scaleIn 0.3s ease',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.5rem',
    borderBottom: '1px solid var(--color-border)',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    transition: 'color var(--transition-base)',
  },
  modalBody: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  qrImage: {
    width: '250px',
    height: '250px',
    borderRadius: 'var(--radius-lg)',
  },
  qrCodeLabel: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
  modalFooter: {
    padding: '1.5rem',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'center',
  },
};

export default UrlTable;
