// Firebase auth service with Firestore
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  startAt,
  endAt,
  getDocFromCache,
  getDocsFromCache
} from "firebase/firestore";
import { auth, db } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "current_user";

export async function registerUser(email, password, displayName = "") {
  try {
    const cleanEmail = email.trim();
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || cleanEmail.split('@')[0],
      avatar: null,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      searchTerms: generateSearchTerms(displayName || cleanEmail.split('@')[0], user.email)
    };
    
    await setDoc(doc(db, "users", user.uid), userProfile);
    
    // Save to local cache
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userProfile));
    
    return userProfile;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("Email đã được sử dụng");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Email không hợp lệ");
    }
    throw new Error(error.message || "Lỗi đăng ký");
  }
}

// Generate search terms for efficient searching
function generateSearchTerms(displayName, email) {
  const terms = [];
  const name = displayName.toLowerCase();
  const emailLower = email.toLowerCase();
  
  // Add full terms
  terms.push(name, emailLower);
  
  // Add prefixes for autocomplete
  for (let i = 1; i <= name.length; i++) {
    terms.push(name.substring(0, i));
  }
  
  for (let i = 1; i <= emailLower.length; i++) {
    terms.push(emailLower.substring(0, i));
  }
  
  return [...new Set(terms)];
}

export async function loginUser(email, password) {
  try {
    const cleanEmail = email.trim();
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;
    
    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    let userProfile;
    
    if (!userDoc.exists()) {
      // Create profile if doesn't exist (for users created before Firestore migration)
      console.log("Creating user profile in Firestore...");
      userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        avatar: null,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        searchTerms: generateSearchTerms(
          user.displayName || user.email.split('@')[0], 
          user.email
        )
      };
      
      await setDoc(doc(db, "users", user.uid), userProfile);
    } else {
      userProfile = { uid: user.uid, ...userDoc.data() };
      
      // Update last seen
      await setDoc(doc(db, "users", user.uid), {
        ...userProfile,
        lastSeen: new Date().toISOString()
      }, { merge: true });
    }
    
    // Save to local cache
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userProfile));
    
    return userProfile;
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error("Email hoặc mật khẩu không đúng");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Email không hợp lệ");
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error("Thông tin đăng nhập không hợp lệ");
    }
    throw new Error(error.message || "Lỗi đăng nhập");
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    await AsyncStorage.removeItem(AUTH_KEY);
  } catch (error) {
    throw new Error("Lỗi đăng xuất");
  }
}

export async function getCurrentUser() {
  try {
    // Try to get from local cache first
    const userData = await AsyncStorage.getItem(AUTH_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    
    // If not in cache, check Firebase Auth
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userProfile = { uid: user.uid, ...userDoc.data() };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userProfile));
        return userProfile;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userProfile = { uid: user.uid, ...userDoc.data() };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userProfile));
        callback(userProfile);
      } else {
        callback(null);
      }
    } else {
      await AsyncStorage.removeItem(AUTH_KEY);
      callback(null);
    }
  });
}

// Cache for users
let usersCache = null;
let usersCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getAllUsers(forceRefresh = false) {
  try {
    // Return cache if valid
    if (!forceRefresh && usersCache && Date.now() - usersCacheTime < CACHE_DURATION) {
      return usersCache;
    }
    
    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(100)); // Limit to 100 users
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      });
    });
    
    // Update cache
    usersCache = users;
    usersCacheTime = Date.now();
    
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    return usersCache || [];
  }
}

export async function getUserByEmail(email) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, uid: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

// Cache for search results
const searchCache = new Map();
const SEARCH_CACHE_DURATION = 1 * 60 * 1000; // 1 minute

// Optimized search using searchTerms array
export async function searchUsersByQuery(searchQuery, maxResults = 10) {
  try {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }
    
    const searchTerm = searchQuery.toLowerCase().trim();
    const cacheKey = `${searchTerm}_${maxResults}`;
    
    // Check memory cache
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.time < SEARCH_CACHE_DURATION) {
      return cached.data;
    }
    
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("searchTerms", "array-contains", searchTerm),
      limit(maxResults)
    );
    
    // Try cache first (instant)
    let querySnapshot;
    try {
      querySnapshot = await getDocsFromCache(q);
      if (!querySnapshot.empty) {
        const users = [];
        querySnapshot.forEach((doc) => {
          users.push({ id: doc.id, uid: doc.id, ...doc.data() });
        });
        searchCache.set(cacheKey, { data: users, time: Date.now() });
        return users;
      }
    } catch {}
    
    // Fallback to network
    querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, uid: doc.id, ...doc.data() });
    });
    
    searchCache.set(cacheKey, { data: users, time: Date.now() });
    return users;
  } catch (error) {
    console.error("Error searching users:", error);
    const cacheKey = `${searchQuery.toLowerCase().trim()}_${maxResults}`;
    const cached = searchCache.get(cacheKey);
    return cached ? cached.data : [];
  }
}

// Upload avatar to Cloudinary
export async function uploadAvatar(fileUri, userId) {
  try {
    const { CLOUDINARY_CONFIG } = require('./cloudinaryPhotoService');
    
    if (!CLOUDINARY_CONFIG.cloud_name || !CLOUDINARY_CONFIG.upload_preset) {
      throw new Error("Cloudinary chưa được cấu hình");
    }
    
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      type: "image/jpeg",
      name: `avatar_${userId}_${Date.now()}.jpg`,
    });
    formData.append("upload_preset", CLOUDINARY_CONFIG.upload_preset);
    formData.append("folder", `avatars/${userId}`);
    formData.append("tags", `avatar,user:${userId}`);
    
    if (CLOUDINARY_CONFIG.api_key) {
      formData.append("api_key", CLOUDINARY_CONFIG.api_key);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || `Upload failed: ${response.status}`);
    }

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw new Error(`Không thể tải ảnh đại diện: ${error.message}`);
  }
}

// Update user profile
export async function updateUserProfile(userId, updates) {
  try {
    const userRef = doc(db, "users", userId);
    
    // If displayName or email is updated, regenerate search terms
    if (updates.displayName || updates.email) {
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        updates.searchTerms = generateSearchTerms(
          updates.displayName || userData.displayName,
          updates.email || userData.email
        );
      }
    }
    
    await setDoc(userRef, updates, { merge: true });
    
    // Update local cache
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.uid === userId) {
      const updatedUser = { ...currentUser, ...updates };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    }
    
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Không thể cập nhật thông tin người dùng");
  }
}

// Update user avatar
export async function updateUserAvatar(userId, fileUri) {
  try {
    // Upload to Cloudinary
    const avatarData = await uploadAvatar(fileUri, userId);
    
    // Update user profile with new avatar URL
    await updateUserProfile(userId, {
      avatar: avatarData.secureUrl,
      avatarPublicId: avatarData.publicId,
    });
    
    return avatarData.secureUrl;
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw error;
  }
}

// Cache for individual users
const userByIdCache = new Map();
const USER_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Get user by ID
export async function getUserById(userId) {
  try {
    // Check memory cache first
    const cached = userByIdCache.get(userId);
    if (cached && Date.now() - cached.time < USER_CACHE_DURATION) {
      return cached.data;
    }
    
    // Try Firestore cache first (instant)
    try {
      const cachedDoc = await getDocFromCache(doc(db, "users", userId));
      if (cachedDoc.exists()) {
        const userData = { id: cachedDoc.id, uid: cachedDoc.id, ...cachedDoc.data() };
        userByIdCache.set(userId, { data: userData, time: Date.now() });
        return userData;
      }
    } catch {}
    
    // Fallback to network
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = { id: userDoc.id, uid: userDoc.id, ...userDoc.data() };
      userByIdCache.set(userId, { data: userData, time: Date.now() });
      return userData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    const cached = userByIdCache.get(userId);
    return cached ? cached.data : null;
  }
}
