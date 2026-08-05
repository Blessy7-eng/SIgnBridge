import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';
import { colors, fonts, fontImport } from '../theme';
import { UNITS } from '../Curriculum';
import { useProgress } from '../ProgressContext';

// Zigzag horizontal offsets for the winding path effect, cycling through a
// short pattern rather than being fully random - keeps it looking
// deliberate rather than chaotic.
const OFFSET_PATTERN = [0, 50, 90, 50, 0, -50, -90, -50];

export default function LearnPage() {
  const navigate = useNavigate();
  const { xp, isComplete, completedCountForUnit } = useProgress();

  const totalSigns = UNITS.filter((u) => u.ready).reduce((sum, u) => sum + u.signs.length, 0);
  const totalCompleted = UNITS.filter((u) => u.ready).reduce(
    (sum, u) => sum + completedCountForUnit(u.id, u.signs),
    0
  );

  // Figure out which sign is the "next up" one, globally, across all ready
  // units in order - that's the only one that's actively unlocked-but-not-
  // yet-done; everything before it is complete, everything after is locked.
  let nextUnlockedKey = null;
  outer: for (const unit of UNITS) {
    if (!unit.ready) continue;
    for (const sign of unit.signs) {
      if (!isComplete(unit.id, sign)) {
        nextUnlockedKey = `${unit.id}:${sign}`;
        break outer;
      }
    }
  }

  let globalIndex = 0;

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: colors.bg }}>
      <style>{`
        ${fontImport}
        .sb-stage { padding: 40px 24px 60px; }
        @keyframes sb-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200, 169, 107, 0.5); }
          50% { box-shadow: 0 0 0 10px rgba(200, 169, 107, 0); }
        }
        .sb-current-node { animation: sb-pulse 1.8s ease-in-out infinite; }
        @media (max-width: 720px) {
          .sb-stage { padding: 24px 16px 40px; }
        }
      `}</style>

      <main className="sb-stage" style={{ flex: 1, width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <PageHeader />

        <h1 style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 'clamp(24px, 4vw, 32px)', color: colors.ink, marginBottom: '6px' }}>
          Learn Sign Language
        </h1>
        <p style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.inkMuted, marginBottom: '20px' }}>
          Work down the path. Each sign unlocks the next.
        </p>

        {/* Stats strip */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '40px',
            fontFamily: fonts.mono,
            fontSize: '12px',
          }}
        >
          <StatPill label="XP" value={xp} color={colors.primary} />
          <StatPill label="Progress" value={`${totalCompleted} / ${totalSigns}`} color={colors.secondary} />
        </div>

        {/* The winding path itself */}
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {UNITS.map((unit) => {
            if (!unit.ready) {
              return (
                <div key={unit.id} style={{ width: '100%', marginTop: '32px', opacity: 0.5 }}>
                  <UnitBanner unit={unit} locked />
                </div>
              );
            }

            return (
              <div key={unit.id} style={{ width: '100%' }}>
                <div style={{ marginTop: '32px', marginBottom: '28px' }}>
                  <UnitBanner unit={unit} completed={completedCountForUnit(unit.id, unit.signs)} total={unit.signs.length} />
                </div>

                {unit.signs.map((sign) => {
                  const key = `${unit.id}:${sign}`;
                  const done = isComplete(unit.id, sign);
                  const isCurrent = key === nextUnlockedKey;
                  const locked = !done && !isCurrent;
                  const offset = OFFSET_PATTERN[globalIndex % OFFSET_PATTERN.length];
                  globalIndex += 1;

                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        transform: `translateX(${offset}px)`,
                        marginBottom: '18px',
                      }}
                    >
                      <SignNode
                        sign={sign}
                        done={done}
                        current={isCurrent}
                        locked={locked}
                        onClick={() => {
                          if (locked) return;
                          navigate(`/learn/${unit.id}/practice/${encodeURIComponent(sign)}`);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: colors.bgAlt,
        border: `1px solid ${colors.border}`,
        borderRadius: '999px',
        padding: '6px 14px',
      }}
    >
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
      <span style={{ color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ color: colors.ink, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function UnitBanner({ unit, completed, total, locked }) {
  return (
    <div
      style={{
        width: '100%',
        background: locked ? colors.bgAlt : colors.ink,
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: '16px', color: locked ? colors.inkMuted : '#FFFFFF' }}>
          {unit.name}
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: '12px', color: locked ? colors.inkMuted : '#B8BACC', marginTop: '2px' }}>
          {unit.description}
        </div>
      </div>
      {!locked && (
        <div style={{ fontFamily: fonts.mono, fontSize: '11px', color: '#B8BACC', whiteSpace: 'nowrap' }}>
          {completed}/{total}
        </div>
      )}
    </div>
  );
}

function SignNode({ sign, done, current, locked, onClick }) {
  const size = 64;

  let background = colors.bgAlt;
  let borderColor = colors.border;
  let textColor = colors.inkMuted;

  if (done) {
    background = colors.secondary;
    borderColor = colors.secondary;
    textColor = '#FFFFFF';
  } else if (current) {
    background = colors.primary;
    borderColor = colors.primary;
    textColor = '#FFFFFF';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        onClick={onClick}
        disabled={locked}
        className={current ? 'sb-current-node' : ''}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background,
          border: `3px solid ${borderColor}`,
          color: textColor,
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: sign.length > 2 ? '12px' : '20px',
          cursor: locked ? 'default' : 'pointer',
          opacity: locked ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done ? '✓' : locked ? '🔒' : sign}
      </button>
      {current && (
        <div
          style={{
            marginTop: '6px',
            fontFamily: fonts.mono,
            fontSize: '10px',
            fontWeight: 500,
            color: colors.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Start
        </div>
      )}
    </div>
  );
}
