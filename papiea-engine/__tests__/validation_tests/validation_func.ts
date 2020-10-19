export class Location {
    f: string
}

export class Spec {
    x: i32
    y: i32
    location: Location[]
}

export function validate(updated: Spec, old: Spec): bool {
    if (updated.x > 100) {
        return false
    } else {
        return true
    }
}

export function getSpec(): Spec {
    return new Spec()
}

export const SPEC_ID = idof<Spec>()
export const LOCATION_ID = idof<Location>()
