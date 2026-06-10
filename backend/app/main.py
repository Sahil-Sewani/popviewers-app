from fastapi import FastAPI

app = FastAPI(title="PopViewers API")

@app.get("/")
def root():
    return {"message": "PopViewers API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
