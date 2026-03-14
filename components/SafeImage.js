import React, { useState } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { validateCloudinaryUrl } from '../services/cloudinaryPhotoService';

export default function SafeImage({ 
  source, 
  style, 
  resizeMode = 'cover', 
  fallbackIcon = 'image-outline',
  ...props 
}) {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Validate and fix the URL
  const validUrl = source?.uri ? validateCloudinaryUrl(source.uri) : null;

  const handleImageError = (error) => {
    console.warn('Image load error:', error);
    setImageError(true);
    setLoading(false);
  };

  const handleImageLoad = () => {
    setLoading(false);
    setImageError(false);
  };

  // If no valid URL, show fallback silently (no alert)
  if (!validUrl || imageError) {
    return (
      <View style={[styles.fallback, style]}>
        <Ionicons name={fallbackIcon} size={32} color="#ccc" />
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        {...props}
        source={{ uri: validUrl }}
        style={[style, loading && styles.loading]}
        resizeMode={resizeMode}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      {loading && (
        <View style={[styles.loadingOverlay, style]}>
          <Ionicons name="image-outline" size={24} color="#ccc" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  loading: {
    opacity: 0.5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
});
