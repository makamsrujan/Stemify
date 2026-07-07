# Stemify Backend

FastAPI + Uvicorn backend for Stemify Pro.

## Setup

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env file and fill in your database URL
cp .env.example .env

# 4. Start PostgreSQL (if running locally)
# On Mac: brew install postgresql && brew services start postgresql

# 5. Create the database
createdb stemify

# 6. Run the server
uvicorn main:app --reload --port 8002
```

## API Endpoints

| Method | URL | What it does |
|--------|-----|-------------|
| POST | /songs | Save an analysis from the app |
| GET | /songs | List all songs |
| GET | /songs/search | Search by key, BPM, mode, title, artist |
| GET | /songs/{id} | Get one song |
| POST | /songs/{id}/stems | Upload audio → trigger Demucs separation |
| GET | /songs/{id}/stems/status | Check if stems are ready |
| GET | /songs/{id}/stems/vocals | Stream vocals audio |
| GET | /songs/{id}/stems/drums | Stream drums audio |
| GET | /songs/{id}/stems/bass | Stream bass audio |
| GET | /songs/{id}/stems/other | Stream other audio |
| GET | /health | Health check |

## Interactive API Docs

Visit **http://localhost:8002/docs** after starting the server.
