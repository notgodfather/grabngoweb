import React, { useState } from 'react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import './index.css';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/home';

  const onSuccess = (res) => {
    try {
      if (!res?.credential) {
        setError('Google login failed. Please try again.');
        return;
      }
      const decoded = jwtDecode(res.credential);
      const email = (decoded.email || '').toLowerCase();

      const allowed =
        email.endsWith('@bmsce.ac.in') || email.endsWith('.bmsce.ac.in')|| email=="rahulranjan5sep@gmail.com" || email.endsWith('@gmail.com');

      if (allowed) {
        setProfile(decoded);
        setError('');
        localStorage.setItem('isAuthed', 'true');
        localStorage.setItem('profile', JSON.stringify(decoded));
        navigate(from, { replace: true });
      } else {
        setProfile(null);
        setError('Login with your College email..');
      }
    } catch (e) {
      console.error('Failed to decode ID token', e);
      setError('Login failed. Please try again.');
    }
  };

  const onError = (err) => {
    console.error('Google login failed', err);
    setError('Google login failed. Please try again.');
  };

  // In src/App.jsx

const onLogout = () => {
  googleLogout();
  setProfile(null);
  setError('');
  localStorage.removeItem('isAuthed');
  localStorage.removeItem('profile');
};


  const onOrderNow = () => {
    const el = document.getElementById('login-card');
    if (el) el.scrollIntoView({ behavior: 'smooth' });

    const btn =
      document.querySelector('#hidden-google .S9gUrf, #hidden-google div[role="button"], #hidden-google button');
    if (btn) {
      btn.click();
    } else {
      const visibleBtn =
        document.querySelector('.google-btn') || document.getElementById('login-card');
      if (visibleBtn) visibleBtn.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Hero section */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="badge">
              <span style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 999, background: '#ffedd5' }}>🍽️</span>
              GrabNGo
            </div>
            <h1>Quick & Convenient Canteen Food Ordering</h1>
            <p>Skip the lines and order ahead with GrabNGo. Fresh food ready when it’s needed.</p>
            <button className="cta" onClick={onOrderNow}>
              Order Now
            </button>
          </div>
          <div style={{ justifySelf: 'end' }}>
            {/* Placeholder overlapping plates */}
            <div style={{ position: 'relative', height: 160, width: 260 }}>
              <div style={{ position: 'absolute', right: 0, top: 0, width: 150, height: 150, borderRadius: '50%', background: '#e2f5e8' }} />
              <div style={{ position: 'absolute', right: 60, top: 40, width: 120, height: 120, borderRadius: '50%', background: '#fde68a' }} />
              <div style={{ position: 'absolute', right: 120, top: 60, width: 100, height: 100, borderRadius: '50%', background: '#c7d2fe' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Content area with login card */}
      <section className="content">
        <div className="center">
          <div id="login-card" className="card">
            <div className="card-header">
              <div className="app-avatar">🍱</div>
              <div className="card-title">Welcome to GrabNGo</div>
              <div className="card-subtitle">
                Order delicious meals from the campus canteen with just a few clicks.
              </div>
            </div>

            {!profile ? (
              <>
                {/* Visible Google button */}
                <div className="google-btn">
                  <GoogleLogin onSuccess={onSuccess} onError={onError} />
                </div>

                {/* Hidden Google button for programmatic trigger */}
                <div id="hidden-google" style={{ height: 0, overflow: 'hidden' }}>
                  <GoogleLogin onSuccess={onSuccess} onError={onError} />
                </div>

                {error && (
                  <div style={{ marginTop: 12, color: '#b91c1c', fontWeight: 600 }}>
                    {error}
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="profile">
                  <img src={profile.picture} alt="profile" width={48} height={48} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{profile.name}</div>
                    <div style={{ color: '#64748b', fontSize: 14 }}>{profile.email}</div>
                  </div>
                </div>
                <button className="cta" style={{ marginTop: 16 }} onClick={onLogout}>
                  Logout
                </button>
              </div>
            )}

            <div style={{ marginTop: 14, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
              By continuing, you agree to GrabNGo’s Terms of Service & Privacy Policy.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
