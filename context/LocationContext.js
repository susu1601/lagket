// Location Context for managing location services
import React, { createContext, useState, useContext } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status !== 'granted') {
        setError('Location permission denied');
        return false;
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        return null;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp
      };
      
      setCurrentLocation(locationData);
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(locationData));
      
      return locationData;
    } catch (err) {
      setError(err.message);
      console.error("Error getting location:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getLocationName = async (latitude, longitude) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (reverseGeocode.length > 0) {
        const location = reverseGeocode[0];
        return {
          address: location.formattedAddress,
          city: location.city,
          region: location.region,
          country: location.country,
          postalCode: location.postalCode
        };
      }
      
      return null;
    } catch (err) {
      console.error("Error getting location name:", err);
      return null;
    }
  };

  const loadLastKnownLocation = async () => {
    try {
      const lastLocation = await AsyncStorage.getItem('lastKnownLocation');
      if (lastLocation) {
        setCurrentLocation(JSON.parse(lastLocation));
      }
    } catch (err) {
      console.error("Error loading last known location:", err);
    }
  };

  const clearError = () => setError(null);

  return (
    <LocationContext.Provider value={{
      currentLocation,
      locationPermission,
      loading,
      error,
      requestLocationPermission,
      getCurrentLocation,
      getLocationName,
      loadLastKnownLocation,
      clearError
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
