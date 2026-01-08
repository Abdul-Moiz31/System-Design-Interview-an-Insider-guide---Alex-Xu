import React from 'react';
import type { User, UrlHistory } from '../App';
import UrlShortenerSection from '../components/UrlShortenerSection';
import UrlTable from '../components/UrlTable';

interface HomeProps {
  user: User | null;
  urlHistory: UrlHistory[];
  guestUrlCount: number;
  canCreateUrl: boolean;
  onAddUrl: (url: UrlHistory) => void;
  onDeleteUrl: (id: string) => void;
  onClearHistory: () => void;
  onNavigate: (page: 'home' | 'login' | 'signup') => void;
}

const Home: React.FC<HomeProps> = ({
  user,
  urlHistory,
  guestUrlCount,
  canCreateUrl,
  onAddUrl,
  onDeleteUrl,
  onClearHistory,
  onNavigate,
}) => {
  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div className="container">
          <div style={styles.heroContent} className="fade-in">
            <h1 style={styles.title}>
              Shorten Your <span className="gradient-text">Loooong Links :)</span>
            </h1>
            <p style={styles.subtitle}>
              Linkly is an efficient and easy-to-use URL shortening service that streamlines your
              online experience.
            </p>

            {/* URL Shortener */}
            <UrlShortenerSection
              canCreateUrl={canCreateUrl}
              guestUrlCount={guestUrlCount}
              onAddUrl={onAddUrl}
              onNavigateToSignup={() => onNavigate('signup')}
            />

            {!user && guestUrlCount > 0 && (
              <div style={styles.guestInfo}>
                <div style={styles.limitText}>
                  You can create <strong>{5 - guestUrlCount} more links</strong>.{' '}
                  <button onClick={() => onNavigate('signup')} style={styles.registerLink}>
                    Register Now
                  </button>{' '}
                  to enjoy <strong>Unlimited</strong> usage
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* URL Table Section */}
      {urlHistory.length > 0 && (
        <section style={styles.tableSection}>
          <div className="container">
            <UrlTable
              urlHistory={urlHistory}
              onDeleteUrl={onDeleteUrl}
              onClearHistory={onClearHistory}
            />
          </div>
        </section>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4rem',
    paddingBottom: '4rem',
    minHeight: 'calc(100vh - 200px)',
  },
  hero: {
    padding: '4rem 0 2rem',
    position: 'relative',
  },
  heroContent: {
    textAlign: 'center',
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: '1.5rem',
    color: 'var(--color-text)',
  },
  subtitle: {
    fontSize: '1.125rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.6,
    marginBottom: '3rem',
    maxWidth: '700px',
    margin: '0 auto 3rem',
  },
  guestInfo: {
    marginTop: '2rem',
    textAlign: 'center',
  },
  limitText: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
  },
  registerLink: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },
  tableSection: {
    padding: '0',
  },
};

export default Home;
