from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.matchmaking import router as matchmaking_router

app = FastAPI(title="Matchmaking Quiz")
app.include_router(matchmaking_router)

FRONTEND = Path(__file__).resolve().parent.parent / "frontend"


@app.get("/health")
async def health():
    return {"message": "Matchmaking Quiz API is running"}


app.mount(
    "/",
    StaticFiles(directory=FRONTEND, html=True),
    name="frontend",
)
