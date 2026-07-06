import asyncio
from pathlib import Path

async def transcribe_audio(audio_path: str) -> list[dict]:
    """
    Run Basic Pitch on an audio file.
    Returns list of notes: { pitch, start, end, confidence }
    pitch = MIDI note number (60 = middle C)
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_basic_pitch, audio_path)

def _run_basic_pitch(audio_path: str) -> list[dict]:
    from basic_pitch.inference import predict
    from basic_pitch import ICASSP_2022_MODEL_PATH

    model_output, midi_data, note_events = predict(
        audio_path,
        ICASSP_2022_MODEL_PATH,
        onset_threshold=0.5,
        frame_threshold=0.3,
        minimum_note_length=0.05,
        minimum_frequency=32.7,
        maximum_frequency=2093.0,
        multiple_pitch_bends=False,
        melodia_trick=True,
    )

    notes = []
    for note in note_events:
        start, end, pitch, amplitude, _ = note
        notes.append({
            "pitch": int(pitch),
            "start": float(start),
            "end": float(end),
            "confidence": float(amplitude),
        })

    # Sort by start time, limit to first 200 notes for performance
    notes.sort(key=lambda n: n["start"])
    return notes[:200]
