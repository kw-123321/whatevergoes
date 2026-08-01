# IaC Deployment Guide

## Before Deployment

Make sure these files are in the root project folder:

- `Dockerfile`
- `docker-compose.yml`
- `render.yaml`
- `server.js`
- `package.json`

Also make sure `server.js` uses:

```javascript
const PORT = process.env.PORT || 3000;
```

The database connection must use environment variables such as:

```javascript
process.env.DB_HOST
process.env.DB_USER
process.env.DB_PASSWORD
process.env.DB_NAME
process.env.DB_PORT
```

## Deploy Using Render Blueprint

1. Log in to Render.
2. Click **New**.
3. Choose **Blueprint**.
4. Connect the GitHub repository:
   `https://github.com/kw-123321/whatevergoes.git`
5. Select the `main` branch.
6. Render reads the `render.yaml` file.
7. Enter the secret values for:
   - `DB_USER`
   - `DB_PASSWORD`
   - `SESSION_SECRET`
8. Click **Apply** or **Deploy**.
9. Wait for the Docker image to build.
10. Check that the service becomes healthy.
11. Open the website and test `/login.html`.

## Deployment Checks

After deployment, check that:

- The Docker build succeeds.
- The Render service is running.
- The health check passes.
- The login page loads.
- The TiDB Cloud database connects.
- The application can read and save data.

## Common Problems

### Health check fails

Make sure the health-check path is:

```text
/login.html
```

### Database does not connect

Check:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

TiDB Cloud uses port:

```text
4000
```

### Application does not start

Make sure the app listens on:

```javascript
process.env.PORT || 3000
```

## Proof for Presentation

Take screenshots of:

1. `render.yaml`
2. GitHub commit
3. Render Blueprint setup
4. Environment variable names
5. Successful Docker build
6. Healthy Render service
7. Working login page
8. Working database connection
