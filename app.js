// BASIC PLACEHOLDER LOGIC — replace with Firebase later

function login() {
    document.querySelector(".login-box").classList.add("hidden");
    document.querySelector(".profile-box").classList.remove("hidden");
}

function signup() {
    document.querySelector(".login-box").classList.add("hidden");
    document.querySelector(".profile-box").classList.remove("hidden");
}

function saveProfile() {
    document.querySelector(".profile-box").classList.add("hidden");
    document.querySelector(".invite-box").classList.remove("hidden");
}

function sendInvite() {
    document.querySelector(".invite-box").classList.add("hidden");
    document.querySelector(".chat-box").classList.remove("hidden");
}

function sendMessage() {
    const msg = document.getElementById("msg").value;
    if (!msg.trim()) return;

    const messages = document.getElementById("messages");
    const div = document.createElement("div");
    div.textContent = msg;
    messages.appendChild(div);

    document.getElementById("msg").value = "";
}
