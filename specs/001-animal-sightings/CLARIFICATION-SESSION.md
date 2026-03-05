# Clarification Session: 2026-03-05

**Feature**: 001-animal-sightings (Animal Sightings PWA)  
**Workflow**: speckit.clarify  
**Status**: ✅ COMPLETE

## Clarification Provided

**Topic**: Image Storage Architecture

**Decision**: Separate images table with one-to-one relationship to sightings.

**Details**:
- Images stored in separate `images` table (not in `sightings` table)
- `sighting_id` column on images is UNIQUE → enforces max 1 image per sighting
- Sightings include `has_image` boolean (for efficient dashboard queries)
- Image CRUD via dedicated endpoints:
  - `POST /sightings/:id/image` - Upload/attach image
  - `GET /sightings/:id/image` - Fetch image data
  - `DELETE /sightings/:id/image` - Delete image

## Artifacts Updated

### 1. **spec.md**
- Added `## Clarifications` section documenting decision
- Updated Key Entities to reflect separate image table

### 2. **data-model.md**
- Updated Sighting entity: removed `image_data` column, added `has_image` boolean
- Converted Image from "Implicit" to full table definition with UNIQUE sighting_id
- Updated relationships diagram to show 1:opt Image relationship
- Updated IndexedDB schema to include images store
- Updated validation rules table to reflect new structure
- Updated notes explaining rationale for separate tables

### 3. **contracts/api.md**
- Updated GET /sightings: response now includes `has_image` (removed `image_data`)
- Updated POST /sightings: request no longer accepts `image_data`, response includes `has_image`
- Updated GET /sightings/:id: response includes `has_image`
- Updated PUT /sightings: removed `image_data` from payload, added note about separate image endpoints
- Added 3 new image endpoints:
  - `POST /sightings/:id/image` (201 Created or 200 OK)
  - `GET /sightings/:id/image` (200 OK)
  - `DELETE /sightings/:id/image` (200 OK)
- Updated /sync notes to clarify images handled separately

### 4. **research.md**
- Updated Drizzle schema (§8) to show separate `images` table
- Added `has_image` boolean to sightings table
- Updated rationale explaining benefits of separate table
- Updated summary to reflect new image storage decision

### 5. **quickstart.md**
- Updated Drizzle schema example: added `has_image` to sightings, added full `images` table definition
- Updated POST endpoint example: removed `image_data`, set `has_image: false`
- Updated Svelte component example: split image handling into 2-step process
  - Step 1: Create sighting
  - Step 2: Upload image via separate endpoint
- Added notes clarifying separate image endpoint workflow

## Rationale

**Benefits of separate images table**:
1. **Query efficiency**: Dashboard can fetch sightings without large image BLOBs
2. **Type safety**: Drizzle enforces one-to-one relationship via UNIQUE constraint
3. **Clear API**: Image operations separate from sighting mutations
4. **Scalability**: Easier to eventually move images to external storage (S3, CDN) later
5. **Sync simplicity**: Images handled separately from sighting sync queue

## Verification

- ✅ All 5 design artifacts updated
- ✅ No contradictions in schema (consistent UNIQUE constraint on sighting_id)
- ✅ API contract complete (all image endpoints specified)
- ✅ Code examples updated (Drizzle schema, SvelteKit endpoint, Svelte component)
- ✅ Documentation consistent across all files

---

## Second Clarification: Location Requirements

**Topic**: Latitude and Longitude Requirement

**Decision**: Latitude and longitude are **ALWAYS required** for every sighting (not optional).

**Details**:
- Every sighting must have valid latitude [-90, 90] and longitude [-180, 180]
- When GPS is unavailable, users must manually enter lat/long coordinates (not just text description)
- `location` field is a text description and complements the numeric coordinates
- No sighting can be created without both coordinates and location description

**Artifacts Updated**:

### 1. **spec.md**
- Updated User Story 2 acceptance scenarios to reflect required lat/long
- Updated FR-004 to specify manual editing of lat/long
- Updated FR-005 to clarify manual entry means entering both coordinates AND text description
- Updated FR-007 to count 5 data points (not 4): name, location, latitude, longitude, timestamp
- Added second clarification entry documenting this decision

### 2. **data-model.md**
- Changed Sighting.latitude from NULLABLE to NOT NULL
- Changed Sighting.longitude from NULLABLE to NOT NULL
- Updated validation rules to reflect Required status
- Updated notes to emphasize lat/long are always present
- Updated validation constraints table

### 3. **contracts/api.md**
- POST /sightings: Changed latitude/longitude from "Optional" to "Required"
- Added specific error messages for missing/invalid lat/long
- PUT /sightings: Updated validation section (was "Same as POST")
- All responses include both latitude and longitude

### 4. **quickstart.md**
- Updated Svelte component: added error message state variable
- Added error validation in handleSubmit() for all 4 required fields
- Changed latitude input: "Latitude (optional)" → "Latitude (required)" with required attribute
- Added longitude input field with required attribute
- Updated placeholder text to clarify location is text description
- Updated component notes to emphasize lat/long always required

## Verification

- ✅ All affected documents updated consistently
- ✅ API contract enforces required fields with error messages
- ✅ Code examples show validation for required fields
- ✅ Schema has NOT NULL constraints
- ✅ Acceptance criteria updated

## Next Steps

1. ✅ Spec updated with clarification session
2. Ready for Phase 2: `/speckit.tasks` command to generate implementation tasks
3. Implementation can proceed with confidence on image storage architecture
