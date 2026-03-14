// Friend service backed by Firestore
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  getDocFromCache
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserById, searchUsersByQuery } from "./authService";
// NOTE: notificationService is imported lazily (require) inside functions
// to avoid circular dependency (notificationService imports from friendService)

// Firestore structure:
// friends/{userId} = {
//   friends: string[],
//   friendRequestsSent: string[],
//   friendRequestsReceived: string[],
//   updatedAt: timestamp
// }

async function getFriendDoc(userId) {
  const docRef = doc(db, "friends", userId);
  
  try {
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    // Create new document if doesn't exist
    const newDoc = {
      friends: [],
      friendRequestsSent: [],
      friendRequestsReceived: [],
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(docRef, newDoc);
    return newDoc;
  } catch (error) {
    // Try cache if offline
    if (error.code === 'unavailable') {
      try {
        const cachedDoc = await getDocFromCache(docRef);
        if (cachedDoc.exists()) {
          return cachedDoc.data();
        }
      } catch (cacheError) {
        console.log('Cache miss, returning empty doc');
      }
    }
    
    // Return empty doc if all fails
    return {
      friends: [],
      friendRequestsSent: [],
      friendRequestsReceived: [],
      updatedAt: new Date().toISOString()
    };
  }
}

async function updateFriendDoc(userId, updates) {
  const docRef = doc(db, "friends", userId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

function unique(arr) {
  return Array.from(new Set(arr));
}

// Cache for friends list
const friendsCache = new Map();
const FRIENDS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Function to clear cache for a specific user
export function clearFriendsCache(userId) {
  friendsCache.delete(userId);
}

export async function getFriends(userId, forceRefresh = false) {
  try {
    // Check cache
    if (!forceRefresh) {
      const cached = friendsCache.get(userId);
      if (cached && Date.now() - cached.time < FRIENDS_CACHE_DURATION) {
        return cached.data;
      }
    }
    
    const friendDoc = await getFriendDoc(userId);
    const friendIds = friendDoc.friends || [];
    
    if (friendIds.length === 0) {
      return [];
    }
    
    // Batch fetch users (max 10 at a time to avoid lag)
    const batchSize = 10;
    const friendsDetails = [];
    
    for (let i = 0; i < friendIds.length; i += batchSize) {
      const batch = friendIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (friendId) => {
          const user = await getUserById(friendId);
          if (user) {
            return {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              avatar: user.avatar,
              lastSeen: user.lastSeen
            };
          }
          return null;
        })
      );
      friendsDetails.push(...batchResults.filter(f => f !== null));
    }
    
    // Update cache
    friendsCache.set(userId, {
      data: friendsDetails,
      time: Date.now()
    });
    
    return friendsDetails;
  } catch (error) {
    console.error("Error getting friends:", error);
    // Return cached data if available
    const cached = friendsCache.get(userId);
    return cached ? cached.data : [];
  }
}

export async function getPendingRequests(userId, forceRefresh = false) {
  try {
    // Clear cache if force refresh
    if (forceRefresh) {
      clearFriendsCache(userId);
      console.log('🗑️ Force refresh: cleared cache for', userId);
    }
    const friendDoc = await getFriendDoc(userId);
    const requests = friendDoc.friendRequestsReceived || [];
    console.log('📬 Pending requests for', userId, ':', requests.length);
    return requests;
  } catch (error) {
    console.error("❌ Error getting pending requests:", error);
    return [];
  }
}

export async function sendFriendRequest(senderId, receiverId) {
  try {
    if (senderId === receiverId) return;
    
    // Check if users exist
    const sender = await getUserById(senderId);
    const receiver = await getUserById(receiverId);
    
    if (!sender || !receiver) {
      throw new Error("Người dùng không tồn tại");
    }
    
    // Get current friend docs
    const senderDoc = await getFriendDoc(senderId);
    const receiverDoc = await getFriendDoc(receiverId);
    
    // Check if already friends
    if (senderDoc.friends?.includes(receiverId)) {
      return;
    }
    
    // Check if request already sent
    if (senderDoc.friendRequestsSent?.includes(receiverId)) {
      return;
    }
    
    // Update sender's sent requests
    const senderRef = doc(db, "friends", senderId);
    await updateDoc(senderRef, {
      friendRequestsSent: arrayUnion(receiverId),
      updatedAt: new Date().toISOString()
    });
    
    // Update receiver's received requests
    const receiverRef = doc(db, "friends", receiverId);
    await updateDoc(receiverRef, {
      friendRequestsReceived: arrayUnion(senderId),
      updatedAt: new Date().toISOString()
    });
    
    // Clear cache for both users
    clearFriendsCache(senderId);
    clearFriendsCache(receiverId);

    // Send notification to receiver
    try {
      const { sendNotification, NOTIFICATION_TYPES } = require("./notificationService");
      await sendNotification(receiverId, {
        senderId: senderId,
        senderName: sender.displayName || sender.email || "Người dùng",
        senderAvatar: sender.avatar || null,
        type: NOTIFICATION_TYPES.FRIEND_REQUEST,
        title: "Lời mời kết bạn",
        message: `${sender.displayName || sender.email} đã gửi lời mời kết bạn`,
        data: { senderId },
      });
      console.log("✅ Friend request notification sent to:", receiverId);
    } catch (notifError) {
      console.warn("⚠️ Failed to send friend request notification:", notifError);
    }
    
  } catch (error) {
    console.error("Error sending friend request:", error);
    throw error;
  }
}

export async function acceptFriendRequest(senderId, receiverId) {
  try {
    console.log('🔄 Accepting friend request:', { senderId, receiverId });
    
    // receiverId accepts request from senderId
    const senderRef = doc(db, "friends", senderId);
    const receiverRef = doc(db, "friends", receiverId);
    
    // Update sender: remove from sent, add to friends
    await updateDoc(senderRef, {
      friendRequestsSent: arrayRemove(receiverId),
      friends: arrayUnion(receiverId),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Updated sender document');
    
    // Update receiver: remove from received, add to friends
    await updateDoc(receiverRef, {
      friendRequestsReceived: arrayRemove(senderId),
      friends: arrayUnion(senderId),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Updated receiver document');
    
    // Clear cache for both users - IMPORTANT!
    clearFriendsCache(senderId);
    clearFriendsCache(receiverId);
    console.log('🗑️ Cleared cache for both users');

    // Send notification to the original sender that request was accepted
    try {
      const { sendNotification, NOTIFICATION_TYPES } = require("./notificationService");
      const receiver = await getUserById(receiverId);
      await sendNotification(senderId, {
        senderId: receiverId,
        senderName: receiver?.displayName || receiver?.email || "Người dùng",
        senderAvatar: receiver?.avatar || null,
        type: NOTIFICATION_TYPES.FRIEND_ACCEPTED,
        title: "Lời mời được chấp nhận",
        message: `${receiver?.displayName || receiver?.email} đã chấp nhận lời mời kết bạn`,
        data: { recipientId: receiverId },
      });
      console.log("✅ Friend accepted notification sent to:", senderId);
    } catch (notifError) {
      console.warn("⚠️ Failed to send friend accepted notification:", notifError);
    }
    
  } catch (error) {
    console.error("❌ Error accepting friend request:", error);
    throw error;
  }
}

export async function declineFriendRequest(senderId, receiverId) {
  try {
    console.log('🔄 Declining friend request:', { senderId, receiverId });
    
    // receiverId declines request from senderId OR sender cancels
    const senderRef = doc(db, "friends", senderId);
    const receiverRef = doc(db, "friends", receiverId);
    
    // Remove from both sides
    await updateDoc(senderRef, {
      friendRequestsSent: arrayRemove(receiverId),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Removed from sender sent requests');
    
    await updateDoc(receiverRef, {
      friendRequestsReceived: arrayRemove(senderId),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Removed from receiver received requests');
    
    // Clear cache for both users - IMPORTANT!
    clearFriendsCache(senderId);
    clearFriendsCache(receiverId);
    console.log('🗑️ Cleared cache for both users');
    
  } catch (error) {
    console.error("❌ Error declining friend request:", error);
    throw error;
  }
}

export async function removeFriend(userId, friendId) {
  try {
    const userRef = doc(db, "friends", userId);
    const friendRef = doc(db, "friends", friendId);
    
    // Remove from both sides
    await updateDoc(userRef, {
      friends: arrayRemove(friendId),
      updatedAt: new Date().toISOString()
    });
    
    await updateDoc(friendRef, {
      friends: arrayRemove(userId),
      updatedAt: new Date().toISOString()
    });
    
    // Clear cache for both users
    clearFriendsCache(userId);
    clearFriendsCache(friendId);
    
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
}

export async function getRelationshipStatus(currentUserId, otherUserId) {
  try {
    const friendDoc = await getFriendDoc(currentUserId);
    
    if (friendDoc.friends?.includes(otherUserId)) return "friends";
    if (friendDoc.friendRequestsSent?.includes(otherUserId)) return "sent";
    if (friendDoc.friendRequestsReceived?.includes(otherUserId)) return "received";
    return "none";
  } catch (error) {
    console.error("Error getting relationship status:", error);
    return "none";
  }
}

export async function getFriendsDetailed(userId) {
  // getFriends now returns detailed objects, so just return it directly
  return getFriends(userId);
}

export async function getPendingRequestsDetailed(userId, forceRefresh = false) {
  try {
    const ids = await getPendingRequests(userId, forceRefresh);
    
    const requestsDetails = await Promise.all(
      ids.map(async (requesterId) => {
        const user = await getUserById(requesterId);
        if (user) {
          return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            lastSeen: user.lastSeen
          };
        }
        return null;
      })
    );
    
    return requestsDetails.filter(r => r !== null);
  } catch (error) {
    console.error("Error getting pending requests detailed:", error);
    return [];
  }
}

export async function searchUsers(query, currentUserId) {
  try {
    console.log("🔍 Searching for:", query, "Current user:", currentUserId);
    
    // Use optimized Firebase search
    const users = await searchUsersByQuery(query, 10);
    console.log("📊 Raw search results:", users.length, users);
    
    // Map to consistent format (don't filter current user - they can search themselves)
    const results = users.map(user => ({
      uid: user.uid || user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      lastSeen: user.lastSeen,
      isCurrentUser: user.uid === currentUserId || user.id === currentUserId
    }));
    
    console.log("✅ Search results:", results.length, results);
    return results;
  } catch (error) {
    console.error("❌ Error searching users:", error);
    return [];
  }
}

export async function addFriend(userId, friendId) {
  // Alias for sendFriendRequest to match the import in UnifiedFriendsScreen
  return sendFriendRequest(userId, friendId);
}
