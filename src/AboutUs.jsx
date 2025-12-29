import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';
import ankitpic from './assets/ankitpic.jpeg';

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
            So I built a simple solution that makes a real difference: browse the canteen menu anytime, order between classes, and get a ping when your food is ready. No more queues. No guesswork. Just hot food waiting for you.
          </p>
          <p className="lead">
            I tested it in real rush hours, fixed the bugs, and made it rock-solid with live tracking and seamless pickup. GrabNGo is my way of giving back a few precious minutes to days that are already packed.
          </p>

          <div className="row gap" style={{ marginBottom: '48px' }}>
            <Link to="/home" className="btn-primary">Explore Menu</Link>
            <Link to="/" className="btn-quiet">Back to Login</Link>
          </div>

          <div className="center">
            <div className="card" style={{ maxWidth: '380px', margin: '0 auto' }}>
              <img src={ankitpic} alt="Ankit" className="photo" style={{ height: '360px' }} />
              <div className="card-body">
                <div className="card-head">
                  <h3 className="name">Ankit</h3>
                  <span className="role">Founder & Lead Developer</span>
                </div>
                <div className="badge-row">
                  <span className="branch-badge">B.Tech CSE · 2nd Year</span>
                </div>
                <p className="note">
                  "Built GrabNGo from a real campus problem—turning long lunch queues into quick, reliable pickups so busy days still have good food."
                </p>
              </div>
            </div>
          </div>

          <p className="lead center muted" style={{ marginTop: '48px', fontSize: '0.95rem' }}>
            A small project by Ankit, a second-year CSE student at BMSCE.
          </p>
        </div>
      </section>
    </main>
  );
}