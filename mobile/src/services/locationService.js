import * as Location from 'expo-location';

/**
 * Mobile Geolocation Service using expo-location
 * Captures real-time device GPS coordinates when cash collector confirms payment or signs in
 */
export async function getCollectionLocation(fallbackName = 'Collector Current Location') {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = Number(pos.coords.latitude.toFixed(6));
      const longitude = Number(pos.coords.longitude.toFixed(6));

      // Attempt reverse geocoding to obtain street/city locality
      let address = null;
      try {
        const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (rev && rev.length > 0) {
          const item = rev[0];
          const parts = [
            item.name,
            item.street,
            item.district || item.subregion,
            item.city,
            item.postalCode,
          ].filter(Boolean);
          if (parts.length > 0) {
            address = parts.join(', ');
          }
        }
      } catch (revErr) {
        console.warn('[LocationService] Reverse geocode error:', revErr.message);
      }

      const locationLabel = address || `${latitude}, ${longitude}`;

      return {
        locationName: locationLabel,
        address: address || locationLabel,
        latitude,
        longitude,
      };
    }
  } catch (error) {
    console.warn('[LocationService] Exception acquiring GPS location:', error.message);
  }

  return {
    locationName: fallbackName,
    address: null,
    latitude: null,
    longitude: null,
  };
}
