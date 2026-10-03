import { describe, it, expect } from 'vitest';
import {
	parseChord,
	transposeNote,
	transposeChord,
	calculateCapoTranspose,
	COMMON_CHORD_LIBRARY
} from './chords';

describe('chords music engine', () => {
	it('parses standard chords and slash chords correctly', () => {
		expect(parseChord('C')).toEqual({ root: 'C', quality: '', bass: undefined });
		expect(parseChord('Am7')).toEqual({ root: 'A', quality: 'm7', bass: undefined });
		expect(parseChord('F#m7')).toEqual({ root: 'F#', quality: 'm7', bass: undefined });
		expect(parseChord('Bbmaj7')).toEqual({ root: 'Bb', quality: 'maj7', bass: undefined });
		expect(parseChord('D/F#')).toEqual({ root: 'D', quality: '', bass: 'F#' });
		expect(parseChord('Cadd9/G')).toEqual({ root: 'C', quality: 'add9', bass: 'G' });
	});

	it('transposes notes accurately', () => {
		expect(transposeNote('C', 2)).toBe('D');
		expect(transposeNote('G', -2)).toBe('F');
		expect(transposeNote('E', 1)).toBe('F');
		expect(transposeNote('B', 1)).toBe('C');
		expect(transposeNote('F#', 2)).toBe('G#');
		expect(transposeNote('Bb', 2, true)).toBe('C');
		expect(transposeNote('Ab', -1, true)).toBe('G');
	});

	it('transposes full chords including qualities and bass notes', () => {
		expect(transposeChord('C', 2)).toBe('D');
		expect(transposeChord('Am', 3)).toBe('Cm');
		expect(transposeChord('Em7', 2)).toBe('F#m7');
		expect(transposeChord('D/F#', 2)).toBe('E/G#');
		expect(transposeChord('C/B', -1)).toBe('B/A#');
		expect(transposeChord('Esus4', -2)).toBe('Dsus4');
	});

	it('calculates capo transposition offsets properly', () => {
		// Capo 2 -> No Capo (0): shapes move up 2 semitones
		expect(calculateCapoTranspose(2, 0)).toBe(2);
		// Capo 2 -> Capo 4: shapes move down 2 semitones
		expect(calculateCapoTranspose(2, 4)).toBe(-2);
	});

	it('has common guitar chord diagrams', () => {
		expect(COMMON_CHORD_LIBRARY['Am']).toBeDefined();
		expect(COMMON_CHORD_LIBRARY['G']).toBeDefined();
		expect(COMMON_CHORD_LIBRARY['D/F#']).toBeDefined();
		expect(COMMON_CHORD_LIBRARY['Am'].frets).toEqual([-1, 0, 2, 2, 1, 0]);
	});
});
