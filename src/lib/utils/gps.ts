import { browser } from '$app/environment';

function isGeolocationSupported() {
  if (browser) {
    if (navigator.geolocation) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
export async function getGeolocation() {
  if (!isGeolocationSupported()) {
    return null;
  }
  return new Promise<{ latitude: number; longitude: number; accuracy: number } | null>(
    (resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          resolve(null);
        },
        {
          timeout: 10000
        }
      );
    }
  );
}
