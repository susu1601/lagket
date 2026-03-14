import React, { useState, useEffect, useContext, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { getAllPhotos } from "../services/cloudinaryPhotoService";
import { getPhotosByLabel } from "../services/cloudinaryPhotoService";
import { AuthContext } from "../context/AuthContext";
import MapView, { Marker } from "react-native-maps";

// Simple geo bucketing by rounding lat/lng to ~100m cells
function makeClusterKey(coords) {
  if (!coords || typeof coords.latitude !== "number" || typeof coords.longitude !== "number") {
    return null;
  }
  const lat = Math.round(coords.latitude * 1000) / 1000; // ~111m
  const lng = Math.round(coords.longitude * 1000) / 1000; // ~85-111m depending latitude
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function computeCentroid(items) {
  if (!items || !items.length) return null;
  let sumLat = 0;
  let sumLng = 0;
  let count = 0;
  for (const p of items) {
    if (p?.coords?.latitude != null && p?.coords?.longitude != null) {
      sumLat += p.coords.latitude;
      sumLng += p.coords.longitude;
      count++;
    }
  }
  if (!count) return null;
  return { latitude: sumLat / count, longitude: sumLng / count };
}

export default function MapScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const labelFilter = (route?.params?.label || "").toString().trim();

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!user) return;
      const data = await getAllPhotos(user.uid);
      setPhotos(Array.isArray(data) ? data : []);
    };
    fetchPhotos();
  }, [user]);

  const clusters = useMemo(() => {
    const base = labelFilter ? getPhotosByLabel(photos, labelFilter) : photos;
    const map = new Map();
    
    for (const p of base) {
      const coords = p?.coords || p?.location;
      const key = makeClusterKey(coords);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    
    const result = [];
    for (const [key, items] of map.entries()) {
      const centroid = computeCentroid(items);
      if (!centroid) continue;
      result.push({ key, items, centroid });
    }
    
    return result;
  }, [photos, labelFilter]);

  return (
    <View style={{ flex: 1 }}>
      <MapView 
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 10.8231,
          longitude: 106.6297,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {clusters.map((c) => {
          const sample = c.items[0];
          const imageUri = sample?.cloudinaryUrl || sample?.uri || sample?.localUri;
          return (
            <Marker
              key={c.key}
              coordinate={c.centroid}
              onPress={() => {
                navigation.navigate("LocationAlbum", { clusterKey: c.key, photos: c.items });
              }}
            >
              <View style={styles.thumbMarker}>
                {!!imageUri && (
                  <Image 
                    source={{ uri: imageUri }} 
                    style={styles.thumbImage}
                  />
                )}
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{c.items.length}</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}


const styles = StyleSheet.create({
  thumbMarker: {
    width: 54,
    height: 54,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "#eaeaea",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  countBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#1f6feb",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  countText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
});


