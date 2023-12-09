import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Fizzbuzz } from "./fizzbuzz.js";
import { Comment, Comments } from "./comments.js";
import { Post, Posts } from "./posts.js";

export class SomeController {
    private fizzbuzz = new Fizzbuzz();
    private comments = new Comments();
    private posts = new Posts();
    private async slow(request: FastifyRequest, reply: FastifyReply) {
        try {
            // Get all posts
            const allPosts: Post[] = await this.posts.getAllPosts();

            // Store later results here
            const results = [];
            // For each post, fetch comments
            const commentPromises: Promise<Comment[]>[] = [];
            for (const post of allPosts) {
                commentPromises.push(this.comments.getComments(post.id));
            }

            for await (const comment of commentPromises) {
                if (comment.length === 0) {
                    continue;
                }

                // Find post based on comment
                const post = allPosts.find((post) => post.id === comment.at(0)?.postId);
                results.push({
                    ...post,
                    comments: comment,
                });
            }

            reply.status(200);
            reply.type("application/json");
            reply.send(results);
        } catch (error) {
            reply.status(500);
            reply.type("application/json");
            reply.send(error);
        }
    }

    private fast(request: FastifyRequest, reply: FastifyReply) {
        const fizzbuzz = this.fizzbuzz.do(100);
        reply.status(200);
        reply.type("application/json");
        reply.send(fizzbuzz);
    }
    public register(fastify: FastifyInstance, opts: Record<never, never>, done: (err?: Error) => void) {
        fastify.get("/slow", (req, res) => this.slow(req, res));
        fastify.get("/fast", (req, res) => this.fast(req, res));
        done();
    }
}