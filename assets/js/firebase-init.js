// Firebase init compartido
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup,
  sendPasswordResetEmail, updateProfile
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, addDoc, getDocs,
  query, where, orderBy, serverTimestamp, limit
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDD6CEteaJi1YhQoAj4orN0hOFIfZTUdmM",
  authDomain: "astronauth-test.firebaseapp.com",
  databaseURL: "https://astronauth-test-default-rtdb.firebaseio.com",
  projectId: "astronauth-test",
  storageBucket: "astronauth-test.firebasestorage.app",
  messagingSenderId: "177121725976",
  appId: "1:177121725976:web:617f2488c0bba88ff37d6d"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, signInWithPopup, sendPasswordResetEmail, updateProfile,
  collection, doc, getDoc, setDoc, addDoc, getDocs,
  query, where, orderBy, serverTimestamp, limit
};

/**
 * Verifica si un email es admin.
 * Estructura en Firestore:
 *   coleccion: admins
 *     documento ID: <correo en minusculas>
 *       campo: role  ->  "admin" | "user"
 *
 * Devuelve true SOLO si el documento existe y el campo role === "admin".
 * Para compatibilidad, si el documento existe pero no tiene el campo role,
 * se considera admin (comportamiento previo).
 */
export async function isAdminEmail(email) {
  if (!email) return false;
  const ref = doc(db, "admins", email.toLowerCase());
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data() || {};
  if (typeof data.role === "string") {
    return data.role.toLowerCase() === "admin";
  }
  // Compatibilidad: documento sin campo role => admin
  return true;
}
