# API Specification: Animal Sightings PWA

**Version**: 1.0.0  
**Base URL**: `/api` (same-origin in SvelteKit)  
**Date**: 2026-03-05

## Overview

RESTful JSON API exposed by SvelteKit backend for:
- User authentication (signup, login, logout)
- Sighting CRUD (create, read, update, delete)
- Offline sync management
- Session validation

All endpoints return JSON. Errors return standard error object: `{ error: string, status: number }`

---

## Authentication Endpoints

### POST /auth/signup

Create a new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  },
  "session": {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "expires_at": "2026-04-05T12:00:00Z"
  }
}
```

**Errors**:
- 400: `{ error: "Email already exists" }`
- 400: `{ error: "Password must be at least 8 characters with uppercase, lowercase, and digit" }`

**Notes**:
- Signup automatically creates session (auto-login)
- Session token included in `Set-Cookie` header (HTTP-only)

---

### POST /auth/login

Authenticate user with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  },
  "session": {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "expires_at": "2026-04-05T12:00:00Z"
  }
}
```

**Errors**:
- 401: `{ error: "Invalid email or password" }`

**Notes**:
- Session token in `Set-Cookie` header (HTTP-only)
- Token also returned in JSON for client storage if needed

---

### POST /auth/logout

Invalidate current session.

**Request**: Empty body (uses session cookie)

**Response** (200 OK):
```json
{
  "success": true
}
```

**Notes**:
- Clears session from DB
- Client should clear cookies and LocalStorage

---

### GET /auth/me

Validate and return current user session.

**Response** (200 OK):
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }
}
```

**Errors**:
- 401: `{ error: "Unauthorized" }` (no valid session)

**Notes**:
- Used on app load to hydrate user state
- Returns 401 if session expired or invalid

---

## Sightings Endpoints

### GET /sightings

Fetch all sightings for authenticated user.

**Query Parameters** (optional):
- `limit`: Number of results (default 50, max 100)
- `offset`: Pagination offset (default 0)
- `sort`: Sort by `created_at` or `updated_at` (default `created_at` descending)

**Response** (200 OK):
```json
{
  "sightings": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "animal_name": "Red Fox",
      "location": "Central Park, NYC",
      "latitude": 40.785091,
      "longitude": -73.968285,
      "has_image": true,
      "created_at": "2026-03-05T10:30:00Z",
      "updated_at": "2026-03-05T10:30:00Z",
      "is_deleted": false
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

**Errors**:
- 401: Unauthorized (no valid session)

**Notes**:
- Only returns sightings for authenticated user
- Excludes soft-deleted sightings (`is_deleted = false`)
- `has_image` boolean indicates if image exists; to fetch actual image, use GET /sightings/:id/image

---

### POST /sightings

Create a new sighting (without image). Image is managed separately via POST /sightings/:id/image.

**Request**:
```json
{
  "animal_name": "Red Fox",
  "location": "Central Park, NYC",
  "latitude": 40.785091,
  "longitude": -73.968285
}
```

**Response** (201 Created):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "animal_name": "Red Fox",
  "location": "Central Park, NYC",
  "latitude": 40.785091,
  "longitude": -73.968285,
  "has_image": false,
  "created_at": "2026-03-05T10:30:00Z",
  "updated_at": "2026-03-05T10:30:00Z",
  "is_deleted": false
}
```

**Validation**:
- `animal_name`: Required, 1-255 chars
- `location`: Required, 1-500 chars (text description)
- `latitude`: Required, range [-90, 90]
- `longitude`: Required, range [-180, 180]

**Errors**:
- 400: `{ error: "Missing required field: animal_name" }`
- 400: `{ error: "Missing required field: location" }`
- 400: `{ error: "Missing required field: latitude" }`
- 400: `{ error: "Missing required field: longitude" }`
- 400: `{ error: "Invalid latitude: must be between -90 and 90" }`
- 400: `{ error: "Invalid longitude: must be between -180 and 180" }`
- 401: Unauthorized

---

### GET /sightings/:id

Fetch a single sighting by ID.

**Response** (200 OK):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "animal_name": "Red Fox",
  "location": "Central Park, NYC",
  "latitude": 40.785091,
  "longitude": -73.968285,
  "has_image": true,
  "created_at": "2026-03-05T10:30:00Z",
  "updated_at": "2026-03-05T10:30:00Z",
  "is_deleted": false
}
```

**Errors**:
- 404: `{ error: "Sighting not found" }`
- 401: Unauthorized
- 403: Forbidden (not owner of sighting)

**Notes**:
- To fetch the image, use GET /sightings/:id/image

---

### PUT /sightings/:id

Update an existing sighting (image updates via separate endpoints).

**Request**:
```json
{
  "animal_name": "Red Fox (Updated)",
  "location": "Central Park, NYC - North Meadow",
  "latitude": 40.785091,
  "longitude": -73.968285
}
```

**Response** (200 OK):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "updated_at": "2026-03-05T11:00:00Z",
  "success": true
}
```

**Validation**:
- `animal_name`: Required, 1-255 chars
- `location`: Required, 1-500 chars
- `latitude`: Required, range [-90, 90]
- `longitude`: Required, range [-180, 180]

**Errors**:
- 404: Sighting not found
- 401: Unauthorized
- 403: Forbidden (not owner)
- 409: `{ error: "Conflict: resource was modified on server", server_version: "2026-03-05T11:15:00Z" }` (if client `updated_at` doesn't match server)

**Notes**:
- Only owner of sighting can update
- Optional fields can be omitted to leave unchanged
- Server updates `updated_at` automatically
- To update image: DELETE /sightings/:id/image then POST /sightings/:id/image

---

### DELETE /sightings/:id

Delete a sighting (soft delete).

**Response** (200 OK):
```json
{
  "success": true,
  "id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Errors**:
- 404: Sighting not found
- 401: Unauthorized
- 403: Forbidden (not owner)

**Notes**:
- Sets `is_deleted = true` (soft delete for sync safety)
- Sighting not returned in GET /sightings after deletion
- Can be permanently deleted later if needed

---

## Image Endpoints

### POST /sightings/:id/image

Attach or update image to a sighting. Max 1 image per sighting; uploading a new image replaces the old one.

**Request** (multipart/form-data):
```
file: <binary image file or Base64 data URI>
```

Or JSON:
```json
{
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response** (201 Created or 200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "sighting_id": "660e8400-e29b-41d4-a716-446655440001",
  "created_at": "2026-03-05T10:35:00Z",
  "updated_at": "2026-03-05T10:35:00Z"
}
```

**Validation**:
- `image_data` or `file`: Required, max 500KB (pre-compressed on client)
- Supported formats: JPEG, PNG

**Errors**:
- 404: Sighting not found
- 401: Unauthorized
- 403: Forbidden (not owner)
- 400: `{ error: "Image exceeds 500KB limit" }`
- 400: `{ error: "Unsupported image format" }`

**Notes**:
- Uploading new image to sighting with existing image replaces old image
- Triggers update to sighting's `has_image = true`

---

### GET /sightings/:id/image

Fetch image data URI for a sighting.

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "sighting_id": "660e8400-e29b-41d4-a716-446655440001",
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "created_at": "2026-03-05T10:35:00Z",
  "updated_at": "2026-03-05T10:35:00Z"
}
```

**Errors**:
- 404: `{ error: "Image not found" }` (sighting exists but has no image)
- 404: `{ error: "Sighting not found" }`
- 401: Unauthorized
- 403: Forbidden (not owner)

---

### DELETE /sightings/:id/image

Delete image attached to a sighting.

**Response** (200 OK):
```json
{
  "success": true,
  "sighting_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Errors**:
- 404: Image not found
- 404: Sighting not found
- 401: Unauthorized
- 403: Forbidden (not owner)

**Notes**:
- Triggers update to sighting's `has_image = false`
- Deleting a sighting cascades to delete its image

---

## Sync Endpoint

### POST /sync

Batch sync offline operations. Used when client comes online to push pending changes.

**Request**:
```json
{
  "sync_queue": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "action": "CREATE",
      "data": {
        "animal_name": "Red Fox",
        "location": "Park",
        "latitude": 40.785,
        "longitude": -73.968
      },
      "client_timestamp": "2026-03-05T09:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "action": "UPDATE",
      "data": {
        "animal_name": "Fox (Updated)"
      },
      "client_timestamp": "2026-03-05T10:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440003",
      "action": "DELETE",
      "data": null,
      "client_timestamp": "2026-03-05T11:00:00Z"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "synced_ids": ["660e8400-e29b-41d4-a716-446655440001", "660e8400-e29b-41d4-a716-446655440002", "660e8400-e29b-41d4-a716-446655440003"],
  "conflicts": [],
  "synced_at": "2026-03-05T12:00:00Z"
}
```

**Conflict Response** (200 OK with conflicts):
```json
{
  "success": true,
  "synced_ids": ["660e8400-e29b-41d4-a716-446655440001"],
  "conflicts": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "action": "UPDATE",
      "reason": "sighting_not_found",
      "server_version": null,
      "client_version": "2026-03-05T10:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440003",
      "action": "DELETE",
      "reason": "not_found",
      "server_version": null,
      "client_version": "2026-03-05T11:00:00Z"
    }
  ],
  "synced_at": "2026-03-05T12:00:00Z"
}
```

**Processing**:
1. Server applies each operation in order
2. For each conflict (404, permission denied, etc.), adds to `conflicts` array
3. Returns all operations attempted, indicates which succeeded

**Notes**:
- Last-write-wins conflict resolution
- Client timestamp is informational; server uses DB timestamp for ordering
- Client should retry failed operations or prompt user
- **Image sync**: Images are synced separately via POST /sightings/:id/image after sighting creation. The sync_queue only contains sighting metadata (no image_data).
- Sighting's `has_image` boolean is automatically updated during sync based on image table state

---

## Error Handling

All errors return standard format:

```json
{
  "error": "Description of error",
  "status": 400,
  "timestamp": "2026-03-05T12:00:00Z"
}
```

**Common Status Codes**:
- 200: Success
- 201: Created
- 400: Bad request (validation error)
- 401: Unauthorized (no valid session)
- 403: Forbidden (permission denied)
- 404: Not found
- 409: Conflict (e.g., resource modified)
- 500: Server error

---

## Authentication & Authorization

- All endpoints except `/auth/signup` and `/auth/login` require valid session cookie
- Session validation happens via `locals.user` in SvelteKit hooks
- User can only see/modify their own sightings (enforced server-side)

---

## Versioning

API version in contract version (semantic). Breaking changes increment major version.
Client should handle version mismatches gracefully.
