// Sentry dependencies
import * as Sentry from "@sentry/node";

import {
    getCurrentHub,
    SentryPropagator,
    SentrySampler,
    SentrySpanProcessor, setOpenTelemetryContextAsyncContextStrategy, setupEventContextTrace,
    setupGlobalHub, wrapContextManagerClass
} from "@sentry/opentelemetry";


// OpenTelemetry dependencies
import opentelemetry from "@opentelemetry/sdk-node";

import otelApi from "@opentelemetry/api";

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";

import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";


function setupSentry() {
    setupGlobalHub();

    // Make sure to call `Sentry.init` BEFORE initializing the OpenTelemetry SDK
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Undici(),
        ],
        sampleRate: 1.0,
        tracesSampleRate: 1.0,
        debug: true,
        // set the instrumenter to use OpenTelemetry instead of Sentry
        instrumenter: "otel",
    });

    const client = getCurrentHub().getClient();
    if (client == null) {
        throw new Error("Sentry Client must not be null");
    }

    setupEventContextTrace(client);

    // You can wrap whatever local storage context manager you want to use
    const SentryContextManager = wrapContextManagerClass(
        AsyncLocalStorageContextManager
    );

    const sdk = new opentelemetry.NodeSDK({
        // Existing config
        traceExporter: new OTLPTraceExporter(),
        instrumentations: [getNodeAutoInstrumentations()],

        // Sentry config
        spanProcessor: new SentrySpanProcessor(),
        textMapPropagator: new SentryPropagator(),
        contextManager: new SentryContextManager(),
        sampler: new SentrySampler(client),
    });

    // Ensure OpenTelemetry Context & Sentry Hub/Scope is synced
    setOpenTelemetryContextAsyncContextStrategy();

    sdk.start();
}

setupSentry();