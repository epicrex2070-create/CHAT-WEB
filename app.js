function showError(msg) {
    const box = document.getElementById("error");
    box.textContent = msg;
    box.classList.remove("hidden");

    setTimeout(() => {
        box.classList.add("hidden");
    }, 4000);
}


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
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (!email.includes("@") || !email.includes(".")) {
        showError("Please enter a valid email address.");
        return;
    }

    if (pass.length < 6) {
        showError("Password must be at least 6 characters.");
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        show(".profile-box");
    } catch (err) {
        showError(err.message);
    }
};



// ------------------------------
// LOGIN
// ------------------------------
window.login = async function () {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (!email.includes("@") || !email.includes(".")) {
        showError("Please enter a valid email address.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        show(".profile-box");
    } catch (err) {
        showError("Incorrect email or password.");
    }
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

    async function declineFriend(req) {
    await updateDoc(doc(db, "friendRequests", req.id), {
        status: "declined"
    });

    showError("Friend request declined.");
}
});

async function acceptFriend(req) {
    const user = auth.currentUser;
    const fromUser = req.data().from;

    // Add both users to each other's friends list
    await setDoc(doc(db, "friends", user.uid + "_" + fromUser), {
        users: [user.uid, fromUser]
    });

    await updateDoc(doc(db, "friendRequests", req.id), {
        status: "accepted"
    });

    showError("Friend added!");
}


// ------------------------------
// SAVE PROFILE (username + PNG)
// ------------------------------
window.saveProfile = async function () {
    const user = auth.currentUser;
    const username = document.getElementById("username").value;
    const file = document.getElementById("pfp").files[0];

    if (username.length < 3) {
    showError("Username must be at least 3 characters.");
    return;
}

if (username.length > 20) {
    showError("Username must be under 20 characters.");
    return;
}


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

    if (!targetEmail.includes("@") || !targetEmail.includes(".")) {
    showError("Friend's email is invalid.");
    return;
}

    

    await addDoc(collection(db, "invites"), {
        from: user.uid,
        toEmail: targetEmail,
        status: "pending"
    });

    async function openChatWith(friendId) {
    const user = auth.currentUser;

    // Find existing chat
    const q = query(
        collection(db, "connections"),
        where("users", "array-contains", user.uid)
    );

    let chatId = null;

    const snap = await getDocs(q);
    snap.forEach(conn => {
        if (conn.data().users.includes(friendId)) {
            chatId = conn.id;
        }
    });

    // If no chat exists, create one
    if (!chatId) {
        const chatRef = await addDoc(collection(db, "connections"), {
            users: [user.uid, friendId]
        });
        chatId = chatRef.id;
    }

    loadChat(chatId);
    show(".chat-box");
}


    alert("Invite sent!");
};

window.sendFriendRequest = async function () {
    const user = auth.currentUser;
    const targetEmail = document.getElementById("friendEmail").value.trim();

    if (!targetEmail.includes("@") || !targetEmail.includes(".")) {
        showError("Please enter a valid email.");
        return;
    }

    await addDoc(collection(db, "friendRequests"), {
        from: user.uid,
        toEmail: targetEmail,
        status: "pending"
    });

    onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const q = query(
        collection(db, "friends"),
        where("users", "array-contains", user.uid)
    );

    onSnapshot(q, (snap) => {
        const box = document.getElementById("friendsList");
        box.innerHTML = "";

        snap.forEach(friend => {
            const users = friend.data().users;
            const otherUser = users.find(u => u !== user.uid);

            const div = document.createElement("div");
            div.textContent = `Friend: ${otherUser}`;
            div.onclick = () => openChatWith(otherUser);

            box.appendChild(div);
        });
    });
});


    showError("Friend request sent!");
};
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const q = query(
        collection(db, "friendRequests"),
        where("toEmail", "==", user.email),
        where("status", "==", "pending")
    );

    onSnapshot(q, (snap) => {
        const box = document.getElementById("friendRequests");
        box.innerHTML = "";

        if (snap.empty) {
            return;
        }

        show(".friend-requests-box");

        snap.forEach(req => {
            const div = document.createElement("div");
            div.textContent = `Friend request from: ${req.data().from}`;

            const acceptBtn = document.createElement("button");
            acceptBtn.textContent = "Accept";
            acceptBtn.onclick = () => acceptFriend(req);

            const declineBtn = document.createElement("button");
            declineBtn.textContent = "Decline";
            declineBtn.onclick = () => declineFriend(req);

            div.appendChild(acceptBtn);
            div.appendChild(declineBtn);
            box.appendChild(div);
        });
    });
});



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

    if (!text.trim()) {
    showError("Message cannot be empty.");
    return;
}


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

onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const q = query(
        collection(db, "friends"),
        where("users", "array-contains", user.uid)
    );

    onSnapshot(q, (snap) => {
        const box = document.getElementById("friendsList");
        box.innerHTML = "";

        if (snap.empty) {
            box.innerHTML = "No friends yet.";
            return;
        }

        show(".friends-box");

        snap.forEach(friend => {
            const users = friend.data().users;
            const otherUser = users.find(u => u !== user.uid);

            const div = document.createElement("div");
            div.textContent = `Friend: ${otherUser}`;
            div.classList.add("friend-item");

            div.onclick = () => openChatWith(otherUser);

            box.appendChild(div);
        });
    });
});

async function openChatWith(friendId) {
    const user = auth.currentUser;

    // Find existing chat
    const q = query(
        collection(db, "connections"),
        where("users", "array-contains", user.uid)
    );

    let chatId = null;

    const snap = await getDocs(q);
    snap.forEach(conn => {
        if (conn.data().users.includes(friendId)) {
            chatId = conn.id;
        }
    });

    // If no chat exists, create one
    if (!chatId) {
        const chatRef = await addDoc(collection(db, "connections"), {
            users: [user.uid, friendId]
        });
        chatId = chatRef.id;
    }

    loadChat(chatId);
    show(".chat-box");
}
