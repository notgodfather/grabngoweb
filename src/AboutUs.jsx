import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';
import ankitpic from './assets/ankitpic.jpeg';
import arnavpic from './assets/arnavpic.jpeg';
import shaswatpic from './assets/shaswatpic.jpeg';
import shreyaspic from './assets/shreyaspic.jpeg';
import raechelpic from './assets/raechelpic.jpeg';
const team = [
  {
    name: 'Ankit Ranjan',
    role: 'Lead Developer',
    branch: 'B.Tech CSE · 2nd Year',
    img: ankitpic,
    note: 'Built so busy days still have good food—no more choosing between a hot meal and a lecture.',
  },{
    name: 'Shreyas Shetty',
    role: 'UI/UX Designer',
    branch: 'B.Tech CSE · 2nd Year',
    img: shreyaspic,
    note: 'Simple flows and warm details—ordering should feel as friendly as sharing a table.',
  },
  {
    name: 'Shaswat',
    role: 'Backend Engineer',
    branch: 'B.Tech Mech · 2nd Year',
    img: shaswatpic,
    note: 'Reliability is kindness—webhooks, retries, and real‑time updates keep promises on time.',
  },
];


export default function AboutUs() {
  return (
    <main className="about-min">
      {/* About */}
      <section className="section">
        <div className="container">
          <p className="badge">Made at BMSCE</p>
          <h1 className="title">About GrabNGo</h1>
          <p className="lead">
            It started in the BMSCE lunch rush—ten minutes to eat, twenty minutes to stand in line. The math didn’t add up, and too many meals turned into “maybe later.”

So we built a small fix that felt big: browse the canteen menu on the go, place the order between classes, and get a gentle ping when it’s ready. No queue. No guesswork. Just hot food, on time.

We tested it during real rush hours, broke it a few times, then made it reliable—live status, clear handoff, and a pickup that takes seconds, not breaks. GrabNGo is our way of giving a little time back to a day that’s already full.


          </p>
          <div className="row gap">
            <Link to="/home" className="btn-primary">Explore Menu</Link>
            <Link to="/" className="btn-quiet">Back to Login</Link>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <div className="container">
          <h2 className="title-sm">Meet the Team</h2>
          <p className="muted center">Built by students, for students—crafted with canteen love.</p>

          <div className="team-grid">
            {team.map((m) => (
              <article className="card" key={m.name}>
  <img className="photo" src={m.img} alt={m.name} />
  <div className="card-body">
    <div className="card-head">
      <h3 className="name">{m.name}</h3>
      <span className="role">{m.role}</span>
    </div>

    {/* New: branch/year chip */}
    <div className="badge-row">
      <span className="branch-badge">{m.branch}</span>
    </div>

    <p className="note">“{m.note}”</p>
  </div>
</article>

            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
