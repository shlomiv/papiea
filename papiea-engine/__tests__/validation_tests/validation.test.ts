import "jest"
import { ValidatorImpl } from "../../src/validator";
import { getLocationDataDescription, getSpecOnlyKind, ValidationBuilder } from "../test_data_factory";
import uuid = require("uuid")
import { SpecOnlyEntityKind } from "papiea-core"

describe("Validation tests", () => {

    const locationDataDescription = getLocationDataDescription();
    const trimmedLocationDataDescription = Object.assign({}, locationDataDescription);
    const maybeLocation = Object.values(locationDataDescription)[0];
    const validator = ValidatorImpl.create()

    test("Basic validation should succeed", (done) => {
        const entity = {
            spec: {
                x: 10,
                y: 11
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocation, trimmedLocationDataDescription, false, "trimmedLocation")
        })
    });

    test("Missing required parameter 'x'", (done) => {
        const entity = {
            spec: {
                y: 11
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocation, trimmedLocationDataDescription, false, "trimmedLocation")
        }, true)
    });

    test("Additional expected parameter 'z'", (done) => {
        const entity = {
            spec: {
                x: 10,
                y: 11,
                z: 20
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocation, trimmedLocationDataDescription, false, "trimmedLocation")
        })
    });

    test("Additional unexpected parameter 'k'", (done) => {
        const entity = {
            spec: {
                x: 10,
                y: 11,
                k: 20
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocation, trimmedLocationDataDescription, false, "trimmedLocation")
        }, true)
    });

    test("Parameter x with wrong type string", (done) => {
        const entity = {
            spec: {
                x: "Totally not an integer",
                y: 11,
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocation, trimmedLocationDataDescription, false, "trimmedLocation")
        }, true)
    });

    test("Additional Nested parameter", (done) => {
        const entity = {
            spec: {
                x: 10,
                y: 11,
                v: {
                    d: 10
                }
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocation, trimmedLocationDataDescription, false, "trimmedLocation")
        })
    });

    test("Additional Nested parameter with wrong type", (done) => {
        const entity = {
            spec: {
                x: 10,
                y: 11,
                v: {
                    d: "Totally not a number"
                }
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocation, trimmedLocationDataDescription, false, "trimmedLocation")
        }, true)
    });

    test("Additional Nested parameter with wrong type", (done) => {
        const entity = {
            spec: {
                x: 10,
                y: 11,
                v: {
                    d: "Totally not a number"
                }
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocation, trimmedLocationDataDescription, false, "trimmedLocation")
        }, true)
    });

    let locationDataDescriptionStringParam = getLocationDataDescription();
    const edited_kind_name = Object.keys(locationDataDescriptionStringParam)[0];
    locationDataDescriptionStringParam[edited_kind_name].properties.x.type = "string";
    const trimmedLocationDataDescriptionStringParam = Object.assign({}, locationDataDescription);
    const maybeLocationStringParam = Object.values(locationDataDescriptionStringParam)[0];

    test("Basic validation with string param should succeed", (done) => {
        const entity = {
            spec: {
                x: "String",
                y: 11
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocationStringParam, trimmedLocationDataDescriptionStringParam, false, "trimmedLocation")
        })
    });

    test("Parameter x with wrong type number", (done) => {
        const entity = {
            spec: {
                x: 10,
                y: 11
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocationStringParam, trimmedLocationDataDescriptionStringParam, false, "trimmedLocation")
        }, true)
    });

    test("Required parameter x with empty string", (done) => {
        const entity = {
            spec: {
                x: "",
                y: 11
            }
        };
        const try_validate = ValidationBuilder.createSimpleValidationFunc(done);
        try_validate(() => {
            validator.validate(entity.spec, maybeLocationStringParam, trimmedLocationDataDescriptionStringParam, false, "trimmedLocation")
        })
    });

    const kind = getSpecOnlyKind()
    const kind_with_pattern: SpecOnlyEntityKind = JSON.parse(JSON.stringify(kind))
    kind_with_pattern.uuid_validation_pattern = "^a$"

    test("Validator validate uuid when pattern is not specified", async () => {
        expect.assertions(1)
        const id = uuid()
        expect(() => {
            validator.validate_uuid(kind, id)
        }).not.toThrow()
    });

    test("Validator doesn't validate uuid when pattern is specified", async () => {
        expect.assertions(1)
        const id = uuid()
        expect(() => {
            validator.validate_uuid(kind_with_pattern, id)
        }).toThrow()
    });

    test("Validator validate uuid when pattern is specified", async () => {
        expect.assertions(1)
        const id = "a"
        expect(() => {
            validator.validate_uuid(kind_with_pattern, id)
        }).not.toThrow()
    });

    test("Validator doesn't validate uuid when pattern is specified and uuid is incorrect", async () => {
        expect.assertions(1)
        const id = "b"
        expect(() => {
            validator.validate_uuid(kind_with_pattern, id)
        }).toThrow()
    });
});
