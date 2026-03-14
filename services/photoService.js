// src/services/photoService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "./firebase";
import { doc, setDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";
import { uploadImageToCloudinary } from "./cloudinaryService";

const STORAGE_KEY = "photos";

export async function savePhotoLocal({ uri, coords, note = "", labels = [] }) {
  const photo = {
    id: Date.now().toString(),
    uri,
    coords,
    note,
    labels,
    timestamp: new Date().toISOString(),
  };
  const saved = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
  saved.push(photo);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return photo;
}

export async function getAllPhotosLocal() {
  return JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
}

export async function savePhotoForUser({ uri, coords, note = "", labels = [] }) {
  const user = auth.currentUser;
  if (!user) {
    return savePhotoLocal({ uri, coords, note, labels });
  }
  
  try {
    // Upload to Cloudinary
    const cloudinaryResult = await uploadImageToCloudinary(uri, user.uid);
    
    const photoId = Date.now().toString();
    const docRef = doc(db, "users", user.uid, "photos", photoId);
    await setDoc(docRef, {
      id: photoId,
      uri: cloudinaryResult.secureUrl,
      publicId: cloudinaryResult.publicId,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      coords,
      note,
      labels,
      timestamp: serverTimestamp(),
      owner: user.uid,
    });
    
    return { 
      id: photoId, 
      uri: cloudinaryResult.secureUrl, 
      coords, 
      note, 
      labels 
    };
  } catch (error) {
    console.error('Save photo error:', error);
    // Fallback to local storage if Cloudinary fails
    return savePhotoLocal({ uri, coords, note, labels });
  }
}

export async function getAllPhotosForCurrentUser() {
  const user = auth.currentUser;
  if (!user) return getAllPhotosLocal();
  const snap = await getDocs(collection(db, "users", user.uid, "photos"));
  const items = [];
  snap.forEach((d) => items.push(d.data()));
  return items;
}

