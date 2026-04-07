# API Documentation

All endpoints are under the `/api` base path and return JSON.

## Authentication

### POST /api/auth/signup

Create a new account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass1!"
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 201 | Account created, session cookie set |
| 400 | Validation errors (weak password, invalid email) |
| 409 | Email already in use |

### POST /api/auth/login

Authenticate and receive a session cookie.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass1!"
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Logged in, `auth_token` cookie set |
| 401 | Invalid credentials |

### POST /api/auth/logout

End the current session.

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Session invalidated, cookie cleared |

### GET /api/auth/me

Get the currently authenticated user.

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | `{ id, email }` |
| 401 | Not authenticated |

---

## Sightings

All sightings endpoints require authentication via the `auth_token` cookie.

### GET /api/sightings

List the authenticated user's sightings (paginated).

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Items per page (max 100) |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "species": "Red Fox",
      "description": "Near the river",
      "latitude": 45.123456,
      "longitude": -122.654321,
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-15T10:30:00.000Z",
      "images": ["https://..."],
      "imageUrl": "https://...",
      "syncStatus": "SYNCED"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50
}
```

### POST /api/sightings

Create a new sighting.

**Request Body:**

```json
{
  "species": "Red Fox",
  "description": "Near the river",
  "latitude": 45.123456,
  "longitude": -122.654321,
  "images": [{ "url": "data:image/jpeg;base64,..." }]
}
```

**Validation:**

- `species` (required): non-empty string
- `latitude` (required): number between -90 and 90
- `longitude` (required): number between -180 and 180
- `description` (optional): string
- `seen_at` (optional): ISO 8601 timestamp
- `userId` / `user_id`: rejected (derived from session)

**Responses:**

| Status | Description |
|--------|-------------|
| 201 | Sighting created |
| 400 | Validation errors |
| 401 | Not authenticated |

### GET /api/sightings/:id

Get a single sighting by ID.

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Sighting object (API field names: `animal_name`, `location`, `image_url`) |
| 401 | Not authenticated |
| 403 | Sighting belongs to another user |
| 404 | Sighting not found |

### PUT /api/sightings/:id

Update a sighting. Only the owner can update.

**Request Body (all fields optional):**

```json
{
  "species": "Arctic Fox",
  "description": "Updated location",
  "latitude": 46.0,
  "longitude": -123.0
}
```

Accepts both `species`/`animal_name` and `description`/`location` field names.

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Updated sighting |
| 400 | Validation errors |
| 401 | Not authenticated |
| 404 | Sighting not found or not owned |

### DELETE /api/sightings/:id

Soft-delete a sighting. Only the owner can delete.

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | `{ success: true }` |
| 401 | Not authenticated |
| 404 | Sighting not found or not owned |

### GET /api/sightings/:id/image

Get the image data for a sighting.

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | `{ image_data: "data:image/..." }` |
| 404 | No image found |
