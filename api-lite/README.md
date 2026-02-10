# API Lite

This is a small PHP backend that can live alongside WordPress while we migrate endpoints.

## Structure
- `public/index.php` – front controller (router)
- `routes.php` – route table
- `src/Controllers` – request handlers
- `src/Models` – data access
- `src/Services` – shared logic

## Current routes
- `GET /api/ping` – health check
- `GET /api/jobs` – sample list endpoint (reads WP DB)

## Notes
This is intentionally lightweight and framework-free but organized like Laravel for an easy future migration.
