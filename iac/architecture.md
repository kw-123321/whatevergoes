# IaC Architecture

## Overview

This project uses Infrastructure as Code through a Render Blueprint.

The main IaC file is `render.yaml`. It defines how the fitness tracker is deployed on Render.

## How the parts connect

1. Member 1 created the Docker setup using `Dockerfile` and `docker-compose.yml`.
2. Member 2 created `render.yaml` to define the Render service using code.
3. Member 4 uses Render to deploy the application.
4. The application connects to TiDB Cloud, which is MySQL-compatible.

## Architecture Flow

GitHub Repository  
→ Render Blueprint (`render.yaml`)  
→ Docker build using `Dockerfile`  
→ Render Web Service  
→ TiDB Cloud Database

## Important Settings

- Render service name: `fitness-tracker`
- Deployment branch: `main`
- Runtime: Docker
- Application port: `3000`
- Health-check path: `/login.html`
- Database host: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
- Database port: `4000`
- Database name: `test`

## Environment Variables

The application uses these environment variables:

- `DB_HOST`
- `DB_NAME`
- `DB_PASSWORD`
- `DB_PORT`
- `DB_USER`
- `SESSION_SECRET`

Secret values are not written directly inside `render.yaml`. They use `sync: false` and are entered securely in Render.

## Why This Is Infrastructure as Code

The Render setup is written inside a YAML file instead of being created only by clicking settings manually.

This makes the deployment:

- Repeatable
- Consistent
- Easier to manage
- Safer for secret values
