# ADR-001: Use Nest for API framework

Date: 2026-01-31
Status: Accepted

Context
- The API will grow across custom orders, store orders, and design review workflows.
- We want a TypeScript-first backend that aligns with the React frontend.

Decision
- Use Node + Nest as the API framework.

Alternatives
- Node + Express
- Python + FastAPI

Consequences
- More structure and boilerplate, but better scalability and consistency.
- Shared TypeScript types are possible across frontend and backend.