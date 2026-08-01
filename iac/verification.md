# IaC Verification Checklist

Use this checklist to prove that the Infrastructure as Code setup works.

- [ ] `render.yaml` is in the project root
- [ ] `iac/README.md` exists
- [ ] `iac/architecture.md` exists
- [ ] `iac/deployment.md` exists
- [ ] Render detects the Blueprint
- [ ] Docker image builds successfully
- [ ] Service name is `fitness-tracker`
- [ ] Deployment branch is `main`
- [ ] Health-check path is `/login.html`
- [ ] Port is `3000`
- [ ] TiDB Cloud port is `4000`
- [ ] Secret values are not stored in GitHub
- [ ] Render service becomes healthy
- [ ] Login page opens
- [ ] Database connection works
- [ ] GitHub commit shows kingsley contribution
