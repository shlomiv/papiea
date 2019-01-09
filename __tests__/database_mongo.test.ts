import "jest"

import { MongoConnection } from "../src/databases/mongo";
import { Spec_DB } from "../src/databases/spec_db_interface";
import { Status_DB } from "../src/databases/status_db_interface";
import { Provider_DB } from "../src/databases/provider_db_interface";
import * as core from "../src/core";
import { v4 as uuid4 } from 'uuid';
import { Kind, Provider } from "../src/papiea";
import { ConflictingEntityError } from "../src/databases/utils/errors";

declare var process: {
    env: {
        MONGO_URL: string,
        MONGO_DB: string
    }
};

describe("MongoDb tests", () => {
    const connection: MongoConnection = new MongoConnection(process.env.MONGO_URL || 'mongodb://mongo:27017', process.env.MONGO_DB || 'papiea');
    beforeEach(() => {
        jest.setTimeout(50000);
    });
    beforeAll(done => {
        connection.connect().then(done).catch(done.fail);
    });
    afterAll(done => {
        connection.close().then(done).catch(done.fail);
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
    const entityA_uuid = uuid4();
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
            deleted_at: undefined
        };
        let spec: core.Spec = { a: "A" };
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
            deleted_at: undefined
        };
        let spec: core.Spec = { a: "A1" };
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
            deleted_at: undefined
        };
        let spec: core.Spec = { a: "A2" };
        specDb.update_spec(entity_metadata, spec).catch(err => {
            expect(err).toBeInstanceOf(ConflictingEntityError);
            expect(err.existing_metadata.spec_version).toEqual(2);
            done();
        });
    });
    test("Get Spec", done => {
        expect.assertions(5);
        if (specDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        let entity_ref: core.Entity_Reference = { uuid: entityA_uuid, kind: "test" };
        specDb.get_spec(entity_ref).then(res => {
            expect(res).not.toBeNull();
            if (res === null) {
                done.fail("Entity without spec");
                return;
            }
            const [metadata, spec] = res;
            expect(metadata.uuid).toEqual(entity_ref.uuid);
            expect(metadata.created_at).not.toBeNull();
            expect(metadata.deleted_at).toBeFalsy();
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
        let entity_ref: core.Entity_Reference = { uuid: uuid4(), kind: "test" };
        specDb.get_spec(entity_ref).catch(err => {
            expect(err).not.toBeNull();
            done();
        });
    });
    test("List Specs", done => {
        expect.assertions(1);
        if (specDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        specDb.list_specs({ "metadata.kind": "test" }).then(res => {
            expect(res.length).toBeGreaterThanOrEqual(1);
            done();
        });
    });
    test("List Specs - check spec data", done => {
        expect.assertions(4);
        if (specDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        specDb.list_specs({ "metadata.kind": "test", "spec.a": "A1" }).then(res => {
            expect(res).not.toBeNull();
            expect(res[0]).not.toBeNull();
            expect(res.length).toBeGreaterThanOrEqual(1);
            // @ts-ignore
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
        let entity_ref: core.Entity_Reference = { uuid: entityA_uuid, kind: "test" };
        let status: core.Status = { a: "A" };
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
        let entity_ref: core.Entity_Reference = { uuid: entityA_uuid, kind: "test" };
        let status: core.Status = { a: "A1" };
        statusDb.update_status(entity_ref, status).then(res => {
            done();
        }).catch(err => {
            done.fail(err);
        });
    });
    test("Get Status", done => {
        expect.assertions(3);
        if (statusDb === undefined) {
            done.fail(new Error("statusDb is undefined"));
            return;
        }
        let entity_ref: core.Entity_Reference = { uuid: entityA_uuid, kind: "test" };
        statusDb.get_status(entity_ref).then(res => {
            expect(res).not.toBeNull();
            if (res === null) {
                done.fail("Entity without status");
                return;
            }
            const [metadata, status] = res;
            expect(metadata.uuid).toEqual(entity_ref.uuid);
            expect(status.a).toEqual("A1");
            done();
        });
    });
    test("Get Status for non existing entity should fail", done => {
        expect.assertions(1);
        if (statusDb === undefined) {
            done.fail(new Error("statusDb is undefined"));
            return;
        }
        let entity_ref: core.Entity_Reference = { uuid: uuid4(), kind: "test" };
        statusDb.get_status(entity_ref).catch(err => {
            expect(err).not.toBeNull();
            done();
        });
    });
    test("List Statuses", done => {
        expect.assertions(1);
        if (statusDb === undefined) {
            done.fail(new Error("statusDb is undefined"));
            return;
        }
        statusDb.list_status({ "metadata.kind": "test" }).then(res => {
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
        statusDb.list_status({ "metadata.kind": "test", "status.a": "A1" }).then(res => {
            expect(res.length).toBeGreaterThanOrEqual(1);
            expect(res[0]).not.toBeNull();
            // @ts-ignore
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
    test("Register Provider", done => {
        if (providerDb === undefined) {
            done.fail(new Error("specDb is undefined"));
            return;
        }
        const test_kind = {} as Kind;
        const provider: Provider = { prefix: "test", version: "0.1.0", kinds: [test_kind] };
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
        let version: string = "0.1.0";
        providerDb.get_provider(prefix_string, version).then(res => {
            expect(res.prefix).toBe(prefix_string);
            expect(res.version).toBe(version);
            done();
        })
    });
    test("Get provider using his prefix", done => {
        expect.assertions(2);
        if (providerDb === undefined) {
            done.fail(new Error("providerDb is undefined"));
            return;
        }
        let prefix_string: string = "test";
        let version: string = "0.1.0";
        providerDb.get_provider(prefix_string).then(res => {
            expect(res.prefix).toBe(prefix_string);
            expect(res.version).toBe(version);
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
        let version: string = "0.1.0";
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
        if (providerDb === undefined) {
            done.fail(new Error("providerDb is undefined"));
            return;
        }
        let prefix_string: string = "test";
        let version: string = "0.1.0";
        providerDb.delete_provider(prefix_string, version).then(res => {
            done();
        })
    })
});
