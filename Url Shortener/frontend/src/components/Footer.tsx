import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.container}>
        <div style={styles.content}>
          {/* Brand Section */}
          <div style={styles.brand}>
            <div style={styles.logoSection}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span style={styles.brandName}>LinkShort</span>
            </div>
            <p style={styles.tagline}>
              Professional URL shortener with analytics and management
            </p>
          </div>

          {/* Links Section */}
          <div style={styles.linksGrid}>
            <div style={styles.linkColumn}>
              <h4 style={styles.linkTitle}>PRODUCT</h4>
              <ul style={styles.linkList}>
                <li><a href="#features" style={styles.link}>Features</a></li>
                <li><a href="#pricing" style={styles.link}>Pricing</a></li>
                <li><a href="#api" style={styles.link}>API</a></li>
              </ul>
            </div>

            <div style={styles.linkColumn}>
              <h4 style={styles.linkTitle}>RESOURCES</h4>
              <ul style={styles.linkList}>
                <li><a href="#docs" style={styles.link}>Documentation</a></li>
                <li><a href="#guides" style={styles.link}>Guides</a></li>
                <li><a href="#support" style={styles.link}>Support</a></li>
              </ul>
            </div>

            <div style={styles.linkColumn}>
              <h4 style={styles.linkTitle}>COMPANY</h4>
              <ul style={styles.linkList}>
                <li><a href="#about" style={styles.link}>About</a></li>
                <li><a href="#blog" style={styles.link}>Blog</a></li>
                <li><a href="#contact" style={styles.link}>Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const styles: Record<string, React.CSSProperties> = {
  footer: {
    background: 'var(--color-bg-secondary)',
    borderTop: '1px solid var(--color-border)',
    padding: '3rem 0 2rem',
    marginTop: 'auto',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '4rem',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: 'var(--color-primary)',
  },
  brandName: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-text)',
  },
  tagline: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
    maxWidth: '400px',
    lineHeight: 1.6,
  },
  linksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '3rem',
  },
  linkColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  linkTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.5rem',
  },
  linkList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  link: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
    transition: 'color var(--transition-base)',
  },
};

export default Footer;
