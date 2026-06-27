# WebSocket Architecture

## Goals

- Deliver near-real-time market updates and alert notifications
- Maintain stable, low-latency connections for active users
- Support future scaling with a dedicated real-time gateway if needed

## Design Direction

- Use Socket.IO for the initial real-time channel layer
- Separate event namespaces by domain such as market data and notifications
- Authenticate connections and authorize event subscriptions
- Provide reconnect and heartbeat handling for mobile reliability
