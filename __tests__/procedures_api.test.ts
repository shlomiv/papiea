import "jest"
import * as http from "http"
import axios from "axios"
import { Provider } from "../src/papiea"
import { getProviderWithSpecOnlyEnitityKindWithOperations } from "./test_data_factory"

declare var process: {
    env: {
        SERVER_PORT: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/entity`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Procedures tests", () => {
    const hostname = '127.0.0.1';
    const port = 9001;
    const provider: Provider = getProviderWithSpecOnlyEnitityKindWithOperations(`http://${hostname}:${port}/`);

    beforeAll(async () => {
        await providerApi.post('/', provider);
    });

    afterAll(async () => {
        await providerApi.delete(`/${provider.prefix}/${provider.version}`);
    });

    test("Call procedure", async (done) => {
        const server = http.createServer((req, res) => {
            if (req.method == 'POST') {
                var body = '';
                req.on('data', function (data) {
                    body += data;
                });
                req.on('end', function () {
                    const post = JSON.parse(body);
                    post.spec.x += post.input;
                    entityApi.put(`/${provider.prefix}/${kind_name}/${post.metadata.uuid}`, {
                        spec: post.spec,
                        metadata: post.metadata  
                    }).then(() => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end(JSON.stringify(post.spec));
                        server.close();
                    }).catch((err) => {
                        console.log(err);
                    });
                });
            }
        });
        server.listen(port, hostname, () => {
            console.log(`Server running at http://${hostname}:${port}/`);
        });
        const kind_name = provider.kinds[0].name;
        const { data: { metadata, spec } } = await entityApi.post(`/${provider.prefix}/${kind_name}`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        const res: any = await entityApi.post(`/${provider.prefix}/${kind_name}/${metadata.uuid}/procedure/moveX`, { input: 5 });
        const updatedEntity: any = await entityApi.get(`/${provider.prefix}/${kind_name}/${metadata.uuid}`);
        expect(updatedEntity.data.metadata.spec_version).toEqual(2);
        expect(updatedEntity.data.spec.x).toEqual(15);
        done();
    });
});