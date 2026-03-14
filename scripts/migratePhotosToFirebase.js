// Script to migrate existing Cloudinary photos to Firebase userAlbums
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyBIzlLnulTQCMTjqa-s9wSjE4tzNu_S_fU",
//   authDomain: "appp-92bd1.firebaseapp.com",
//   projectId: "appp-92bd1",
//   storageBucket: "appp-92bd1.firebasestorage.app",
//   messagingSenderId: "266853425631",
//   appId: "1:266853425631:web:a3704a3e75da244b5f646a",
//   measurementId: "G-6C8JD2PEJZ"
// };

// const firebaseConfig = {
//   apiKey: "AIzaSyBWpDVERFKlEPZyVp4RGGFBZG2csyAOdLE",
//   authDomain: "we-share-43b11.firebaseapp.com",
//   projectId: "we-share-43b11",
//   storageBucket: "we-share-43b11.firebasestorage.app",
//   messagingSenderId: "71205270137",
//   appId: "1:71205270137:web:ceca9343f90197e77f9aa8"
// };

const firebaseConfig = {
  apiKey: "AIzaSyACPsnfB9D9EGwzsij1dVUmfxhMDZiFtvg",
  authDomain: "weshare-7b3b9.firebaseapp.com",
  projectId: "weshare-7b3b9",
  storageBucket: "weshare-7b3b9.firebasestorage.app",
  messagingSenderId: "656343949905",
  appId: "1:656343949905:web:f8e399f6e91ac673610e70",
  measurementId: "G-BL69HMC0KW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Your Cloudinary cloud name
const CLOUDINARY_CLOUD_NAME = "diiqmfjhd";

async function migratePhotos() {
  try {
    console.log("🔍 Fetching all users...");
    const usersSnapshot = await getDocs(collection(db, "users"));

    console.log(`📊 Found ${usersSnapshot.size} users`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      console.log(`\n👤 Processing user: ${userData.email || userId}`);

      // Fetch photos from Cloudinary for this user
      // Note: You need to implement this based on how you store photos in Cloudinary
      // For now, we'll create a sample migration

      const samplePhotos = await fetchCloudinaryPhotos(userId);

      if (samplePhotos.length === 0) {
        console.log(`   ⏭️  No photos found, skipping`);
        continue;
      }

      // Create userAlbum document
      const albumRef = doc(db, "userAlbums", userId);

      const albumData = {
        userId: userId,
        photos: samplePhotos.map(photo => ({
          id: photo.public_id || Date.now().toString(),
          cloudinaryUrl: photo.secure_url,
          publicId: photo.public_id,
          caption: photo.context?.custom?.caption || "",
          tags: photo.tags || [],
          location: photo.context?.custom?.location || null,
          aiAnalysis: photo.context?.custom?.aiAnalysis || null,
          createdAt: photo.created_at || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        totalPhotos: samplePhotos.length,
        lastUpdated: new Date().toISOString()
      };

      await setDoc(albumRef, albumData);
      console.log(`   ✅ Migrated ${samplePhotos.length} photos`);
    }

    console.log(`\n🎉 Migration complete!`);

  } catch (error) {
    console.error("❌ Migration error:", error);
  }
}

// Fetch photos from Cloudinary
// This is a placeholder - you need to implement based on your Cloudinary setup
async function fetchCloudinaryPhotos(userId) {
  try {
    // Option 1: Use Cloudinary Admin API
    // const cloudinary = require('cloudinary').v2;
    // cloudinary.config({ ... });
    // const result = await cloudinary.api.resources({
    //   type: 'upload',
    //   prefix: `users/${userId}/`,
    //   max_results: 500
    // });
    // return result.resources;

    // Option 2: Fetch from your existing photo storage
    // If you store photo metadata in Firestore/AsyncStorage

    // For now, return empty array
    console.log(`   🔍 Fetching Cloudinary photos for user ${userId}...`);

    // You can also use Cloudinary's search API
    // https://cloudinary.com/documentation/search_api

    return [];
  } catch (error) {
    console.error(`   ❌ Error fetching photos for ${userId}:`, error);
    return [];
  }
}

// Alternative: Migrate from existing local storage
async function migrateFromLocalStorage() {
  console.log("📱 This function should be run from React Native app");
  console.log("   Use AsyncStorage to get existing photos");
  console.log("   Then sync to Firebase userAlbums");
}

// Run migration
console.log("🚀 Starting photo migration...\n");
migratePhotos();
