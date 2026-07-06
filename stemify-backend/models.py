from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON
from sqlalchemy.sql import func
from database import Base

class Song(Base):
    __tablename__ = "songs"

    id          = Column(String, primary_key=True)
    file_name   = Column(String, nullable=False)
    title       = Column(String, nullable=True)
    artist      = Column(String, nullable=True)

    # Music theory
    key_name    = Column(String, nullable=False)   # e.g. "G Minor"
    key_root    = Column(Integer, nullable=False)  # 0-11
    key_mode    = Column(String, nullable=False)   # "major" | "minor"
    mode_name   = Column(String, nullable=False)   # "Dorian" etc.
    bpm         = Column(Integer, nullable=False)
    time_sig    = Column(String, nullable=False)   # "4/4" etc.
    confidence  = Column(Integer, nullable=False)
    duration    = Column(Float, nullable=True)

    # Stored arrays
    chroma      = Column(JSON, nullable=True)      # list of 12 floats
    waveform    = Column(JSON, nullable=True)      # list of 300 floats

    # Stems paths (relative to stems_dir)
    stem_vocals = Column(String, nullable=True)
    stem_drums  = Column(String, nullable=True)
    stem_bass   = Column(String, nullable=True)
    stem_other  = Column(String, nullable=True)
    stems_ready = Column(Integer, default=0)       # 0=pending 1=done 2=failed

    lyrics      = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
