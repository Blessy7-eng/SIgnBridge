import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { colors, fonts, fontImport } from '../theme';
import Footer from '../components/Footer';
import Mudra from '../components/Mudra';
import { useProgress } from '../ProgressContext';

// The 6 signs Mudra can actually demonstrate (see Mudra.jsx) - the daily
// spotlight only picks from these so it's always backed by a real animation.
const SPOTLIGHT_SIGNS = ['Hello', 'Goodbye', 'Please', 'ThankYou', 'Yes', 'No'];

function getSignOfTheDay() {
  // Deterministic by date, not random per page load - same pick all day,
  // changes tomorrow. A simple day-of-year hash into the list.
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return SPOTLIGHT_SIGNS[dayOfYear % SPOTLIGHT_SIGNS.length];
}

export default function HomePage() {
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();
  const { xp } = useProgress();
  const signOfDay = getSignOfTheDay();

  const cards = [
    {
      key: 'interpreter',
      title: 'Sign Language Interpreter',
      description: 'Sign into your camera. See and hear it translated live, in real time.',
      accent: colors.primary,
      path: '/interpreter',
    },
    {
      key: 'learn',
      title: 'Learn Sign Language',
      description: 'Start with the alphabet and build up your Indian Sign Language vocabulary.',
      accent: colors.secondary,
      path: '/learn',
    },
    {
      key: 'challenge',
      title: 'Speed Challenge',
      description: '60 seconds. Sign as many prompts as you can. Beat your best score.',
      accent: colors.primaryDark,
      path: '/challenge',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: colors.bg }}>
      <style>{`
        ${fontImport}

        @keyframes sb-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sb-fade-1 { animation: sb-fade-up 0.5s ease both; }
        .sb-fade-2 { animation: sb-fade-up 0.5s ease 0.08s both; }
        .sb-fade-3 { animation: sb-fade-up 0.5s ease 0.16s both; }

        .sb-card { transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; }
        .sb-card:focus-visible { outline: 3px solid ${colors.ink}; outline-offset: 3px; }

        .sb-hero { padding: 96px 32px 72px; }
        .sb-hero-title { font-size: clamp(36px, 6vw, 60px); }
        .sb-cards-row { flex-direction: row; }

        @media (max-width: 720px) {
          .sb-hero { padding: 56px 20px 48px; }
          .sb-cards-row { flex-direction: column; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sb-fade-1, .sb-fade-2, .sb-fade-3 { animation: none; }
        }
      `}</style>

      <main
        className="sb-hero"
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Signature element: landmark-path motif - dotted nodes connected
            by a line, echoing the motion-tracking points this whole product
            is built on. Placed as quiet ambient texture, not a centerpiece. */}
        <svg
          width="100%"
          height="180"
          viewBox="0 0 1100 180"
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: '-10px', left: 0, opacity: 0.5, pointerEvents: 'none' }}
        >
          <path d="M 40 140 Q 250 20, 480 110 T 900 60 T 1060 100" stroke={colors.border} strokeWidth="1.5" fill="none" strokeDasharray="1 6" strokeLinecap="round" />
          <circle cx="40" cy="140" r="3" fill={colors.primary} opacity="0.5" />
          <circle cx="480" cy="110" r="3" fill={colors.secondary} opacity="0.5" />
          <circle cx="900" cy="60" r="3" fill={colors.primary} opacity="0.5" />
        </svg>

        <div style={{ maxWidth: '640px', marginBottom: '56px', zIndex: 1 }}>
          <h1
            className="sb-fade-1 sb-hero-title"
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              color: colors.ink,
              margin: '0 0 16px 0',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            Welcome to SignBridge
          </h1>
          <p
            className="sb-fade-2"
            style={{
              fontFamily: fonts.body,
              fontSize: '18px',
              color: colors.inkMuted,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Understand sign language, and learn to sign back.
          </p>
        </div>

        <div
          className="sb-fade-3 sb-cards-row"
          style={{
            display: 'flex',
            gap: '24px',
            justifyContent: 'center',
            zIndex: 1,
            width: '100%',
            maxWidth: '980px',
          }}
        >
          {cards.map((card) => (
            <button
              key={card.key}
              className="sb-card"
              onMouseEnter={() => setHovered(card.key)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => navigate(card.path)}
              style={{
                flex: '1 1 320px',
                background: colors.bgAlt,
                border: `1px solid ${colors.border}`,
                borderRadius: '20px',
                padding: '36px 28px',
                cursor: 'pointer',
                textAlign: 'left',
                transform: hovered === card.key ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hovered === card.key ? '0 16px 32px rgba(27, 27, 47, 0.10)' : '0 1px 2px rgba(27, 27, 47, 0.03)',
                borderColor: hovered === card.key ? card.accent : colors.border,
                fontFamily: fonts.body,
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: card.accent, marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFFFFF' }} />
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: '20px', fontWeight: 600, color: colors.ink, marginBottom: '10px' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '14px', color: colors.inkMuted, lineHeight: 1.55 }}>
                {card.description}
              </div>
            </button>
          ))}
        </div>

        {xp > 0 && (
          <div
            style={{
              marginTop: '20px',
              fontFamily: fonts.mono,
              fontSize: '12px',
              color: colors.inkMuted,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 1,
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.primary }} />
            <span>{xp} XP earned so far</span>
          </div>
        )}

        <Link
          to={`/learn/words/practice/${encodeURIComponent(signOfDay)}`}
          style={{
            marginTop: '48px',
            zIndex: 1,
            textDecoration: 'none',
            width: '100%',
            maxWidth: '460px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: colors.bgAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: '18px',
            padding: '18px 22px',
          }}
        >
          <Mudra gesture={signOfDay} size={72} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: fonts.mono, fontSize: '10px', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Sign of the day
            </div>
            <div style={{ fontFamily: fonts.display, fontSize: '18px', fontWeight: 600, color: colors.ink }}>
              {signOfDay}
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: '12px', color: colors.inkMuted, marginTop: '2px' }}>
              Tap to practice it now →
            </div>
          </div>
        </Link>
      </main>

      <Footer />
    </div>
  );
}