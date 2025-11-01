import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBTyCMxdq20kTGWTqgfMJyZsEFofkgfTMQ',
  authDomain: 'time-tracker-app-6f896.firebaseapp.com',
  projectId: 'time-tracker-app-6f896',
  appId: '1:615869184485:web:821b74162779fa1b61170c',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signInGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    // popup first; fallback to redirect if blocked
    const res = await signInWithPopup(auth, provider);
    return res.user;
  } catch (e) {
    await signInWithRedirect(auth, provider);
    const res = await getRedirectResult(auth);
    return res?.user ?? null;
  }
};

export { doc, onSnapshot, setDoc, onAuthStateChanged };
