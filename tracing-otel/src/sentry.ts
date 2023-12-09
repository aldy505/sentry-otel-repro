import { captureException, getCurrentHub, runWithAsyncContext } from "@sentry/core";
import type { NodeClient } from "@sentry/node";
import type { Integration } from "@sentry/types";
import { logger } from "@sentry/utils";
import type { FastifyInstance } from "fastify";
import type * as http from "http";

export function isAutoSessionTrackingEnabled(client?: NodeClient): boolean {
    if (client === undefined) {
        return false;
    }
    const clientOptions = client && client.getOptions();
    if (clientOptions && clientOptions.autoSessionTracking !== undefined) {
        return clientOptions.autoSessionTracking;
    }
    return false;
}

export function sentryTraceFromHeader(headers: Record<string, string | string[] | undefined>): string | undefined {
    if (!headers["sentry-trace"]) {
        return undefined;
    }

    const sentryTrace = headers["sentry-trace"];

    if (typeof sentryTrace === "string") {
        return sentryTrace;
    }

    if (Array.isArray(headers["sentry-trace"])) {
        return sentryTrace?.at(0) ?? undefined;
    }

    return undefined;
}

// We do not want to have fastify as a dependency, so we mock the type here

type FastifyPlugin = (fastify: FastifyInstance, _options: unknown, pluginDone: () => void) => void;

type RequestHookHandler = (
    this: FastifyInstance,
    request: http.IncomingMessage,
    reply: unknown,
    done: () => void,
) => void;

const SKIP_OVERRIDE = Symbol.for("skip-override");
const FASTIFY_DISPLAY_NAME = Symbol.for("fastify.display-name");

interface FastifyOptions {
    fastify: FastifyInstance;
}

const fastifyRequestPlugin = (): FastifyPlugin =>
    Object.assign(
        (fastify: FastifyInstance, _options: unknown, pluginDone: () => void) => {
            fastify.addHook("onRequest", (request, _reply, done) => {
                runWithAsyncContext(() => {
                    const currentHub = getCurrentHub();
                    currentHub.configureScope(scope => {
                        scope.setSDKProcessingMetadata({
                            request,
                        });

                        const client = currentHub.getClient<NodeClient>();
                        if (isAutoSessionTrackingEnabled(client)) {
                            const scope = currentHub.getScope();
                            // Set `status` of `RequestSession` to Ok, at the beginning of the request
                            scope.setRequestSession({ status: "ok" });
                        }
                    });

                    done();
                });
            });

            fastify.addHook("onResponse", (_request, _reply, done) => {
                const client = getCurrentHub().getClient<NodeClient>();
                if (isAutoSessionTrackingEnabled(client)) {
                    setImmediate(() => {
                        if (client && client["_captureRequestSession"]) {
                            // Calling _captureRequestSession to capture request session at the end of the request by incrementing
                            // the correct SessionAggregates bucket i.e. crashed, errored or exited
                            client["_captureRequestSession"]();
                        }
                    });
                }

                done();
            });

            pluginDone();
        },
        {
            [SKIP_OVERRIDE]: true,
            [FASTIFY_DISPLAY_NAME]: "SentryFastifyRequestPlugin",
        },
    );

export const fastifyErrorPlugin = (): FastifyPlugin =>
    Object.assign(
        (fastify: FastifyInstance, _options: unknown, pluginDone: () => void) => {
            fastify.addHook("onError", (_request, _reply, error, done) => {
                captureException(error);
                done();
            });

            pluginDone();
        },
        {
            [SKIP_OVERRIDE]: true,
            [FASTIFY_DISPLAY_NAME]: "SentryFastifyErrorPlugin",
        },
    );

/** Capture errors for your fastify app. */
export class SentryFastify implements Integration {
    public static id: string = "Fastify";
    public name: string = SentryFastify.id;

    private _fastify?: FastifyInstance;

    public constructor(options?: FastifyOptions) {
        const fastify = options?.fastify;
        this._fastify = fastify && typeof fastify.register === "function" ? fastify : undefined;

        if (!this._fastify) {
            logger.warn("The Fastify integration expects a fastify instance to be passed. No errors will be captured.");
        }
    }

    /**
     * @inheritDoc
     */
    public setupOnce(): void {
        if (!this._fastify) {
            return;
        }

        void this._fastify.register(fastifyErrorPlugin());
        void this._fastify.register(fastifyRequestPlugin());
    }
}