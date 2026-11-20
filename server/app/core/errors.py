import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

log = logging.getLogger("tandem")


class AppError(Exception):
    def __init__(self, code: str, status: int, message: str, details: list | None = None):
        super().__init__(message)
        self.code, self.status, self.message, self.details = code, status, message, details


def not_authenticated(msg: str = "Not authenticated") -> AppError:
    return AppError("not_authenticated", 401, msg)


def forbidden(msg: str = "Not allowed") -> AppError:
    return AppError("forbidden", 403, msg)


def not_found(msg: str = "Not found") -> AppError:
    return AppError("not_found", 404, msg)


def conflict(code: str, msg: str) -> AppError:
    return AppError(code, 409, msg)


def _envelope(status: int, code: str, message: str, details: list | None = None) -> JSONResponse:
    error: dict = {"code": code, "message": message}
    if details:
        error["details"] = details
    return JSONResponse({"error": error}, status_code=status)


_HTTP_CODES = {401: "not_authenticated", 403: "forbidden", 404: "not_found"}


def register_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        return _envelope(exc.status, exc.code, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError):
        details = [
            {"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return _envelope(422, "validation_error", "Invalid request", details)

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException):
        fallback = "internal_error" if exc.status_code >= 500 else "bad_request"
        return _envelope(
            exc.status_code, _HTTP_CODES.get(exc.status_code, fallback), str(exc.detail)
        )

    @app.exception_handler(Exception)
    async def _unexpected(_: Request, exc: Exception):
        log.exception("unhandled error", exc_info=exc)
        return _envelope(500, "internal_error", "Internal server error")
