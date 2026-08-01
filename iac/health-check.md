# Automatic Health Check

## Enhancement

The project now uses a dedicated `/health` endpoint.

Render checks this endpoint to make sure the application is ready to receive traffic.

## How it works

The route returns HTTP status `200` and a small JSON response:

```json
{
  "status": "healthy",
  "service": "fitness-tracker",
  "uptimeSeconds": 120,
  "timestamp": "..."
}
```

The `render.yaml` file contains:

```yaml
healthCheckPath: /health
```

## Why this is useful

- Render can tell when the application is ready.
- An unhealthy service can be detected quickly.
- The health check does not depend on a normal webpage.
- It gives clear proof that the application server is running.
- It strengthens the Infrastructure as Code setup.

## Testing

Run the application and open:

```text
http://localhost:3000/health
```

On Render, open:

```text
https://YOUR-RENDER-URL.onrender.com/health
```

A successful result should return HTTP `200` and show `"status": "healthy"`.
