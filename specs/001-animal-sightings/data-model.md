# Data Model

**Feature**: Animal Sightings PWA  
**Framework**: SvelteKit with Drizzle ORM + PostgreSQL  
**Status**: Phase 1 Design

## Core Entities

### 1. User

**Purpose**: Represents an authenticated user who records animal sightings.

**Fields**:
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, auto-generated | Unique user identifier |
| `email` | varchar(255) | UNIQUE, NOT NULL | Email for login |
| `password_hash` | varchar(255) | NOT NULL | Hashed password (bcrypt/argon2) |
| `created_at` | timestamp | DEFAULT NOW() | Account creation time |

**Validation Rules**:
- Email must be valid email format (RFC 5322)
- Password must be ≥8 characters, contain uppercase, lowercase, digit
- Email uniqueness enforced at DB level

**State Transitions**:
- `Created` → `Active` (after signup)
- `Active` → `Inactive` (optional: if delete account feature added)

**Relationships**:
- One User → Many Sightings (1:N via `sightings.user_id`)
- One User → Many Sessions (1:N via `sessions.user_id`)

---

### 2. Sighting

**Purpose**: Represents a single animal observation with location, timestamp, and optional image reference.

**Fields**:
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, auto-generated | Unique sighting identifier |
| `user_id` | UUID | FOREIGN KEY (users.id), NOT NULL | Owner of sighting |
| `animal_name` | varchar(255) | NOT NULL | Name/type of animal (e.g., "Red Fox", "House Cat") |
| `location` | varchar(500) | NOT NULL | Location description (e.g., "Central Park, NYC" or free text) |
| `latitude` | real | NOT NULL | GPS latitude (always present, either auto-captured or manually entered) |
| `longitude` | real | NOT NULL | GPS longitude (always present, either auto-captured or manually entered) |
| `has_image` | boolean | DEFAULT false | Whether an associated image exists in images table |
| `created_at` | timestamp | DEFAULT NOW() | When sighting was recorded |
| `updated_at` | timestamp | DEFAULT NOW(), auto-update | Last modification time (for sync conflict detection) |
| `is_deleted` | boolean | DEFAULT false | Soft delete flag (for offline sync) |

**Validation Rules**:
- `animal_name`: 1-255 characters, non-empty
- `location`: 1-500 characters, non-empty (text description)
- `latitude`: Required, range [-90, 90]
- `longitude`: Required, range [-180, 180]
- `has_image`: Automatically set by database (do not set directly)
- Must have `animal_name`, `location`, `latitude`, and `longitude`; all required

**State Transitions**:
```
Created → Synced (after /api/sync completes)
         ↓
Updated → Synced
         ↓
Deleted (is_deleted = true) → Synced
```

**Relationships**:
- Many Sightings → One User (N:1 via `user_id`)
- One Sighting → One optional Image (1:opt via images.sighting_id UNIQUE)

**Client-Side Only** (not in DB):
| Field | Type | Purpose |
|-------|------|---------|
| `sync_status` | enum | `pending`, `syncing`, `synced`, `conflict` |
| `offline_created` | boolean | Whether created while offline (for UI indication) |

---

### 3. Session

**Purpose**: Tracks authenticated user sessions for login/logout.

**Fields**:
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, auto-generated | Session identifier |
| `user_id` | UUID | FOREIGN KEY (users.id), NOT NULL | User owning session |
| `token` | varchar(255) | UNIQUE, NOT NULL | Secure session token |
| `expires_at` | timestamp | NOT NULL | When session expires (e.g., 30 days) |
| `created_at` | timestamp | DEFAULT NOW() | When session was created |

**Validation Rules**:
- `token`: Random, cryptographically secure (min 32 bytes)
- `expires_at`: Must be in future

**Relationships**:
- Many Sessions → One User (N:1 via `user_id`)

---

### 4. Image

**Purpose**: Stores one-to-one optional image attachment to a sighting as a data URI.

**Fields**:
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, auto-generated | Unique image identifier |
| `sighting_id` | UUID | FOREIGN KEY (sightings.id), NOT NULL, UNIQUE | Links to exactly one sighting; UNIQUE enforces max 1 image per sighting |
| `image_data` | text | NOT NULL | Base64-encoded data URI (e.g., `data:image/jpeg;base64,...`) |
| `created_at` | timestamp | DEFAULT NOW() | When image was uploaded |
| `updated_at` | timestamp | DEFAULT NOW() | When image was last modified |

**Validation Rules**:
- `image_data`: Must be valid Base64 data URI, max 500KB (pre-compressed on client)
- `sighting_id`: Must reference existing sighting; UNIQUE constraint enforces 1:1 relationship
- Supported formats: JPEG, PNG

**Relationships**:
- One Image → One Sighting (1:1 via `sighting_id` UNIQUE)

---

## Relationships Diagram

```
User (1) ──── (N) Sighting ──── (opt 1) Image
  │                  (max 1 image per sighting)
  │
  └──── (N) Session
```

**Data Flow**:
```
Client (IndexedDB) ─────sync_queue──────→ Server (PostgreSQL)
  ├─ sightings table                         ├─ users table
  ├─ sync_queue table                        ├─ sightings table (has_image bool)
  └─ metadata (last_synced_at)              ├─ images table (one-to-one via sighting_id UNIQUE)
                                            └─ sessions table
```

---

## Client-Side Offline State

### IndexedDB Schema

```typescript
// sightings store
{
  id: UUID,
  user_id: UUID,
  animal_name: string,
  location: string,
  latitude: number,
  longitude: number,
  has_image: boolean,
  created_at: ISO timestamp,
  updated_at: ISO timestamp,
  is_deleted: boolean,
  sync_status: 'pending' | 'syncing' | 'synced' | 'conflict'
}

// images store (optional, mirrors server for offline access)
{
  id: UUID,
  sighting_id: UUID (foreign key, UNIQUE),
  image_data: string (Base64data URI),
  created_at: ISO timestamp,
  updated_at: ISO timestamp
}

// sync_queue store (index by id)
{
  id: UUID (sighting id),
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  data: Sighting object,
  client_timestamp: ISO timestamp,
  synced: boolean
}

// metadata store
{
  key: 'last_synced_at',
  value: ISO timestamp
}
```

---

## API Contract

### POST /api/auth/signup
**Request**: `{ email, password }`  
**Response**: `{ user: { id, email }, session: { token, expires_at } }`

### POST /api/auth/login
**Request**: `{ email, password }`  
**Response**: `{ user: { id, email }, session: { token, expires_at } }`

### POST /api/sync
**Request**: `{ sync_queue: [{ id, action, data, client_timestamp }] }`  
**Response**: `{ success: true, synced_ids: [UUID], conflicts: [{ id, reason }] }`

### GET /api/sightings
**Response**: `{ sightings: [Sighting] }`

### POST /api/sightings
**Request**: `Sighting object`  
**Response**: `{ id, created_at, updated_at }`

### PUT /api/sightings/:id
**Request**: `Sighting object`  
**Response**: `{ id, updated_at }`

### DELETE /api/sightings/:id
**Response**: `{ success: true }`

---

## Validation & Constraints

| Entity | Field | Rule | Error Message |
|--------|-------|------|---------------|
| User | email | Must be valid email | "Invalid email address" |
| User | password | Min 8 chars, 1 uppercase, 1 lowercase, 1 digit | "Password too weak" |
| Sighting | animal_name | Non-empty, ≤255 chars | "Animal name required" |
| Sighting | location | Non-empty, ≤500 chars | "Location required" |
| Sighting | latitude | ≥-90 and ≤90 | "Invalid latitude" |
| Sighting | longitude | ≥-180 and ≤180 | "Invalid longitude" |
| Image | image_data | ≤500KB, valid Base64 data URI | "Image too large" |
| Image | sighting_id | Must be UNIQUE (max 1 image per sighting) | "Sighting already has image" |

---

## Notes

- All timestamps in UTC (ISO 8601 format)
- Latitude and longitude are **always required** for every sighting (auto-captured via GPS or manually entered by user)
- `location` field is a text description and complements the numeric lat/long coordinates
- Soft delete (`is_deleted`) ensures offline deletes sync cleanly
- `updated_at` is critical for conflict detection in sync
- Images table separates image data from sighting metadata for cleaner queries
- `has_image` boolean on sighting allows fast dashboard list queries without joining images
- `UNIQUE sighting_id` constraint on images enforces one-to-one relationship
- Images stored as data URIs (Base64) keeps implementation simple and HTTP-friendly
- Deleting a sighting cascades to delete associated image
