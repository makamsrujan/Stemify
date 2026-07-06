from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SongSave(BaseModel):
    id: Optional[str] = None
    file_name: str
    title: Optional[str] = None
    artist: Optional[str] = None
    key_name: str
    key_root: int
    key_mode: str
    mode_name: str
    bpm: int
    time_sig: str
    confidence: int
    duration: Optional[float] = None
    chroma: Optional[list[float]] = None
    waveform: Optional[list[float]] = None
    lyrics: Optional[str] = None

class SongOut(BaseModel):
    id: str
    file_name: str
    title: Optional[str]
    artist: Optional[str]
    key_name: str
    key_root: int
    key_mode: str
    mode_name: str
    bpm: int
    time_sig: str
    confidence: int
    duration: Optional[float]
    chroma: Optional[list[float]]
    waveform: Optional[list[float]]
    stems_ready: int
    lyrics: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class SearchResult(BaseModel):
    id: str
    file_name: str
    title: Optional[str]
    artist: Optional[str]
    key_name: str
    mode_name: str
    bpm: int
    time_sig: str
    confidence: int
    stems_ready: int
    created_at: datetime

    class Config:
        from_attributes = True
