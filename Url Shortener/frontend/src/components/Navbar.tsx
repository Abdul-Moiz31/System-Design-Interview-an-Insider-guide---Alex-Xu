import React from 'react';
import type { User } from '../App';

interface NavbarProps {
  user: User | null;
  onNavigate: (page: 'home' | 'login' | 'signup') => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onNavigate, onLogout }) => {
  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.container}>
        {/* Logo */}
        <button onClick={() => onNavigate('home')} style={styles.logo}>
          <span style={styles.brandName}>Linkly</span>
        </button>

        {/* Navigation Items */}
        <div style={styles.navItems}>
          {user ? (
            <>
              <div style={styles.userInfo}>
                <div style={styles.avatar}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={styles.userName}>{user.name}</span>
              </div>
              <button onClick={onLogout} className="btn btn-ghost" style={styles.navBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onNavigate('login')} className="btn btn-ghost" style={styles.navBtn}>
                Login →
              </button>
              <button onClick={() => onNavigate('signup')} className="btn btn-primary">
                Register Now
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  nav: {
    background: 'var(--color-bg)',
    borderBottom: '1px solid var(--color-border)',
    padding: '1.25rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.5rem',
    fontWeight: 700,
    padding: '0.5rem',
    borderRadius: 'var(--radius-lg)',
    transition: 'opacity var(--transition-base)',
  },
  brandName: {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-pink) 50%, var(--color-accent) 100%)',
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradient 3s ease infinite',
  },
  navItems: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  navBtn: {
    fontSize: '0.9375rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-full)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  userName: {
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: 'var(--color-text)',
  },
};

export default Navbar;
