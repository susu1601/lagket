import { db } from '../config/firebaseConfig';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';

// Add photo to favorites
export const addToFavorites = async (userId, photoId) => {
  try {
    const favoriteRef = doc(db, 'users', userId, 'favorites', photoId);
    await setDoc(favoriteRef, {
      photoId,
      addedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

// Remove photo from favorites
export const removeFromFavorites = async (userId, photoId) => {
  try {
    const favoriteRef = doc(db, 'users', userId, 'favorites', photoId);
    await deleteDoc(favoriteRef);
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

// Check if photo is favorited
export const isFavorited = async (userId, photoId) => {
  try {
    const favoriteRef = doc(db, 'users', userId, 'favorites', photoId);
    const docSnap = await getDoc(favoriteRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

// Get all favorite photos
export const getFavoritePhotos = async (userId) => {
  try {
    console.log('getFavoritePhotos - userId:', userId);
    const favoritesRef = collection(db, 'users', userId, 'favorites');
    const snapshot = await getDocs(favoritesRef);
    
    console.log('Favorites snapshot size:', snapshot.size);
    const favoriteIds = snapshot.docs.map(doc => {
      console.log('Favorite doc:', doc.id, doc.data());
      return doc.data().photoId;
    });
    
    console.log('Favorite IDs:', favoriteIds);
    
    if (favoriteIds.length === 0) {
      console.log('No favorites found');
      return [];
    }
    
    // Get actual photo data from user's album
    const albumRef = doc(db, 'userAlbums', userId);
    const albumSnap = await getDoc(albumRef);
    
    console.log('Album exists:', albumSnap.exists());
    
    if (!albumSnap.exists()) {
      console.log('Album document does not exist');
      return [];
    }
    
    const allPhotos = albumSnap.data().photos || [];
    console.log('Total photos in album:', allPhotos.length);
    
    const favoritePhotos = allPhotos.filter(photo => {
      const isFav = favoriteIds.includes(photo.id);
      if (isFav) {
        console.log('Found favorite photo:', photo.id);
      }
      return isFav;
    });
    
    console.log('Favorite photos found:', favoritePhotos.length);
    return favoritePhotos;
  } catch (error) {
    console.error('Error getting favorite photos:', error);
    return [];
  }
};
