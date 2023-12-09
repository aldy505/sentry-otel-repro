import { trace } from "@opentelemetry/api";
export class Fizzbuzz {
    public tracer = trace.getTracer("Fizzbuzz");

    public do(n: number): string[] {
        return this.tracer.startActiveSpan("do", (span) => {
            const output: string[] = [];
            for (let i = 0; i < n; i++) {
                if (i % 3 === 0 && i % 5 === 0) {
                    output.push("FizzBuzz");
                } else if (i % 5 === 0) {
                    output.push("Buzz");
                } else if (i % 3 === 0) {
                    output.push("Fizz");
                } else {
                    output.push(i.toString());
                }
            }

            span.end();
            return output;
        });
    }
}