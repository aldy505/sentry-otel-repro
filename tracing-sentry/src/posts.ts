import * as Sentry from "@sentry/node";

export type Post = {
    userId: number;
    id: number;
    title: string;
    body: string;
}
export class Posts {
    getAllPosts(signal?: AbortSignal): Promise<Post[]> {
        return Sentry.startSpan({
            name: "Get all posts",
            op: "posts.get_all_posts",
        }, async () => {
            const posts = await fetch("https://jsonplaceholder.typicode.com/posts", { signal });

            const body = await posts.json();

            const validatedSchema = this.validateSchema(body);
            return validatedSchema;
        });
    }

    validateSchema(s: unknown): Post[] {
        return Sentry.startSpan({
            name: "Validate post schema",
            op: "posts.validate_schema",
        }, () => {
            if (!(typeof s === "object")) {
                throw new Error("Invalid schema, expecting object");
            }

            if (Array.isArray(s)) {
                for (const item of s) {
                    if (!item.userId || typeof item.userId !== "number") {
                        throw new Error("Invalid schema, expending userId to be number");
                    }

                    if (!item.id || typeof item.id !== "number") {
                        throw new Error("Invalid schema, expecting id to be number");
                    }

                    if (!item.title || typeof item.title !== "string") {
                        throw new Error("Invalid schema, expecting title to be string");
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