import asyncio
import os
import uuid
from pathlib import Path
from config import settings

async def separate_stems(audio_path: str, song_id: str) -> dict[str, str]:
    """
    Runs Demucs htdemucs model to split audio into 4 stems.
    Returns dict with paths to vocals, drums, bass, other.
    """
    out_dir = Path(settings.stems_dir) / song_id
    out_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        "python", "-m", "demucs",
        "--name", "htdemucs",
        "--out", str(out_dir),
        "--mp3",
        audio_path,
    ]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if proc.returncode != 0:
        raise RuntimeError(f"Demucs failed: {stderr.decode()}")

    # Demucs outputs to: out_dir/htdemucs/<filename>/vocals.mp3 etc.
    src_name = Path(audio_path).stem
    stem_dir = out_dir / "htdemucs" / src_name

    stems = {}
    for part in ["vocals", "drums", "bass", "other"]:
        p = stem_dir / f"{part}.mp3"
        if p.exists():
            stems[part] = str(p)

    return stems
