import { trace } from "@opentelemetry/api";

export type Comment = {
    postId: number;
    id: number;
    name: string;
    email: string;
    body: string;
}
export class Comments {
    public tracer = trace.getTracer("Posts");
    async getComments(postId?: number, signal?: AbortSignal): Promise<Comment[]> {
        return this.tracer.startActiveSpan("getAllPosts", async (span) => {
            const url = new URL("https://jsonplaceholder.typicode.com/comments");
            if (postId) {
                url.searchParams.set("postId", postId.toString());
            }

            const posts = await fetch(url, { signal });

            const body = await posts.json();

            const validatedSchema = this.validateSchema(body);
            span.end();
            return validatedSchema;
        });
    }

    validateSchema(s: unknown): Comment[] {
        return this.tracer.startActiveSpan("validateSchema", (span) => {
            if (!(typeof s === "object")) {
                span.end();
                throw new Error("Invalid schema, expecting object");
            }

            if (Array.isArray(s)) {
                for (const item of s) {
                    if (!item.postId || typeof item.postId !== "number") {
                        span.end();
                        throw new Error("Invalid schema, expending postId to be number");
                    }

                    if (!item.id || typeof item.id !== "number") {
                        span.end();
                        throw new Error("Invalid schema, expecting id to be number");
                    }

                    if (!item.name || typeof item.name !== "string") {
                        span.end();
                        throw new Error("Invalid schema, expecting name to be string");
                    }

                    if (!item.email || typeof item.email !== "string") {
                        span.end();
                        throw new Error("Invalid schema, expecting email to be string");
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