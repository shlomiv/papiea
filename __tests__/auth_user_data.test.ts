import 'jest'
import { deref, parseJwt } from '../src/auth/user_data_evaluator'
import * as _ from "lodash"
import { loadYaml } from "./test_data_factory";

const token =
    {
        token:
        { scope: 'openid',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: '93b3ebdc-8ac6-3181-ab78-42c22a48e345',
          id_token:
          'eyJhbGciOiJSUzI1NiIsIng1dCI6IlpXSXlZVFV6TkRJeFpETXlNVEEzTWpVME5XSTBNMlU1WTJZMFltTXlZMlUzTlRCbVptTmhOdyIsImtpZCI6IlpXSXlZVFV6TkRJeFpETXlNVEEzTWpVME5XSTBNMlU1WTJZMFltTXlZMlUzTlRCbVptTmhOdyJ9.eyJhenAiOiJCWjVhZmlIYTEwVHZ4WmRjVFd2N05aWlVYMjBhIiwic3ViIjoic2hsb21pLnZha25pbkBudXRhbml4LmNvbSIsImF0X2hhc2giOiJ0cmc4YjFHaVlKb2xDdzlSQVg5NW93IiwiZGVmYXVsdF90ZW5hbnQiOiIyNjI1MDVjMS04M2UzLTQxNTgtYTE1My1lMzM3N2FmZDk3OWIiLCJpc3MiOiJodHRwczpcL1wvaWRwLXRlc3QubnV0YW5peC5jb21cL29hdXRoMlwvdG9rZW4iLCJnaXZlbl9uYW1lIjoic2hsb21pIiwiaWF0IjoxNTU0MzE4NDgyLCJ4aV9yb2xlIjoiVzNzaWRHVnVZVzUwTFdSdmJXRnBiaUk2SWpJMk1qVXdOV014TFRnelpUTXROREUxT0MxaE1UVXpMV1V6TXpjM1lXWmtPVGM1WWlJc0luUmxibUZ1ZEMxemRHRjBkWE1pT2lKUVVrOVdTVk5KVDA1RlJDSXNJblJsYm1GdWRDMXVZVzFsSWpvaWNISmhZWE5VWlhOMFVHVndjMmtpTENKeWIyeGxjeUk2VzNzaWJtRnRaU0k2SW1GalkyOTFiblF0WVdSdGFXNGlmU3g3SW01aGJXVWlPaUp1ZFc1bGRDMWhaRzFwYmlKOVhTd2lkR1Z1WVc1MExXOTNibVZ5TFdWdFlXbHNJam9pY0hKaFlYTlVaWE4wVUdWd2MybEFiblYwWVc1cGVDNWpiMjBpTENKaFkyTnZkVzUwWDJGd2NISnZkbVZrSWpwMGNuVmxMQ0owWlc1aGJuUXRjSEp2Y0dWeWRHbGxjeUk2ZXlKelptUmpMV0ZqWTI5MWJuUnBaQ0k2SW5oNWVuUmxjM1FpTENKMFpXNWhiblF0ZFhWcFpDSTZJakkyTWpVd05XTXhMVGd6WlRNdE5ERTFPQzFoTVRVekxXVXpNemMzWVdaa09UYzVZaUo5ZlYwPSIsImF1dGhfdGltZSI6MTU1NDMxODQ4MSwiZXhwIjoxNTU0MzMyODgyLCJlbWFpbCI6InNobG9taS52YWtuaW5AbnV0YW5peC5jb20iLCJhdWQiOlsiQlo1YWZpSGExMFR2eFpkY1RXdjdOWlpVWDIwYSJdLCJsYXN0X25hbWUiOiJ2YWtuaW4iLCJyb2xlIjpbIkFwcGxpY2F0aW9uXC9udW5ldC10ZXN0IiwiQ09NTVVOSVRZIiwiVVNFUl9NR01UIiwiSW50ZXJuYWxcL2V2ZXJ5b25lIl0sImZlZGVyYXRlZF9pZHAiOiJsb2NhbCJ9.gaVjeSy1TBZuU_tPHuEgxFNEjk1stvozIuOHZYCZ98LTsDgPr1dDw2dYrNJTezKPvwoBwfa7GGbR2Ydh-Wt-6KHiZYRNHncyrJAQ-EzdyLn3utHEK_gS2N9GXqYD8DJcdjaFlM5p1DqJRWYa6r35cM4P4sgsTDs2gYx5pbsIjqhbB-11S3uxaU_JLToLa92HwlgMP1hdJ7oK5OH_g-h99OmtURXQdnZxcrs9ZX_uZBb9Kul4n5lQpVO2SxiIM9xqWliSCkee8DevXHNGNAN9IAi0F8NBd6jZXlh8SJbdrH66uPQJUDYPb09Sc3hqXUD54Lg7fLII7sGIuL_5_o6sCQ',
          access_token:
          'eyJhbGciOiJSUzI1NiJ9.eyJhenAiOiJCWjVhZmlIYTEwVHZ4WmRjVFd2N05aWlVYMjBhIiwic3ViIjoic2hsb21pLnZha25pbkBudXRhbml4LmNvbSIsImRlZmF1bHRfdGVuYW50IjoiMjYyNTA1YzEtODNlMy00MTU4LWExNTMtZTMzNzdhZmQ5NzliIiwiaXNzIjoiaHR0cHM6XC9cL2lkcC10ZXN0Lm51dGFuaXguY29tXC9vYXV0aDJcL3Rva2VuIiwiZ2l2ZW5fbmFtZSI6InNobG9taSIsImlhdCI6MTU1NDMxODQ4MiwiZXhwIjoxNTU0MzIyMDgyLCJlbWFpbCI6InNobG9taS52YWtuaW5AbnV0YW5peC5jb20iLCJsYXN0X25hbWUiOiJ2YWtuaW4iLCJhdWQiOlsiQlo1YWZpSGExMFR2eFpkY1RXdjdOWlpVWDIwYSJdLCJyb2xlIjoiQXBwbGljYXRpb25cL251bmV0LXRlc3QsQ09NTVVOSVRZLFVTRVJfTUdNVCxJbnRlcm5hbFwvZXZlcnlvbmUiLCJqdGkiOiI2YjFjN2YzOS1hY2UwLTQxMDgtYTg1OC0wMTliODI2MWJiMmYiLCJ1c2VyX2lkIjoiZDVkY2YyODEtNDMwYS00OTMzLWFkNzAtZWUxMGFlZWQyNmE4In0.Kjh7gLRzwHvnH2KTHgrJW2n2dJ00jMncHK0ulzsG0WtngfmUbCgQmq--fbk6IkuN2e4bAujcmns1dL_ICeKHeTtxwoVh5LoTFNJR9WZlw9nRT-HQSOkfBOiF2K6ANrinQasKuFc0wzmD6TlflYEENblE1TIzkzBr6ARh8sZlypVMyUS4kAeZphV_IF9CYixZQgUsil3sCj4MvUN7kzeNJbBKenn1uYCSgVFY0c-I9y46LGpn3sRecu6HdBvLmfvPNnTaj5w8KKqmh6tBnId7YXk8UUi_0aWmwLGcrQk84JAmHWINoOxqmampjYoaH2wgW2oOboKbyy0BZTh-M4cfEw',
          expires_at: "now"} };

describe("ParseJwt", () => {
    test ("no token", (done)=>{
        expect(parseJwt("")).toEqual({header:{}, content:{}});
        done()
    });

    test ("empty token", (done)=>{
        expect(parseJwt(".")).toEqual({header:{}, content:{}});
        done()
    });

    test("parse valid token", (done)=>{
        expect(parseJwt(token.token.access_token)).toEqual(
            {
                "content": {
                    "aud": [
                        "BZ5afiHa10TvxZdcTWv7NZZUX20a",
                    ],
                    "azp": "BZ5afiHa10TvxZdcTWv7NZZUX20a",
                    "default_tenant": "262505c1-83e3-4158-a153-e3377afd979b",
                    "email": "shlomi.vaknin@nutanix.com",
                    "exp": 1554322082,
                    "given_name": "shlomi",
                    "iat": 1554318482,
                    "iss": "https://idp-test.nutanix.com/oauth2/token",
                    "jti": "6b1c7f39-ace0-4108-a858-019b8261bb2f",
                    "last_name": "vaknin",
                    "role": "Application/nunet-test,COMMUNITY,USER_MGMT,Internal/everyone",
                    "sub": "shlomi.vaknin@nutanix.com",
                    "user_id": "d5dcf281-430a-4933-ad70-ee10aeed26a8",
                },
                "header": {
                    "alg": "RS256",
                },
            }
        );
        done()
    })
});

// Todo(Shlomi): the following tests non-exported functions, we should use rewire or something

//describe("Validating getters", ()=>{
//    test("get_reference should fail on non-references", done=>{
//        try {
//            get_reference("no-reference")
//            done.fail("Error not thrown")
//        } catch (err) {
//            expect(err.message).toEqual(`'no-reference' not a reference.`)
//            done()
//        }
//    })
//    
//})

describe("Test deref", ()=> {
    test("direct", done=>{
        let env = {'g':'q'};
        expect(deref(env, '^g')).toEqual('q');
        done()
    });

    test("single reference", done=>{
        let env = {'a':{'q':2}, 'b':'^a'};
        expect(deref(env, '^b')).toEqual({'q':2});
        expect(deref(env, '^b.q')).toEqual(2);
        done()
    });

    test("multiple references", done=>{
        let env = {'a':{'q':2}, 'b':'^a', 'g':'^b', 'q':'^g'};
        expect(deref(env, '^q')).toEqual({'q':2});
        expect(deref(env, '^q.q')).toEqual(2);
        done()
    });

    test("deref should memoize", done=>{
        let env = {'a':{'q':2}, 'b':'^a', 'g':'^b', 'q':'^g'};
        deref(env, '^q');
        expect(env).toEqual({"a": {"q": 2}, "b": {"q": 2}, "g": {"q": 2}, "q": {"q": 2}});
        done()
    });

    test("deref on non-reference returns the input", done=>{
        let env = {};
            expect(deref(env, 'no-reference')).toEqual('no-reference');
            done()
    });

    test("deref on invalid variable should throw an error", done=>{
        let env = {};
        try {
            deref(env, '^none');
            done.fail("Error not thrown")
        } catch (err) {
            expect(err.message).toEqual(`Variable, index or key 'none' not found`);
            done()
        }
    });

    test("deref with find without args", done=>{
        let env = {t:'t'};
        try {
            deref(env, '^t.$find');
            done.fail("Error not thrown")
        } catch (err) {
            expect(err.message).toEqual("no params found for 'find' function");
            done()
        }
    });

    test("deref with find with bad args", done=>{
        let env = {t:'t'};
        try {
            let a = deref(env, '^t.$find(asdasd)');
            done.fail("Error not thrown")
        } catch (err) {
            expect(err.message)
                .toEqual(`bad params found for 'find' function. asdasd`);
            done()
        }
    });

    test("deref on token", done=>{
        let env = {token:token.token};
        expect(deref(env, "^token.scope")).toEqual("openid");
        expect(deref(env, "^token.id_token.$JWT.content.given_name")).toEqual("shlomi");
        expect(deref(env, "^token.id_token.$JWT.content.xi_role.$JWT.header.0.roles.1.name")).toEqual("nunet-admin");
        done()
    })
});

describe("Evaluating a full yaml file", () => {
    const doc = loadYaml("./auth.yaml");

    const headers = doc.oauth.user_info.headers;
    let env = _.omit(doc.oauth.user_info, ['headers']);

    // Insert the token into the enviroment
    env.token = token.token;

    test("Headers", (done) => {
        try {
            const the_headers = _.mapValues(headers, (v: any) => deref(env, v));
            expect(the_headers).toEqual(
                {
                    "tenant-email": "shlomi.vaknin@nutanix.com",
                    "tenant-id": "262505c1-83e3-4158-a153-e3377afd979b",
                    "tenant-fname": "shlomi",
                    "tenant-lname": "vaknin",
                    "tenant-role": "account-admin",
                });
            done()
        } catch (e) {
            done.fail(e)
        }
    })
});
