// (弦, 指) → 音名 對照表
// finger 0 = 空弦,finger 1..4 = 第一把位的食指/中指/無名指/小指
const STRING_FINGER_NOTES = {
  G: ['G3', 'A3', 'B3',  'C4', 'D4'],
  D: ['D4', 'E4', 'F#4', 'G4', 'A4'],
  A: ['A4', 'B4', 'C#5', 'D5', 'E5'],
  E: ['E5', 'F#5', 'G5', 'A5', 'B5'],
};

// 音名 → 頻率(等律,A4 = 440 Hz)
const NOTE_FREQUENCIES = {
  G3: 196.00, A3: 220.00, B3: 246.94, C4: 261.63,
  D4: 293.66, E4: 329.63, 'F#4': 369.99, G4: 392.00,
  A4: 440.00, B4: 493.88, 'C#5': 554.37, D5: 587.33,
  E5: 659.25, 'F#5': 739.99, G5: 783.99, A5: 880.00, B5: 987.77,
};

export function getPitchInfo(stringName, finger = 0) {
  const notes = STRING_FINGER_NOTES[stringName];
  if (!notes) return null;
  if (!Number.isInteger(finger) || finger < 0 || finger >= notes.length) return null;
  const name = notes[finger];
  const frequency = NOTE_FREQUENCIES[name];
  if (frequency == null) return null;
  return { name, frequency };
}

export function getFinger(stringName, pitchName) {
  const notes = STRING_FINGER_NOTES[stringName];
  if (!notes) return null;
  const idx = notes.indexOf(pitchName);
  return idx >= 0 ? idx : null;
}

export function getFrequency(pitchName) {
  return NOTE_FREQUENCIES[pitchName] ?? null;
}