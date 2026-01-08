import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UrlHistory {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
}

type Page = 'home' | 'login' | 'signup';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [urlHistory, setUrlHistory] = useState<UrlHistory[]>([]);
  const [guestUrlCount, setGuestUrlCount] = useState(0);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedHistory = localStorage.getItem('urlHistory');
    const savedGuestCount = localStorage.getItem('guestUrlCount');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedHistory) {
      setUrlHistory(JSON.parse(savedHistory));
    }
    if (savedGuestCount) {
      setGuestUrlCount(parseInt(savedGuestCount, 10));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentPage('home');
  };

  const handleSignup = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCurrentPage('home');
  };

  const addUrlToHistory = (url: UrlHistory) => {
    const newHistory = [url, ...urlHistory];
    setUrlHistory(newHistory);
    localStorage.setItem('urlHistory', JSON.stringify(newHistory));

    if (!user) {
      const newCount = guestUrlCount + 1;
      setGuestUrlCount(newCount);
      localStorage.setItem('guestUrlCount', newCount.toString());
    }
  };

  const deleteUrlFromHistory = (id: string) => {
    const newHistory = urlHistory.filter(item => item.id !== id);
    setUrlHistory(newHistory);
    localStorage.setItem('urlHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setUrlHistory([]);
    localStorage.removeItem('urlHistory');
  };

  const canCreateUrl = user || guestUrlCount < 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {currentPage === 'home' && (
        <>
          <Navbar
            user={user}
            onNavigate={setCurrentPage}
            onLogout={handleLogout}
          />

          <main style={{ flex: 1 }}>
            <Home
              user={user}
              urlHistory={urlHistory}
              guestUrlCount={guestUrlCount}
              canCreateUrl={canCreateUrl}
              onAddUrl={addUrlToHistory}
              onDeleteUrl={deleteUrlFromHistory}
              onClearHistory={clearHistory}
              onNavigate={setCurrentPage}
            />
          </main>

          <Footer />
        </>
      )}

      {currentPage === 'login' && (
        <Login onLogin={handleLogin} onNavigate={setCurrentPage} />
      )}

      {currentPage === 'signup' && (
        <Signup onSignup={handleSignup} onNavigate={setCurrentPage} />
      )}
    </div>
  );
}

export default App;
