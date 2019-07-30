export class InvocationError extends Error {
    status_code: number;
    message: string;

    constructor(status_code: number, message: string, stack?: string) {
        super(message);
        Object.setPrototypeOf(this, InvocationError.prototype);
        this.status_code = status_code;
        this.message = message;
        if (stack !== undefined) {
            this.stack = stack
        }
    }

    static fromError(status_code: number, e: Error, custom_message?: string) {
        if (custom_message !== undefined) {
            return new InvocationError(status_code, custom_message, e.stack)
        }
        return new InvocationError(status_code, e.message, e.stack)
    }

    toResponse() {
        return [{
            message: this.message,
            stacktrace: this.stack
        }]
    }
}

export class ValidationError extends Error {
    errors: string[];

    constructor(errors: Error[]) {
        const messages = errors.map(x => x.message);
        super(JSON.stringify(messages));
        Object.setPrototypeOf(this, ValidationError.prototype);
        this.errors = messages;
    }

    mapErr(fn: (e: string[]) => string) {
        const error_msg = fn(this.errors);
        console.error(error_msg);
        return this.errors.map(e => {
            return {
                message: error_msg,
                reason: e
            }
        })
    }
}