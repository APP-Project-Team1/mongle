from fastapi import FastAPI

app = FastAPI(title="Mongle API", description="Backend for the Mongle App")

@app.get("/")
def read_root():
    return {"message": "Welcome to Mongle API"}
