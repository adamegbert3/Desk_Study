/* ===== Show/hide password toggle ===== */
function bindPasswordToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', function () {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? 'Hide' : 'Show';
    });
}

const AUTH_STORAGE_KEY = 'deskStudyAuth';

/* ===== Login / sign-up (Firebase-ready, falls back to local placeholder) ===== */
async function getFirebaseAuthIfConfigured() {
    try {
        const mod = await import('./firebase.js');
        if (mod && typeof mod.getFirebaseAuth === 'function') {
            return await mod.getFirebaseAuth();
        }
    } catch {
        // Ignore; local fallback will be used.
    }
    return null;
}

/* ===== Login form ===== */
function initLoginForm() {
    bindPasswordToggle('loginShowPassword', 'loginPassword');
    const form = document.getElementById('loginForm');
    if (!form) return;
    const errorEl = document.getElementById('loginError');

    function showLoginError(message) {
        if (!errorEl) return;
        errorEl.textContent = message || '';
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        void (async function () {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            showLoginError('');

            // Basic client-side validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailPattern.test(email)) {
                showLoginError('Enter a valid email.');
                return;
            }
            if (!password || password.length < 8) {
                showLoginError('Password must be at least 8 characters.');
                return;
            }

            const auth = await getFirebaseAuthIfConfigured();
            if (auth) {
                try {
                    const { FIREBASE_VERSION } = await import('./firebase-version.js');
                    const { signInWithEmailAndPassword } = await import(
                        `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`
                    );
                    const cred = await signInWithEmailAndPassword(auth, email, password);
                    const user = cred.user;
                    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                        status: "user",
                        uid: user.uid,
                        email: user.email || email,
                        displayName: user.displayName || ""
                    }));
                } catch (err) {
                    console.error('Login failed', err);
                    showLoginError('Login failed. Check your email and password.');
                    return;
                }
            } else {
                // Local-only fallback until Firebase is configured.
                window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                    status: 'user',
                    uid: '',
                    email,
                    displayName: email.split('@')[0] || ''
                }));
            }

            if (window.dataStore && typeof window.dataStore.migrateGuestDataToUser === 'function') {
                window.dataStore.migrateGuestDataToUser();
            }
            window.location.href = 'index.html';
        })();
    });
}

/* ===== Sign-up form ===== */
function initSignupForm() {
    bindPasswordToggle('signupShowPassword', 'signupPassword');
    const form = document.getElementById('signupForm');
    if (!form) return;
    const errorEl = document.getElementById('signupError');

    function showSignupError(message) {
        if (!errorEl) return;
        errorEl.textContent = message || '';
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        void (async function () {
            const email = document.getElementById('signupEmail').value.trim();
            const name = document.getElementById('signupName').value.trim();
            const password = document.getElementById('signupPassword').value;
            showSignupError('');

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailPattern.test(email)) {
                showSignupError('Enter a valid email.');
                return;
            }
            if (!name) {
                showSignupError('Name is required.');
                return;
            }
            const hasLetter = /[A-Za-z]/.test(password);
            const hasNumberOrSymbol = /[\d\W]/.test(password);
            if (!password || password.length < 8 || !hasLetter || !hasNumberOrSymbol) {
                showSignupError('Password must be at least 8 characters and include letters and numbers or symbols.');
                return;
            }

            const auth = await getFirebaseAuthIfConfigured();
            if (auth) {
                try {
                    const {
                        createUserWithEmailAndPassword,
                        updateProfile
                    } = await import(
                        `https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js`
                    );
                    const cred = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(cred.user, { displayName: name });
                    window.localStorage.setItem(
                        AUTH_STORAGE_KEY,
                        JSON.stringify({
                            status: 'user',
                            uid: cred.user.uid,
                            email: cred.user.email || email,
                            displayName: name
                        })
                    );
                } catch (err) {
                    console.error('Sign up failed', err);
                    showSignupError('Sign up failed. Try a different email or password.');
                    return;
                }
            } else {
                // Local-only fallback until Firebase is configured.
                window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                    status: 'user',
                    uid: '',
                    email,
                    displayName: name
                }));
            }

            if (window.dataStore && typeof window.dataStore.migrateGuestDataToUser === 'function') {
                window.dataStore.migrateGuestDataToUser();
            }
            window.location.href = 'index.html';
        })();
    });
}

/* ===== Init based on page ===== */
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('loginForm')) initLoginForm();
    if (document.getElementById('signupForm')) initSignupForm();
});
