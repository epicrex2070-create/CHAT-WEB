// ------------------------------
// Firebase Imports (MODERN)
// ------------------------------
import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

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
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";


// ------------------------------
// Firebase Config (YOUR REAL ONE)
// ------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyAkSp3twPsiu2Yj6vxpX0SPjLL3UskQpQQ",
    authDomain: "chat-web-9acd0.firebaseapp.com",
    projectId: "chat-web-9acd0",
    storageBucket: "chat-web-9acd0.appspot.com",
    messagingSenderId: "190719752036",
    appId: "1:190719752036:web:717ebcd76d8831de1a2c71"
};

// ------------------------------
// Initialize Firebase
// ------------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// ------------------------------
// UI Helpers
// ------------------------------
function show(box) {
    document.querySelectorAll(".login-box, .profile-box, .invite-box, .chat-box")
        .forEach(el => el.classList.add("hidden"));
    document.querySelector(box).classList.remove("hidden");
}


// ------------------------------
// SIGN UP
// ------------------------------
window.signup = async function () {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    await createUserWithEmailAndPassword(auth, email, pass);

    show(".profile-box");
};


// ------------------------------
// LOGIN
// ------------------------------
window.login = async function () {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    await signInWithEmailAndPassword(auth, email, pass);

    show(".profile-box");
};


// ------------------------------
// AUTH STATE LISTENER
// ------------------------------
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
        // New user → go to profile setup
        show(".profile-box");
    } else {
        // Existing user → go to invite screen
        show(".invite-box");
    }
});


// ------------------------------
// SAVE PROFILE (username + PNG)
// ------------------------------
window.saveProfile = async function () {
    const user = auth.currentUser;
    const username = document.getElementById("username").value;
    const file = document.getElementById("pfp").files[0];

    let pfpURL = "";

    if (file) {
        const pfpRef = ref(storage, `pfp/${user.uid}.png`);
        await uploadBytes(pfpRef, file);
        pfpURL = await getDownloadURL(pfpRef);
    }

    await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: username,
        pfp: pfpURL
    });

    show(".invite-box");
};


// ------------------------------
// SEND INVITE
// ------------------------------
window.sendInvite = async function () {
    const user = auth.currentUser;
    const targetEmail = document.getElementById("inviteEmail").value;

    await addDoc(collection(db, "invites"), {
        from: user.uid,
        toEmail: targetEmail,
        status: "pending"
    });

    alert("Invite sent!");
};


// ------------------------------
// ACCEPT INVITE (auto-detect)
// ------------------------------
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const q = query(
        collection(db, "invites"),
        where("toEmail", "==", user.email),
        where("status", "==", "pending")
    );

    onSnapshot(q, async (snap) => {
        snap.forEach(async (invite) => {
            const fromUser = invite.data().from;

            // Create chat connection
            const chatRef = await addDoc(collection(db, "connections"), {
                users: [fromUser, user.uid]
            });

            // Mark invite accepted
            await updateDoc(doc(db, "invites", invite.id), {
                status: "accepted",
                chatId: chatRef.id
            });

            loadChat(chatRef.id);
            show(".chat-box");
        });
    });
});


// ------------------------------
// SEND MESSAGE
// ------------------------------
window.sendMessage = async function () {
    const text = document.getElementById("msg").value;
    if (!text.trim()) return;

    const chatId = window.currentChat;
    const user = auth.currentUser;

    await addDoc(collection(db, "messages"), {
        chatId: chatId,
        sender: user.uid,
        text: text,
        time: Date.now()
    });

    document.getElementById("msg").value = "";
};


// ------------------------------
// LOAD CHAT MESSAGES (REAL-TIME)
// ------------------------------
async function loadChat(chatId) {
    window.currentChat = chatId;

    const q = query(
        collection(db, "messages"),
        where("chatId", "==", chatId)
    );

    onSnapshot(q, (snap) => {
        const box = document.getElementById("messages");
        box.innerHTML = "";

        snap.forEach(msg => {
            const div = document.createElement("div");
            div.textContent = msg.data().text;
            box.appendChild(div);
        });
    });
}
