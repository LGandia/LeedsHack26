import { signInAnonymously } from 'firebase/auth';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Ensure user is authenticated anonymously
export const ensureAuth = async () => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser.uid;
};

// Find or create a pod based on user preferences
export const findOrCreatePod = async (struggle, supportStyle, duration) => {
  const userId = await ensureAuth();

  // Try to find an existing pod that matches
  const podsRef = collection(db, 'pods');
  const q = query(
    podsRef,
    where('struggle', '==', struggle),
    where('isActive', '==', true),
    where('memberCount', '<', 5)
  );

  const snapshot = await getDocs(q);
  
  // Check if any pod is not expired and not full
  for (const podDoc of snapshot.docs) {
    const podData = podDoc.data();
    const expiresAt = podData.expiresAt?.toDate();
    
    if (expiresAt && expiresAt > new Date()) {
      // Join this pod
      await updateDoc(doc(db, 'pods', podDoc.id), {
        memberCount: podData.memberCount + 1,
      });

      // Add member
      await addDoc(collection(db, 'pods', podDoc.id, 'members'), {
        userId,
        joinedAt: serverTimestamp(),
      });

      // Add system message
      await addDoc(collection(db, 'pods', podDoc.id, 'messages'), {
        type: 'system',
        text: 'Someone new joined the pod 👋',
        createdAt: serverTimestamp(),
      });

      return podDoc.id;
    }
  }

  // No suitable pod found, create a new one
  const expiresInMs = duration === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + expiresInMs);

  const newPod = await addDoc(collection(db, 'pods'), {
    struggle,
    supportStyle,
    duration,
    memberCount: 1,
    isActive: true,
    createdAt: serverTimestamp(),
    expiresAt,
  });

  // Add creator as member
  await addDoc(collection(db, 'pods', newPod.id, 'members'), {
    userId,
    joinedAt: serverTimestamp(),
  });

  // Add welcome message
  await addDoc(collection(db, 'pods', newPod.id, 'messages'), {
    type: 'system',
    text: `Welcome! This is a safe space to share and support each other. Pod expires in ${duration}.`,
    createdAt: serverTimestamp(),
  });

  return newPod.id;
};

// Get user's current pod
export const getUserPod = async () => {
  const userId = await ensureAuth();

  const podsSnapshot = await getDocs(collection(db, 'pods'));
  
  for (const podDoc of podsSnapshot.docs) {
    const membersSnapshot = await getDocs(
      collection(db, 'pods', podDoc.id, 'members')
    );
    
    const isMember = membersSnapshot.docs.some(m => m.data().userId === userId);
    
    if (isMember) {
      const podData = podDoc.data();
      const expiresAt = podData.expiresAt?.toDate();
      
      // Check if pod is still active
      if (expiresAt && expiresAt > new Date()) {
        return { id: podDoc.id, ...podData };
      }
    }
  }

  return null;
};

// Subscribe to pod messages
export const subscribeToPodMessages = (podId, callback) => {
  const messagesRef = collection(db, 'pods', podId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(messages);
  });
};

// Send a message to the pod
export const sendMessage = async (podId, text) => {
  const userId = await ensureAuth();

  await addDoc(collection(db, 'pods', podId, 'messages'), {
    type: 'user',
    userId,
    text,
    createdAt: serverTimestamp(),
  });
};

// Leave the pod
export const leavePod = async (podId) => {
  const userId = await ensureAuth();

  // Find and delete the member document
  const membersSnapshot = await getDocs(
    collection(db, 'pods', podId, 'members')
  );
  
  const memberDoc = membersSnapshot.docs.find(m => m.data().userId === userId);
  if (memberDoc) {
    await updateDoc(doc(db, 'pods', podId), {
      memberCount: (await getDoc(doc(db, 'pods', podId))).data().memberCount - 1,
    });
  }

  // Add system message
  await addDoc(collection(db, 'pods', podId, 'messages'), {
    type: 'system',
    text: 'Someone left the pod 👋',
    createdAt: serverTimestamp(),
  });
};

// Check if pod is expired
export const isPodExpired = (pod) => {
  if (!pod || !pod.expiresAt) return true;
  const expiresAt = pod.expiresAt.toDate ? pod.expiresAt.toDate() : new Date(pod.expiresAt);
  return expiresAt <= new Date();
};