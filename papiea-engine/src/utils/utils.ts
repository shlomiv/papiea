import { SortParams } from "../entity/entity_api_impl"
import { ValidationError } from "../errors/validation_error"
import { AxiosError } from "axios"

function validatePaginationParams(offset: number | undefined, limit: number | undefined) {
    if (offset !== undefined) {
        if (offset <= 0) {
            throw new ValidationError([new Error("Offset should not be less or equal to zero")])
        }
    }
    if (limit !== undefined) {
        if (limit <= 0) {
            throw new ValidationError([new Error("Limit should not be less or equal to zero")])
        }
    }
}

export function processPaginationParams(
    offset: number | undefined, limit: number | undefined,
): [number, number] {
    let skip = 0
    let size = 30
    if (!offset && !limit) {
        validatePaginationParams(offset, limit)
        return [skip, size]
    }
    if (!offset && limit) {
        validatePaginationParams(offset, limit)
        size = Number(limit)
        return [skip, size]
    }
    if (offset && !limit) {
        validatePaginationParams(offset, limit)
        skip = Number(offset)
        return [skip, size]
    }
    validatePaginationParams(offset, limit)
    size = Number(limit)
    skip = Number(offset)
    return [skip, size]
}

export function processSortQuery(query: string | undefined): undefined | SortParams {
    if (query === undefined) {
        return undefined
    }
    const processedQuery: SortParams = {}
    const splitFields = query.split(",")
    splitFields.forEach(fieldQuery => {
        const [field, sortOrd] = fieldQuery.split(":")
        switch (sortOrd) {
            case "asc":
                processedQuery[field] = 1
                break
            case "desc":
                processedQuery[field] = -1
                break
            case undefined:
                processedQuery[field] = 1
                break
            default:
                throw new ValidationError([new Error("Sorting key's value must be either 'asc' or 'desc'")])
        }
    })
    return processedQuery
}

export function isEmpty(obj: any) {
    // JS type system note:
    // axios returns "" as response.data if no data was returned
    // thus if a procedure returns "" it is considered as no response
    if (obj === undefined || obj === null || obj === "") {
        return false
    }
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false
        }
    }
    return true
}

export function safeJSONParse(chunk: string): object | null {
    try {
        return JSON.parse(chunk)
    } catch (e) {
        console.error(`Safe json parse failed: ${e}, Falling back to undefined`)
        return null
    }
}

export function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function getRandomInt(min: number, max: number) {
    const min_val = Math.ceil(min)
    const max_val = Math.floor(max)
    return Math.floor(Math.random() * (max_val - min_val + 1)) + min_val
}

export function isAxiosError(e: Error): e is AxiosError {
    return e.hasOwnProperty("response")
}

export function isObject(item: any): item is object {
    return (item && typeof item === "object" && !Array.isArray(item))
}

export function deepMerge(target: any, ...sources: any[]): any {
    if (!sources.length) return target
    const source = sources.shift()

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            // @ts-ignore
            if (isObject(source[key])) {
                // @ts-ignore
                if (!target[key]) Object.assign(target, { [key]: {} })
                // @ts-ignore
                deepMerge(target[key], source[key])
            } else {
                // @ts-ignore
                Object.assign(target, { [key]: source[key] })
            }
        }
    }

    return deepMerge(target, ...sources)
}
