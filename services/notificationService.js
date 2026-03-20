import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { getFriends } from "./friendService";
import { getUserPushToken, sendPushNotification } from "./pushNotificationService";

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  NEW_PHOTO: "new_photo",
  CHAT_MESSAGE: "chat_message",
  FRIEND_REQUEST: "friend_request",
  FRIEND_ACCEPTED: "friend_accepted",
  FAMILY_INVITATION: "family_invitation",
  FAMILY_ACCEPTED: "family_accepted",
  FAMILY_DECLINED: "family_declined",
  REACTION: "reaction",
};

/**
 * Send notification to a single user
 */
export async function sendNotification(recipientId, notification) {
  try {
    const notificationData = {
      recipientId,
      senderId: notification.senderId,
      senderName: notification.senderName,
      senderAvatar: notification.senderAvatar || null,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      read: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "notifications"), notificationData);
    console.log("✅ Notification sent:", docRef.id);

    // Send push notification
    try {
      const pushToken = await getUserPushToken(recipientId);
      if (pushToken) {
        const pushData = {
          ...(notification.data || {}),
          notificationType: notification.type,
          senderId: notification.senderId,
          recipientId,
          notificationId: docRef.id,
        };

        await sendPushNotification(
          pushToken,
          notification.title,
          notification.message,
          pushData
        );
        console.log("✅ Push notification sent to:", recipientId);
      }
    } catch (pushError) {
      console.warn("⚠️ Failed to send push notification:", pushError);
      // Don't throw - Firestore notification was created successfully
    }

    return docRef.id;
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    throw error;
  }
}

/**
 * Send notification to multiple users (batch)
 */
export async function sendNotificationToMultiple(recipientIds, notification) {
  try {
    const batch = writeBatch(db);
    const notificationsRef = collection(db, "notifications");

    const promises = recipientIds.map(recipientId => {
      const notificationData = {
        recipientId,
        senderId: notification.senderId,
        senderName: notification.senderName,
        senderAvatar: notification.senderAvatar || null,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        read: false,
        createdAt: serverTimestamp(),
      };

      return addDoc(notificationsRef, notificationData);
    });

    await Promise.all(promises);
    console.log(`✅ Sent ${recipientIds.length} notifications`);
    return true;
  } catch (error) {
    console.error("❌ Error sending batch notifications:", error);
    throw error;
  }
}

/**
 * Notify all friends about a new photo
 */
export async function notifyFriendsAboutNewPhoto(userId, userName, photoData) {
  try {
    console.log("📢 Notifying friends about new photo...");

    // Get user's friends
    const friends = await getFriends(userId);

    if (friends.length === 0) {
      console.log("ℹ️ No friends to notify");
      return;
    }

    const friendIds = friends.map(f => f.uid);

    // Create notification
    const notification = {
      senderId: userId,
      senderName: userName,
      senderAvatar: null,
      type: NOTIFICATION_TYPES.NEW_PHOTO,
      title: "Ảnh mới",
      message: `${userName} đã đăng ảnh mới`,
      data: {
        photoId: photoData.id,
        photoUrl: photoData.cloudinaryUrl || photoData.uri,
        caption: photoData.caption || photoData.note || "",
      }
    };

    await sendNotificationToMultiple(friendIds, notification);
    console.log(`✅ Notified ${friendIds.length} friends`);
  } catch (error) {
    console.error("❌ Error notifying friends:", error);
    throw error;
  }
}

/**
 * Subscribe to user's notifications (real-time)
 */
export function subscribeToNotifications(userId, callback) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
        });

        notifications.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        console.log(`📬 Received ${notifications.length} notifications`);
        callback(notifications);
      },
      (error) => {
        console.error("❌ Error in notification listener:", error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("❌ Error subscribing to notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
    console.log("✅ Notification marked as read:", notificationId);
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.forEach((document) => {
      batch.update(document.ref, {
        read: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`✅ Marked ${snapshot.size} notifications as read`);
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    return 0;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId) {
  try {
    await deleteDoc(doc(db, "notifications", notificationId));
    console.log("✅ Notification deleted:", notificationId);
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    throw error;
  }
}

/**
 * Send family invitation notification
 */
export async function sendFamilyInvitationNotification(recipientId, senderName, familyName, familyId) {
  try {
    const notification = {
      senderId: recipientId, // Placeholder, will be overridden
      senderName: senderName,
      senderAvatar: null,
      type: NOTIFICATION_TYPES.FAMILY_INVITATION,
      title: "Lời mời gia đình",
      message: `${senderName} đã mời bạn vào gia đình "${familyName}"`,
      data: {
        familyId: familyId,
        familyName: familyName,
      }
    };

    await sendNotification(recipientId, notification);
    console.log("✅ Family invitation notification sent");
  } catch (error) {
    console.error("❌ Error sending family invitation notification:", error);
    throw error;
  }
}

/**
 * Send family accepted notification
 */
export async function sendFamilyAcceptedNotification(recipientId, accepterName, familyName) {
  try {
    const notification = {
      senderId: recipientId, // Placeholder
      senderName: accepterName,
      senderAvatar: null,
      type: NOTIFICATION_TYPES.FAMILY_ACCEPTED,
      title: "Lời mời được chấp nhận",
      message: `${accepterName} đã chấp nhận lời mời vào gia đình "${familyName}"`,
      data: {
        familyName: familyName,
      }
    };

    await sendNotification(recipientId, notification);
    console.log("✅ Family accepted notification sent");
  } catch (error) {
    console.error("❌ Error sending family accepted notification:", error);
    throw error;
  }
}

/**
 * Send family declined notification
 */
export async function sendFamilyDeclinedNotification(recipientId, declinerName, familyName) {
  try {
    const notification = {
      senderId: recipientId, // Placeholder
      senderName: declinerName,
      senderAvatar: null,
      type: NOTIFICATION_TYPES.FAMILY_DECLINED,
      title: "Lời mời bị từ chối",
      message: `${declinerName} đã từ chối lời mời vào gia đình "${familyName}"`,
      data: {
        familyName: familyName,
      }
    };

    await sendNotification(recipientId, notification);
    console.log("✅ Family declined notification sent");
  } catch (error) {
    console.error("❌ Error sending family declined notification:", error);
    throw error;
  }
}
