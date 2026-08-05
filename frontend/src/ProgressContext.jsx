import React, { createContext, useContext, useState } from 'react';

// NOTE: this is in-memory (React state) only - progress resets on page
// reload. Persisting this across sessions would need a backend (e.g. the
// Supabase setup mentioned earlier in the project plan) to store per-user
// progress. That's a good next step once this flow feels right.

const ProgressContext = createContext(null);

const XP_PER_CORRECT = 10;
const COMBO_BONUS_PER_STEP = 2; // extra XP per consecutive correct sign beyond the first

export function ProgressProvider({ children }) {
  const [completedSigns, setCompletedSigns] = useState(new Set()); // "unitId:sign"
  const [xp, setXp] = useState(0);
  const [bestChallengeScore, setBestChallengeScoreState] = useState(0);

  function setBestChallengeScore(score) {
    setBestChallengeScoreState((prev) => Math.max(prev, score));
  }

  function markComplete(unitId, sign, comboCount = 1) {
    const key = `${unitId}:${sign}`;
    const alreadyDone = completedSigns.has(key);

    setCompletedSigns((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    // Only award XP the first time a sign is completed - re-practicing an
    // already-mastered sign is still good practice, just not double-paid.
    if (!alreadyDone) {
      const bonus = Math.max(0, comboCount - 1) * COMBO_BONUS_PER_STEP;
      setXp((prev) => prev + XP_PER_CORRECT + bonus);
    }
  }

  function isComplete(unitId, sign) {
    return completedSigns.has(`${unitId}:${sign}`);
  }

  function completedCountForUnit(unitId, signs) {
    return signs.filter((s) => isComplete(unitId, s)).length;
  }

  return (
    <ProgressContext.Provider value={{ xp, markComplete, isComplete, completedCountForUnit, bestChallengeScore, setBestChallengeScore }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider');
  return ctx;
}