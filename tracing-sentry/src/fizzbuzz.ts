import * as Sentry from "@sentry/node";

export class Fizzbuzz {

    public do(n: number): string[] {
        return Sentry.startSpan({
            name: "Execute FizzBuzz",
            op: "fizzbuzz.do",
        }, () => {
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

            return output;
        });
    }
}