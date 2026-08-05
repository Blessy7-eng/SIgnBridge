import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import HumanMascot from '../components/HumanMascot';
import { fonts } from '../theme';
import { UNITS } from '../Curriculum';
import { useProgress } from '../ProgressContext';

export default function LearnPage() {
  const navigate = useNavigate();
  const { xp, isComplete, completedCountForUnit } = useProgress();
  const readyUnits = UNITS.filter((unit) => unit.ready);
  const totalSigns = readyUnits.reduce((sum, unit) => sum + unit.signs.length, 0);
  const totalCompleted = readyUnits.reduce((sum, unit) => sum + completedCountForUnit(unit.id, unit.signs), 0);
  let nextUnlockedKey = null;
  outer: for (const unit of readyUnits) {
    for (const sign of unit.signs) {
      if (!isComplete(unit.id, sign)) { nextUnlockedKey = `${unit.id}:${sign}`; break outer; }
    }
  }

  return (
    <div className="sb-page">
      <PageHeader />
      <main className="sb-shell sb-learn-main">
        <section className="sb-learn-intro">
          <div><div className="sb-section-label">Your path</div><h1 style={{ fontFamily: fonts.display }}>Keep going, one sign at a time.</h1><p>Short lessons, real progress, and a friendly guide whenever you need a little encouragement.</p></div>
          <HumanMascot size={128} compact mood="encourage" message="Small steps add up." />
        </section>
        <div className="sb-learn-stats"><Stat label="XP" value={xp} /><Stat label="Signs learned" value={`${totalCompleted}/${totalSigns}`} /><Stat label="Current level" value={totalCompleted > 5 ? 'Explorer' : 'Starter'} /></div>

        <section className="sb-learning-map">
          {UNITS.map((unit) => {
            if (!unit.ready) return <div key={unit.id} className="sb-locked-unit"><strong>{unit.name}</strong><span>Coming soon</span></div>;
            const completed = completedCountForUnit(unit.id, unit.signs);
            return (
              <div className="sb-unit" key={unit.id}>
                <div className="sb-unit-heading"><div><span className="sb-unit-kicker">Unit {unit.id}</span><h2 style={{ fontFamily: fonts.display }}>{unit.name}</h2><p>{unit.description}</p></div><span className="sb-unit-count">{completed}/{unit.signs.length}</span></div>
                <div className="sb-sign-grid">
                  {unit.signs.map((sign, index) => {
                    const key = `${unit.id}:${sign}`;
                    const done = isComplete(unit.id, sign);
                    const current = key === nextUnlockedKey;
                    const locked = !done && !current;
                    return <SignNode key={key} sign={sign} index={index} done={done} current={current} locked={locked} onClick={() => !locked && navigate(`/learn/${unit.id}/practice/${encodeURIComponent(sign)}`)} />;
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="sb-learn-stat"><span>{label}</span><strong>{value}</strong></div>;
}

function SignNode({ sign, index, done, current, locked, onClick }) {
  return (
    <button className={`sb-sign-node ${done ? 'is-done' : ''} ${current ? 'is-current' : ''} ${locked ? 'is-locked' : ''}`} onClick={onClick} disabled={locked}>
      <span className="sb-sign-node-number">{String(index + 1).padStart(2, '0')}</span>
      <strong>{done ? 'Complete' : sign}</strong>
      <small>{done ? 'Review anytime' : current ? 'Start here' : 'Locked'}</small>
    </button>
  );
}
