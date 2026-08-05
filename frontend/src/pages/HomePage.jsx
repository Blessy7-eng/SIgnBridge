import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import HumanMascot from '../components/HumanMascot';
import { fonts } from '../theme';
import { useProgress } from '../ProgressContext';

const SPOTLIGHT_SIGNS = ['Hello', 'Goodbye', 'Please', 'ThankYou', 'Yes', 'No'];

function getSignOfTheDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return SPOTLIGHT_SIGNS[dayOfYear % SPOTLIGHT_SIGNS.length];
}

const lessons = [
  { key: 'alphabet', label: 'Alphabet', detail: 'Learn your A, B, C', color: '#e8f2ee', icon: 'A', path: '/learn' },
  { key: 'words', label: 'Everyday words', detail: 'Build useful vocabulary', color: '#fff1e9', icon: 'W', path: '/learn' },
  { key: 'challenge', label: 'Speed challenge', detail: 'Test your new skills', color: '#fdf2cf', icon: 'S', path: '/challenge' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { xp } = useProgress();
  const signOfDay = getSignOfTheDay();

  return (
    <div className="sb-page">
      <PageHeader />
      <main className="sb-shell sb-home-main">
        <section className="sb-hero-grid sb-fade-up">
          <div className="sb-hero-copy">
            <div className="sb-section-label">Your learning space</div>
            <h1 style={{ fontFamily: fonts.display }}>Make every gesture count.</h1>
            <p>Learn Indian Sign Language in small, friendly steps. Practice with your camera, explore new words, and keep your streak moving.</p>
            <div className="sb-hero-actions">
              <button className="sb-primary-button" onClick={() => navigate('/learn')}>Continue learning</button>
              <Link className="sb-text-link" to="/interpreter">Try the interpreter <span aria-hidden="true">→</span></Link>
            </div>
            <div className="sb-progress-line">
              <div className="sb-progress-meta"><span>Your progress</span><strong>{xp} XP</strong></div>
              <div className="sb-progress-track"><span style={{ width: `${Math.min(100, Math.max(12, xp))}%` }} /></div>
            </div>
          </div>
          <div className="sb-hero-mascot"><HumanMascot size={245} mood="happy" message={"Hi, I'm Mira!"} /></div>
        </section>

        <section className="sb-section sb-fade-up" style={{ animationDelay: '.12s' }}>
          <div className="sb-section-heading"><div><div className="sb-section-label">Pick a path</div><h2 style={{ fontFamily: fonts.display }}>What would you like to do?</h2></div><Link className="sb-text-link" to="/learn">See all lessons →</Link></div>
          <div className="sb-lesson-grid">
            {lessons.map((lesson) => (
              <Link className="sb-lesson-card" key={lesson.key} to={lesson.path}>
                <span className="sb-lesson-icon" style={{ background: lesson.color }}>{lesson.icon}</span>
                <span><strong>{lesson.label}</strong><small>{lesson.detail}</small></span>
                <span className="sb-card-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="sb-daily-card sb-fade-up" style={{ animationDelay: '.2s' }}>
          <div><div className="sb-section-label">Today&apos;s tiny win</div><h2 style={{ fontFamily: fonts.display }}>Practice “{signOfDay}”</h2><p>One clear sign today is better than waiting for the perfect study session.</p><Link className="sb-primary-button sb-inline-button" to={`/learn/words/practice/${encodeURIComponent(signOfDay)}`}>Practice now</Link></div>
          <HumanMascot size={112} compact mood="focus" message="You&apos;ve got this." />
        </section>
      </main>
    </div>
  );
}
