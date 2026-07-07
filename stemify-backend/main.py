import os
import uuid
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
import aiofiles

from config import settings
from database import get_db, init_db
from models import Song
from stems import separate_stems
from transcribe import transcribe_audio
from schemas import SongOut, SongSave, SearchResult

app = FastAPI(title="Stemify Pro", description="Music analysis app - Detect key, BPM, chords, lyrics, and AI stem separation", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.stems_dir, exist_ok=True)
    await init_db()


# ─── Save analysis ──────────────────────────────────────────────────────────[...]

@app.post("/songs", response_model=SongOut)
async def save_song(body: SongSave, db: AsyncSession = Depends(get_db)):
    """Save an analysis result from the app into the database."""
    song = Song(
        id=body.id or str(uuid.uuid4()),
        file_name=body.file_name,
        title=body.title,
        artist=body.artist,
        key_name=body.key_name,
        key_root=body.key_root,
        key_mode=body.key_mode,
        mode_name=body.mode_name,
        bpm=body.bpm,
        time_sig=body.time_sig,
        confidence=body.confidence,
        duration=body.duration,
        chroma=body.chroma,
        waveform=body.waveform,
        lyrics=body.lyrics,
        stems_ready=0,
    )
    db.add(song)
    await db.commit()
    await db.refresh(song)
    return song


# ─── Upload audio + trigger stem separation ───────────────────────────────────

@app.post("/songs/{song_id}/stems")
async def upload_for_stems(
    song_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload audio file and start Demucs stem separation in the background."""
    song = await db.get(Song, song_id)
    if not song:
        raise HTTPException(404, "Song not found")

    max_bytes = settings.max_file_size_mb * 1024 * 1024
    upload_path = Path(settings.upload_dir) / f"{song_id}_{file.filename}"

    async with aiofiles.open(upload_path, "wb") as f:
        size = 0
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                raise HTTPException(413, f"File too large (max {settings.max_file_size_mb}MB)")
            await f.write(chunk)

    background_tasks.add_task(run_stems, song_id, str(upload_path), db)
    return {"status": "processing", "song_id": song_id}


async def run_stems(song_id: str, audio_path: str, db: AsyncSession):
    async with db.begin():
        song = await db.get(Song, song_id)
        if not song:
            return
        try:
            stems = await separate_stems(audio_path, song_id)
            song.stem_vocals = stems.get("vocals")
            song.stem_drums  = stems.get("drums")
            song.stem_bass   = stems.get("bass")
            song.stem_other  = stems.get("other")
            song.stems_ready = 1
        except Exception as e:
            song.stems_ready = 2
        await db.commit()


# ─── Get stem status + stream stem files ─────────────────────────────────────

@app.get("/songs/{song_id}/stems/status")
async def stems_status(song_id: str, db: AsyncSession = Depends(get_db)):
    song = await db.get(Song, song_id)
    if not song:
        raise HTTPException(404, "Song not found")
    return {
        "ready": song.stems_ready == 1,
        "status": ["pending", "done", "failed"][song.stems_ready],
    }


@app.get("/songs/{song_id}/stems/{part}")
async def get_stem(song_id: str, part: str, db: AsyncSession = Depends(get_db)):
    """Stream a stem audio file (vocals / drums / bass / other)."""
    song = await db.get(Song, song_id)
    if not song or song.stems_ready != 1:
        raise HTTPException(404, "Stems not ready")
    path_map = {
        "vocals": song.stem_vocals,
        "drums":  song.stem_drums,
        "bass":   song.stem_bass,
        "other":  song.stem_other,
    }
    path = path_map.get(part)
    if not path or not os.path.exists(path):
        raise HTTPException(404, "Stem file not found")
    return FileResponse(path, media_type="audio/mpeg")


# ─── Search ────────────────────────────────────────────────────────────[...]

@app.get("/songs/search", response_model=list[SearchResult])
async def search_songs(
    q: Optional[str] = Query(None, description="Search by title or artist"),
    key: Optional[str] = Query(None, description="e.g. G Minor"),
    mode: Optional[str] = Query(None, description="e.g. Dorian"),
    bpm_min: Optional[int] = Query(None),
    bpm_max: Optional[int] = Query(None),
    time_sig: Optional[str] = Query(None, description="e.g. 4/4"),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Song)

    if q:
        stmt = stmt.where(or_(
            Song.title.ilike(f"%{q}%"),
            Song.artist.ilike(f"%{q}%"),
            Song.file_name.ilike(f"%{q}%"),
        ))
    if key:
        stmt = stmt.where(Song.key_name.ilike(f"%{key}%"))
    if mode:
        stmt = stmt.where(Song.mode_name.ilike(f"%{mode}%"))
    if bpm_min is not None:
        stmt = stmt.where(Song.bpm >= bpm_min)
    if bpm_max is not None:
        stmt = stmt.where(Song.bpm <= bpm_max)
    if time_sig:
        stmt = stmt.where(Song.time_sig == time_sig)

    stmt = stmt.order_by(Song.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


# ─── Get single song ─────────────────────────────────────────────────────────[...]

@app.get("/songs/{song_id}", response_model=SongOut)
async def get_song(song_id: str, db: AsyncSession = Depends(get_db)):
    song = await db.get(Song, song_id)
    if not song:
        raise HTTPException(404, "Song not found")
    return song


# ─── List all songs ────────────────────────────────────────────────────────[...]

@app.get("/songs", response_model=list[SearchResult])
async def list_songs(limit: int = Query(50, le=200), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Song).order_by(Song.created_at.desc()).limit(limit))
    return result.scalars().all()


# ─── Transcription (Basic Pitch) ──────────────────────────────────────────────

transcription_cache: dict[str, list] = {}

@app.post("/songs/{song_id}/transcribe")
async def transcribe_song(
    song_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload audio and run Basic Pitch transcription in background."""
    song = await db.get(Song, song_id)
    if not song:
        raise HTTPException(404, "Song not found")

    upload_path = Path(settings.upload_dir) / f"transcribe_{song_id}_{file.filename}"
    async with aiofiles.open(upload_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            await f.write(chunk)

    background_tasks.add_task(run_transcription, song_id, str(upload_path))
    return {"status": "processing", "song_id": song_id}


async def run_transcription(song_id: str, audio_path: str):
    try:
        notes = await transcribe_audio(audio_path)
        transcription_cache[song_id] = notes
    except Exception as e:
        transcription_cache[song_id] = []


@app.get("/songs/{song_id}/transcribe")
async def get_transcription(song_id: str):
    """Get transcription result. Returns empty list if still processing."""
    if song_id not in transcription_cache:
        return {"status": "processing", "notes": []}
    return {"status": "done", "notes": transcription_cache[song_id]}


# ─── Health check ──────────────────────────────────────────────────────────[...]

@app.get("/health")
async def health():
    return {"status": "ok"}
