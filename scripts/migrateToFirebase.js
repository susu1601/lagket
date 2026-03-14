/**
 * Migration Script: AsyncStorage to Firebase
 * 
 * Script này giúp migrate dữ liệu users từ AsyncStorage sang Firebase Firestore
 * 
 * LƯU Ý: Script này chỉ để tham khảo. Bạn cần chạy thủ công và điều chỉnh theo nhu cầu.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";

const USERS_KEY = "users_data";

// Generate search terms for user
function generateSearchTerms(displayName, email) {
  const terms = [];
  const name = displayName.toLowerCase();
  const emailLower = email.toLowerCase();
  
  terms.push(name, emailLower);
  
  for (let i = 1; i <= name.length; i++) {
    terms.push(name.substring(0, i));
  }
  
  for (let i = 1; i <= emailLower.length; i++) {
    terms.push(emailLower.substring(0, i));
  }
  
  return [...new Set(terms)];
}

/**
 * Migrate users from AsyncStorage to Firebase
 * 
 * WARNING: Passwords cannot be migrated because Firebase uses different hashing.
 * Users will need to reset their passwords or register again.
 */
export async function migrateUsersToFirebase() {
  try {
    console.log("Starting migration...");
    
    // Get users from AsyncStorage
    const usersData = await AsyncStorage.getItem(USERS_KEY);
    if (!usersData) {
      console.log("No users found in AsyncStorage");
      return { success: 0, failed: 0, total: 0 };
    }
    
    const users = JSON.parse(usersData);
    console.log(`Found ${users.length} users to migrate`);
    
    let success = 0;
    let failed = 0;
    const failedUsers = [];
    
    for (const user of users) {
      try {
        console.log(`Migrating user: ${user.email}`);
        
        // Create Firebase Auth user with temporary password
        // Users will need to reset password later
        const tempPassword = `Temp${Date.now()}!`;
        
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          user.email, 
          tempPassword
        );
        
        const firebaseUser = userCredential.user;
        
        // Create user profile in Firestore
        const userProfile = {
          uid: firebaseUser.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          avatar: user.avatar || null,
          createdAt: user.createdAt || new Date().toISOString(),
          lastSeen: user.lastSeen || new Date().toISOString(),
          searchTerms: generateSearchTerms(
            user.displayName || user.email.split('@')[0],
            user.email
          ),
          // Migration metadata
          migratedFrom: "AsyncStorage",
          migratedAt: new Date().toISOString(),
          oldUserId: user.id,
          needsPasswordReset: true
        };
        
        await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
        
        console.log(`✓ Successfully migrated: ${user.email}`);
        success++;
        
      } catch (error) {
        console.error(`✗ Failed to migrate ${user.email}:`, error.message);
        failed++;
        failedUsers.push({
          email: user.email,
          error: error.message
        });
      }
    }
    
    console.log("\n=== Migration Summary ===");
    console.log(`Total users: ${users.length}`);
    console.log(`Successfully migrated: ${success}`);
    console.log(`Failed: ${failed}`);
    
    if (failedUsers.length > 0) {
      console.log("\nFailed users:");
      failedUsers.forEach(u => {
        console.log(`- ${u.email}: ${u.error}`);
      });
    }
    
    return {
      total: users.length,
      success,
      failed,
      failedUsers
    };
    
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}

/**
 * Export users from AsyncStorage to JSON file
 * Useful for backup before migration
 */
export async function exportUsersToJSON() {
  try {
    const usersData = await AsyncStorage.getItem(USERS_KEY);
    if (!usersData) {
      console.log("No users found");
      return null;
    }
    
    const users = JSON.parse(usersData);
    
    // Remove passwords for security
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen
    }));
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalUsers: users.length,
      users: sanitizedUsers
    };
    
    console.log("Export data:", JSON.stringify(exportData, null, 2));
    return exportData;
    
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
}

/**
 * Clear AsyncStorage users data after successful migration
 * WARNING: Only run this after confirming migration was successful!
 */
export async function clearAsyncStorageUsers() {
  try {
    await AsyncStorage.removeItem(USERS_KEY);
    console.log("AsyncStorage users data cleared");
  } catch (error) {
    console.error("Error clearing AsyncStorage:", error);
    throw error;
  }
}

// Example usage:
// import { migrateUsersToFirebase, exportUsersToJSON } from './scripts/migrateToFirebase';
//
// // 1. Export backup first
// const backup = await exportUsersToJSON();
//
// // 2. Run migration
// const result = await migrateUsersToFirebase();
//
// // 3. If successful, optionally clear old data
// if (result.failed === 0) {
//   await clearAsyncStorageUsers();
// }
