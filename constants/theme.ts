export const colors = {
  bg: '#0a0a0a',
  card: '#141414',
  card2: '#1c1c1c',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.15)',
  green: '#1DB954',
  greenDim: 'rgba(29,185,84,0.12)',
  purple: '#B49DFF',
  purpleDim: 'rgba(180,157,255,0.12)',
  teal: '#00C9A7',
  tealDim: 'rgba(0,201,167,0.10)',
  amber: '#F59B0A',
  amberDim: 'rgba(245,155,10,0.12)',
  red: '#FF4747',
  redDim: 'rgba(255,71,71,0.10)',
  blue: '#4C9FFF',
  text: '#ffffff',
  text2: 'rgba(255,255,255,0.7)',
  text3: 'rgba(255,255,255,0.4)',
  text4: 'rgba(255,255,255,0.2)',
};

export const NOTES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
export const NOTES_FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

export const MAJ = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
export const MIN = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];

export const MAJOR_INTERVALS = [0,2,4,5,7,9,11];
export const MINOR_INTERVALS = [0,2,3,5,7,8,10];
export const MAJOR_QUALITIES = ['','m','m','','','m','dim'];
export const MINOR_QUALITIES = ['m','dim','','m','m','',''];
export const MAJOR_DEGREES = ['I','ii','iii','IV','V','vi','vii°'];
export const MINOR_DEGREES = ['i','ii°','III','iv','v','VI','VII'];

export const MODES = [
  { name:'Ionian',    intervals:[0,2,4,5,7,9,11], feel:'Major scale — bright, happy',          genre:'Pop, classical, folk',    color:'#1DB954' },
  { name:'Dorian',    intervals:[0,2,3,5,7,9,10], feel:'Minor with raised 6th — jazzy, funky', genre:'Jazz, funk, Celtic',      color:'#B49DFF' },
  { name:'Phrygian',  intervals:[0,1,3,5,7,8,10], feel:'Dark, Spanish/flamenco intensity',      genre:'Flamenco, metal, Middle East', color:'#FF4747' },
  { name:'Lydian',    intervals:[0,2,4,6,7,9,11], feel:'Dreamy, floating — raised 4th',        genre:'Film scores, dream pop',  color:'#4C9FFF' },
  { name:'Mixolydian',intervals:[0,2,4,5,7,9,10], feel:'Major feel, flat 7th — bluesy',        genre:'Blues, rock, country',    color:'#F59B0A' },
  { name:'Aeolian',   intervals:[0,2,3,5,7,8,10], feel:'Natural minor — melancholic, dark',    genre:'Pop ballads, rock, EDM',  color:'#00C9A7' },
  { name:'Locrian',   intervals:[0,1,3,5,6,8,10], feel:'Diminished, tense, unstable',          genre:'Jazz, experimental, metal',color:'#888888' },
];

export const EXOTIC_SCALES: Record<string, { intervals: number[]; description: string }> = {
  'Blues':           { intervals:[0,3,5,6,7,10],       description:'Minor pentatonic + blue note (♭5). The soul of blues and rock.' },
  'Major Pentatonic':{ intervals:[0,2,4,7,9],          description:'5 notes, no tension. Used in folk, country, world music.' },
  'Minor Pentatonic':{ intervals:[0,3,5,7,10],         description:'Foundation of rock guitar solos and blues.' },
  'Whole Tone':      { intervals:[0,2,4,6,8,10],       description:'All equal steps — dreamy, symmetrical, no tonic pull.' },
  'Diminished':      { intervals:[0,2,3,5,6,8,9,11],   description:'Alternating W-H steps. Tense and unsettling.' },
  'Harmonic Minor':  { intervals:[0,2,3,5,7,8,11],     description:'Natural minor with raised 7th — classical, Middle Eastern.' },
  'Melodic Minor':   { intervals:[0,2,3,5,7,9,11],     description:'Raised 6th and 7th ascending. Jazz minor.' },
  'Chromatic':       { intervals:[0,1,2,3,4,5,6,7,8,9,10,11], description:'All 12 semitones. No tonal center.' },
};

export const TIME_SIGNATURES: Record<string, { beats: number; unit: number; feel: string; grouping: string; examples: string }> = {
  '4/4':  { beats:4, unit:4, feel:'Simple quadruple — most common in pop/rock', grouping:'4',         examples:'Most pop songs' },
  '3/4':  { beats:3, unit:4, feel:'Simple triple — waltz feel',                  grouping:'3',         examples:'My Favorite Things, Happy Birthday' },
  '2/4':  { beats:2, unit:4, feel:'Simple duple — march feel',                   grouping:'2',         examples:'Marches, polkas' },
  '6/8':  { beats:6, unit:8, feel:'Compound duple — lilting, two big beats',     grouping:'3+3',       examples:'House of the Rising Sun' },
  '12/8': { beats:12,unit:8, feel:'Compound quadruple — slow blues, gospel',     grouping:'3+3+3+3',   examples:'Nothing Else Matters intro' },
  '9/8':  { beats:9, unit:8, feel:'Compound triple — rolling feel',              grouping:'3+3+3',     examples:'Celtic jigs' },
  '5/4':  { beats:5, unit:4, feel:'Quintuple — asymmetric, complex',             grouping:'3+2 or 2+3',examples:'Mission Impossible, Take Five' },
  '7/8':  { beats:7, unit:8, feel:'Septuple — Balkan folk, prog rock',           grouping:'2+2+3',     examples:'Money (Pink Floyd), Unsquare Dance' },
  '11/8': { beats:11,unit:8, feel:'Rare odd meter — very complex',               grouping:'3+3+3+2',   examples:'Prog rock, Meshuggah' },
};
