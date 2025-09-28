// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCA-PD9eeubbdCQiqswgXjhDvjVhVGy_78",
  authDomain: "examly-6a3b1.firebaseapp.com",
  projectId: "examly-6a3b1",
  storageBucket: "examly-6a3b1.firebasestorage.app",
  messagingSenderId: "43021686317",
  appId: "1:43021686317:web:d3681fb30899f3d96b4aa4",
  measurementId: "G-Y16W608K8Y"
};

// Avoid re-initializing app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Auth can run on server or client
export const auth = getAuth(app);

// Analytics only runs on client
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}


// Initialize Firebase



export const db = getDatabase(app);
export const storage = getStorage(app);


