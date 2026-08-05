// SignBridge - curriculum data
//
// IMPORTANT: the "signs" lists here should match your model's actual
// trained classes (see encoder.classes_ printed when server/app.py starts).
// If you add new trained signs later (e.g. numbers), add them here too.

export const UNITS = [
  {
    id: 'alphabet',
    name: 'Alphabet',
    description: 'A through Z, one hand shape at a time',
    ready: true,
    signs: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  },
  {
    id: 'words',
    name: 'Common Words',
    description: 'Everyday greetings and words',
    ready: true,
    signs: ['Hello', 'Goodbye', 'Please', 'ThankYou', 'Yes', 'No'],
  },
  {
    id: 'numbers',
    name: 'Numbers',
    description: '0 through 9',
    ready: false,
    signs: [],
  },
];

export function getUnit(unitId) {
  return UNITS.find((u) => u.id === unitId) || null;
}