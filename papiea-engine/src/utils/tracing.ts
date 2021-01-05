import { FORMAT_HTTP_HEADERS } from "opentracing"
import { initTracer } from "jaeger-client"
import {NextFunction, Request, Response} from "express"
import {UserAuthInfoRequest} from "../auth/authn"

const defaultServiceName = process.env.JAEGER_SERVICE_NAME ?? "papiea-engine";

const defaultReporter = {
    collectorEndpoint: "http://jaeger:14268/api/traces",
    agentHost: "jaeger",
    agentPort: 6832,
    logSpans: true
};

const defaultSampler = {
    type: "const",
    param: 1
};

const defaultLogger = {
    info: (msg: string) => {
        console.log("JAEGER INFO ", msg);
    },
    error: (msg: string) => {
        console.log("JAEGER ERROR", msg);
    }
};

const defaultOptions = { logger: defaultLogger };

export const track = (operationName: string) => (req: Request, res: Response, next: NextFunction) => {

    const config = {
        serviceName: defaultServiceName,
        reporter: defaultReporter,
        sampler: defaultSampler
    }

    let { headers, path, url, method, body, query, params } = req;
    const tracer = initTracer(config, defaultOptions);
    const context = tracer.extract(FORMAT_HTTP_HEADERS, headers)

    const span = tracer.startSpan(operationName, { childOf: context! });
    span.setTag("http.request.url", url);
    span.setTag("http.request.method", method);
    span.setTag("http.request.path", path);
    span.log({headers}).log({ body }).log({ query }).log({ params });

    tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
    req.headers = headers;
    res.once("finish", () => {
        span.setTag("http.response.status_code", res.statusCode);
        span.setTag("http.response.status_message", res.statusMessage);
        span.finish();
    });

    return next();

};
