import React, { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import ankitpic from './assets/ankitpic.jpeg';
import arnavpic from './assets/arnavpic.jpeg';
import shaswatpic from './assets/shaswatpic.jpg';
import { Link } from 'react-router-dom';

const AppHeader = ({ onGetInTouch }) => (
  <header className="app-header">
    <div className="container header-container">
      <div className="logo">GrabNGo</div>
      <nav>
        <Link to="/about" className="nav-link nav-link--about">About Us</Link>
      </nav>
    </div>
  </header>
);

export default function App() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/home';

  useEffect(() => {
    const isAuthed = localStorage.getItem('isAuthed') === 'true';
    if (isAuthed) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        const userData = userInfo.data;
        const email = (userData.email || '').toLowerCase();
        const allowed = email.endsWith('@bmsce.ac.in') || email==='ankitranjan10may@gmail.com';
        if (allowed) {
          setProfile(userData);
          setError('');
          localStorage.setItem('isAuthed', 'true');
          localStorage.setItem('profile', JSON.stringify(userData));

          navigate(from, { replace: true });
        } else {
          setError('Please log in with a valid college email.');
          googleLogout();
          localStorage.clear();
        }
      } catch (err) {
        setError('An error occurred during login.');
      }
    },
    onError: () => {
      setError('Google login failed. Please try again later.');
    },
  });

  const handleLoginClick = () => {
    if (profile) {
      navigate(from, { replace: true });
    } else {
      login();
    }
  };

  return (
    <div className="app-wrapper">
      <AppHeader onGetInTouch={handleLoginClick} />
      <main className="hero-section">
        <div className="container hero-container">
          <div className="hero-text">
            <h1>Quick Canteen <span className="highlight">Food Service</span></h1>
            <p className="subtitle">Skip the lines and order the delicious food ahead.</p>
            <div className="cta-buttons">
              <button id="order-now-btn" className="btn btn-primaryy" onClick={handleLoginClick}>
                Order Now
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>

          <div className="hero-image-container">
            <div className="image-wrapper">
              <img
                src="https://media.istockphoto.com/id/1829241109/photo/enjoying-a-brunch-together.jpg?s=612x612&w=0&k=20&c=9awLLRMBLeiYsrXrkgzkoscVU_3RoVwl_HA-OT-srjQ="
                alt="Brunch"
                className="hero-image"
              />
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>

              <div className="floating-card card-1">
                <img src={ankitpic} alt="Ankit" />
                <div>
                  <strong style={{ color: 'black' }}>Ankit</strong>
                  <small>Veg Fried Maggie</small>
                  <div className="stars">⭐⭐⭐⭐⭐</div>
                </div>
              </div>

              <div className="floating-card card-2">
                <img src={shaswatpic} alt="Shaswat" />
                <div>
                  <strong style={{ color: 'black' }}>Shaswat</strong>
                  <small>Loved the cold coffee!</small>
                  <div className="stars">⭐⭐⭐⭐</div>
                </div>
              </div>

              <div className="floating-card card-3">
                <img src={arnavpic} alt="Arnav" />
                <div>
                  <strong style={{ color: 'black' }}>Arnav</strong>
                  <small>Goated Service</small>
                  <div className="stars">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
