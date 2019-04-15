import "jest"
import { UserAuthInfo } from "../src/auth/authn";
import { CasbinAuthorizer, PermissionDeniedError, Action, ReadAction, CreateAction, UpdateAction, DeleteAction } from "../src/auth/authz";
import { resolve } from "path";


describe("Casbin authorizer tests", () => {
    const pathToModel: string = resolve(__dirname, "../src/auth/default_provider_model.txt");
    const pathToPolicy: string = resolve(__dirname, "../src/auth/provider_policy_example.txt");
    const authorizer = new CasbinAuthorizer(pathToModel, pathToPolicy);

    beforeAll(async () => {
        await authorizer.init();
    });

    afterAll(async () => {
    });

    function actionShouldFail(user: UserAuthInfo, object: any, action: Action, done: any) {
        try {
            authorizer.checkPermission(user, object, action);
            done.fail();
        } catch (e) {
            if (e.constructor === PermissionDeniedError) {
                done();
            } else {
                done.fail(e);
            }
        }
    }

    function actionShouldSucceed(user: UserAuthInfo, object: any, action: Action, done: any) {
        try {
            authorizer.checkPermission(user, object, action);
            done();
        } catch (e) {
            done.fail(e);
        }
    }

    test("Alice fails to write an imaged host of another user without rights", async (done) => {
        actionShouldFail(
            { "owner": "alice", "tenant": "1" },
            { "metadata": { "owner": "1alice1", "kind": "imaged_host" } },
            CreateAction,
            done
        );
    });

    test("Alice fails to delete her own imaged_host, which is explicitly denied", async (done) => {
        actionShouldFail(
            { "owner": "alice", "tenant": "1" },
            { "metadata": { "owner": "alice", "kind": "imaged_host" } },
            DeleteAction,
            done
        );
    });

    test("Alice succeeds reading her own imaged host which is explicitly allowed", async (done) => {
        actionShouldSucceed(
            { "owner": "alice", "tenant": "1" },
            { "metadata": { "owner": "alice", "kind": "imaged_host" } },
            ReadAction,
            done
        );
    });

    test("Bob succeeds reading alice's geolocation, which is allowed to read by everyone using the default 'reader_group'", async (done) => {
        actionShouldSucceed(
            { "owner": "bob", "tenant": "1" },
            { "metadata": { "owner": "alice", "kind": "geolocation" } },
            ReadAction,
            done
        );
    });

    test("Bob fails to delete a geolocation since no rule allows for it", async (done) => {
        actionShouldFail(
            { "owner": "bob", "tenant": "1" },
            { "metadata": { "owner": "alice", "kind": "geolocation" } },
            DeleteAction,
            done
        );
    });

    test("Alice succeeds reading a host_type owned by her since it was explicitly allowed", async (done) => {
        actionShouldSucceed(
            { "owner": "alice", "tenant": "1" },
            { "metadata": { "owner": "alice", "kind": "host_type" } },
            ReadAction,
            done
        );
    });

    test("Bill succeeds reading alice's host_type since the reader_group allows it for everyone", async (done) => {
        actionShouldSucceed(
            { "owner": "bill", "tenant": "1" },
            { "metadata": { "owner": "alice", "kind": "host_type" } },
            ReadAction,
            done
        );
    });

    test("Bill fails deleting alice's host_type, since no rule allows it", async (done) => {
        actionShouldFail(
            { "owner": "bill", "tenant": "1" },
            { "metadata": { "owner": "alice", "kind": "host_type" } },
            DeleteAction,
            done
        );
    });

    test("Bill fails deleting alice's imaged_type, since the standard_group only allows deleting to owners", async (done) => {
        actionShouldFail(
            { "owner": "bill", "tenant": "1" },
            { "metadata": { "owner": "alice", "kind": "imaged_host" } },
            DeleteAction,
            done
        );
    });

    test("Bill succeeds deleting his own imaged_type, since the standard_group only allows deleting to owners", async (done) => {
        actionShouldSucceed(
            { "owner": "bill", "tenant": "1" },
            { "metadata": { "owner": "bill", "kind": "imaged_host" } },
            DeleteAction,
            done
        );
    });

    test("Anonymous user is denied reading alice's host_type, by a rule denying anything of anyone's entity", async (done) => {
        actionShouldFail(
            { "owner": "anonymous" },
            { "metadata": { "owner": "alice", "kind": "host_type" } },
            ReadAction,
            done
        );
    });

    test("Admin can delete alice's imaged_host since admin belongs to the admin's group", async (done) => {
        actionShouldSucceed(
            { "owner": "admin" },
            { "metadata": { "owner": "alice", "kind": "imaged_host" } },
            DeleteAction,
            done
        );
    });

    test("Rick can delete alice's imaged_host since he is in her tenant and is a part of tenant_group", async (done) => {
        actionShouldSucceed(
            { "owner": "rick", "tenant": "1" },
            { "metadata": { "owner": "alice", "tenant_uuid": "1", "kind": "imaged_host" } },
            DeleteAction,
            done
        );
    });

    test("Rick fails to delete alice's imaged_cluster since he is in her tenant and is a part of tenant_group but the rule denies deleteing", async (done) => {
        actionShouldFail(
            { "owner": "rick", "tenant": "1" },
            { "metadata": { "owner": "alice", "tenant_uuid": "1", "kind": "imaged_cluster" } },
            DeleteAction,
            done
        );
    });
});