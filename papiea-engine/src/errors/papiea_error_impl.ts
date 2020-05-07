import { PapieaError } from "papiea-core";
import { EntityNotFoundError, ConflictingEntityError } from "../databases/utils/errors";
import { ValidationError } from "./validation_error";
import { ProcedureInvocationError } from "./procedure_invocation_error";
import { PermissionDeniedError, UnauthorizedError } from "./permission_error";
import { BadRequestError } from "./bad_request_error";
import { PapieaErrorType } from "papiea-core";


export class PapieaErrorImpl implements PapieaError {
    error: {
        errors: { [key: string]: any }[],
        code: number
        message: string,
        type: PapieaErrorType
    }

    constructor(code: number, errorMsg: string, type: PapieaErrorType, errors?: { [key: string]: any }[]) {
        if (errors) {
            this.error = {
                code,
                errors,
                message: errorMsg,
                type
            }
        } else {
            this.error = {
                code,
                errors: [
                    { message: errorMsg }
                ],
                message: errorMsg,
                type
            }
        }

    }

    public get status(): number {
        return this.error.code
    }

    public toResponse() {
        return this
    }

    static create(err: Error) {
        let errorPayload: { message: string }[];
        switch (err.constructor) {
            case BadRequestError:
                return new PapieaErrorImpl(400, "Bad Request", PapieaErrorType.BadRequest,
                    [{ message: err.message }])
            case ValidationError:
                errorPayload = (err as ValidationError).errors.map(description => {
                    return { message: description }
                })
                return new PapieaErrorImpl(400, "Validation failed.", PapieaErrorType.Validation, errorPayload)
            case ProcedureInvocationError:
                return new PapieaErrorImpl((err as ProcedureInvocationError).status, "Procedure invocation failed.", PapieaErrorType.ProcedureInvocation, (err as ProcedureInvocationError).errors)
            case EntityNotFoundError:
                return new PapieaErrorImpl(
                    404,
                    "Entity not found.",
                    PapieaErrorType.EntityNotFound,
                    [{ message: `Entity with kind: ${(err as EntityNotFoundError).kind}, uuid: ${(err as EntityNotFoundError).uuid} not found` }],
                )
            case UnauthorizedError:
                return new PapieaErrorImpl(401, "Unauthorized.", PapieaErrorType.Unauthorized)
            case PermissionDeniedError:
                return new PapieaErrorImpl(403, "Permission denied.", PapieaErrorType.PermissionDenied)
            case ConflictingEntityError:
                let conflictingError = err as ConflictingEntityError
                let metadata = conflictingError.existing_metadata

                return new PapieaErrorImpl(409, `Conflicting Entity: ${metadata.uuid} has version ${metadata.spec_version}`, PapieaErrorType.ConflictingEntity)
            default:
                console.log(`Default handle got error: ${err.message}`)
                return new PapieaErrorImpl(500, err.message, PapieaErrorType.ServerError)
        }
    }
}