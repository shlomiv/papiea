const SwggerModelValidator = require('swagger-model-validator');

export class ValidationError extends Error {
    type: string;
    errors: Array<string>;

    constructor(errors: Array<Error>) {
        const messages = errors.map(x => x.message);
        super(JSON.stringify(messages));
        Object.setPrototypeOf(this, ValidationError.prototype);
        this.type = "ValidationError";
        this.errors = messages;
    }
}

export class Validator {
    private validator: any;

    constructor() {
        this.validator = new SwggerModelValidator();
    }

    validate(data: any, model: any, models: any): any {
        const res = this.validator.validate(data, model, models);
        if (!res.valid) {
            throw new ValidationError(res.errors);
        }
    }
}