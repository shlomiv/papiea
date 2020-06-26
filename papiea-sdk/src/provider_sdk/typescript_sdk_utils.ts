import { ErrorDescriptions } from "papiea-core"

export function validate_error_descriptions(error_desc: ErrorDescriptions | undefined) {
    if (error_desc) {
        for (let code of Object.keys(error_desc)) {
            const parsed_code = Number(code)
            if (!Number.isInteger(parsed_code) || !(parsed_code >= 400 && parsed_code <= 599)) {
                throw new Error(`Error description should feature status code in 4xx or 5xx`)
            }
        }
    }
}
