# Sentry OTel Repro

Based on a convo me and @AbhiPrasad had a few days ago. This repo provides 2 endpoint: `/fast` which just do
a fizzbuzz loop from 0 to 100, and `/slow` which makes tons of outgoing HTTP call.

Set your `SENTRY_DSN` as an environment variable.

On Linux: `export SENTRY_DSN=https://....ingest.sentry.io/123`
On Windows: `$env:SENTRY_DSN="https://....ingest.sentry.io/123"`

## Run steps

1. `pnpm install`
2. `cd tracing-otel && pnpm run start`, then it should be running at `localhost:3000`
    ```http
    GET http://localhost:3000/slow
    ```
    
    ```http
    GET http://localhost:3000/fast
    ```

3. `cd tracing-sentry && pnpm run start`, then it should be running at `localhost:5000`
    ```http
    GET http://localhost:5000/slow
    ```

    ```http
    GET http://localhost:5000/fast
    ```
   
Or if you have [k6](https://k6.io/) ready:

1. `cd benchmark`
2. `k6 run otel-fast.js`
3. `k6 run sentry-fast.js`
4. `k6 run otel-slow.js`
5. `k6 run sentry-slow.js`

## Benchmark Results

### OTel Fast endpoint

```
  execution: local
     script: otel-fast.js
     output: -

  scenarios: (100.00%) 1 scenario, 10 max VUs, 1m0s max duration (incl. graceful stop):
           * default: 10 looping VUs for 30s (gracefulStop: 30s)


     data_received..................: 237 kB 7.8 kB/s
     data_sent......................: 25 kB  827 B/s
     http_req_blocked...............: avg=449.8µs  min=0s  med=0s     max=13.36ms p(90)=0s       p(95)=0s
     http_req_connecting............: avg=33.31µs  min=0s  med=0s     max=999.4µs p(90)=0s       p(95)=0s
     http_req_duration..............: avg=10.31ms  min=1ms med=7.87ms max=55.91ms p(90)=21.7ms   p(95)=27.17ms
       { expected_response:true }...: avg=10.31ms  min=1ms med=7.87ms max=55.91ms p(90)=21.7ms   p(95)=27.17ms
     http_req_failed................: 0.00%  ✓ 0        ✗ 300
     http_req_receiving.............: avg=101.87µs min=0s  med=0s     max=1.52ms  p(90)=512.48µs p(95)=999.7µs
     http_req_sending...............: avg=17.13µs  min=0s  med=0s     max=1ms     p(90)=0s       p(95)=0s
     http_req_tls_handshaking.......: avg=0s       min=0s  med=0s     max=0s      p(90)=0s       p(95)=0s
     http_req_waiting...............: avg=10.19ms  min=1ms med=7.8ms  max=55.91ms p(90)=21.54ms  p(95)=27.17ms
     http_reqs......................: 300    9.846181/s
     iteration_duration.............: avg=1.01s    min=1s  med=1.01s  max=1.07s   p(90)=1.02s    p(95)=1.03s
     iterations.....................: 300    9.846181/s
     vus............................: 10     min=10     max=10
     vus_max........................: 10     min=10     max=10

                                                                                                                                                                                                                                    
running (0m30.5s), 00/10 VUs, 300 complete and 0 interrupted iterations                                                                                                                                                             
default ✓ [======================================] 10 VUs  30s
```

### Sentry Fast endpoint

```
  execution: local
     script: sentry-fast.js
     output: -

  scenarios: (100.00%) 1 scenario, 10 max VUs, 1m0s max duration (incl. graceful stop):
           * default: 10 looping VUs for 30s (gracefulStop: 30s)


     data_received..................: 237 kB 7.8 kB/s
     data_sent......................: 25 kB  828 B/s
     http_req_blocked...............: avg=447.59µs min=0s      med=0s     max=13.11ms p(90)=0s       p(95)=25.58µs
     http_req_connecting............: avg=26.92µs  min=0s      med=0s     max=807.8µs p(90)=0s       p(95)=0s
     http_req_duration..............: avg=7.86ms   min=506.2µs med=5.21ms max=55.78ms p(90)=16.5ms   p(95)=26.15ms
       { expected_response:true }...: avg=7.86ms   min=506.2µs med=5.21ms max=55.78ms p(90)=16.5ms   p(95)=26.15ms
     http_req_failed................: 0.00%  ✓ 0        ✗ 300
     http_req_receiving.............: avg=94.72µs  min=0s      med=0s     max=2.58ms  p(90)=375.33µs p(95)=764.33µs
     http_req_sending...............: avg=22.61µs  min=0s      med=0s     max=1.51ms  p(90)=0s       p(95)=98.13µs
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s     max=0s      p(90)=0s       p(95)=0s
     http_req_waiting...............: avg=7.74ms   min=506.2µs med=5.14ms max=55.78ms p(90)=16.24ms  p(95)=26.15ms
     http_reqs......................: 300    9.860055/s
     iteration_duration.............: avg=1.01s    min=1s      med=1.01s  max=1.07s   p(90)=1.01s    p(95)=1.03s
     iterations.....................: 300    9.860055/s
     vus............................: 10     min=10     max=10
     vus_max........................: 10     min=10     max=10

                                                                                                                                                                                                                                    
running (0m30.4s), 00/10 VUs, 300 complete and 0 interrupted iterations                                                                                                                                                             
default ✓ [======================================] 10 VUs  30s
```
