import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';
import ankitpic from './assets/ankitpic.jpeg';
import shreyaspic from './assets/shreyaspic.jpeg';
import shaswatpic from './assets/shaswatpic.jpg';
import souppic from './assets/souppic.jpg';

const team = [
  {
    name: 'Ankit',
    role: 'Founder & Lead Developer',
    branch: 'B.Tech CSE · 2nd Year',
    img: ankitpic,
    note: 'The one who started it all—turned a frustrating lunch queue into the idea for GrabNGo, and built the core from the ground up.',
  },
  {
    name: 'Shreyas',
    role: 'Marketing Head',
    branch: 'B.Tech CSE · 2nd Year',
    img: shreyaspic,
    note: 'Simple flows and warm details—ordering should feel as friendly as sharing a table.',
  },
  {
    name: 'Shaswat',
    role: 'Lead Advisor',
    branch: 'B.Tech · 2nd Year',
    img: shaswatpic,
    note: 'Reliability is kindness—webhooks, retries, and real-time updates keep promises on time.',
  },
  {
    name: 'Soup',
    role: 'UI/UX Designer',
    branch: 'B.Tech CSE · 2nd Year',
    img: souppic,
    note: 'Crafted the clean, intuitive interface so the app feels effortless and welcoming.',
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

          <div className="row gap" style={{ marginBottom: '48px' }}>
            <Link to="/home" className="btn-primary">Explore Menu</Link>
            <Link to="/" className="btn-quiet">Back to Login</Link>
          </div>

          <h2 className="title-sm center" style={{ marginBottom: '32px' }}>Meet the Team</h2>
          <div className="team-grid">
            {team.map((member) => (
              <div key={member.name} className="card">
                <img src={member.img} alt={member.name} className="photo" />
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

          <p className="lead center muted" style={{ marginTop: '48px', fontSize: '0.95rem' }}>
            A small project by four second-year students trying to make campus life a little smoother.
          </p>
        </div>
      </section>
    </main>
  );
}