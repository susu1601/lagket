// Complete Photo Context for managing photos and albums
import React, { createContext, useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uploadImageToCloudinary, getPhotosByUser, deletePhoto } from "../services/cloudinaryPhotoService";

const PhotoContext = createContext();

export function PhotoProvider({ children }) {
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPhotos = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const userPhotos = await getPhotosByUser(userId);
      setPhotos(userPhotos);
      
      // Group photos by albums
      const albumMap = {};
      userPhotos.forEach(photo => {
        const albumName = photo.album || 'Default Album';
        if (!albumMap[albumName]) {
          albumMap[albumName] = [];
        }
        albumMap[albumName].push(photo);
      });
      
      const albumList = Object.keys(albumMap).map(name => ({
        name,
        photos: albumMap[name],
        count: albumMap[name].length
      }));
      
      setAlbums(albumList);
    } catch (err) {
      setError(err.message);
      console.error("Error loading photos:", err);
    } finally {
      setLoading(false);
    }
  };

  const addPhoto = async (photoData) => {
    try {
      setLoading(true);
      const newPhoto = await uploadImageToCloudinary(photoData.uri, photoData.userId);
      setPhotos(prev => [newPhoto, ...prev]);
      
      // Update albums
      const albumName = newPhoto.album || 'Default Album';
      setAlbums(prev => {
        const existingAlbum = prev.find(album => album.name === albumName);
        if (existingAlbum) {
          return prev.map(album => 
            album.name === albumName 
              ? { ...album, photos: [newPhoto, ...album.photos], count: album.count + 1 }
              : album
          );
        } else {
          return [...prev, { name: albumName, photos: [newPhoto], count: 1 }];
        }
      });
      
      return newPhoto;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async (photoId, userId) => {
    try {
      setLoading(true);
      await deletePhoto(photoId, userId);
      setPhotos(prev => prev.filter(photo => photo.public_id !== photoId));
      
      // Update albums
      setAlbums(prev => prev.map(album => ({
        ...album,
        photos: album.photos.filter(photo => photo.public_id !== photoId),
        count: album.photos.filter(photo => photo.public_id !== photoId).length
      })).filter(album => album.count > 0));
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPhotosByAlbum = (albumName) => {
    return photos.filter(photo => (photo.album || 'Default Album') === albumName);
  };

  const getPhotosByLocation = (location) => {
    return photos.filter(photo => 
      photo.location && 
      photo.location.latitude === location.latitude && 
      photo.location.longitude === location.longitude
    );
  };

  const getPhotosByDate = (date) => {
    const targetDate = new Date(date).toDateString();
    return photos.filter(photo => 
      new Date(photo.created_at).toDateString() === targetDate
    );
  };

  const clearError = () => setError(null);

  return (
    <PhotoContext.Provider value={{
      photos,
      albums,
      loading,
      error,
      loadPhotos,
      addPhoto,
      removePhoto,
      getPhotosByAlbum,
      getPhotosByLocation,
      getPhotosByDate,
      clearError
    }}>
      {children}
    </PhotoContext.Provider>
  );
}

export const usePhotos = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhotos must be used within a PhotoProvider');
  }
  return context;
};
