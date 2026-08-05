import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { colors, fonts } from '../theme';

export default function PageHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sb-topbar" style={{ fontFamily: fonts.body }}>
      <Link to="/" className="sb-brand" style={{ color: colors.ink, fontFamily: fonts.display }}>
        <span className="sb-brand-mark">S</span>
        <span>SignBridge</span>
      </Link>
      <nav className="sb-nav" aria-label="Primary navigation">
        <Link className={location.pathname.startsWith('/learn') ? 'is-active' : ''} to="/learn">Learn</Link>
        <Link className={location.pathname === '/interpreter' ? 'is-active' : ''} to="/interpreter">Interpreter</Link>
        <Link className={location.pathname === '/challenge' ? 'is-active' : ''} to="/challenge">Challenge</Link>
      </nav>
      {!isHome ? (
        <button className="sb-back-button" onClick={() => navigate(-1)} aria-label="Go back">Back</button>
      ) : (
        <div className="sb-streak-chip"><span>7</span> day streak</div>
      )}
    </header>
  );
}
