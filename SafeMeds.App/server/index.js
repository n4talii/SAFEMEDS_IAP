import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCau-9p3m_qJHmA6u5VcMM8uoCtIm4OmkY",
  authDomain: "medsafe-8410d.firebaseapp.com",
  projectId: "medsafe-8410d",
  storageBucket: "medsafe-8410d.firebasestorage.app",
  messagingSenderId: "326552708569",
  appId: "1:326552708569:web:485930ec3c134cce2225c8",
  measurementId: "G-CET6QDBL8N"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (user != null) {
    console.log('User is signed in:', user.email);
  } else {
    console.log('No user is signed in.');
  }
});
