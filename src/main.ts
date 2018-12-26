import * as express from "express";
import createProviderAPIRouter from "./provider/provider_routes";
import { Provider_API_Dummy } from "./provider/provider_api_dummy";

declare var process: {
    env: {
        SERVER_PORT: string
    },
    title: string;
};
process.title = 'papiea';
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const app = express();
app.use(express.json());
app.use('/provider', createProviderAPIRouter(new Provider_API_Dummy()));
app.use(function (err: any, req: any, res: any, next: any) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
    console.error(err);
    res.json({ error: `${err}` });
});

app.listen(serverPort, function () {
    console.log(`Papiea app listening on port ${serverPort}!`);
});
