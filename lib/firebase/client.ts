"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoG01jULVHKnvFHa1kaP7dowUE1f_9b9E",
  authDomain: "papirar-72bc6.firebaseapp.com",
  databaseURL: "https://papirar-72bc6-default-rtdb.firebaseio.com",
  projectId: "papirar-72bc6",
  storageBucket: "papirar-72bc6.firebasestorage.app",
  messagingSenderId: "144434847036",
  appId: "1:144434847036:web:e9f4c07ccd227f9ab0d239",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
