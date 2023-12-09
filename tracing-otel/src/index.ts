import * as Sentry from "@sentry/node";
import Fastify from "fastify";
import { SentryFastify } from "./sentry.js";
import { SomeController } from "./controller.js";

const app = Fastify({
    logger: true, // Set this to false if you think it affect the performance
    trustProxy: true,
    connectionTimeout: 60 * 1000,
    keepAliveTimeout: 60 * 1000,
    caseSensitive: true,
    return503OnClosing: true,
});

Sentry.addIntegration(new SentryFastify({ fastify: app }));

app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    Sentry.getCurrentHub()?.captureException(error);
    reply.status(500).send({ error: "Internal server error", message: "Something's wrong with the server" });
});

const controller = new SomeController();
app.register((fastify, opts, done) => controller.register(fastify, opts, done));


const abortController = new AbortController();
async function terminate(sig: string): Promise<void> {
    await app.close();
    await Sentry.close(5000);
    abortController.abort(`Received ${sig}`);
}
process.on("SIGINT", () => terminate("SIGINT"));
process.on("SIGTERM", () => terminate("SIGTERM"));

app.listen({ port: 3000, host: "0.0.0.0", signal: abortController.signal }, (error, address) => {
    if (error) {
        app.log.error(error);
        Sentry.captureException(error);
        process.exit(1);
    }
});