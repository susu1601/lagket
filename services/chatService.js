// Chat service for Firestore
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserById } from "./authService";

// Firestore structure:
// chats/{chatId} = {
//   participants: [userId1, userId2],
//   participantDetails: { userId1: {name, avatar}, userId2: {name, avatar} },
//   lastMessage: { text, senderId, timestamp, type },
//   updatedAt: timestamp
// }
// 
// chats/{chatId}/messages/{messageId} = {
//   senderId: string,
//   text: string,
//   imageUrl: string (optional),
//   type: 'text' | 'image',
//   timestamp: timestamp,
//   read: boolean
// }

// Get or create chat between two users
export async function getOrCreateChat(userId1, userId2) {
  try {
    // Sort user IDs to ensure consistent chat ID
    const participants = [userId1, userId2].sort();
    const chatId = participants.join('_');

    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      return { id: chatId, ...chatSnap.data() };
    }

    // Create new chat
    const user1 = await getUserById(userId1);
    const user2 = await getUserById(userId2);

    const newChat = {
      participants,
      participantDetails: {
        [userId1]: {
          name: user1.displayName || user1.email,
          avatar: user1.avatar || null
        },
        [userId2]: {
          name: user2.displayName || user2.email,
          avatar: user2.avatar || null
        }
      },
      lastMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(chatRef, newChat);
    return { id: chatId, ...newChat };
  } catch (error) {
    console.error('Error getting or creating chat:', error);
    throw error;
  }
}

// Get all chats for a user
export async function getUserChats(userId) {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const chats = [];

    snapshot.forEach(doc => {
      chats.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
}

// Send a text message
export async function sendMessage(chatId, senderId, text) {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    const now = Timestamp.now();

    // Add message with server timestamp
    const messageData = {
      senderId,
      text,
      type: 'text',
      timestamp: now,
      createdAt: now,
      read: false
    };

    await addDoc(messagesRef, messageData);

    // Update chat's last message
    await updateDoc(chatRef, {
      lastMessage: {
        text,
        senderId,
        timestamp: now,
        type: 'text'
      },
      updatedAt: now
    });

    // Send notification to the other participant.
    try {
      if (chatSnap.exists()) {
        const chatData = chatSnap.data() || {};
        const participants = chatData.participants || [];
        const recipientId = participants.find((id) => id !== senderId);
        const senderInfo = chatData.participantDetails?.[senderId] || {};

        if (recipientId) {
          const { sendNotification, NOTIFICATION_TYPES } = require('./notificationService');
          await sendNotification(recipientId, {
            senderId,
            senderName: senderInfo.name || 'Bạn bè',
            senderAvatar: senderInfo.avatar || null,
            type: NOTIFICATION_TYPES.CHAT_MESSAGE,
            title: senderInfo.name || 'Tin nhắn mới',
            message: text,
            data: {
              chatId,
              senderId,
              senderName: senderInfo.name || 'Bạn bè',
              senderAvatar: senderInfo.avatar || null,
              messageType: 'text'
            }
          });
        }
      }
    } catch (notifyError) {
      console.warn('⚠️ Failed to send chat notification:', notifyError);
    }
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
}

// Send an image message
export async function sendImageMessage(chatId, senderId, imageUrl, caption = '') {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    const now = Timestamp.now();

    // Ensure imageUrl is a string
    const imageUrlString = String(imageUrl || '');

    // Add message with server timestamp
    const messageData = {
      senderId: String(senderId),
      text: String(caption || ''),
      imageUrl: imageUrlString,
      type: 'image',
      timestamp: now,
      createdAt: now,
      read: false
    };

    await addDoc(messagesRef, messageData);

    // Update chat's last message
    await updateDoc(chatRef, {
      lastMessage: {
        text: caption || '📷 Hình ảnh',
        senderId: String(senderId),
        timestamp: now,
        type: 'image'
      },
      updatedAt: now
    });

    // Send notification to the other participant.
    try {
      if (chatSnap.exists()) {
        const chatData = chatSnap.data() || {};
        const participants = chatData.participants || [];
        const recipientId = participants.find((id) => id !== String(senderId));
        const senderInfo = chatData.participantDetails?.[String(senderId)] || {};

        if (recipientId) {
          const { sendNotification, NOTIFICATION_TYPES } = require('./notificationService');
          await sendNotification(recipientId, {
            senderId: String(senderId),
            senderName: senderInfo.name || 'Bạn bè',
            senderAvatar: senderInfo.avatar || null,
            type: NOTIFICATION_TYPES.CHAT_MESSAGE,
            title: senderInfo.name || 'Tin nhắn mới',
            message: caption || '📷 Đã gửi một hình ảnh',
            data: {
              chatId,
              senderId: String(senderId),
              senderName: senderInfo.name || 'Bạn bè',
              senderAvatar: senderInfo.avatar || null,
              messageType: 'image'
            }
          });
        }
      }
    } catch (notifyError) {
      console.warn('⚠️ Failed to send chat notification:', notifyError);
    }
  } catch (error) {
    console.error('❌ Error sending image message:', error);
    throw error;
  }
}

// Get messages for a chat (with real-time listener)
export function subscribeToMessages(chatId, callback) {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data
        });
      });

      callback(messages);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to messages:', error);
    return () => { };
  }
}

// Subscribe to user's chats (real-time)
export function subscribeToUserChats(userId, callback) {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = [];
      snapshot.forEach(doc => {
        chats.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(chats);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to chats:', error);
    return () => { };
  }
}

// Mark messages as read
export async function markMessagesAsRead(chatId, userId) {
  try {
    // Simplified version without compound query to avoid index requirement
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const snapshot = await getDocs(messagesRef);
    const updatePromises = [];

    snapshot.forEach(doc => {
      const message = doc.data();
      // Only update if message is from other user and not read
      if (message.senderId !== userId && message.read === false) {
        updatePromises.push(
          updateDoc(doc.ref, { read: true })
        );
      }
    });

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);

      // Update parent chat document to trigger real-time listener without affecting sort order
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        _lastReadUpdate: new Date().toISOString()
      });
    }
  } catch (error) {
    console.warn('❌ Error marking messages as read:', error);
  }
}

// Get unread message count for a chat
export async function getUnreadCount(chatId, userId) {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '!=', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    return 0;
  }
}

// Delete all messages in a chat
export async function deleteAllMessages(chatId) {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const snapshot = await getDocs(messagesRef);

    const deletePromises = [];
    snapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);

    // Update chat's last message
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: null,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error deleting messages:', error);
    throw error;
  }
}
