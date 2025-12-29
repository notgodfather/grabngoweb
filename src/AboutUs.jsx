import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';
import ankitpic from './assets/ankitpic.jpeg';
import shreyaspic from './assets/shreyaspic.jpeg';
import souppic from './assets/souppic.jpg';

const team = [
  {
    name: 'Ankit',
    role: 'Founder & Lead Developer',
    branch: 'B.Tech CSE · 2nd Year',
    img: ankitpic,
    linkedin: 'www.linkedin.com/in/ankitranjan77', // Replace with real LinkedIn URLs
    note: 'Started GrabNGo from a real campus pain point—turned long queues into quick, reliable pickups.',
  },
  {
    name: 'Shreyas',
    role: 'Marketing Head',
    branch: 'B.Tech CSE · 2nd Year',
    img: shreyaspic,
    linkedin: 'https://www.linkedin.com/in/shreyas-linkedin',
    note: 'Drives growth and spreads the word—making sure every student knows about hassle-free meals.',
  },
  {
    name: 'Soup',
    role: 'Marketing Head',
    branch: 'B.Tech CSE · 2nd Year',
    img: souppic,
    linkedin: 'https://www.linkedin.com/in/soup-linkedin',
    note: 'Crafts the clean, friendly interface that makes ordering feel effortless and enjoyable.',
  },
];

export default function AboutUs() {
  return (
    <main className="about-min">
      <section className="section">
        <div className="container">
          <p className="badge">Made with ❤️ at BMSCE</p>
          <h1 className="title">About GrabNGo</h1>
          <p className="lead">
            It all began in the BMSCE lunch rush—ten minutes to eat, twenty minutes waiting in line. The math never added up, and too many good meals got skipped.
          </p>
          <p className="lead">
            So we built a simple solution that makes a real difference: browse the canteen menu anytime, order between classes, and get a ping when your food is ready. No more queues. No guesswork. Just hot food waiting for you.
          </p>
          <p className="lead">
            We tested it in real rush hours, fixed the bugs, and made it rock-solid with live tracking and seamless pickup. GrabNGo is our way of giving back a few precious minutes to days that are already packed.
          </p>

          <div className="row gap" style={{ marginBottom: '64px' }}>
            <Link to="/home" className="btn-primary">Explore Menu</Link>
            <Link to="/" className="btn-quiet">Back to Login</Link>
          </div>

          <h2 className="title-sm center" style={{ marginBottom: '40px' }}>Connect with the Team</h2>
          <div className="team-grid">
            {team.map((member) => (
              <div key={member.name} className="card team-card">
                <div className="photo-wrapper">
                  <img src={member.img} alt={member.name} className="photo" />
                  <div className="social-overlay">
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-icon">
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.174 0-2.126-.952-2.126-2.126 0-1.174.952-2.126 2.126-2.126 1.174 0 2.126.952 2.126 2.126 0 1.174-.952 2.126-2.126 2.126zm1.777 13.019H3.56V9h3.774v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.208 24 24 23.227 24 22.271V1.729C24 .774 23.208 0 22.225 0z"/>
                      </svg>
                    </a>
                  </div>
                </div>
                <div className="card-body">
                  <div className="card-head">
                    <h3 className="name">{member.name}</h3>
                    <span className="role">{member.role}</span>
                  </div>
                  <div className="badge-row">
                    <span className="branch-badge">{member.branch}</span>
                  </div>
                  <p className="note">"{member.note}"</p>
                </div>
              </div>
            ))}
          </div>

          <p className="lead center muted" style={{ marginTop: '64px', fontSize: '0.95rem' }}>
            A student project by a small passionate team at BMSCE, making campus life a little easier—one meal at a time.
          </p>
        </div>
      </section>
    </main>
  );
}