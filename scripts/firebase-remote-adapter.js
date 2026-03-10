// ===== Firestore remote adapter (plug into `dataStore.configureRemoteAdapter`) =====
//
// Firestore structure used:
// users/{uid}/state/timer  (doc)  { value: <timerState>, soundEnabled: boolean, updatedAt }
// users/{uid}/state/tasks  (doc)  { value: <tasksArray>, updatedAt }
// users/{uid}/state/tunes  (doc)  { value: <tunesState>, updatedAt }
//
// Security rules (paste in Firebase console):
// match /users/{uid}/{document=**} {
//   allow read, write: if request.auth != null && request.auth.uid == uid;
// }

async function importFirestore(firebaseVersion) {
    return await import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`);
}

export function createFirestoreRemoteAdapter({ db, firebaseVersion }) {
    // Lazy-load Firestore helpers so this file works without bundling.
    let cached = null;
    async function f() {
        if (cached) return cached;
        cached = await importFirestore(firebaseVersion);
        return cached;
    }

    function timerDocRef(mod, uid) {
        return mod.doc(db, 'users', uid, 'state', 'timer');
    }

    function tasksDocRef(mod, uid) {
        return mod.doc(db, 'users', uid, 'state', 'tasks');
    }

    function tunesDocRef(mod, uid) {
        return mod.doc(db, 'users', uid, 'state', 'tunes');
    }

    return {
        // ===== Timer =====
        async loadTimerState(uid) {
            const mod = await f();
            const snap = await mod.getDoc(timerDocRef(mod, uid));
            const data = snap.exists() ? snap.data() : null;
            return data && data.value ? data.value : null;
        },
        async saveTimerState(uid, state) {
            const mod = await f();
            await mod.setDoc(
                timerDocRef(mod, uid),
                { value: state, updatedAt: mod.serverTimestamp() },
                { merge: true }
            );
        },
        async loadTimerSoundPref(uid) {
            const mod = await f();
            const snap = await mod.getDoc(timerDocRef(mod, uid));
            const data = snap.exists() ? snap.data() : null;
            if (!data || typeof data.soundEnabled !== 'boolean') return null;
            return data.soundEnabled;
        },
        async saveTimerSoundPref(uid, enabled) {
            const mod = await f();
            await mod.setDoc(
                timerDocRef(mod, uid),
                { soundEnabled: Boolean(enabled), updatedAt: mod.serverTimestamp() },
                { merge: true }
            );
        },

        // ===== Tasks =====
        async loadTasks(uid) {
            const mod = await f();
            const snap = await mod.getDoc(tasksDocRef(mod, uid));
            const data = snap.exists() ? snap.data() : null;
            return Array.isArray(data && data.value) ? data.value : [];
        },
        async saveTasks(uid, tasks) {
            const mod = await f();
            await mod.setDoc(
                tasksDocRef(mod, uid),
                { value: Array.isArray(tasks) ? tasks : [], updatedAt: mod.serverTimestamp() },
                { merge: true }
            );
        },

        // ===== Tunes =====
        async loadTunesState(uid) {
            const mod = await f();
            const snap = await mod.getDoc(tunesDocRef(mod, uid));
            const data = snap.exists() ? snap.data() : null;
            return data && data.value ? data.value : null;
        },
        async saveTunesState(uid, state) {
            const mod = await f();
            await mod.setDoc(
                tunesDocRef(mod, uid),
                { value: state || null, updatedAt: mod.serverTimestamp() },
                { merge: true }
            );
        }
    };
}

