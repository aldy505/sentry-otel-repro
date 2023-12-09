import { trace } from "@opentelemetry/api";

export type Post = {
    userId: number;
    id: number;
    title: string;
    body: string;
}
export class Posts {
    public tracer = trace.getTracer("Posts");
    getAllPosts(signal?: AbortSignal): Promise<Post[]> {
        return this.tracer.startActiveSpan("getAllPosts", async (span) => {
            const posts = await fetch("https://jsonplaceholder.typicode.com/posts", { signal });

            const body = await posts.json();

            const validatedSchema = this.validateSchema(body);
            span.end();
            return validatedSchema;
        });
    }

    validateSchema(s: unknown): Post[] {
        return this.tracer.startActiveSpan("validateSchema", (span) => {
            if (!(typeof s === "object")) {
                span.end();
                throw new Error("Invalid schema, expecting object");
            }

            if (Array.isArray(s)) {
                for (const item of s) {
                    if (!item.userId || typeof item.userId !== "number") {
                        span.end();
                        throw new Error("Invalid schema, expending userId to be number");
                    }

                    if (!item.id || typeof item.id !== "number") {
                        span.end();
                        throw new Error("Invalid schema, expecting id to be number");
                    }

                    if (!item.title || typeof item.title !== "string") {
                        span.end();
                        throw new Error("Invalid schema, expecting title to be string");
                    }

                    if (!item.body || typeof item.body !== "string") {
                        span.end();
                        throw new Error("Invalid schema, expecting body to be string");
                    }
                }

                span.end();
                return s;
            }

            span.end();
            throw new Error("Invalid schema, expecting an array");
        });
    }
}