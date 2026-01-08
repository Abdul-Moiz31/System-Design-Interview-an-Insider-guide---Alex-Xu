import React, { useState } from 'react';
import type { User } from '../App';

interface SignupProps {
  onSignup: (user: User) => void;
  onNavigate: (page: 'home' | 'login' | 'signup') => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Signup failed');
        setLoading(false);
        return;
      }

      onSignup(data);
    } catch {
      setError('Network error. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div className="card" style={styles.card}>
          {/* Logo */}
          <button onClick={() => onNavigate('home')} style={styles.logoSection}>
            <span style={styles.logoText}>Linkly</span>
          </button>

          <div style={styles.header}>
            <h1 style={styles.title}>Create Your Account</h1>
            <p style={styles.subtitle}>
              Join thousands of users managing their URLs effectively
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="name" style={styles.label}>
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input"
                disabled={loading}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                disabled={loading}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                disabled={loading}
                required
                minLength={8}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="confirmPassword" style={styles.label}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                disabled={loading}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div style={styles.error} className="scale-in">
                <ErrorIcon />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={styles.submitBtn}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlusIcon />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Already have an account?{' '}
              <button onClick={() => onNavigate('login')} style={styles.link}>
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div style={styles.benefits}>
          <h3 style={styles.benefitsTitle}>What you'll get:</h3>
          <div style={styles.benefitsList}>
            <div style={styles.benefit}>
              <div style={styles.benefitIcon}>
                <InfinityIcon />
              </div>
              <div>
                <h4 style={styles.benefitTitle}>Unlimited URLs</h4>
                <p style={styles.benefitDesc}>Create as many short URLs as you need</p>
              </div>
            </div>

            <div style={styles.benefit}>
              <div style={styles.benefitIcon}>
                <ChartIcon />
              </div>
              <div>
                <h4 style={styles.benefitTitle}>Advanced Analytics</h4>
                <p style={styles.benefitDesc}>Track clicks and monitor performance</p>
              </div>
            </div>

            <div style={styles.benefit}>
              <div style={styles.benefitIcon}>
                <ShieldIcon />
              </div>
              <div>
                <h4 style={styles.benefitTitle}>Secure & Private</h4>
                <p style={styles.benefitDesc}>Your data is encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Icons
function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function InfinityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18.178 8C19.935 8.867 21 10.547 21 12.357 21 15.333 18.314 18 15 18c-1.848 0-3.527-.803-4.5-2.015C9.527 17.197 7.848 18 6 18c-3.314 0-6-2.667-6-5.643C0 10.547 1.065 8.867 2.822 8" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%)',
  },
  content: {
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  card: {
    padding: '2.5rem',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '2rem',
    paddingBottom: '2rem',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity var(--transition-base)',
  },
  logoText: {
    fontSize: '2rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-pink) 50%, var(--color-accent) 100%)',
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradient 3s ease infinite',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    background: 'var(--color-error-bg)',
    border: '1px solid var(--color-error)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--color-error)',
    fontSize: '0.9375rem',
  },
  submitBtn: {
    width: '100%',
    padding: '0.875rem',
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '0.5rem',
  },
  footer: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--color-border)',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-muted)',
  },
  link: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  benefits: {
    padding: '2rem',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
  },
  benefitsTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: '1.5rem',
  },
  benefitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  benefit: {
    display: 'flex',
    gap: '1rem',
  },
  benefitIcon: {
    width: '40px',
    height: '40px',
    flexShrink: 0,
    borderRadius: 'var(--radius-lg)',
    background: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: '0.25rem',
  },
  benefitDesc: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
  },
};

export default Signup;

