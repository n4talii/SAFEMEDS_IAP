import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCau-9p3m_qJHmA6u5VcMM8uoCtIm4OmkY",
  authDomain: "medsafe-8410d.firebaseapp.com",
  projectId: "medsafe-8410d",
  storageBucket: "medsafe-8410d.firebasestorage.app",
  messagingSenderId: "326552708569",
  appId: "1:326552708569:web:485930ec3c134cce2225c8",
  measurementId: "G-CET6QDBL8N",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
