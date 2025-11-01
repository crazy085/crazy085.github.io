// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getStorage, ref, uploadBytes, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCAuSK6SoHVqOjIS7LxnLiXRJDLYS5rA9Q",
  authDomain: "messanger-e973f.firebaseapp.com",
  databaseURL: "https://messanger-e973f-default-rtdb.firebaseio.com",
  projectId: "messanger-e973f",
  storageBucket: "messanger-e973f.appspot.com",   // ✅ FIXED HERE
  messagingSenderId: "797920714063",
  appId: "1:797920714063:web:b86d6f38191f40d8fa393a",
  measurementId: "G-TSM8BKWNV2"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// 🔐 Set your passkey here
const CORRECT_PASSKEY = "secretissecret"; // change this!

function checkPasskey() {
  const input = document.getElementById("passkey").value;
  if (input === CORRECT_PASSKEY) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("uploader").style.display = "block";
    loadFiles();
  } else {
    alert("Wrong passkey!");
  }
}
window.checkPasskey = checkPasskey;

async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Choose a file first!");

  const storageRef = ref(storage, `uploads/${file.name}`);
  await uploadBytes(storageRef, file);
  alert("Uploaded!");
  loadFiles();
}

async function loadFiles() {
  const listRef = ref(storage, "uploads/");
  const res = await listAll(listRef);
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";
  for (const itemRef of res.items) {
    const url = await getDownloadURL(itemRef);
    const li = document.createElement("li");
    li.innerHTML = `<a href="${url}" target="_blank">${itemRef.name}</a>`;
    fileList.appendChild(li);
  }
}
