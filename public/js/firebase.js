import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset, sendPasswordResetEmail, updatePassword, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { runTransaction, remove, update, child, get, equalTo, orderByChild, query, getDatabase, ref, onValue, set, push } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { deleteObject, getDownloadURL, uploadBytes, getStorage, ref as sref } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-storage.js";
const firebaseConfig = {
  apiKey: "AIzaSyBbSnf0OrBEdg0x758-yQqKPz7afXxuC9s",
  authDomain: "antonio-scurtains.firebaseapp.com",
  projectId: "antonio-scurtains",
  storageBucket: "antonio-scurtains.appspot.com",
  messagingSenderId: "419597770702",
  databaseURL: "https://antonio-scurtains-default-rtdb.firebaseio.com/",
  appId: "1:419597770702:web:74a041ae72a46a1585559f"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth();
const storage = getStorage(app);
export function logout() {
  signOut(auth).then(() => {
    window.location.href = "/templates/login.html"
  }).catch((error) => {
  });
}
export { applyActionCode, confirmPasswordReset, verifyPasswordResetCode, runTransaction, sendPasswordResetEmail, updatePassword, deleteObject, remove, getDownloadURL, uploadBytes, sref, storage, update, child, get, signOut, equalTo, orderByChild, query, push, database, ref, onValue, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, set, onAuthStateChanged };