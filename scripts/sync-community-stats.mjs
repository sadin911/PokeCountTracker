import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collectionGroup,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAbY6AmE9EkIcQ0H3GNUTJ6fdiP9Yrlpxk',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'pokecount-tracker.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'pokecount-tracker',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'pokecount-tracker.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '794583302773',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:794583302773:web:a20f2697d19b21c0e2ee3c',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function aggregateCommunityStats() {
  console.log('🔄 Fetching all binders across users in Firestore...');

  try {
    const bindersSnap = await getDocs(collectionGroup(db, 'binders'));
    console.log(`📦 Found ${bindersSnap.size} binder documents.`);

    // Map of cardId -> Set of unique userIds who own at least 1 copy
    const cardOwnersMap = new Map();
    const allUsersSet = new Set();

    bindersSnap.forEach((docSnap) => {
      // Path format: users/{userId}/binders/{binderId}
      const pathSegments = docSnap.ref.path.split('/');
      const userId = pathSegments[1];
      if (userId) {
        allUsersSet.add(userId);
      }

      const data = docSnap.data();
      const cards = data?.cards || {};

      for (const [cardId, cardEntry] of Object.entries(cards)) {
        if (!cardEntry) continue;
        const variants = cardEntry.variants || {};
        const count = Object.values(variants).reduce((sum, n) => sum + (Number(n) || 0), 0);

        if (count > 0 && userId) {
          if (!cardOwnersMap.has(cardId)) {
            cardOwnersMap.set(cardId, new Set());
          }
          cardOwnersMap.get(cardId).add(userId);
        }
      }
    });

    const totalUsers = Math.max(1, allUsersSet.size);
    const cardOwners = {};

    cardOwnersMap.forEach((userSet, cardId) => {
      cardOwners[cardId] = userSet.size;
    });

    const payload = {
      totalUsers,
      cardOwners,
      lastUpdatedAt: Date.now(),
    };

    console.log(`📊 Aggregated stats:`);
    console.log(`   - Total Users: ${totalUsers}`);
    console.log(`   - Unique Owned Cards: ${Object.keys(cardOwners).length}`);

    await setDoc(doc(db, 'community_stats', 'ownership'), payload);
    console.log(`✅ Successfully updated doc "community_stats/ownership"!`);
  } catch (err) {
    console.error('❌ Error aggregating community stats:', err);
  }
}

aggregateCommunityStats();
