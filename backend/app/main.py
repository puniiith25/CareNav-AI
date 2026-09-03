from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.ai_doctor import router as ai_router
from app.api.auth import router as auth_router
from app.api.clinical import router as clinical_router
from app.api.directory import router as directory_router
from app.api.doctor_portal import router as doctor_router
from app.api.hospital_portal import router as hospital_router
from app.config import settings

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(title="CareNav AI", version="0.1.0", description="AI healthcare navigator + Health Memory. Not a diagnostic service.")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


@app.get("/health")
def health():
    return {"status": "ok", "service": "carenav-ai", "demo_mode": settings.demo_mode}


@app.get("/api/rate-limits")
@limiter.limit("30/minute")
def rate_limits_info(request: Request):
    return {
        "ai_chat": "20/minute",
        "document_processing": "10/minute",
        "authentication": "10/minute",
        "appointments": "20/minute",
        "public_map": "60/minute",
    }


app.include_router(auth_router)
app.include_router(clinical_router)
app.include_router(directory_router)
app.include_router(ai_router)
app.include_router(doctor_router)
app.include_router(hospital_router)

