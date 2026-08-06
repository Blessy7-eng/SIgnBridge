import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { colors, fonts } from '../theme';
import LoadingScreen from './LoadingScreen';

export default function PageHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [showLoading, setShowLoading] = useState(false);

  function previewLoading() {
    setShowLoading(true);
  }

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
      <div className="sb-header-actions">
        {!isHome ? (
          <button className="sb-back-button" onClick={() => navigate(-1)} aria-label="Go back">Back</button>
        ) : (
          <div className="sb-streak-chip"><span>7</span> day streak</div>
        )}
        <button className="sb-loading-preview-button" type="button" onClick={previewLoading}>Preview loading</button>
      </div>
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} label="Previewing the SignBridge loading screen" />}
    </header>
  );
}
