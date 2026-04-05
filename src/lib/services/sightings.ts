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
      throw new Error(`response Status: ${response.status}`);
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
  let baseUrl = BASE_PATH + API_ROUTES.SIGHTINGS.BY_ID.replace(':id', id);
  let options = {
    method: 'PUT',
    body: JSON.stringify(sighting),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  let response = await apiFetch(baseUrl, options);
  return response;
}

export async function deleteSighting(id: string) {
  let baseUrl = BASE_PATH + API_ROUTES.SIGHTINGS.BY_ID.replace(':id', id);
  let options = {
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
