// ===== Auth-aware data store (guest localStorage vs authenticated remote) =====

const DS_AUTH_KEY = 'deskStudyAuth';
const DS_TIMER_LOCAL_KEY = 'deskStudyTimerStateV1';
const DS_TIMER_SOUND_LOCAL_KEY = 'deskStudyTimerSoundEnabledV1';
const DS_TASKS_LOCAL_KEY = 'deskStudyTasksStateV1';
const DS_TUNES_LOCAL_KEY = 'deskStudyTunesStateV1';

function dsSafeParse(json) {
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function dsGetAuthSnapshot() {
    try {
        const raw = window.localStorage.getItem(DS_AUTH_KEY);
        if (!raw) return { status: null, uid: '', email: '', displayName: '' };
        const parsed = dsSafeParse(raw) || {};
        return {
            status: parsed.status === 'user' ? 'user' : null,
            uid: String(parsed.uid || ''),
            email: String(parsed.email || ''),
            displayName: String(parsed.displayName || '')
        };
    } catch {
        return { status: null, uid: '', email: '', displayName: '' };
    }
}

function dsGetCurrentUserId() {
    const auth = dsGetAuthSnapshot();
    if (auth.status === 'user' && auth.uid) {
        return auth.uid;
    }
    if (auth.status === 'user' && auth.email) {
        return auth.email.toLowerCase();
    }
    return null;
}

// ----- Local guest backend (localStorage) -----

const dsLocalBackend = {
    async loadTimerState() {
        return dsSafeParse(window.localStorage.getItem(DS_TIMER_LOCAL_KEY));
    },
    async saveTimerState(state) {
        try {
            window.localStorage.setItem(DS_TIMER_LOCAL_KEY, JSON.stringify(state));
        } catch {}
    },
    async loadTimerSoundPref() {
        const raw = window.localStorage.getItem(DS_TIMER_SOUND_LOCAL_KEY);
        if (raw === null) return null;
        return raw === 'true';
    },
    async saveTimerSoundPref(enabled) {
        try {
            window.localStorage.setItem(DS_TIMER_SOUND_LOCAL_KEY, enabled ? 'true' : 'false');
        } catch {}
    },
    async loadTasks() {
        return dsSafeParse(window.localStorage.getItem(DS_TASKS_LOCAL_KEY)) || [];
    },
    async saveTasks(taskGroups) {
        try {
            window.localStorage.setItem(DS_TASKS_LOCAL_KEY, JSON.stringify(taskGroups || []));
        } catch {}
    },
    async loadTunesState() {
        return dsSafeParse(window.localStorage.getItem(DS_TUNES_LOCAL_KEY));
    },
    async saveTunesState(state) {
        try {
            window.localStorage.setItem(DS_TUNES_LOCAL_KEY, JSON.stringify(state || {}));
        } catch {}
    }
};

// ----- Remote backend adapter (configure later with Firebase) -----
//
// IMPORTANT: To avoid code you must delete later, this file does NOT implement a fake
// per-user localStorage backend. When you're ready, call:
//
//   window.dataStore.configureRemoteAdapter({
//     loadTimerState: async (uid) => ...,
//     saveTimerState: async (uid, state) => ...,
//     loadTimerSoundPref: async (uid) => ...,
//     saveTimerSoundPref: async (uid, enabled) => ...,
//     loadTasks: async (uid) => ...,
//     saveTasks: async (uid, tasks) => ...,
//     loadTunesState: async (uid) => ...,
//     saveTunesState: async (uid, state) => ...,
//   })
//
// Firebase security rules should restrict reads/writes to the authenticated user's uid only.
let dsRemoteAdapter = null;

function dsHasRemoteAdapter() {
    return Boolean(dsRemoteAdapter);
}

function dsGetBackend() {
    const userId = dsGetCurrentUserId();
    if (!userId) {
        return { kind: 'guest', userId: null, impl: dsLocalBackend };
    }
    if (!dsHasRemoteAdapter()) {
        return { kind: 'guest', userId: null, impl: dsLocalBackend };
    }
    return { kind: 'user', userId, impl: dsRemoteAdapter };
}

// ----- Public interface -----

const dataStore = {
    // Auth helpers
    getAuthSnapshot: dsGetAuthSnapshot,
    getCurrentUserId: dsGetCurrentUserId,
    isAuthenticated() {
        return Boolean(dsGetCurrentUserId());
    },

    configureRemoteAdapter(adapter) {
        dsRemoteAdapter = adapter || null;
    },

    // Timer
    async loadTimerState() {
        const { kind, userId, impl } = dsGetBackend();
        if (kind === 'guest') return await impl.loadTimerState();
        return await impl.loadTimerState(userId);
    },
    async saveTimerState(state) {
        const { kind, userId, impl } = dsGetBackend();
        if (kind === 'guest') {
            await impl.saveTimerState(state);
        } else {
            await impl.saveTimerState(userId, state);
        }
    },
    async loadTimerSoundPref() {
        const { kind, userId, impl } = dsGetBackend();
        const value = kind === 'guest'
            ? await impl.loadTimerSoundPref()
            : await impl.loadTimerSoundPref(userId);
        if (value === null) return null;
        return Boolean(value);
    },
    async saveTimerSoundPref(enabled) {
        const { kind, userId, impl } = dsGetBackend();
        if (kind === 'guest') {
            await impl.saveTimerSoundPref(enabled);
        } else {
            await impl.saveTimerSoundPref(userId, enabled);
        }
    },

    // Tasks
    async loadTasks() {
        const { kind, userId, impl } = dsGetBackend();
        return kind === 'guest' ? await impl.loadTasks() : await impl.loadTasks(userId);
    },
    async saveTasks(taskGroups) {
        const { kind, userId, impl } = dsGetBackend();
        if (kind === 'guest') {
            await impl.saveTasks(taskGroups);
        } else {
            await impl.saveTasks(userId, taskGroups);
        }
    },

    // Tunes
    async loadTunesState() {
        const { kind, userId, impl } = dsGetBackend();
        return kind === 'guest' ? await impl.loadTunesState() : await impl.loadTunesState(userId);
    },
    async saveTunesState(state) {
        const { kind, userId, impl } = dsGetBackend();
        if (kind === 'guest') {
            await impl.saveTunesState(state);
        } else {
            await impl.saveTunesState(userId, state);
        }
    },

    // call after successful login/sign-up
    async migrateGuestDataToUser() {
        const userId = dsGetCurrentUserId();
        if (!userId) return false;
        if (!dsHasRemoteAdapter()) return false;

        // Timer
        const guestTimer = await dsLocalBackend.loadTimerState();
        if (guestTimer) {
            await dsRemoteAdapter.saveTimerState(userId, guestTimer);
        }
        const guestSound = await dsLocalBackend.loadTimerSoundPref();
        if (guestSound !== null) {
            await dsRemoteAdapter.saveTimerSoundPref(userId, guestSound);
        }

        // Tasks
        const guestTasks = await dsLocalBackend.loadTasks();
        if (guestTasks && guestTasks.length) {
            await dsRemoteAdapter.saveTasks(userId, guestTasks);
        }

        // Tunes
        const guestTunes = await dsLocalBackend.loadTunesState();
        if (guestTunes) {
            await dsRemoteAdapter.saveTunesState(userId, guestTunes);
        }

        // clear guest copies
        try {
            window.localStorage.removeItem(DS_TIMER_LOCAL_KEY);
            window.localStorage.removeItem(DS_TIMER_SOUND_LOCAL_KEY);
            window.localStorage.removeItem(DS_TASKS_LOCAL_KEY);
            window.localStorage.removeItem(DS_TUNES_LOCAL_KEY);
        } catch {}

        return true;
    }
};

window.dataStore = dataStore;

