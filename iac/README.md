# Infrastructure as Code

This project uses a Render Blueprint for Infrastructure as Code.

The `render.yaml` file automatically defines:

- The Render web service
- Docker deployment
- The main GitHub branch
- Port 3000
- The health-check path
- TiDB Cloud database environment variables
- Automatic deployment

Secret values such as the database username, database password, and session secret are not stored in GitHub. They are entered securely in Render.

This makes the deployment easier to repeat and keeps the setup consistent.

Created by kingsley.