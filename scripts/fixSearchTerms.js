// Script to fix searchTerms for existing users
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBIzlLnulTQCMTjqa-s9wSjE4tzNu_S_fU",
  authDomain: "appp-92bd1.firebaseapp.com",
  projectId: "appp-92bd1",
  storageBucket: "appp-92bd1.firebasestorage.app",
  messagingSenderId: "266853425631",
  appId: "1:266853425631:web:a3704a3e75da244b5f646a",
  measurementId: "G-6C8JD2PEJZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateSearchTerms(displayName, email) {
  const terms = [];
  const name = (displayName || "").toLowerCase().trim();
  const emailLower = (email || "").toLowerCase().trim();
  
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

async function fixSearchTerms() {
  try {
    console.log("🔍 Fetching all users...");
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    
    console.log(`📊 Found ${snapshot.size} users`);
    
    let fixed = 0;
    let skipped = 0;
    
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`\n👤 User: ${userData.email || userId}`);
      console.log(`   Display Name: ${userData.displayName || 'N/A'}`);
      console.log(`   Current searchTerms: ${userData.searchTerms?.length || 0} terms`);
      
      if (!userData.searchTerms || userData.searchTerms.length === 0) {
        // Generate searchTerms
        const searchTerms = generateSearchTerms(
          userData.displayName || userData.email?.split('@')[0] || '',
          userData.email || ''
        );
        
        console.log(`   ✅ Generating ${searchTerms.length} search terms...`);
        console.log(`   Terms: ${searchTerms.slice(0, 10).join(', ')}...`);
        
        // Update user document
        await updateDoc(doc(db, "users", userId), {
          searchTerms: searchTerms,
          displayName: userData.displayName || userData.email?.split('@')[0] || 'User'
        });
        
        fixed++;
      } else {
        console.log(`   ⏭️  Already has searchTerms, skipping`);
        skipped++;
      }
    }
    
    console.log(`\n✅ Done!`);
    console.log(`   Fixed: ${fixed} users`);
    console.log(`   Skipped: ${skipped} users`);
    console.log(`\n🎉 All users now have searchTerms!`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

fixSearchTerms();
