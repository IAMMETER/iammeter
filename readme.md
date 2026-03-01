# IAMMETER App Center

IAMMETER App Center is an open ecosystem for applications built on top of IAMMETER devices and cloud services.

It allows developers to create and publish energy-related applications that integrate with:

- IAMMETER device HTTP API
- IAMMETER Cloud API
- IAMMETER MQTT data streams
- Local device web interfaces

All applications in the App Center are open-source and structured in a standardized format to ensure quality and compatibility.

------

## Two Types of Applications

### 1️⃣ Static Apps (Frontend-only)

Static apps run entirely in the browser.

They can directly communicate with IAMMETER devices because IAMMETER meters support cross-origin requests (CORS) by default.

This makes it possible to build:

- Energy dashboards
- Solar analytics tools
- Real-time monitoring interfaces
- Configuration utilities

No backend service is required.

------

### 2️⃣ Hosted Apps (Backend-based)

Hosted apps include a backend service and are containerized (Docker-based).

They are suitable for:

- Advanced analytics
- AI processing
- Multi-user systems
- WebSocket or API gateways
- Data aggregation services

Hosted apps must pass automated validation and Docker build checks before being accepted.

------

## Standardized Manifest System

Each application must provide a `manifest.json` file that defines:

- App identity
- Runtime type
- Entry path
- Configuration schema
- Links and metadata

All manifests are automatically validated against a JSON schema to ensure consistency across the ecosystem.

------

## Open and Extensible

IAMMETER App Center is designed to:

- Encourage open innovation
- Lower the development barrier
- Support both lightweight frontend tools and full backend systems
- Provide a clean, standardized integration model

Developers are welcome to submit applications through Pull Requests.
 All submissions are automatically validated via CI.