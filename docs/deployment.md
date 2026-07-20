# Deployment Guide

This project deploys PostgreSQL, the Spring Boot API, and the React frontend as one Docker Compose stack.

## Before the first deployment

1. Install Docker Engine and Docker Compose on the server.
2. Clone the approved `main` branch.
3. Copy `.env.example` to `.env` in the repository root.
4. Set strong values for `POSTGRES_PASSWORD`, `JWT_SECRET`, and `APP_ADMIN_PASSWORD`.
5. Set the new SePay deploy token and the receiving bank account values.
6. Set `CORS_ALLOWED_ORIGINS` to the public frontend origin when the frontend is served from a different domain.

Do not commit `.env` or send its contents through chat.

## Start

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

The first backend start runs Flyway migration `V1` against an empty PostgreSQL database and creates baseline clinic data: roles, permissions, seven departments, six medical services, five lab tests, ten medicines, billing settings, and the configured administrator account.

## Verify

1. Open the frontend at `http://SERVER_IP`.
2. Sign in with `APP_ADMIN_EMAIL` and `APP_ADMIN_PASSWORD`.
3. Create a real doctor and doctor schedule.
4. Check patient booking, lab catalog, medicine catalog, revenue report, and real-time queue updates.
5. Create a small SePay payment and verify it before disabling the old SePay token.

## Operations

```bash
docker compose pull
docker compose up -d --build
docker compose logs -f backend
docker compose down
```

PostgreSQL data and uploaded avatars are stored in named Docker volumes. Back up `postgres_data` before upgrades and do not run the production profile against an existing database without a migration review.
