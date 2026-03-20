// Reaction Service - Emoji reactions on photos
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField
} from "firebase/firestore";
import { db } from "./firebase";

// Firestore structure:
// reactions/{photoId} = {
//   [userId]: { emoji: string, userName: string, createdAt: string }
// }

const EMOJI_LIST = ["❤️", "😂", "😍", "🔥", "👏", "😢"];

export { EMOJI_LIST };

// Add or update a reaction
export async function addReaction(
  userId,
  photoId,
  emoji,
  userName = "Bạn",
  ownerUserId = null,
  photoMeta = {}
) {
  try {
    const reactionRef = doc(db, "reactions", photoId);
    const reactionSnap = await getDoc(reactionRef);

    const reactionData = {
      emoji,
      userName,
      createdAt: new Date().toISOString(),
    };

    if (reactionSnap.exists()) {
      await updateDoc(reactionRef, {
        [userId]: reactionData,
      });
    } else {
      await setDoc(reactionRef, {
        [userId]: reactionData,
      });
    }

    console.log("✅ Reaction added:", { photoId, userId, emoji });

    // Send notification to photo owner
    if (ownerUserId && ownerUserId !== userId) {
      try {
        const { sendNotification, NOTIFICATION_TYPES } = require("./notificationService");
        await sendNotification(ownerUserId, {
          senderId: userId,
          senderName: userName,
          type: NOTIFICATION_TYPES.REACTION,
          title: "Cảm xúc mới",
          message: `${userName} đã thả ${emoji} cho ảnh của bạn`,
          data: {
            photoId,
            ownerUserId,
            emoji,
            photoUrl: photoMeta?.photoUrl || null,
            caption: photoMeta?.caption || "",
          },
        });
      } catch (notifErr) {
        console.warn("⚠️ Failed to send reaction notification:", notifErr);
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Error adding reaction:", error);
    throw error;
  }
}

// Remove a reaction
export async function removeReaction(userId, photoId) {
  try {
    const reactionRef = doc(db, "reactions", photoId);
    const reactionSnap = await getDoc(reactionRef);

    if (!reactionSnap.exists()) return false;

    const data = reactionSnap.data();
    delete data[userId];

    // If no reactions left, keep empty doc
    await setDoc(reactionRef, data);

    console.log("✅ Reaction removed:", { photoId, userId });
    return true;
  } catch (error) {
    console.error("❌ Error removing reaction:", error);
    throw error;
  }
}

// Get all reactions for a photo
export async function getReactions(photoId) {
  try {
    const reactionRef = doc(db, "reactions", photoId);
    const reactionSnap = await getDoc(reactionRef);

    if (!reactionSnap.exists()) return {};

    return reactionSnap.data();
  } catch (error) {
    if (error?.code !== 'permission-denied') {
      console.error("❌ Error getting reactions:", error);
    }
    return {};
  }
}

// Get current user's reaction for a photo
export async function getUserReaction(userId, photoId) {
  try {
    const reactions = await getReactions(photoId);
    return reactions[userId] || null;
  } catch (error) {
    return null;
  }
}
