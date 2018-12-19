import "jest"

import {MongoConnection} from "../src/databases/mongo";
import {Spec_DB} from "../src/databases/spec_db_interface";
import {Status_DB} from "../src/databases/status_db_interface";
import {Provider_DB} from "../src/databases/provider_db_interface";
import * as core from "../src/core";
import {v4 as uuid4} from 'uuid';
import {Kind, Provider} from "../src/papiea";

declare var process: {
    env: {
        MONGO_URL: string,
        MONGO_DB: string
    }
};

describe("MongoDb tests", () => {
    const connection: MongoConnection = new MongoConnection(process.env.MONGO_URL, process.env.MONGO_DB);
    beforeEach(() => {
        jest.setTimeout(50000);
    });
    beforeAll(done => {
        connection.connect((err) => {
            if (err)
                done.fail(err);
            else
                done();
        });
    });
    afterAll(done => {
        connection.close((err) => {
            if (err)
                done.fail(err);
            else
                done();
        });
    });
    let specDb: Spec_DB | undefined;
    test("Get Spec_DB", done => {
        connection.get_spec_db().then(res => {
            specDb = res;
            done();
        }).catch(err => {
            done.fail(err);
        });
    });
    let entityA_uuid = uuid4();
    test("Insert Spec", done => {
        if (specDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        let entity_metadata: core.Metadata = {
            uuid: entityA_uuid,
            kind: "test",
            spec_version: 0,
            created_at: new Date(),
            delete_at: null
        };
        let spec: core.Spec = {a: "A"};
        specDb.update_spec(entity_metadata, spec).then(res => {
            done();
        }).catch(err => {
            expect(err).toBeNull();
            done();
        });
    });
    test("Update Spec", done => {
        if (specDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        let entity_metadata: core.Metadata = {
            uuid: entityA_uuid,
            kind: "test",
            spec_version: 1,
            created_at: new Date(),
            delete_at: null
        };
        let spec: core.Spec = {a: "A1"};
        specDb.update_spec(entity_metadata, spec).then(res => {
            done();
        }).catch(err => {
            expect(err).toBeNull();
            done();
        });
    });
    test("Update Spec with same version should fail", done => {
        expect.assertions(2);
        if (specDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        let entity_metadata: core.Metadata = {
            uuid: entityA_uuid,
            kind: "test",
            spec_version: 1,
            created_at: new Date(),
            delete_at: null
        };
        let spec: core.Spec = {a: "A2"};
        specDb.update_spec(entity_metadata, spec).then(res => {
            const [metadata, spec, err] = res;
            expect(err).not.toBeNull();
            if (metadata == undefined) {
                return done.fail(new Error("Should return existing entity"))
            }
            if (spec == undefined) {
                return done.fail(new Error("Should return existing entity"))
            }
            expect(metadata.spec_version).toEqual(2);
            done();
        });
    });
    test("Get Spec", done => {
        expect.assertions(2);
        if (specDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        let entity_ref: core.Entity_Reference = {uuid: entityA_uuid, kind: "test"};
        specDb.get_spec(entity_ref).then(res => {
            const [metadata, spec] = res;
            if (metadata === undefined || spec === undefined) {
                done.fail(new Error("no data returned"));
                return;
            }
            expect(metadata.uuid).toEqual(entity_ref.uuid);
            expect(spec.a).toEqual("A1");
            done();
        });
    });
    test("Get Spec for non existing entity should fail", done => {
        expect.assertions(1);
        if (specDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        let entity_ref: core.Entity_Reference = {uuid: uuid4(), kind: "test"};
        specDb.get_spec(entity_ref).catch(err => {
            expect(err).not.toBeNull();
            done();
        });
    });
    test("List Specs", done => {
        expect.assertions(2);
        if (specDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        specDb.list_specs({"metadata.kind": "test"}).then(res => {
            expect(res).not.toBeNull();
            if (res === undefined) {
                done.fail(new Error("No data returned"));
                return;
            }
            expect(res.length).toBeGreaterThanOrEqual(1);
            done();
        });
    });
    test("List Specs - check spec data", done => {
        expect.assertions(3);
        if (specDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        specDb.list_specs({"metadata.kind": "test"}).then(res => {
            expect(res).not.toBeNull();
            if (res === undefined) {
                done.fail(new Error("No data returned"));
                return;
            }
            expect(res.length).toBeGreaterThanOrEqual(1);
            expect(res[0][1].a).toEqual("A1");
            done();
        });
    });
    let statusDb: Status_DB | undefined;
    test("Get Status_DB", done => {
        connection.get_status_db().then(res => {
            statusDb = res;
            done();
        }).catch(err => {
            done.fail(err);
        });
    });
    test("Insert Status", done => {
        if (statusDb === undefined) {
            done.fail(new Error("statusDb is undefined"));
            return;
        }
        let entity_ref: core.Entity_Reference = {uuid: entityA_uuid, kind: "test"};
        let status: core.Status = {a: "A"};
        statusDb.update_status(entity_ref, status).then(res => {
            done();
        }).catch(err => {
            done.fail(err);
        });
    });
    test("Update Status", done => {
        if (statusDb === undefined) {
            done.fail(new Error("statusDb is undefined"));
            return;
        }
        let entity_ref: core.Entity_Reference = {uuid: entityA_uuid, kind: "test"};
        let status: core.Status = {a: "A1"};
        statusDb.update_status(entity_ref, status).then(res => {
            done();
        }).catch(err => {
            done.fail(err);
        });
    });
    test("Get Status", done => {
        expect.assertions(2);
        if (statusDb === undefined) {
            done.fail(new Error("statusDb is undefined"));
            return;
        }
        let entity_ref: core.Entity_Reference = {uuid: entityA_uuid, kind: "test"};
        statusDb.get_status(entity_ref).then(res => {
            const [metadata, status] = res;
            if (metadata === undefined || status === undefined) {
                done.fail(new Error("no data returned"))
            } else {
                expect(metadata.uuid).toEqual(entity_ref.uuid);
                expect(status.a).toEqual("A1");
                done();
            }
        });
    });
    test("Get Status for non existing entity should fail", done => {
        expect.assertions(1);
        if (statusDb === undefined) {
            done.fail(new Error("statusDb is undefined"));
            return;
        }
        let entity_ref: core.Entity_Reference = {uuid: uuid4(), kind: "test"};
        statusDb.get_status(entity_ref).catch(err => {
            expect(err).not.toBeNull();
            done();
        });
    });
    test("List Statuses", done => {
        expect.assertions(2);
        if (statusDb === undefined) {
            done.fail(new Error("statusDb is undefined"));
            return;
        }
        statusDb.list_status({"metadata.kind": "test"}).then(res => {
            expect(res).not.toBeNull();
            if (res === undefined) {
                done.fail(new Error("no data returned"));
                return;
            }
            expect(res.length).toBeGreaterThanOrEqual(1);
            done();
        });
    });
    test("List Statuses - check status data", done => {
        expect.assertions(3);
        if (statusDb === undefined) {
            done.fail(new Error("statusDb is undefined"));
            return;
        }
        statusDb.list_status({"metadata.kind": "test", "status.a": "A1"}).then(res => {
            expect(res).not.toBeNull();
            if (res === undefined) {
                done.fail(new Error("no data returned"));
                return;
            }
            expect(res.length).toBeGreaterThanOrEqual(1);
            expect(res[0][1].a).toEqual("A1");
            done();
        });
    });
    let providerDb: Provider_DB | undefined;
    test("Get Provider Db", done => {
        connection.get_provider_db().then(res => {
            providerDb = res;
            done();
        }).catch(err => {
            done.fail(err)
        })
    });
    let provider_uuid = uuid4();
    test("Register Provider", done => {
        if (providerDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        const test_kind = {} as Kind;
        const provider: Provider = {"uuid": provider_uuid, prefix: "test", version: "0.1", kinds: [test_kind]};
        providerDb.register_provider(provider).then(res => {
            done();
        });
    });
    test("Get provider", done => {
        expect.assertions(2);
        if (providerDb === undefined) {
            done.fail(new Error("providerDb is undefined"));
            return;
        }
        let prefix_string: string = "test";
        let version: string = "0.1";
        providerDb.get_provider(prefix_string, version).then(res => {
            expect(res).not.toBeUndefined();
            expect(res.uuid).toBe(provider_uuid);
            done();
        })
    });
    test("Get non-existing provider fail", done => {
        expect.assertions(1);
        if (providerDb === undefined) {
            done.fail(new Error("providerDb is undefined"));
            return;
        }
        let prefix_string: string = "testFail";
        let version: string = "0.1";
        providerDb.get_provider(prefix_string, version).catch(err => {
            expect(err).not.toBeNull();
            done();
        })
    });
    test("List Providers", done => {
        expect.assertions(3);
        if (providerDb === undefined) {
            done.fail(new Error("providerDb is undefined"));
            return;
        }
        providerDb.list_providers().then(res => {
            expect(res).not.toBeNull();
            expect(res).not.toBeUndefined();
            expect(res.length).toBeGreaterThanOrEqual(1);
            done();
        })
    });
    test("Delete provider", done => {
        expect.assertions(1);
        if (providerDb === undefined) {
            done.fail(new Error("providerDb is undefined"));
            return;
        }
        providerDb.delete_provider(provider_uuid).then(res => {
            expect(res).toBeTruthy();
            done();
        })
    })
});
