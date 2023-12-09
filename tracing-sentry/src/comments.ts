import * as Sentry from "@sentry/node";

export type Comment = {
    postId: number;
    id: number;
    name: string;
    email: string;
    body: string;
}
export class Comments {
    async getComments(postId?: number, signal?: AbortSignal): Promise<Comment[]> {
        return Sentry.startSpan({
            name: "Get comments",
            op: "comments.get_comments",
        }, async () => {
            const url = new URL("https://jsonplaceholder.typicode.com/comments");
            if (postId) {
                url.searchParams.set("postId", postId.toString());
            }

            const posts = await fetch(url, { signal });

            const body = await posts.json();

            const validatedSchema = this.validateSchema(body);
            return validatedSchema;
        });
    }

    validateSchema(s: unknown): Comment[] {
        return Sentry.startSpan({
            name: "Validating comment schema",
            op: "comments.validate_schema",
        }, () => {
            if (!(typeof s === "object")) {
                throw new Error("Invalid schema, expecting object");
            }

            if (Array.isArray(s)) {
                for (const item of s) {
                    if (!item.postId || typeof item.postId !== "number") {
                        throw new Error("Invalid schema, expending postId to be number");
                    }

                    if (!item.id || typeof item.id !== "number") {
                        throw new Error("Invalid schema, expecting id to be number");
                    }

                    if (!item.name || typeof item.name !== "string") {
                        throw new Error("Invalid schema, expecting name to be string");
                    }

                    if (!item.email || typeof item.email !== "string") {
                        throw new Error("Invalid schema, expecting email to be string");
                    }

                    if (!item.body || typeof item.body !== "string") {
                        throw new Error("Invalid schema, expecting body to be string");
                    }
                }

                return s;
            }

            throw new Error("Invalid schema, expecting an array");
        });
    }
}