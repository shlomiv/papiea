from typing import Any, List, Optional

from aiohttp import web

from papiea.api import ApiException
from papiea.core import PapieaError


class PapieaBaseException(Exception):
    def __init__(self, message: str, resp: web.Response):
        super().__init__(message)
        self.resp = resp

    @staticmethod
    def raise_error(status: int, reason: str, details: Any, resp: web.Response):
        error = details.get("error")
        if error:
            exception = EXCEPTION_MAP.get(error["type"])
            if exception:
                raise exception(error["message"], resp)
            else:
                raise ApiException(status, reason, details)


class ConflictingEntityException(PapieaBaseException):
    pass


class EntityNotFoundException(PapieaBaseException):
    pass


class PermissionDeniedException(PapieaBaseException):
    pass


class ProcedureInvocationException(PapieaBaseException):
    pass


class UnauthorizedException(PapieaBaseException):
    pass


class ValidationException(PapieaBaseException):
    pass


class BadRequestException(PapieaBaseException):
    pass


class PapieaServerException(PapieaBaseException):
    pass


class InvocationError(Exception):
    def __init__(
            self,
            status_code: int,
            message: str,
            errors: List[Any],
            stack: Optional[str] = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.errors = errors
        self.stack = stack

    @staticmethod
    def from_error(e: Exception):
        return InvocationError(500, str(e), [e])

    def to_response(self) -> dict:
        return {
            "errors": self.errors,
            "message": self.message,
            "stacktrace": self.stack,
        }


class SecurityApiError(InvocationError):
    @staticmethod
    def from_error(e: Exception, message: str):
        return SecurityApiError(500, message, [e])


EXCEPTION_MAP = {
    PapieaError.ConflictingEntity: ConflictingEntityException,
    PapieaError.EntityNotFound: EntityNotFoundException,
    PapieaError.PermissionDenied: PermissionDeniedException,
    PapieaError.ProcedureInvocation: ProcedureInvocationException,
    PapieaError.Unauthorized: UnauthorizedException,
    PapieaError.Validation: ValidationException,
    PapieaError.BadRequest: BadRequestException,
    PapieaError.ServerError: PapieaServerException
}
