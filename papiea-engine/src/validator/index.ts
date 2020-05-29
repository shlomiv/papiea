import { ValidationError } from "../errors/validation_error";
import { isEmpty } from "../utils/utils"

const SwaggerModelValidator = require('swagger-model-validator');

export interface Validator {
    validate(data: any, model: any | undefined, models: any, allowExtraProps: boolean, schemaName: string, procedureName?: string): void
}

// We can receive model in 2 forms:
// As user specified in definition, which means it has "properties" field ( { properties: {} } } )
// As procedure returned, which means it is an empty object ( {} )
function modelIsEmpty(model: any) {
    if (isEmpty(model)) {
        return true
    }
    if (model && model.properties !== undefined && model.properties !== null) {
        return isEmpty(model.properties)
    }
    return false
}

export class ValidatorImpl {
    private validator = new SwaggerModelValidator();

    constructor() {
    }

    validate(data: any, model: any | undefined, models: any, allowExtraProps: boolean, schemaName: string, procedureName?: string) {
        const validatorDenyExtraProps = !allowExtraProps
        const allowBlankTarget = false
        if (modelIsEmpty(model)) {
            console.log("Model is empty")
            if (isEmpty(data)) {
                console.log("Data is empty")
                return {valid: true}
            } else {
                throw new ValidationError([{
                    name: "Error",
                    message: procedureName !== undefined
                        ? `${procedureName} with schema ${schemaName} was expecting empty object`
                        : `${schemaName} was expecting empty object`
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
                    message: procedureName !== undefined
                        ? `${procedureName} with schema ${schemaName} was expecting type void`
                        : `${schemaName} was expecting type void`
                }])
            }
        }
    }
}