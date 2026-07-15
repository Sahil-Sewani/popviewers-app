# PopViewers Load Testing

This directory contains load testing scripts for PopViewers.

## Tool

k6

## Install

```bash
brew install k6
```

## Smoke Test

```bash
k6 run --vus 1 --iterations 1 \
-e API_URL=https://api.popviewers.com \
viewercon.js
```

## Full ViewerCon Test

```bash
k6 run \
-e API_URL=https://api.popviewers.com \
viewercon.js
```

## Production Results

ViewerCon Phase 1

- Successful requests: 4,162
- Failed requests: 0
- p95 latency: 38.94 ms
- Average latency: 36.5 ms
- Peak throughput: 20 requests/sec
- EC2 CPU: 10.7%
- RDS CPU: 5.4%
