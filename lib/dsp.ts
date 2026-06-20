import { MAJ, MIN, NOTES, MAJOR_INTERVALS, MINOR_INTERVALS, NOTES_FLAT, MAJOR_QUALITIES, MINOR_QUALITIES, MAJOR_DEGREES, MINOR_DEGREES, MODES, TIME_SIGNATURES } from '../constants/theme';

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s,v)=>s+v,0)/n;
  const mb = b.reduce((s,v)=>s+v,0)/n;
  let num=0,da=0,db=0;
  for(let i=0;i<n;i++){const x=a[i]-ma,y=b[i]-mb;num+=x*y;da+=x*x;db+=y*y;}
  return num/(Math.sqrt(da*db)||1);
}

function frameChroma(frame: Float32Array, sr: number, N: number): Float32Array {
  const c = new Float32Array(12).fill(0);
  const stride = Math.max(1, Math.floor(N/256));
  for(let k=1;k<N/2;k++){
    const freq=k*sr/N;
    if(freq<27.5||freq>4200) continue;
    const midi=12*Math.log2(freq/440)+69;
    const pc=((Math.round(midi)%12)+12)%12;
    let re=0,im=0;
    for(let n=0;n<N;n+=stride){const a=2*Math.PI*k*n/N;re+=frame[n]*Math.cos(a);im-=frame[n]*Math.sin(a);}
    c[pc]+=Math.sqrt(re*re+im*im)/(N/stride);
  }
  return c;
}

export function computeChroma(data: Float32Array, sampleRate: number): Float32Array {
  const fftSize=8192, hop=4096;
  const chroma=new Float32Array(12).fill(0);
  let count=0;
  for(let s=0;s+fftSize<data.length;s+=hop){
    const frame=new Float32Array(fftSize);
    for(let i=0;i<fftSize;i++) frame[i]=data[s+i]*(0.5-0.5*Math.cos(2*Math.PI*i/fftSize));
    const c=frameChroma(frame,sampleRate,fftSize);
    for(let i=0;i<12;i++) chroma[i]+=c[i];
    count++;
  }
  if(count) for(let i=0;i<12;i++) chroma[i]/=count;
  const mx=Math.max(...Array.from(chroma))||1;
  for(let i=0;i<12;i++) chroma[i]/=mx;
  return chroma;
}

export function detectKey(chroma: Float32Array): { root: number; mode: string; name: string; confidence: number; modeName: string } {
  let best={corr:-Infinity,root:0,mode:'major'};
  const all: {r:number;mode:string;corr:number}[]=[];
  for(let r=0;r<12;r++){
    const rot=Array.from({length:12},(_,i)=>chroma[(i+r)%12]);
    const mj=pearson(rot,MAJ), mn=pearson(rot,MIN);
    all.push({r,mode:'major',corr:mj},{r,mode:'minor',corr:mn});
    if(mj>best.corr) best={corr:mj,root:r,mode:'major'};
    if(mn>best.corr) best={corr:mn,root:r,mode:'minor'};
  }
  all.sort((a,b)=>b.corr-a.corr);
  const conf=Math.max(52,Math.min(97,Math.round(((all[0].corr-all[1].corr)/(1-all[1].corr))*300+58)));
  const detectedMode = detectMode(chroma, best.root);
  return { root:best.root, mode:best.mode, name:NOTES[best.root], confidence:conf, modeName:detectedMode };
}

function detectMode(chroma: Float32Array, root: number): string {
  let bestMode = 'Ionian'; let bestCorr = -Infinity;
  for(const mode of MODES){
    const template = new Float32Array(12).fill(0);
    for(const iv of mode.intervals) template[(root+iv)%12]=1;
    const rot = Array.from({length:12},(_,i)=>chroma[i]);
    const corr = pearson(rot, Array.from(template));
    if(corr>bestCorr){bestCorr=corr;bestMode=mode.name;}
  }
  return bestMode;
}

export function detectBPM(data: Float32Array, sampleRate: number): { bpm: number; confidence: number; timeSig: string } {
  const frame=1024,hop=512;
  const energies: number[]=[];
  for(let i=0;i+frame<data.length;i+=hop){
    let e=0;for(let j=0;j<frame;j++) e+=data[i+j]*data[i+j];
    energies.push(e/frame);
  }
  const onsets: number[]=[],win=20;
  for(let i=1;i<energies.length;i++){
    const flux=Math.max(0,energies[i]-energies[i-1]);
    let lm=0;for(let w=Math.max(0,i-win);w<i;w++) lm+=energies[w];
    lm/=Math.min(i,win);
    if(flux>lm*1.4) onsets.push(i*hop/sampleRate);
  }
  if(onsets.length<4) return {bpm:120,confidence:55,timeSig:'4/4'};
  const iois: number[]=[];
  for(let i=1;i<onsets.length;i++){const d=onsets[i]-onsets[i-1];if(d>0.15&&d<2.5)iois.push(d);}
  if(iois.length<3) return {bpm:120,confidence:58,timeSig:'4/4'};
  const bins=new Float32Array(221).fill(0);
  iois.forEach(d=>{for(let m=1;m<=4;m++){const b=Math.round(60*m/d);if(b>=60&&b<=200)bins[b]++;}});
  let bestBPM=120,bestC=0;
  for(let b=60;b<=200;b++){let s=0;for(let d=-2;d<=2;d++)if(b+d>=60&&b+d<=200)s+=bins[b+d];if(s>bestC){bestC=s;bestBPM=b;}}
  if(bestBPM<75) bestBPM*=2;if(bestBPM>180) bestBPM=Math.round(bestBPM/2);
  const conf=Math.max(55,Math.min(96,Math.round((bestC/(iois.length*4))*400+48)));
  const timeSig = detectTimeSig(onsets, bestBPM);
  return {bpm:bestBPM,confidence:conf,timeSig};
}

function detectTimeSig(onsets: number[], bpm: number): string {
  if(onsets.length<6) return '4/4';
  const beatDur=60/bpm;
  const iois: number[]=[];
  for(let i=1;i<onsets.length;i++) iois.push(onsets[i]-onsets[i-1]);
  const avg=iois.reduce((a,b)=>a+b,0)/iois.length;
  const ratio=avg/beatDur;
  if(ratio>0.4&&ratio<0.6) return '6/8';
  if(ratio>0.6&&ratio<0.85) return '3/4';
  const groups: Record<string,number>={'2':0,'3':0,'4':0,'5':0,'6':0,'7':0};
  let streak=0;let prev=0;
  for(const ioi of iois){
    if(ioi<beatDur*1.5){streak++;} else {
      const g=Math.round(ioi/beatDur);
      if(g>=2&&g<=7) groups[String(g)]=(groups[String(g)]||0)+1;
      streak=1;
    }
  }
  const maxGroup=Object.entries(groups).sort((a,b)=>b[1]-a[1])[0];
  if(maxGroup&&parseInt(maxGroup[0])===3&&groups['3']>groups['4']) return '3/4';
  if(maxGroup&&parseInt(maxGroup[0])===5) return '5/4';
  if(maxGroup&&parseInt(maxGroup[0])===7) return '7/8';
  return '4/4';
}

export function buildWaveform(data: Float32Array, points=400): number[] {
  const step=Math.floor(data.length/points);
  const peaks: number[]=[];
  for(let i=0;i<points;i++){
    let p=0;for(let j=0;j<step;j++) p=Math.max(p,Math.abs(data[i*step+j]||0));
    peaks.push(p);
  }
  return peaks;
}

export function getScaleChords(root: number, mode: string): { name: string; degree: string; notes: string[] }[] {
  const intervals=mode==='major'?MAJOR_INTERVALS:MINOR_INTERVALS;
  const quals=mode==='major'?MAJOR_QUALITIES:MINOR_QUALITIES;
  const degs=mode==='major'?MAJOR_DEGREES:MINOR_DEGREES;
  return intervals.map((iv,pos)=>{
    const chordRoot=NOTES_FLAT[(root+iv)%12];
    const chordNotes=getChordNotes(root+iv, quals[pos]);
    return { name:chordRoot+quals[pos], degree:degs[pos], notes:chordNotes };
  });
}

export function getExtendedChords(root: number, mode: string): { name: string; degree: string; type: string; notes: string[]; description: string }[] {
  const intervals=mode==='major'?MAJOR_INTERVALS:MINOR_INTERVALS;
  const degs=mode==='major'?MAJOR_DEGREES:MINOR_DEGREES;
  const extTypes=['maj7','m7','m7','maj7','7','m7','m7b5'];
  const minExtTypes=['m7','m7b5','maj7','m7','m7','maj7','7'];
  const types=mode==='major'?extTypes:minExtTypes;
  const descriptions: Record<string,string>={
    'maj7':'Major seventh — warm, jazzy, stable','m7':'Minor seventh — mellow, soulful',
    '7':'Dominant seventh — tension, blues feel','m7b5':'Half-diminished — dark, jazz',
    'maj9':'Major ninth — lush, contemporary R&B','m9':'Minor ninth — sophisticated, neo-soul',
    'sus4':'Suspended fourth — unresolved, floating','sus2':'Suspended second — open, airy',
    'dim7':'Diminished seventh — maximum tension','aug':'Augmented — bright tension',
  };
  return intervals.map((iv,pos)=>{
    const r=(root+iv)%12;
    const baseName=NOTES_FLAT[r];
    const type=types[pos];
    return { name:baseName+type, degree:degs[pos], type, notes:getExtendedNotes(r,type), description:descriptions[type]||'' };
  });
}

function getChordNotes(root: number, quality: string): string[] {
  const r=((root%12)+12)%12;
  if(quality==='m') return [NOTES_FLAT[r],NOTES_FLAT[(r+3)%12],NOTES_FLAT[(r+7)%12]];
  if(quality==='dim') return [NOTES_FLAT[r],NOTES_FLAT[(r+3)%12],NOTES_FLAT[(r+6)%12]];
  return [NOTES_FLAT[r],NOTES_FLAT[(r+4)%12],NOTES_FLAT[(r+7)%12]];
}

function getExtendedNotes(root: number, type: string): string[] {
  const r=((root%12)+12)%12;
  const n=(i: number)=>NOTES_FLAT[(r+i)%12];
  const map: Record<string,string[]>={
    'maj7':[n(0),n(4),n(7),n(11)], 'm7':[n(0),n(3),n(7),n(10)],
    '7':[n(0),n(4),n(7),n(10)], 'm7b5':[n(0),n(3),n(6),n(10)],
    'maj9':[n(0),n(4),n(7),n(11),n(14%12)], 'm9':[n(0),n(3),n(7),n(10),n(14%12)],
    'sus4':[n(0),n(5),n(7)], 'sus2':[n(0),n(2),n(7)],
    'dim7':[n(0),n(3),n(6),n(9)], 'aug':[n(0),n(4),n(8)],
  };
  return map[type]||[n(0),n(4),n(7)];
}

export function transposeChord(chord: string, semitones: number): string {
  if(!chord||semitones===0) return chord;
  const m=chord.match(/^([A-G][#♯b♭]?)(.*)/);
  if(!m) return chord;
  const nm: Record<string,number>={'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11};
  const nr=m[1].replace('♯','#').replace('♭','b');
  const idx=nm[nr];
  if(idx===undefined) return chord;
  return NOTES[((idx+semitones)+12)%12]+m[2];
}

export function getSignedSemitone(orig: number, tgt: number): number {
  let semi=((tgt-orig)+12)%12;
  if(semi>6) semi-=12;
  return semi;
}

export function bandEnergy(data: Float32Array, sampleRate: number, lo: number, hi: number, bins=22): number[] {
  const fftSize=2048,seg=Math.floor(data.length/bins);
  const loK=Math.round(lo*fftSize/sampleRate),hiK=Math.min(Math.round(hi*fftSize/sampleRate),fftSize/2-1);
  const out: number[]=[];
  for(let s=0;s<bins;s++){
    const start=s*seg;let e=0;
    const f=new Float32Array(fftSize);
    for(let i=0;i<fftSize&&start+i<data.length;i++) f[i]=data[start+i]*(0.5-0.5*Math.cos(2*Math.PI*i/fftSize));
    const stride=Math.max(1,Math.floor(fftSize/64));
    for(let k=loK;k<=hiK;k++){let re=0,im=0;for(let n=0;n<fftSize;n+=stride){const a=2*Math.PI*k*n/fftSize;re+=f[n]*Math.cos(a);im-=f[n]*Math.sin(a);}e+=Math.sqrt(re*re+im*im);}
    out.push(e);
  }
  const mx=Math.max(...out)||1;
  return out.map(v=>Math.max(3,Math.round((v/mx)*60)));
}
