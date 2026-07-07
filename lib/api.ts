const BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8001'       // browser on same machine
  : 'http://192.168.1.9:8001';   // phone on local WiFi

export interface SongRecord {
  id: string;
  file_name: string;
  title?: string;
  artist?: string;
  key_name: string;
  key_root: number;
  key_mode: string;
  mode_name: string;
  bpm: number;
  time_sig: string;
  confidence: number;
  duration?: number;
  chroma?: number[];
  waveform?: number[];
  stems_ready: number;
  lyrics?: string;
  created_at: string;
}

export interface SearchParams {
  q?: string;
  key?: string;
  mode?: string;
  bpm_min?: number;
  bpm_max?: number;
  time_sig?: string;
  limit?: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function saveSong(data: {
  id?: string;
  file_name: string;
  title?: string;
  artist?: string;
  key_name: string;
  key_root: number;
  key_mode: string;
  mode_name: string;
  bpm: number;
  time_sig: string;
  confidence: number;
  duration?: number;
  chroma?: number[];
  waveform?: number[];
  lyrics?: string;
}): Promise<SongRecord> {
  return request<SongRecord>('/songs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadForStems(songId: string, audioUri: string, fileName: string, fileObj?: File): Promise<void> {
  const formData = new FormData();
  if (fileObj) {
    formData.append('file', fileObj, fileName);
  } else {
    formData.append('file', { uri: audioUri, name: fileName, type: 'audio/mpeg' } as any);
  }
  const res = await fetch(`${BASE_URL}/songs/${songId}/stems`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
}

export async function getStemsStatus(songId: string): Promise<{ ready: boolean; status: string }> {
  return request(`/songs/${songId}/stems/status`);
}

export function getStemUrl(songId: string, part: 'vocals' | 'drums' | 'bass' | 'other'): string {
  return `${BASE_URL}/songs/${songId}/stems/${part}`;
}

export async function searchSongs(params: SearchParams): Promise<SongRecord[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.key) qs.set('key', params.key);
  if (params.mode) qs.set('mode', params.mode);
  if (params.bpm_min != null) qs.set('bpm_min', String(params.bpm_min));
  if (params.bpm_max != null) qs.set('bpm_max', String(params.bpm_max));
  if (params.time_sig) qs.set('time_sig', params.time_sig);
  if (params.limit) qs.set('limit', String(params.limit));
  return request<SongRecord[]>(`/songs/search?${qs}`);
}

export async function listSongs(limit = 50): Promise<SongRecord[]> {
  return request<SongRecord[]>(`/songs?limit=${limit}`);
}

export async function getSong(id: string): Promise<SongRecord> {
  return request<SongRecord>(`/songs/${id}`);
}

export async function uploadForTranscription(songId: string, audioUri: string, fileName: string, fileObj?: File): Promise<void> {
  const formData = new FormData();
  if (fileObj) {
    formData.append('file', fileObj, fileName);
  } else {
    formData.append('file', { uri: audioUri, name: fileName, type: 'audio/mpeg' } as any);
  }
  const res = await fetch(`${BASE_URL}/songs/${songId}/transcribe`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Transcription upload failed`);
}

export async function getTranscription(songId: string): Promise<{ status: string; notes: Note[] }> {
  return request(`/songs/${songId}/transcribe`);
}

export interface Note {
  pitch: number;
  start: number;
  end: number;
  confidence: number;
}

export async function checkHealth(): Promise<boolean> {
  try {
    await request('/health');
    return true;
  } catch {
    return false;
  }
}
