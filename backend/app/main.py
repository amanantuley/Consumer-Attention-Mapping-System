from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import auth, stores, video, users, roles
from .services.batch_writer import BatchWriterWorker

batch_worker = BatchWriterWorker()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    batch_worker.start()
    yield
    # Shutdown
    batch_worker.stop()


app = FastAPI(
    title="AI Consumer Attention Mapping System", 
    version="0.1.0", 
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(roles.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(stores.router, prefix="/api/v1")
app.include_router(video.router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "AI Consumer Attention Mapping System API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
