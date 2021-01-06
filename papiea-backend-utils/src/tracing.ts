import {FORMAT_HTTP_HEADERS, Tracer} from "opentracing"
import {initTracer, ReporterConfig, SamplerConfig} from "jaeger-client"
import {NextFunction, Request, Response} from "express"
import {Logger} from "./logging"

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

export function getTracer(serviceName: string, logger: Logger, reporterConfig?: ReporterConfig, samplerConfig?: SamplerConfig): Tracer {
    const config = {
        serviceName: serviceName,
        reporter: reporterConfig ?? defaultReporter,
        sampler: samplerConfig ?? defaultSampler
    }
    return initTracer(config, {logger})
}

export function getTracingMiddleware(tracer: Tracer) {
    return function (operationName: string) {
        return function (req: Request, res: Response, next: NextFunction) {
            let { headers, path, url, method, body, query, params } = req;
            const context = tracer.extract(FORMAT_HTTP_HEADERS, headers)

            const span = tracer.startSpan(operationName, { childOf: context! });
            span.setTag("http.request.url", url);
            span.setTag("http.request.method", method);
            span.setTag("http.request.path", path);
            span.log({headers}).log({ body }).log({ query }).log({ params });

            tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
            res.locals.ctx = {tracer: tracer, span: span, headers: headers}
            req.headers = headers;
            res.once("finish", () => {
                span.setTag("http.response.status_code", res.statusCode);
                span.setTag("http.response.status_message", res.statusMessage);
                span.finish();
            });

            return next();
        }
    }
}
