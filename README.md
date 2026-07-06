# Stemify Pro

A professional music analysis app built with React Native (Expo) + Python backend.

Pick any audio file — Stemify Pro instantly detects the key, BPM, mode, chords, time signature, and more. Connect the backend for AI stem separation (Demucs) and note-for-note transcription (Basic Pitch).

---

## Features

| Feature | Description |
|---------|-------------|
| **Key Detection** | Chromagram + Pearson correlation against Krumhansl profiles |
| **BPM Detection** | Onset energy flux analysis |
| **7 Musical Modes** | Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian |
| **Extended Chords** | maj7, m7, dom7, m9, sus4, dim7, aug and more |
| **Exotic Scales** | Blues, Pentatonic, Whole Tone, Diminished, Harmonic Minor, Chromatic |
| **Time Signatures** | 4/4, 3/4, 6/8, 5/4, 7/8, 9/8, 12/8, 11/8 |
| **Lyrics** | AudD fingerprint → LRCLIB (synced) → Lyrics.ovh cascade |
| **Transpose** | Shift key up/down by semitone, all chords update live |
| **Sheet Music** | Staff notation + piano roll via Basic Pitch AI |
| **AI Stems** | Vocals / Drums / Bass / Other via Meta's Demucs |
| **Cloud Database** | Search your analysis history by key, BPM, mode |
| **History** | All analyses saved locally on device |

---

## Project Structure

```
stemify-pro/          ← React Native app (Expo)
├── app/              ← Screens (Expo Router)
│   ├── index.tsx     ← Home screen
│   ├── history.tsx   ← Analysis history
│   ├── search.tsx    ← Cloud database search
│   ├── settings.tsx  ← Settings
│   └── results/      ← 7 result tabs
│       ├── overview.tsx    ← Key, BPM, waveform, chromagram
│       ├── theory.tsx      ← Mode, scale, time signature
│       ├── chords.tsx      ← Diatonic, extended, exotic chords
│       ├── lyrics.tsx      ← Lyrics fetching
│       ├── stems.tsx       ← AI stem separation
│       ├── sheet.tsx       ← Sheet music / piano roll
│       ├── transpose.tsx   ← Key transposer
│       └── meter.tsx       ← Time signature visualizer
├── lib/
│   ├── dsp.ts        ← Audio analysis (key, BPM, chords, waveform)
│   ├── lyrics.ts     ← Lyrics fetching cascade
│   ├── storage.ts    ← Local history (AsyncStorage)
│   ├── api.ts        ← Backend API client
│   └── AnalysisContext.tsx ← Shared analysis state
├── constants/
│   └── theme.ts      ← Colors, music theory data
└── stemify-backend/  ← Python FastAPI backend
    ├── main.py       ← API endpoints
    ├── stems.py      ← Demucs stem separation
    ├── transcribe.py ← Basic Pitch transcription
    ├── models.py     ← Database models
    └── schemas.py    ← Pydantic schemas
```

---

## Running the App

### Mobile / Web (Expo)

```bash
cd stemify-pro
npm install
npx expo start          # scan QR with Expo Go
npx expo start --web    # open in browser
```

### Backend (Python)

```bash
cd stemify-pro/stemify-backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
pip install basic-pitch   # for sheet music transcription

# requires PostgreSQL running
createdb stemify
uvicorn main:app --reload --port 8000
```

Backend API docs available at **http://localhost:8000/docs**

---

## Build for Production

```bash
# Android APK (for testing)
eas build --platform android --profile preview

# Android AAB (for Play Store)
eas build --platform android

# iOS
eas build --platform ios
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile framework | React Native + Expo SDK 56 |
| Navigation | Expo Router (file-based) |
| Audio analysis | Custom DSP (FFT, Pearson correlation) |
| AI stem separation | Meta Demucs (htdemucs model) |
| AI transcription | Spotify Basic Pitch |
| Backend | FastAPI + Uvicorn |
| Database | PostgreSQL + SQLAlchemy |
| Local storage | AsyncStorage |
| Charts | react-native-svg |

---

## Design

- **Theme:** Dark Studio
- **Colors:** Black `#0a0a0a` · Green `#1DB954` · Purple `#B49DFF`
- **Font:** System (San Francisco / Roboto)

---

## License

MIT
