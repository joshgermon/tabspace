// Music theory and chord transposition engine for Tabspace

export interface ChordDiagramData {
	frets: number[]; // 6 elements for strings 6 down to 1 (E A D G B E), -1 means mute (X), 0 means open (O)
	fingers?: number[]; // 0 for open/unfretted, 1=index, 2=middle, 3=ring, 4=pinky
	baseFret?: number; // 1 for open position, >1 if shifted up the neck
	barres?: { fret: number; startString: number; lastString: number; finger?: number }[];
	name?: string;
}

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_TO_SEMITONE: Record<string, number> = {
	'C': 0, 'B#': 0,
	'C#': 1, 'Db': 1,
	'D': 2,
	'D#': 3, 'Eb': 3,
	'E': 4, 'Fb': 4,
	'F': 5, 'E#': 5,
	'F#': 6, 'Gb': 6,
	'G': 7,
	'G#': 8, 'Ab': 8,
	'A': 9,
	'A#': 10, 'Bb': 10,
	'B': 11, 'Cb': 11
};

// Common standard keys preferring flats
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm']);

/**
 * Transpose a single note (e.g., 'C#', 'Bb') by given semitones.
 */
export function transposeNote(note: string, semitones: number, preferFlats = false): string {
	const currentSemitone = NOTE_TO_SEMITONE[note];
	if (currentSemitone === undefined) return note;

	let targetSemitone = (currentSemitone + semitones) % 12;
	if (targetSemitone < 0) targetSemitone += 12;

	return preferFlats ? FLAT_NOTES[targetSemitone] : SHARP_NOTES[targetSemitone];
}

/**
 * Parses chord into { root, quality, bass }
 * e.g., "F#m7/C#" -> { root: "F#", quality: "m7", bass: "C#" }
 */
export function parseChord(chord: string): { root: string; quality: string; bass?: string } | null {
	if (!chord || typeof chord !== 'string') return null;

	const trimmed = chord.trim();
	const slashIndex = trimmed.indexOf('/');

	let mainPart = trimmed;
	let bassPart: string | undefined;

	if (slashIndex !== -1) {
		mainPart = trimmed.slice(0, slashIndex);
		bassPart = trimmed.slice(slashIndex + 1);
	}

	const match = mainPart.match(/^([A-G][#b]?)(.*)$/);
	if (!match) return null;

	return {
		root: match[1],
		quality: match[2] || '',
		bass: bassPart ? bassPart.trim() : undefined
	};
}

/**
 * Transpose a full chord symbol (including slash chords like D/F#) by a semitone offset.
 */
export function transposeChord(chord: string, semitones: number, forceFlats?: boolean): string {
	if (semitones === 0) return chord;

	const parsed = parseChord(chord);
	if (!parsed) return chord;

	// Decide whether to use flats based on chord or context
	const usesFlats = forceFlats ?? (chord.includes('b') || chord.startsWith('F'));

	const newRoot = transposeNote(parsed.root, semitones, usesFlats);
	let newBass = '';
	if (parsed.bass) {
		const bassNote = transposeNote(parsed.bass, semitones, usesFlats);
		newBass = '/' + bassNote;
	}

	return `${newRoot}${parsed.quality}${newBass}`;
}

/**
 * Calculates new chords when adjusting Capo.
 * When playing with a capo:
 * - originalShape: what you play with originalCapo
 * - targetCapo: where you move the capo
 * If moving capo up, finger shapes move down to produce the same concert pitch.
 * If targetCapo = 0 ("No Capo"), we transpose up by originalCapo to get sounding pitch.
 */
export function calculateCapoTranspose(originalCapo: number, targetCapo: number): number {
	return originalCapo - targetCapo;
}

/**
 * Standard chord fingering library (Standard EADGBE tuning)
 * frets array: [E, A, D, G, B, e]
 * -1 = mute, 0 = open string
 */
export const COMMON_CHORD_LIBRARY: Record<string, ChordDiagramData> = {
	// A Chords
	'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
	'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
	'A7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], baseFret: 1 },
	'Am7': { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1 },
	'Amaj7': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], baseFret: 1 },
	'Asus2': { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1 },
	'Asus4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },

	// B Chords
	'B': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [{ fret: 2, startString: 1, lastString: 5, finger: 1 }] },
	'Bm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [{ fret: 2, startString: 1, lastString: 5, finger: 1 }] },
	'B7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 },
	'Bm7': { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barres: [{ fret: 2, startString: 1, lastString: 5, finger: 1 }] },
	'B7sus4': { frets: [-1, 2, 2, 2, 0, 2], fingers: [0, 2, 3, 4, 0, 1], baseFret: 1 },
	'Bb': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [{ fret: 1, startString: 1, lastString: 5, finger: 1 }] },
	'Bbm': { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [{ fret: 1, startString: 1, lastString: 5, finger: 1 }] },

	// C Chords
	'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
	'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1 },
	'Cmaj7': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1 },
	'Cadd9': { frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4], baseFret: 1 },
	'Cm': { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barres: [{ fret: 3, startString: 1, lastString: 5, finger: 1 }] },
	'C#': { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barres: [{ fret: 4, startString: 1, lastString: 5, finger: 1 }] },
	'C#m': { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [{ fret: 4, startString: 1, lastString: 5, finger: 1 }] },
	'C#m7': { frets: [-1, 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], baseFret: 4, barres: [{ fret: 4, startString: 1, lastString: 5, finger: 1 }] },

	// D Chords
	'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
	'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
	'D7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 },
	'Dsus2': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0], baseFret: 1 },
	'Dsus4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1 },
	'Dmaj7': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1 },
	'Dm7': { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], baseFret: 1 },
	'D/F#': { frets: [2, 0, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3], baseFret: 1 },

	// E Chords
	'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
	'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },
	'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 },
	'Em7': { frets: [0, 2, 2, 0, 3, 0], fingers: [0, 1, 2, 0, 3, 0], baseFret: 1 },
	'Emaj7': { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0], baseFret: 1 },
	'Esus4': { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], baseFret: 1 },
	'Eb': { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3], baseFret: 1 },

	// F Chords
	'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [{ fret: 1, startString: 0, lastString: 5, finger: 1 }] },
	'Fm': { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [{ fret: 1, startString: 0, lastString: 5, finger: 1 }] },
	'F7': { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [{ fret: 1, startString: 0, lastString: 5, finger: 1 }] },
	'Fmaj7': { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], baseFret: 1 },
	'Fsus4': { frets: [1, 3, 3, 3, 1, 1], fingers: [1, 2, 3, 4, 1, 1], baseFret: 1, barres: [{ fret: 1, startString: 0, lastString: 5, finger: 1 }] },
	'F#': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [{ fret: 2, startString: 0, lastString: 5, finger: 1 }] },
	'F#m': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barres: [{ fret: 2, startString: 0, lastString: 5, finger: 1 }] },
	'F#m7': { frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], baseFret: 2, barres: [{ fret: 2, startString: 0, lastString: 5, finger: 1 }] },
	'F#7': { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barres: [{ fret: 2, startString: 0, lastString: 5, finger: 1 }] },

	// G Chords
	'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
	'Gm': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [{ fret: 3, startString: 0, lastString: 5, finger: 1 }] },
	'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
	'Gmaj7': { frets: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
	'Gsus4': { frets: [3, 2, 0, 0, 1, 3], fingers: [3, 2, 0, 0, 1, 4], baseFret: 1 },
	'G/B': { frets: [-1, 2, 0, 0, 3, 3], fingers: [0, 1, 0, 0, 3, 4], baseFret: 1 },
	'G#m': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [{ fret: 4, startString: 0, lastString: 5, finger: 1 }] }
};

/**
 * Normalizes UG applicature chord format into our ChordDiagramData.
 * In UG, frets are given as 6 numbers, or reversed (e.g. string 1 to 6).
 */
export function normalizeUGApplicature(chordName: string, ugChord: any): ChordDiagramData | null {
	if (!ugChord || !Array.isArray(ugChord.frets)) return null;

	// In UG data, notes/frets are ordered e, B, G, D, A, E (index 0 is high e) OR E to e.
	// UG frets: [high-e, B, G, D, A, low-E] in some versions or low-E to high-e.
	// We can inspect: string 0 in UG notes is MIDI ~52-64 (high e) and index 5 is MIDI ~28-40 (low E).
	// So we reverse it so index 0 = Low E (string 6) and index 5 = High e (string 1).
	let frets = [...ugChord.frets];
	let fingers = Array.isArray(ugChord.fingers) ? [...ugChord.fingers] : [0, 0, 0, 0, 0, 0];

	if (ugChord.notes && ugChord.notes[0] > ugChord.notes[ugChord.notes.length - 1]) {
		// High e is first, reverse to Low E first
		frets.reverse();
		fingers.reverse();
	}

	const baseFret = ugChord.fret || 1;
	const barres = (ugChord.listCapos || []).map((c: any) => ({
		fret: c.fret,
		startString: c.startString,
		lastString: c.lastString,
		finger: c.finger
	}));

	return {
		frets,
		fingers,
		baseFret: baseFret > 0 ? baseFret : 1,
		barres,
		name: chordName
	};
}
