// User Album Service - Manage user photos with Cloudinary + Firebase
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "./firebase";

// Firestore structure:
// userAlbums/{userId} = {
//   userId: string,
//   photos: [{
//     id: string,
//     cloudinaryUrl: string,
//     publicId: string,
//     caption: string,
//     tags: string[],
//     location: { latitude, longitude, address },
//     aiAnalysis: { labels, objects, description },
//     createdAt: timestamp,
//     updatedAt: timestamp
//   }],
//   totalPhotos: number,
//   lastUpdated: timestamp
// }

// Add photo to user's album
export async function addPhotoToUserAlbum(userId, photoData) {
  try {
    const albumRef = doc(db, "userAlbums", userId);
    const albumSnap = await getDoc(albumRef);
    
    // Generate unique ID: timestamp + random string
    const uniqueId = photoData.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const photo = {
      id: uniqueId,
      cloudinaryUrl: photoData.cloudinaryUrl,
      publicId: photoData.publicId,
      caption: photoData.caption || "",
      tags: photoData.tags || [],
      location: photoData.location || null,
      aiAnalysis: photoData.aiAnalysis || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (albumSnap.exists()) {
      // Update existing album
      const existingPhotos = albumSnap.data().photos || [];
      
      // Check if photo with same ID already exists
      const photoExists = existingPhotos.some(p => p.id === uniqueId);
      
      if (photoExists) {
        console.log("⚠️ Photo already exists in album:", uniqueId);
        return photo;
      }
      
      // Add new photo
      await updateDoc(albumRef, {
        photos: arrayUnion(photo),
        totalPhotos: existingPhotos.length + 1,
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Create new album - get user info for userName
      let userName = "Unknown";
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          userName = userData.displayName || userData.email?.split('@')[0] || "Unknown";
        }
      } catch (e) {
        console.warn("Could not get user name:", e);
      }
      
      await setDoc(albumRef, {
        userId: userId,
        userName: userName,
        photos: [photo],
        totalPhotos: 1,
        lastUpdated: new Date().toISOString()
      });
    }
    
    console.log("✅ Photo added to user album:", userId);
    return photo;
  } catch (error) {
    console.error("❌ Error adding photo to album:", error);
    throw error;
  }
}

// Clean up invalid photos from album
export async function cleanupUserAlbum(userId) {
  try {
    const albumRef = doc(db, "userAlbums", userId);
    const albumSnap = await getDoc(albumRef);
    
    if (!albumSnap.exists()) {
      return { removed: 0, kept: 0 };
    }
    
    const data = albumSnap.data();
    const allPhotos = data.photos || [];
    
    // Keep only valid photos with cloudinaryUrl and unique IDs
    const validPhotos = [];
    const seenIds = new Set();
    let removedCount = 0;
    
    for (const photo of allPhotos) {
      if (!photo.cloudinaryUrl) {
        console.log("🗑️ Removing photo without cloudinaryUrl:", photo.id);
        removedCount++;
        continue;
      }
      
      if (seenIds.has(photo.id)) {
        console.log("🗑️ Removing duplicate photo:", photo.id);
        removedCount++;
        continue;
      }
      
      seenIds.add(photo.id);
      validPhotos.push(photo);
    }
    
    // Update album with cleaned photos
    await updateDoc(albumRef, {
      photos: validPhotos,
      totalPhotos: validPhotos.length,
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`✅ Cleaned album: removed ${removedCount}, kept ${validPhotos.length}`);
    return { removed: removedCount, kept: validPhotos.length };
  } catch (error) {
    console.error("❌ Error cleaning album:", error);
    throw error;
  }
}

// Get user's album
export async function getUserAlbum(userId, maxPhotos = 100) {
  try {
    const albumRef = doc(db, "userAlbums", userId);
    const albumSnap = await getDoc(albumRef);
    
    if (!albumSnap.exists()) {
      return {
        userId,
        photos: [],
        totalPhotos: 0
      };
    }
    
    const data = albumSnap.data();
    
    // Filter out invalid photos (no cloudinaryUrl) and ensure unique IDs
    const validPhotos = (data.photos || [])
      .filter(photo => {
        // Must have cloudinaryUrl
        if (!photo.cloudinaryUrl) {
          console.warn("⚠️ Skipping photo without cloudinaryUrl:", photo.id);
          return false;
        }
        return true;
      });
    
    // Remove duplicates by ID (keep the newest one)
    const uniquePhotos = [];
    const seenIds = new Set();
    
    for (const photo of validPhotos) {
      if (!seenIds.has(photo.id)) {
        seenIds.add(photo.id);
        uniquePhotos.push(photo);
      } else {
        console.warn("⚠️ Skipping duplicate photo ID:", photo.id);
      }
    }
    
    // Sort photos by createdAt (newest first)
    const photos = uniquePhotos
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, maxPhotos);
    
    return {
      userId,
      photos,
      totalPhotos: photos.length
    };
  } catch (error) {
    console.error("❌ Error getting user album:", error);
    return {
      userId,
      photos: [],
      totalPhotos: 0
    };
  }
}

// Get friend's albums (only if they are friends)
export async function getFriendAlbum(currentUserId, friendId) {
  try {
    // Check if they are friends
    const friendDoc = await getDoc(doc(db, "friends", currentUserId));
    
    if (!friendDoc.exists()) {
      throw new Error("Bạn chưa kết bạn với người này");
    }
    
    const friends = friendDoc.data().friends || [];
    if (!friends.includes(friendId)) {
      throw new Error("Bạn chưa kết bạn với người này");
    }
    
    // Get friend's album
    return await getUserAlbum(friendId);
  } catch (error) {
    console.error("❌ Error getting friend album:", error);
    throw error;
  }
}

// Delete photo from user's album
export async function deletePhotoFromUserAlbum(userId, photoId) {
  try {
    console.log("🗑️ Deleting photo from Firebase:", { userId, photoId });
    
    if (!userId || !photoId) {
      throw new Error("userId và photoId không được để trống");
    }
    
    const albumRef = doc(db, "userAlbums", userId);
    const albumSnap = await getDoc(albumRef);
    
    if (!albumSnap.exists()) {
      console.log("⚠️ Album không tồn tại, tạo mới");
      return null; // Album chưa tồn tại, không cần xóa
    }
    
    const data = albumSnap.data();
    const photos = data.photos || [];
    console.log("📸 Current photos count:", photos.length);
    
    const photoToDelete = photos.find(p => p && p.id && p.id.toString() === photoId.toString());
    
    if (!photoToDelete) {
      console.log("⚠️ Ảnh không tồn tại trong album:", photoId);
      return null; // Ảnh không tồn tại, không cần xóa
    }
    
    console.log("🎯 Found photo to delete:", photoToDelete);
    
    // Remove photo from array - sử dụng filter thay vì arrayRemove để tránh lỗi
    const updatedPhotos = photos.filter(p => p && p.id && p.id.toString() !== photoId.toString());
    
    await updateDoc(albumRef, {
      photos: updatedPhotos,
      totalPhotos: Math.max(0, updatedPhotos.length),
      lastUpdated: new Date().toISOString()
    });
    
    console.log("✅ Photo deleted from album:", photoId);
    return photoToDelete;
  } catch (error) {
    console.error("❌ Error deleting photo:", error);
    throw error;
  }
}

// Update photo metadata
export async function updatePhotoInUserAlbum(userId, photoId, updates) {
  try {
    const albumRef = doc(db, "userAlbums", userId);
    const albumSnap = await getDoc(albumRef);
    
    if (!albumSnap.exists()) {
      throw new Error("Album không tồn tại");
    }
    
    const data = albumSnap.data();
    const photos = data.photos || [];
    const photoIndex = photos.findIndex(p => p.id === photoId);
    
    if (photoIndex === -1) {
      throw new Error("Ảnh không tồn tại");
    }
    
    // Update photo
    const updatedPhoto = {
      ...photos[photoIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Replace in array
    const newPhotos = [...photos];
    newPhotos[photoIndex] = updatedPhoto;
    
    await updateDoc(albumRef, {
      photos: newPhotos,
      lastUpdated: new Date().toISOString()
    });
    
    console.log("✅ Photo updated:", photoId);
    return updatedPhoto;
  } catch (error) {
    console.error("❌ Error updating photo:", error);
    throw error;
  }
}

// Get recent photos from all friends
export async function getFriendsRecentPhotos(userId, maxPhotos = 20) {
  try {
    // Get user's friends
    const friendDoc = await getDoc(doc(db, "friends", userId));
    
    if (!friendDoc.exists()) {
      return [];
    }
    
    const friendIds = friendDoc.data().friends || [];
    
    if (friendIds.length === 0) {
      return [];
    }
    
    // Get albums from all friends (with userName)
    const albumResults = await Promise.all(
      friendIds.map(async (friendId) => {
        const album = await getUserAlbum(friendId, 5);
        // Try to get userName from the album doc
        let userName = "Bạn bè";
        try {
          const albumSnap = await getDoc(doc(db, "userAlbums", friendId));
          if (albumSnap.exists()) {
            userName = albumSnap.data().userName || "Bạn bè";
          }
        } catch (e) {}
        return { ...album, userName };
      })
    );
    
    // Combine and sort all photos
    const allPhotos = [];
    albumResults.forEach(album => {
      album.photos.forEach(photo => {
        allPhotos.push({
          ...photo,
          userId: album.userId,
          userName: album.userName,
        });
      });
    });
    
    // Sort by createdAt (newest first)
    allPhotos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return allPhotos.slice(0, maxPhotos);
  } catch (error) {
    console.error("❌ Error getting friends photos:", error);
    return [];
  }
}

// Search photos by tags
export async function searchPhotosByTags(userId, tags) {
  try {
    const album = await getUserAlbum(userId);
    
    if (!tags || tags.length === 0) {
      return album.photos;
    }
    
    // Filter photos that have any of the tags
    const filtered = album.photos.filter(photo => {
      const photoTags = photo.tags || [];
      return tags.some(tag => 
        photoTags.some(pt => pt.toLowerCase().includes(tag.toLowerCase()))
      );
    });
    
    return filtered;
  } catch (error) {
    console.error("❌ Error searching photos:", error);
    return [];
  }
}

// Get album statistics
export async function getAlbumStats(userId) {
  try {
    const album = await getUserAlbum(userId);
    
    const stats = {
      totalPhotos: album.totalPhotos,
      withLocation: album.photos.filter(p => p.location).length,
      withAI: album.photos.filter(p => p.aiAnalysis).length,
      withTags: album.photos.filter(p => p.tags && p.tags.length > 0).length,
      oldestPhoto: album.photos.length > 0 
        ? album.photos[album.photos.length - 1].createdAt 
        : null,
      newestPhoto: album.photos.length > 0 
        ? album.photos[0].createdAt 
        : null
    };
    
    return stats;
  } catch (error) {
    console.error("❌ Error getting album stats:", error);
    return null;
  }
}
