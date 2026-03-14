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
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserById } from "./authService";
import { 
  sendFamilyInvitationNotification,
  sendFamilyAcceptedNotification,
  sendFamilyDeclinedNotification 
} from "./notificationService";

// Firestore structure:
// families/{familyId} = {
//   id: string,
//   name: string,
//   createdBy: string,
//   members: string[],
//   createdAt: timestamp,
//   updatedAt: timestamp
// }
// 
// familyRequests/{userId} = {
//   received: [{ familyId, familyName, fromUserId, fromUserName, timestamp }],
//   sent: [{ familyId, toUserId, timestamp }]
// }

async function getFamilyRequestDoc(userId) {
  const docRef = doc(db, "familyRequests", userId);
  
  try {
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    const newDoc = {
      received: [],
      sent: [],
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(docRef, newDoc);
    return newDoc;
  } catch (error) {
    console.error("Error getting family request doc:", error);
    return {
      received: [],
      sent: [],
      updatedAt: new Date().toISOString()
    };
  }
}

export async function createFamily(userId, familyName) {
  try {
    const familyId = `family_${Date.now()}_${userId}`;
    const familyRef = doc(db, "families", familyId);
    
    const user = await getUserById(userId);
    
    const familyData = {
      id: familyId,
      name: familyName,
      createdBy: userId,
      members: [userId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(familyRef, familyData);
    
    return familyData;
  } catch (error) {
    console.error("Error creating family:", error);
    throw error;
  }
}

export async function getUserFamilies(userId) {
  try {
    const familiesRef = collection(db, "families");
    const q = query(familiesRef, where("members", "array-contains", userId));
    const snapshot = await getDocs(q);
    
    const families = [];
    snapshot.forEach(doc => {
      families.push(doc.data());
    });
    
    return families;
  } catch (error) {
    console.error("Error getting user families:", error);
    return [];
  }
}

export async function getFamilyById(familyId) {
  try {
    const familyRef = doc(db, "families", familyId);
    const familySnap = await getDoc(familyRef);
    
    if (familySnap.exists()) {
      return familySnap.data();
    }
    
    return null;
  } catch (error) {
    console.error("Error getting family:", error);
    return null;
  }
}

export async function sendFamilyRequest(familyId, fromUserId, toUserId) {
  try {
    if (fromUserId === toUserId) return;
    
    const family = await getFamilyById(familyId);
    if (!family) {
      throw new Error("Gia đình không tồn tại");
    }
    
    if (!family.members.includes(fromUserId)) {
      throw new Error("Bạn không phải thành viên của gia đình này");
    }
    
    if (family.members.includes(toUserId)) {
      throw new Error("Người dùng đã là thành viên");
    }
    
    const fromUser = await getUserById(fromUserId);
    const toUser = await getUserById(toUserId);
    
    if (!fromUser || !toUser) {
      throw new Error("Người dùng không tồn tại");
    }
    
    const toUserRequestRef = doc(db, "familyRequests", toUserId);
    const toUserRequestDoc = await getFamilyRequestDoc(toUserId);
    
    const alreadyRequested = toUserRequestDoc.received.some(
      req => req.familyId === familyId
    );
    
    if (alreadyRequested) {
      return;
    }
    
    const request = {
      familyId: familyId,
      familyName: family.name,
      fromUserId: fromUserId,
      fromUserName: fromUser.displayName || fromUser.email,
      timestamp: new Date().toISOString()
    };
    
    await setDoc(toUserRequestRef, {
      received: arrayUnion(request),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    const fromUserRequestRef = doc(db, "familyRequests", fromUserId);
    const fromUserRequestDoc = await getFamilyRequestDoc(fromUserId);
    
    await setDoc(fromUserRequestRef, {
      sent: arrayUnion({
        familyId: familyId,
        toUserId: toUserId,
        timestamp: new Date().toISOString()
      }),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    // Send notification
    try {
      await sendFamilyInvitationNotification(
        toUserId,
        fromUser.displayName || fromUser.email,
        family.name,
        familyId
      );
    } catch (notifError) {
      console.warn("Failed to send notification:", notifError);
    }
    
  } catch (error) {
    console.error("Error sending family request:", error);
    throw error;
  }
}

export async function acceptFamilyRequest(userId, familyId, fromUserId) {
  try {
    const familyRef = doc(db, "families", familyId);
    
    await updateDoc(familyRef, {
      members: arrayUnion(userId),
      updatedAt: new Date().toISOString()
    });
    
    const userRequestRef = doc(db, "familyRequests", userId);
    const userRequestDoc = await getFamilyRequestDoc(userId);
    
    const requestToRemove = userRequestDoc.received.find(
      req => req.familyId === familyId && req.fromUserId === fromUserId
    );
    
    if (requestToRemove) {
      await setDoc(userRequestRef, {
        received: arrayRemove(requestToRemove),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    
    const fromUserRequestRef = doc(db, "familyRequests", fromUserId);
    const fromUserRequestDoc = await getFamilyRequestDoc(fromUserId);
    
    const sentRequestToRemove = fromUserRequestDoc.sent.find(
      req => req.familyId === familyId && req.toUserId === userId
    );
    
    if (sentRequestToRemove) {
      await setDoc(fromUserRequestRef, {
        sent: arrayRemove(sentRequestToRemove),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    
    // Send notification to inviter
    try {
      const family = await getFamilyById(familyId);
      const accepter = await getUserById(userId);
      if (family && accepter) {
        await sendFamilyAcceptedNotification(
          fromUserId,
          accepter.displayName || accepter.email,
          family.name
        );
      }
    } catch (notifError) {
      console.warn("Failed to send notification:", notifError);
    }
    
  } catch (error) {
    console.error("Error accepting family request:", error);
    throw error;
  }
}

export async function declineFamilyRequest(userId, familyId, fromUserId) {
  try {
    const userRequestRef = doc(db, "familyRequests", userId);
    const userRequestDoc = await getFamilyRequestDoc(userId);
    
    const requestToRemove = userRequestDoc.received.find(
      req => req.familyId === familyId && req.fromUserId === fromUserId
    );
    
    if (requestToRemove) {
      await setDoc(userRequestRef, {
        received: arrayRemove(requestToRemove),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    
    const fromUserRequestRef = doc(db, "familyRequests", fromUserId);
    const fromUserRequestDoc = await getFamilyRequestDoc(fromUserId);
    
    const sentRequestToRemove = fromUserRequestDoc.sent.find(
      req => req.familyId === familyId && req.toUserId === userId
    );
    
    if (sentRequestToRemove) {
      await setDoc(fromUserRequestRef, {
        sent: arrayRemove(sentRequestToRemove),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    
    // Send notification to inviter
    try {
      const family = await getFamilyById(familyId);
      const decliner = await getUserById(userId);
      if (family && decliner) {
        await sendFamilyDeclinedNotification(
          fromUserId,
          decliner.displayName || decliner.email,
          family.name
        );
      }
    } catch (notifError) {
      console.warn("Failed to send notification:", notifError);
    }
    
  } catch (error) {
    console.error("Error declining family request:", error);
    throw error;
  }
}

export async function getFamilyRequests(userId) {
  try {
    const requestDoc = await getFamilyRequestDoc(userId);
    return requestDoc.received || [];
  } catch (error) {
    console.error("Error getting family requests:", error);
    return [];
  }
}

export async function leaveFamily(userId, familyId) {
  try {
    const familyRef = doc(db, "families", familyId);
    const family = await getFamilyById(familyId);
    
    if (!family) {
      throw new Error("Gia đình không tồn tại");
    }
    
    await updateDoc(familyRef, {
      members: arrayRemove(userId),
      updatedAt: new Date().toISOString()
    });
    
    if (family.createdBy === userId && family.members.length === 1) {
      await deleteDoc(familyRef);
    }
    
  } catch (error) {
    console.error("Error leaving family:", error);
    throw error;
  }
}

export async function getFamilyMembers(familyId) {
  try {
    const family = await getFamilyById(familyId);
    if (!family) return [];
    
    const members = await Promise.all(
      family.members.map(async (memberId) => {
        const user = await getUserById(memberId);
        if (user) {
          return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            isCreator: memberId === family.createdBy
          };
        }
        return null;
      })
    );
    
    return members.filter(m => m !== null);
  } catch (error) {
    console.error("Error getting family members:", error);
    return [];
  }
}
