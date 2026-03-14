import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { uploadImageToCloudinary } from "./cloudinaryService";
import { getFamilyById } from "./familyService";
import { sendNotification, NOTIFICATION_TYPES } from "./notificationService";
import { getUserById } from "./authService";

// Firestore structure:
// familyPhotos/{familyId}/photos/{photoId} = {
//   id: string,
//   uri: string,
//   publicId: string,
//   uploadedBy: string,
//   uploadedByName: string,
//   timestamp: string,
//   coords: { latitude, longitude },
//   note: string,
//   labels: string[],
//   isPublic: boolean,
//   sharedWith: string[] // usernames who can see this photo
// }

export async function uploadFamilyPhoto({ familyId, userId, userName, uri, coords, note = "", labels = [], isPublic = true, sharedWith = [] }) {
  try {
    const family = await getFamilyById(familyId);
    if (!family) {
      throw new Error("Gia đình không tồn tại");
    }
    
    if (!family.members.includes(userId)) {
      throw new Error("Bạn không phải thành viên của gia đình này");
    }
    
    const cloudinaryResult = await uploadImageToCloudinary(uri, userId);
    
    const photoId = `photo_${Date.now()}_${userId}`;
    const photoRef = doc(db, "familyPhotos", familyId, "photos", photoId);
    
    const photoData = {
      id: photoId,
      uri: cloudinaryResult.secureUrl,
      publicId: cloudinaryResult.publicId,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      uploadedBy: userId,
      uploadedByName: userName,
      timestamp: new Date().toISOString(),
      coords: coords || null,
      note: note,
      labels: labels,
      isPublic: isPublic,
      sharedWith: sharedWith
    };
    
    await setDoc(photoRef, photoData);
    
    // Send notification to all family members except uploader
    try {
      const otherMembers = family.members.filter(memberId => memberId !== userId);
      
      for (const memberId of otherMembers) {
        await sendNotification(memberId, {
          senderId: userId,
          senderName: userName,
          senderAvatar: null,
          type: NOTIFICATION_TYPES.NEW_PHOTO,
          title: "Ảnh mới trong gia đình",
          message: `${userName} đã đăng ảnh mới trong "${family.name}"`,
          data: {
            photoId: photoId,
            photoUrl: cloudinaryResult.secureUrl,
            familyId: familyId,
            familyName: family.name,
            caption: note
          }
        });
      }
    } catch (notifError) {
      console.warn("Failed to send notifications:", notifError);
    }
    
    return photoData;
  } catch (error) {
    console.error("Error uploading family photo:", error);
    throw error;
  }
}

export async function getFamilyPhotos(familyId, userId) {
  try {
    const family = await getFamilyById(familyId);
    if (!family) {
      return [];
    }
    
    if (!family.members.includes(userId)) {
      return [];
    }
    
    // Get all photos from all members' personal albums
    const allPhotos = [];
    
    for (const memberId of family.members) {
      try {
        // Get member's user info for displayName
        const userInfo = await getUserById(memberId);
        const displayName = userInfo?.displayName || userInfo?.email?.split('@')[0] || "Unknown";
        
        // Get member's personal album
        const userAlbumRef = doc(db, "userAlbums", memberId);
        const userAlbumSnap = await getDoc(userAlbumRef);
        
        if (userAlbumSnap.exists()) {
          const albumData = userAlbumSnap.data();
          const memberPhotos = albumData.photos || [];
          
          // Add member info to each photo
          memberPhotos.forEach(photo => {
            allPhotos.push({
              ...photo,
              uploadedBy: memberId,
              uploadedByName: displayName,
              familyId: familyId
            });
          });
        }
      } catch (memberError) {
        console.warn(`Error loading photos for member ${memberId}:`, memberError);
      }
    }
    
    // Sort by timestamp descending
    allPhotos.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    
    return allPhotos;
  } catch (error) {
    console.error("Error getting family photos:", error);
    return [];
  }
}

export async function getPublicFamilyPhotos(familyId, maxPhotos = 50) {
  try {
    const photosRef = collection(db, "familyPhotos", familyId, "photos");
    const q = query(
      photosRef, 
      where("isPublic", "==", true)
    );
    const snapshot = await getDocs(q);
    
    const photos = [];
    snapshot.forEach(doc => {
      photos.push(doc.data());
    });
    
    // Sort in memory and limit
    return photos
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, maxPhotos);
  } catch (error) {
    console.error("Error getting public family photos:", error);
    return [];
  }
}

export async function getFamilyPhotosByUser(familyId, userId) {
  try {
    const photosRef = collection(db, "familyPhotos", familyId, "photos");
    const q = query(
      photosRef, 
      where("uploadedBy", "==", userId)
    );
    const snapshot = await getDocs(q);
    
    const photos = [];
    snapshot.forEach(doc => {
      photos.push(doc.data());
    });
    
    // Sort in memory
    return photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error("Error getting family photos by user:", error);
    return [];
  }
}

export async function updateFamilyPhotoVisibility(familyId, photoId, isPublic, sharedWith = []) {
  try {
    const photoRef = doc(db, "familyPhotos", familyId, "photos", photoId);
    
    await updateDoc(photoRef, {
      isPublic: isPublic,
      sharedWith: sharedWith,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error updating photo visibility:", error);
    throw error;
  }
}

export async function deleteFamilyPhoto(familyId, photoId, userId) {
  try {
    const photoRef = doc(db, "familyPhotos", familyId, "photos", photoId);
    const photoSnap = await getDoc(photoRef);
    
    if (!photoSnap.exists()) {
      throw new Error("Ảnh không tồn tại");
    }
    
    const photo = photoSnap.data();
    
    if (photo.uploadedBy !== userId) {
      const family = await getFamilyById(familyId);
      if (family.createdBy !== userId) {
        throw new Error("Bạn không có quyền xóa ảnh này");
      }
    }
    
    await deleteDoc(photoRef);
    
  } catch (error) {
    console.error("Error deleting family photo:", error);
    throw error;
  }
}

export async function getRandomFamilyPhotos(familyId, count = 10) {
  try {
    const photos = await getPublicFamilyPhotos(familyId, 100);
    
    const shuffled = photos.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error("Error getting random family photos:", error);
    return [];
  }
}

export async function getFamilyPhotoStats(familyId) {
  try {
    const photosRef = collection(db, "familyPhotos", familyId, "photos");
    const snapshot = await getDocs(photosRef);
    
    const stats = {
      totalPhotos: 0,
      publicPhotos: 0,
      privatePhotos: 0,
      photosByUser: {}
    };
    
    snapshot.forEach(doc => {
      const photo = doc.data();
      stats.totalPhotos++;
      
      if (photo.isPublic) {
        stats.publicPhotos++;
      } else {
        stats.privatePhotos++;
      }
      
      if (!stats.photosByUser[photo.uploadedBy]) {
        stats.photosByUser[photo.uploadedBy] = 0;
      }
      stats.photosByUser[photo.uploadedBy]++;
    });
    
    return stats;
  } catch (error) {
    console.error("Error getting family photo stats:", error);
    return {
      totalPhotos: 0,
      publicPhotos: 0,
      privatePhotos: 0,
      photosByUser: {}
    };
  }
}
