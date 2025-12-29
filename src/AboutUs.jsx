import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';
import ankitpic from './assets/ankitpic.jpeg';
import arnavpic from './assets/arnavpic.jpeg';
import shaswatpic from './assets/shaswatpic.jpg';
import shreyaspic from './assets/shreyaspic.jpeg';
import souppic from './assets/souppic.jpg';
const team = [
  {
    name: 'Ankit',
    role: 'Lead Developer',
    branch: 'B.Tech CSE · 2nd Year',
    img: ankitpic,
    note: 'Built so busy days still have good food—no more choosing between a hot meal and a lecture.',
  },{
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
    note: 'Reliability is kindness—webhooks, retries, and real‑time updates keep promises on time.',
  },
  {
    name: 'Soup',
    role: 'UI/UX',
    branch: 'B.Tech CSE· 2nd Year',
    img: souppic,
    note: 'Reliability is kindness—webhooks, retries, and real‑time updates keep promises on time.',
  },
];

export default function AboutUs() {
  return (
    <main className="about-min">
      <section className="section">
        <div className="container">
          <p className="badge">Made at BMSCE</p>
          <h1 className="title">About GrabNGo</h1>
          <p className="lead">
            It started in the BMSCE lunch rush—ten minutes to eat, twenty minutes to stand in line. The math didn’t add up, and too many meals turned into “maybe later.”
            <br /><br />
            So we built a small fix that felt big: browse the canteen menu on the go, place the order between classes, and get a gentle ping when it’s ready. No queue. No guesswork. Just hot food, on time.
            <br /><br />
            We tested it during real rush hours, broke it a few times, then made it reliable—live status, clear handoff, and a pickup that takes seconds, not breaks. GrabNGo is our way of giving a little time back to a day that’s already full.
          </p>

          {/* NEW: Developer note */}
          <section className="dev-note">
            <div className="dev-note-card">
              <p className="dev-note-label">A note from the builders</p>
              <h2 className="dev-note-title">Built for the 10:15 rush.</h2>
              <p className="dev-note-text">
                GrabNGo wasn’t built in a lab. It was built on the floor outside the canteen,
                with cold samosas, low battery, and “bro, line kitni lambi hai?” in the background.
              </p>
              <p className="dev-note-text">
                Every loading state, retry, and printer beep is there because someone once missed their
                break or their breakfast. If the app feels calm when the campus is chaotic,
                that’s not an accident—that’s the whole point.
              </p>
              <p className="dev-note-signoff">
                If you ever see a bug or have an idea, tell us at the counter or in class.
                We’ll probably push the fix between lectures.
              </p>
              <div className="dev-note-meta">
                <span>— Team GrabNGo</span>
                <span className="dev-note-pill">From BMSCE, for BMSCE</span>
              </div>
            </div>
          </section>

          <div className="row gap">
            <Link to="/home" className="btn-primary">Explore Menu</Link>
            <Link to="/" className="btn-quiet">Back to Login</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
