// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBTLLSOmw9bHzTQg23RS7_dybCMd1jOSnU",
  authDomain: "ekko-database.firebaseapp.com",
  projectId: "ekko-database",
  storageBucket: "ekko-database.firebasestorage.app",
  messagingSenderId: "728214439632",
  appId: "1:728214439632:web:8b9282da470d3c1dd540d5",
  measurementId: "G-S7LEC3Z8F9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const auth = getAuth(app);

// Export both app and auth
export { app, auth };