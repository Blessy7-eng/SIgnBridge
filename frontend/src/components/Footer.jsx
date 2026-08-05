import React from 'react';
import { Link } from 'react-router-dom';
import { colors, fonts } from '../theme';

function LandmarkPath() {
  return (
    <svg width="72" height="16" viewBox="0 0 72 16" style={{ display: 'block' }}>
      <path d="M2 12 Q 18 2, 34 10 T 70 6" stroke={colors.secondary} strokeWidth="1.5" fill="none" strokeDasharray="1 5" strokeLinecap="round" />
      <circle cx="2" cy="12" r="2" fill={colors.primary} />
      <circle cx="34" cy="10" r="2" fill={colors.primary} />
      <circle cx="70" cy="6" r="2" fill={colors.primary} />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ width: '100%', marginTop: 'auto', background: colors.ink, color: '#C7C8D6' }}>
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '28px 20px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ minWidth: '200px' }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: '18px', color: '#FFFFFF', marginBottom: '8px' }}>
            SignBridge
          </div>
          <p style={{ fontFamily: fonts.body, fontSize: '13px', lineHeight: 1.6, color: '#9294AC', maxWidth: '260px', margin: 0 }}>
            An open interpreter and learning platform for Indian Sign Language.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: fonts.mono, fontSize: '11px', letterSpacing: '0.08em', color: '#6E7090', marginBottom: '10px', textTransform: 'uppercase' }}>
              Product
            </div>
            <FooterLink to="/interpreter">Interpreter</FooterLink>
            <FooterLink to="/learn">Learn</FooterLink>
          </div>
          <div>
            <div style={{ fontFamily: fonts.mono, fontSize: '11px', letterSpacing: '0.08em', color: '#6E7090', marginBottom: '10px', textTransform: 'uppercase' }}>
              About
            </div>
            <FooterLink to="/">Home</FooterLink>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #2C2D45',
          padding: '14px 20px',
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span style={{ fontFamily: fonts.mono, fontSize: '12px', color: '#6E7090' }}>
          © {year} SignBridge. Built for accessibility.
        </span>
        <LandmarkPath />
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} style={{ display: 'block', fontFamily: fonts.body, fontSize: '13px', color: '#C7C8D6', textDecoration: 'none', marginBottom: '8px' }}>
      {children}
    </Link>
  );
}