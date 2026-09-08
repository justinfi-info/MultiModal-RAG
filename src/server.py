from fastapi import Body, FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

try:
    from .query_engine import QueryEngine
except ImportError:  # pragma: no cover
    from query_engine import QueryEngine

app = FastAPI(title="MultiModal RAG API")


def get_engine() -> QueryEngine:
    if not hasattr(app.state, "engine"):
        app.state.engine = QueryEngine()
    return app.state.engine


@app.get("/")
def health_check():
    return {"status": "ok", "message": "MultiModal RAG server is running"}


@app.post("/ingest")
async def ingest_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    try:
        pdf_bytes = await file.read()
        result = get_engine().ingest(file.filename, pdf_bytes)
        return JSONResponse(status_code=200, content=result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/query")
async def query_pdf(payload: dict = Body(...)):
    question = payload.get("question")
    session_id = payload.get("session_id")

    if not question or not session_id:
        raise HTTPException(
            status_code=400,
            detail="Both 'question' and 'session_id' are required.",
        )

    try:
        result = get_engine().query(session_id=session_id, question=question)
        return JSONResponse(status_code=200, content=result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
