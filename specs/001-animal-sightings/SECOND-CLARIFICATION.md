# Second Clarification Summary: Location Requirements

**Date**: 2026-03-05  
**Feature**: 001-animal-sightings PWA  
**Topic**: Latitude and Longitude Requirements  
**Status**: ✅ Applied to all design artifacts

---

## Clarification Provided

**User Requirement**: When a user manually enters a location, they are typing in latitude and longitude (not just a text description). Latitude and longitude are **ALWAYS required** - no sighting can be created without valid numeric coordinates.

---

## Key Changes

### Data Model (`data-model.md`)
- **latitude**: Changed from NULLABLE to **NOT NULL**
- **longitude**: Changed from NULLABLE to **NOT NULL**
- Notes updated to emphasize: "Latitude and longitude are **always required** for every sighting"
- Validation rules updated to show Required status with specific ranges

### API Contract (`contracts/api.md`)
- **POST /sightings**: 
  - Validation: latitude Required [-90, 90], longitude Required [-180, 180]
  - Error messages: Added specific errors for missing/invalid lat/long
- **PUT /sightings**: 
  - Validation updated (was generic "Same as POST")
  - Now explicitly shows all 4 required fields
- All responses include both latitude and longitude fields

### Feature Specification (`spec.md`)
- **User Story 2** acceptance scenarios updated:
  - Scenario 2: "location (lat/long) is auto-filled" → "latitude and longitude are auto-filled"
  - Scenario 3: "modifies the location field" → "modifies the latitude or longitude fields"
  - Scenario 4: GPS unavailable "location field is empty" → "latitude and longitude fields are empty"
  - Scenario 5: "enters animal name, location, and timestamp" → includes all 4 required fields
- **FR-004**: Updated to specify manual editing of latitude and longitude
- **FR-005**: Clarified manual entry means entering both coordinates AND text description
- **FR-007**: Updated from 4 to 5 data points (added separate latitude column)
- **Success Criteria SC-002**: Extended time allowance for manual lat/long entry (up to 2 min)

### Quickstart Guide (`quickstart.md`)
- **Svelte Component**:
  - Added `error: string | null` state variable
  - Added validation in `handleSubmit()` requiring all 4 fields
  - Changed latitude input: "optional" → "required" with `required` attribute
  - Added longitude input field (was missing) with `required` attribute
  - Updated placeholder text to clarify
  - Added error message display in form
  - Notes clarified: "Latitude and longitude are **always required**"

### Spec Clarifications Section (`spec.md`)
- Added second entry documenting this clarification with full rationale

---

## Consistency Verification

✅ **All documents aligned**:
- Database schema: NOT NULL constraints
- API contract: Required field validation with error messages
- Feature spec: Acceptance criteria and requirements reflect mandatory coordinates
- Quickstart: Component validation enforces all 4 required fields
- Error handling: User receives clear feedback if lat/long missing

✅ **No conflicts**: 
- `location` field remains for text description
- Numeric coordinates not optional
- Manual entry workflow clarified
- All 5 data points (name, location, lat, lng, timestamp) now clearly defined

---

## Impact on Implementation

### For Backend Developers
- Add NOT NULL constraints to latitude/longitude columns
- API validation must check all 4 required fields before creating sighting
- Provide clear error messages for validation failures

### For Frontend Developers
- Location form must require latitude and longitude input
- Can auto-populate from GPS or require manual entry
- Must validate before submission
- Show error messages for missing/invalid coordinates

### For QA/Testing
- Test coverage: Cannot create sighting without all 4 fields
- Test coverage: Invalid lat/long ranges rejected
- Test coverage: Manual entry workflow enforces coordinates

---

## Ready for Phase 2

All design artifacts now unambiguously specify that latitude and longitude are mandatory fields. Implementation can proceed with confidence that all decisions are documented and consistent across:
- Database schema
- API contract and validation
- Frontend UI/UX workflows
- Feature requirements and acceptance criteria
- Code examples and patterns
