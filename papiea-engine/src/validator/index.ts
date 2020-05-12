import { ValidationError } from "../errors/validation_error";
import { isEmpty } from "../utils/utils"

const SwaggerModelValidator = require('swagger-model-validator');

export interface Validator {
    validate(data: any, model: any | undefined, models: any, allowExtraProps: boolean): void
}

function modelIsEmpty(model: any) {
    if (model && model.properties !== undefined && model.properties !== null) {
        return isEmpty(model.properties)
    }
    return false
}

export class ValidatorImpl {
    private validator = new SwaggerModelValidator();

    constructor() {
    }

    validate(data: any, model: any | undefined, models: any, allowExtraProps: boolean) {
        const validatorDenyExtraProps = !allowExtraProps
        const allowBlankTarget = false
        if (modelIsEmpty(model)) {
            if (isEmpty(data)) {
                return {valid: true}
            } else {
                throw new ValidationError([{
                    name: "Error",
                    message: "Function was expecting empty object"
                }])
            }
        }
        if (model !== undefined && model !== null) {
            const res = this.validator.validate(data, model, models, allowBlankTarget, validatorDenyExtraProps);
            if (!res.valid) {
                throw new ValidationError(res.errors);
            }
            return res
        } else {
            if (data !== undefined && data !== null && data !== "" && !(Object.entries(data).length === 0 && data.constructor === Object)) {
                throw new ValidationError([{
                    name: "Error",
                    message: "Function was expecting output of type void"
                }])
            }
        }
    }
}