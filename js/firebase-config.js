import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB26KA89b8bpJjockOxDtVG3qsIYKBQgd0",
  authDomain: "library-project-2aee1.firebaseapp.com",
  projectId: "library-project-2aee1",
  storageBucket: "library-project-2aee1.firebasestorage.app",
  messagingSenderId: "414606379446",
  appId: "1:414606379446:web:7219f6290718cd10b5d917"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);