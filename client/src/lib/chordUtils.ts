// Chord transposition utilities

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map flats to sharps for normalization
const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};

// Common chord pattern - matches chord notation like C, Cm, C7, Cmaj7, etc.
const CHORD_REGEX = /\b([A-G][b#]?)(m|maj|min|dim|aug|sus|add)?(\d*)?\b/g;

/**
 * Normalize a note (convert flats to sharps)
 */
export function normalizeNote(note: string): string {
  return FLAT_TO_SHARP[note] || note;
}

/**
 * Transpose a single chord by semitones
 */
export function transposeChord(chord: string, semitones: number): string {
  return chord.replace(CHORD_REGEX, (match, root, quality = '', number = '') => {
    const normalizedRoot = normalizeNote(root);
    const currentIndex = NOTES.indexOf(normalizedRoot);
    
    if (currentIndex === -1) return match;
    
    const newIndex = (currentIndex + semitones + 12) % 12;
    const newRoot = NOTES[newIndex];
    
    return `${newRoot}${quality}${number}`;
  });
}

/**
 * Calculate semitone difference between two keys
 */
export function getSemitoneDifference(fromKey: string, toKey: string): number {
  const fromNormalized = normalizeNote(fromKey);
  const toNormalized = normalizeNote(toKey);
  
  const fromIndex = NOTES.indexOf(fromNormalized);
  const toIndex = NOTES.indexOf(toNormalized);
  
  if (fromIndex === -1 || toIndex === -1) return 0;
  
  return (toIndex - fromIndex + 12) % 12;
}

/**
 * Transpose entire lyrics with chords
 * Expects format: chord line, lyric line, chord line, lyric line...
 */
export function transposeLyrics(lyrics: string, semitones: number): string {
  if (semitones === 0) return lyrics;
  
  const lines = lyrics.split('\n');
  
  return lines.map(line => {
    // Check if line contains chords (has chord patterns and minimal text)
    if (isChordLine(line)) {
      return transposeChord(line, semitones);
    }
    return line;
  }).join('\n');
}

/**
 * Detect if a line is a chord line
 * A chord line typically has chord patterns and limited lowercase text
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  
  // Check if line has chord patterns
  const hasChords = CHORD_REGEX.test(trimmed);
  if (!hasChords) return false;
  
  // Check if line is mostly chords (not lyrics)
  // Lyrics typically have more lowercase letters and spaces
  const words = trimmed.split(/\s+/);
  const chordWords = words.filter(word => /^[A-G][b#]?(m|maj|min|dim|aug|sus|add)?(\d*)?$/.test(word));
  
  // If more than 40% of words are chords, consider it a chord line
  return chordWords.length / words.length > 0.4;
}

/**
 * Parse pasted lyrics and separate chords from lyrics
 * Detects if chords are on separate lines or inline
 */
export function parsePastedLyrics(text: string): string {
  // Return as-is - we expect users to paste with chords on separate lines
  // Our isChordLine function will handle detection
  return text.trim();
}

/**
 * Get all available keys for dropdown
 */
export function getAllKeys(): string[] {
  return [...NOTES];
}

/**
 * Parse a chord line and extract chord positions
 */
export function parseChordLine(line: string): Array<{ chord: string; position: number }> {
  const chords: Array<{ chord: string; position: number }> = [];
  let match;
  const regex = /\b([A-G][b#]?(?:m|maj|min|dim|aug|sus|add)?(?:\d*)?)\b/g;
  
  while ((match = regex.exec(line)) !== null) {
    chords.push({
      chord: match[1],
      position: match.index,
    });
  }
  
  return chords;
}

/**
 * Transpose to a new key
 */
export function transposeToKey(lyrics: string, fromKey: string, toKey: string): string {
  const semitones = getSemitoneDifference(fromKey, toKey);
  return transposeLyrics(lyrics, semitones);
}
