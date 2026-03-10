// ===== Firebase bootstrap (Auth + Firestore) =====
//
// TODO: Create a Firebase project and enable:
// - Authentication → Email/Password
// - Firestore Database
// - Firestore Rules: restrict users to their own uid subtree
//
// Then: Project settings → General → "Your apps" → add Web app
// Paste the config object below (firebaseConfig).

const firebaseConfig = {
    // apiKey: "…",
    // authDomain: "…",
    // projectId: "…",
    // appId: "…",
    // storageBucket: "…",
    // messagingSenderId: "…"
};

// TODO: Pick a Firebase version and pin it.
const FIREBASE_VERSION = '10.12.5';

let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let firebaseEnabled = false;

export function isFirebaseConfigured() {
    return firebaseEnabled;
}

export async function getFirebaseAuth() {
    const { auth } = await initFirebase();
    return auth;
}

export async function getFirestoreDb() {
    const { db } = await initFirebase();
    return db;
}

function hasFirebaseConfig() {
    return Boolean(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

async function importFirebase(path) {
    return await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/${path}`);
}

export async function initFirebase() {
    if (firebaseEnabled && firebaseApp && firebaseAuth && firestoreDb) {
        return { app: firebaseApp, auth: firebaseAuth, db: firestoreDb };
    }

    if (!hasFirebaseConfig()) {
        firebaseEnabled = false;
        return { app: null, auth: null, db: null };
    }

    const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
        importFirebase('firebase-app.js'),
        importFirebase('firebase-auth.js'),
        importFirebase('firebase-firestore.js')
    ]);

    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firestoreDb = getFirestore(firebaseApp);
    firebaseEnabled = true;

    return { app: firebaseApp, auth: firebaseAuth, db: firestoreDb };
}

export async function configureDataStoreRemoteAdapter() {
    const db = await getFirestoreDb();
    if (!db || !window.dataStore || typeof window.dataStore.configureRemoteAdapter !== 'function') {
        return false;
    }

    const mod = await import('./firebase-remote-adapter.js');
    if (!mod || typeof mod.createFirestoreRemoteAdapter !== 'function') {
        return false;
    }

    window.dataStore.configureRemoteAdapter(mod.createFirestoreRemoteAdapter({ db, firebaseVersion: FIREBASE_VERSION }));
    return true;
}

