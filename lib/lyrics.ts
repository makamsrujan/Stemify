const AUDD_API_KEY = 'test'; // replace with real key at audd.io

export interface LyricsResult {
  title: string;
  artist: string;
  lyrics: string;
  source: string;
  synced: boolean;
  lines?: { time: number; text: string }[];
}

async function fetchAudd(uri: string): Promise<{ title: string; artist: string } | null> {
  try {
    const form = new FormData();
    form.append('url', uri);
    form.append('return', 'apple_music,spotify');
    form.append('api_token', AUDD_API_KEY);
    const res = await fetch('https://api.audd.io/', { method: 'POST', body: form });
    const j = await res.json();
    if (j?.result?.title) return { title: j.result.title, artist: j.result.artist };
  } catch {}
  return null;
}

async function fetchLRCLIB(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    const q = encodeURIComponent(`${title} ${artist}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://lrclib.net/api/search?q=${q}`, { signal: controller.signal });
    clearTimeout(timeout);
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const hit = arr[0];
    if (hit.syncedLyrics) {
      const lines = parseLRC(hit.syncedLyrics);
      return { title: hit.trackName, artist: hit.artistName, lyrics: hit.plainLyrics || stripLRC(hit.syncedLyrics), source: 'LRCLIB', synced: true, lines };
    }
    if (hit.plainLyrics) {
      return { title: hit.trackName, artist: hit.artistName, lyrics: hit.plainLyrics, source: 'LRCLIB', synced: false };
    }
  } catch {}
  return null;
}

async function fetchLyricsOvh(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    const a = encodeURIComponent(artist), t = encodeURIComponent(title);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://api.lyrics.ovh/v1/${a}/${t}`, { signal: controller.signal });
    clearTimeout(timeout);
    const j = await res.json();
    if (j?.lyrics) return { title, artist, lyrics: j.lyrics, source: 'Lyrics.ovh', synced: false };
  } catch {}
  return null;
}

function parseLRC(lrc: string): { time: number; text: string }[] {
  return lrc.split('\n').flatMap(line => {
    const m = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
    if (!m) return [];
    return [{ time: parseInt(m[1]) * 60 + parseFloat(m[2]), text: m[3].trim() }];
  });
}

function stripLRC(lrc: string): string {
  return lrc.split('\n').map(l => l.replace(/\[\d+:\d+\.\d+\]/g, '').trim()).filter(Boolean).join('\n');
}

export async function fetchLyrics(audioUri: string, manualTitle?: string, manualArtist?: string): Promise<LyricsResult | null> {
  let title = manualTitle || '';
  let artist = manualArtist || '';

  if (!title) {
    const detected = await fetchAudd(audioUri);
    if (detected) { title = detected.title; artist = detected.artist; }
  }

  if (!title) return null;

  const lrc = await fetchLRCLIB(title, artist);
  if (lrc) return lrc;

  const ovh = await fetchLyricsOvh(title, artist);
  if (ovh) return ovh;

  return null;
}

export function buildChordSheet(lyrics: string, chords: { name: string; degree: string }[]): string {
  if (!lyrics || chords.length === 0) return lyrics;
  const lines = lyrics.split('\n');
  const chordNames = chords.map(c => c.name);
  const result: string[] = [];
  let ci = 0;
  for (const line of lines) {
    if (line.trim()) {
      const chord = chordNames[ci % chordNames.length];
      result.push(chord);
      ci++;
    }
    result.push(line);
  }
  return result.join('\n');
}
