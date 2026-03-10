/* ===== Auth state (localStorage until Firebase integration) ===== */
const AUTH_STORAGE_KEY = 'deskStudyAuth';

function readAuthState() {
    try {
        const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return { status: null, uid: '', email: '', displayName: '' };
        const parsed = JSON.parse(raw);
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

function writeAuthState(partial) {
    const current = readAuthState();
    const next = { ...current, ...partial };
    try {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    return next;
}

export function getAuthState() {
    return readAuthState();
}

/* ===== Navbar auth UI ===== */
let navAuthContainer = null;

function getNavAuthContainer() {
    if (navAuthContainer) return navAuthContainer;
    const mainNav = document.querySelector('.main-nav');
    if (!mainNav) return null;
    let el = mainNav.querySelector('#navAuth');
    if (!el) {
        el = document.createElement('div');
        el.id = 'navAuth';
        el.className = 'nav-auth';
        mainNav.appendChild(el);
    }
    navAuthContainer = el;
    return el;
}

function renderNavAuth(authState) {
    const container = getNavAuthContainer();
    if (!container) return;

    container.textContent = '';

    if (authState.status === 'user') {
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'nav-auth-btn nav-auth-logout-btn';
        logoutBtn.textContent = 'Log out';
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            void (async function () {
                try {
                    const mod = await import('./firebase.js');
                    if (mod && typeof mod.getFirebaseAuth === 'function') {
                        const auth = await mod.getFirebaseAuth();
                        if (auth) {
                            // TODO: Install Firebase SDK and replace with:
                            // import { signOut } from "firebase/auth";
                            // await signOut(auth);
                        }
                    }
                } catch {
                    // Ignore; local fallback will be used.
                }

                writeAuthState({ status: null, uid: '', email: '', displayName: '' });
                renderNavAuth(readAuthState());
            })();
        });
        container.appendChild(logoutBtn);
        return;
    }

    const loginLink = document.createElement('a');
    loginLink.href = 'login.html';
    loginLink.className = 'nav-auth-btn';
    loginLink.textContent = 'Log in';
    container.appendChild(loginLink);

    const signupLink = document.createElement('a');
    signupLink.href = 'sign-up.html';
    signupLink.className = 'nav-auth-btn';
    signupLink.textContent = 'Sign up';
    container.appendChild(signupLink);
}

/* ===== Init ===== */
function initLogin() {
    // If Firebase config exists, this will enable remote persistence automatically.
    void (async function () {
        try {
            const mod = await import('./firebase.js');
            if (mod && typeof mod.configureDataStoreRemoteAdapter === 'function') {
                await mod.configureDataStoreRemoteAdapter();
            }
        } catch {
            // Ignore; local-only mode remains active.
        }
    })();
    renderNavAuth(readAuthState());
}

document.addEventListener('DOMContentLoaded', initLogin);
