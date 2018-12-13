import "jest"

import {MongoConnection} from "../src/databases/mongo";

declare var process : {
    env: {
        MONGO_URL: string,
        MONGO_DB: string
    }
}

describe("MongoDb tests", () => {
    const connection:MongoConnection = new MongoConnection(process.env.MONGO_URL, process.env.MONGO_DB);
    test("Verify Mongo connection open", done => {
        connection.connect((err, db) => {
            if (err)
                done.fail(err);
            else
                done();
        });
    });
    test("Verify Mongo connection close", done => {
        connection.close((err) => {
            if (err)
                done.fail(err);
            else
                done();
        });
    });
})
