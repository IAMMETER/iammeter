[toc]

# IAMMETER App Center

# Developer Specification

------

# 1. Overview

IAMMETER App Center is an open ecosystem for applications built on top of:

- IAMMETER device HTTP API
- IAMMETER Cloud API
- IAMMETER MQTT data stream
- IAMMETER device local web interface

All submitted applications must be:

- Open-source
- Structured according to this specification
- Validated automatically via CI

This document defines:

- Supported app types
- Repository structure
- Required files
- Manifest schema requirements
- Validation rules
- Security and design principles

------

# 2. Supported Application Types

IAMMETER App Center supports two runtime models.

------

## 2.1 Static Apps (Frontend-only)

### Definition

A Static App:

- Runs entirely in the browser
- Requires no backend service
- Is hosted under `/apps/{app-id}/frontend/`

### Why Static Apps Are Supported

IAMMETER energy meters enable **CORS by default**.

This allows:

- Direct browser-to-device HTTP API calls
- Direct browser-to-IAMMETER-Cloud calls
- Direct MQTT connections (via WebSocket brokers)

Therefore, many use cases do not require a backend.

### Suitable Use Cases

- Energy dashboards
- Real-time monitoring tools
- Visualization utilities
- Configuration panels
- Solar analytics UI

### Requirements

- Must not require proprietary backend infrastructure
- Must function using IAMMETER APIs or MQTT
- Must include a valid frontend entry path

------

## 2.2 Hosted Apps (Backend Required)

### Definition

A Hosted App:

- Requires a backend service
- Runs in a container
- Is deployed independently from IAMMETER infrastructure

### Suitable Use Cases

- Advanced analytics services
- AI processing
- Data aggregation platforms
- WebSocket relays
- Authentication services
- Multi-user systems

### Requirements

Hosted apps must:

- Provide a valid `Dockerfile`
- Pass `docker build`
- Expose required ports
- Provide a health endpoint (recommended: `/health`)
- Not depend on private IAMMETER infrastructure

------

# 3. Repository Structure

Each application must follow this structure:

```
apps/
  └── {app-id}/
        ├── manifest.json
        ├── frontend/         (for static apps)
        ├── backend/          (for hosted apps, optional)
        └── Dockerfile        (required for hosted apps)
```

Example:

```
apps/example/
apps/template-hosted/
```

------

# 4. manifest.json Specification

Every application must include a valid `manifest.json`.

------

## 4.1 Required Fields

```
{
  "id": "example",
  "name": "Example App",
  "version": "0.1.0",
  "author": "IAMMETER",
  "description": "A minimal example app.",
  "runtime": "static",
  "entry": "apps/example/frontend/"
}
```

### Field Definitions

| Field       | Type   | Required | Description                                           |
| ----------- | ------ | -------- | ----------------------------------------------------- |
| id          | string | Yes      | Unique identifier (lowercase, kebab-case recommended) |
| name        | string | Yes      | Display name                                          |
| version     | string | Yes      | Semantic version (SemVer recommended)                 |
| author      | string | Yes      | Author or organization                                |
| description | string | Yes      | Short description                                     |
| runtime     | string | Yes      | `static` or `hosted`                                  |
| entry       | string | Yes      | Application entry path                                |

------

## 4.2 Optional Fields

```
{
  "tags": ["solar", "dashboard"],
  "links": {
    "source": "https://github.com/...",
    "docs": "https://..."
  }
}
```

Optional fields:

- `tags`
- `links.source`
- `links.docs`

------

# 5. Entry Path Rules

For static apps:

```
"entry": "apps/{app-id}/frontend/"
```

Must:

- Exist in repository
- Contain an `index.html`
- Be directly accessible via static hosting

For hosted apps:

- Entry may represent the frontend path
- Backend must be buildable via Docker

------

# 6. CI Validation Rules

Every Pull Request will be automatically validated.

CI checks include:

### 6.1 Manifest Validation

- JSON syntax validation
- Required fields present
- Valid runtime value
- Entry path exists

### 6.2 Docker Build (Hosted Apps)

If `runtime = "hosted"`:

- `docker build` must succeed
- Dockerfile must exist
- No build errors allowed

### 6.3 App Index Generation

Apps are automatically aggregated into:

```
/apps/index.json
```

Used by the App Center frontend.

------

# 7. Security & Isolation Model

IAMMETER App Center does NOT:

- Execute untrusted backend code
- Host third-party backend services
- Provide runtime server execution

Static apps:

- Run entirely client-side
- Communicate directly with IAMMETER devices or cloud APIs

Hosted apps:

- Must be containerized
- Deployment is independent from IAMMETER core systems

IAMMETER does not assume responsibility for external hosted deployments.

------

# 8. Versioning Policy

All applications must follow Semantic Versioning:

```
MAJOR.MINOR.PATCH
```

- MAJOR → Breaking changes
- MINOR → New features
- PATCH → Bug fixes

Version must be updated when changes are introduced.

------

# 9. Submission Process

1. Fork the repository

2. Create `apps/{your-app-id}/`

3. Add:

   - manifest.json
   - frontend (or backend + Dockerfile)

4. Run local validation:

   ```
   npm run validate:manifests
   ```

5. Submit Pull Request

6. CI must pass

Only validated apps can be merged.

------

# 10. Design Principles

IAMMETER App Center is designed to:

- Encourage open innovation
- Lower the development barrier
- Support browser-native integrations
- Enable backend-augmented energy intelligence
- Keep the ecosystem open and extensible

------

# 11. Future Extensions (Reserved)

The following may be introduced in future versions:

- App permission declaration
- IAMMETER_CONFIG capability declaration
- Cloud integration flags
- App rating metadata
- Signature verification