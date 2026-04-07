import { API_ROUTES, BASE_PATH } from '$lib/utils/constants';

interface PaginatedResult {
  data: Sighting[];
  total: number;
  page: number;
  limit: number;
}

export async function apiFetch(url: string, option: object) {
  try {
    let response = await fetch(url, option);
    if (!response.ok) {
      if (response.status === 503)
        throw new Error('Network Unavailable');
      throw new Error(`response Status: ${response.statusText}`);
    }
    let data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    throw error;
  }
}

export async function getSightings(page?: number, limit?: number) {
  let baseUrl = BASE_PATH + API_ROUTES.SIGHTINGS.BASE;
  const params = new URLSearchParams();
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  if (params.toString()) baseUrl += '?' + params.toString();

  let options = {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  let response = await apiFetch(baseUrl, options);
  return response;
}

export async function getSightingById(id: string) {
  let baseUrl = BASE_PATH + API_ROUTES.SIGHTINGS.BY_ID.replace(':id', id);
  let options = {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  let response = await apiFetch(baseUrl, options);
  return response;
}

export async function createSighting(
  sighting: Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'userId'>
) {
  let baseUrl = BASE_PATH + API_ROUTES.SIGHTINGS.BASE;
  let options = {
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(sighting),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  let response = await apiFetch(baseUrl, options);
  return response;
}

export async function updateSighting(
  id: string,
  sighting: Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId' | 'syncStatus'>>
) {
  // Map client field names to API field names
  const apiBody: Record<string, unknown> = {};
  if (sighting.species !== undefined) apiBody.animal_name = sighting.species;
  if (sighting.description !== undefined) apiBody.location = sighting.description;
  if (sighting.latitude !== undefined) apiBody.latitude = sighting.latitude;
  if (sighting.longitude !== undefined) apiBody.longitude = sighting.longitude;

  let baseUrl = BASE_PATH + API_ROUTES.SIGHTINGS.BY_ID.replace(':id', id);
  let options = {
    credentials: 'include',
    method: 'PUT',
    body: JSON.stringify(apiBody),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  let response = await apiFetch(baseUrl, options);
  // Map API field names back to client field names
  return {
    id: response.id,
    userId: response.user_id,
    species: response.animal_name,
    description: response.location ?? undefined,
    latitude: response.latitude ?? 0,
    longitude: response.longitude ?? 0,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    images: response.image_url ? [{ id: '', sightingId: response.id, url: response.image_url, createdAt: new Date().toISOString() }] : []
  };
}

export async function deleteSighting(id: string) {
  let baseUrl = BASE_PATH + API_ROUTES.SIGHTINGS.BY_ID.replace(':id', id);
  let options = {
    credentials: 'include',
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  await apiFetch(baseUrl, options);
}
export async function getSightingImage(id: string): Promise<string | null> {
  try {
    const baseUrl = BASE_PATH + API_ROUTES.SIGHTINGS.IMAGE.replace(':id', id);
    const data = await apiFetch(baseUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return data.image_data ?? null;
  } catch {
    return null;
  }
}

export async function uploadImages(sightingid: string, url: string) {
  let baseUrl = BASE_PATH + API_ROUTES.SIGHTINGS.IMAGE.replace(':id', sightingid);
  let options = {
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  let response = await apiFetch(baseUrl, options);
  return response;
}
export const sightingsService = {
  getSightings,
  getSightingById,
  getSightingImage,
  createSighting,
  updateSighting,
  uploadImages,
  deleteSighting
};
