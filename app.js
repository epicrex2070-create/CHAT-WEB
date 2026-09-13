import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkSp3twPsiu2Yj6vxpX0SPjLL3UskQpQQ",
  authDomain: "chat-web-9acd0.firebaseapp.com",
  projectId: "chat-web-9acd0",
  storageBucket: "chat-web-9acd0.appspot.com",
  messagingSenderId: "190719752036",
  appId: "1:190719752036:web:717ebcd76d8831de1a2c71"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// UI helpers
function showError(msg) {
  const box = document.getElementById("error");
  box.textContent = msg;
  box.classList.remove("hidden");
  setTimeout(() => box.classList.add("hidden"), 4000);
}

function show(selector) {
  document.querySelectorAll(".login-box, .profile-box, .messenger").forEach(el => el.classList.add("hidden"));
  const box = document.querySelector(selector);
  if (box) box.classList.remove("hidden");
}

// Slide
