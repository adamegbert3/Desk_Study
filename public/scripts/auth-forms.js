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

async function configureRemoteAdapterIfAvailable() {
    try {
        const mod = await import('./firebase.js');
        if (mod && typeof mod.configureDataStoreRemoteAdapter === 'function') {
            await mod.configureDataStoreRemoteAdapter();
        }
    } catch {
        // Ignore; local fallback will be used.
    }
}

function getLocalDataPresence() {
    if (!window.dataStore || typeof window.dataStore.hasGuestData !== 'function') {
        return false;
    }
    return Boolean(window.dataStore.hasGuestData());
}

function promptLocalDataMergeChoice() {
    return new Promise(function (resolve) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0, 0, 0, 0.55)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '16px';
        overlay.style.zIndex = '9999';

        const modal = document.createElement('div');
        modal.style.background = '#ffffff';
        modal.style.color = '#222222';
        modal.style.width = 'min(520px, 100%)';
        modal.style.borderRadius = '14px';
        modal.style.padding = '18px';
        modal.style.boxShadow = '0 20px 45px rgba(0,0,0,.22)';

        const title = document.createElement('h2');
        title.textContent = 'Save existing data to this account?';
        title.style.margin = '0 0 10px 0';
        title.style.fontSize = '1.1rem';

        const body = document.createElement('p');
        body.textContent = 'We found existing task and timer data on this device. To keep your data, you can merge it with this account.';
        body.style.margin = '0 0 16px 0';
        body.style.lineHeight = '1.4';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.justifyContent = 'flex-end';
        actions.style.flexWrap = 'wrap';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';

        const keepBtn = document.createElement('button');
        keepBtn.type = 'button';
        keepBtn.textContent = "Don't merge local data";

        const mergeBtn = document.createElement('button');
        mergeBtn.type = 'button';
        mergeBtn.textContent = 'Merge local data to new account';

        function finish(choice) {
            overlay.remove();
            resolve(choice);
        }

        cancelBtn.addEventListener('click', function () { finish('cancel'); });
        keepBtn.addEventListener('click', function () { finish('keep'); });
        mergeBtn.addEventListener('click', function () { finish('merge'); });

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) finish('cancel');
        });

        actions.append(cancelBtn, keepBtn, mergeBtn);
        modal.append(title, body, actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
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
                    const { signInWithEmailAndPassword } = await import(
                        `https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js`
                    );
                    const cred = await signInWithEmailAndPassword(auth, email, password);
                    const user = cred.user;
                    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                        status: 'user',
                        uid: user.uid,
                        email: user.email || email,
                        displayName: user.displayName || email.split('@')[0] || ''
                    }));

                    if (getLocalDataPresence()) {
                        const choice = await promptLocalDataMergeChoice();
                        if (choice === 'merge') {
                            await configureRemoteAdapterIfAvailable();
                            if (window.dataStore && typeof window.dataStore.migrateGuestDataToUser === 'function') {
                                await window.dataStore.migrateGuestDataToUser();
                            }
                        } else if (choice === 'cancel') {
                            const { signOut } = await import(
                                `https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js`
                            );
                            await signOut(auth);
                            window.localStorage.removeItem(AUTH_STORAGE_KEY);
                            return;
                        }
                    }
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
                    const { createUserWithEmailAndPassword, updateProfile } = await import(
                        `https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js`
                    );
                    const cred = await createUserWithEmailAndPassword(auth, email, password);
                    const user = cred.user;
                    if (name) {
                        await updateProfile(user, { displayName: name });
                    }
                    window.localStorage.setItem(
                        AUTH_STORAGE_KEY,
                        JSON.stringify({
                            status: 'user',
                            uid: user.uid,
                            email: user.email || email,
                            displayName: name || user.displayName || email.split('@')[0] || ''
                        })
                    );
                } catch (err) {
                    console.error('Sign-up failed', err);
                    showSignupError('Sign-up failed. Check your details and try again.');
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

            // New account flow: move guest local data into the authenticated user's remote store.
            if (getLocalDataPresence()) {
                const choice = await promptLocalDataMergeChoice();
                if (choice === 'merge') {
                    await configureRemoteAdapterIfAvailable();
                    if (window.dataStore && typeof window.dataStore.migrateGuestDataToUser === 'function') {
                        await window.dataStore.migrateGuestDataToUser();
                    }
                } else if (choice === 'cancel') {
                    const { signOut } = await import(
                        `https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js`
                    );
                    await signOut(auth);
                    window.localStorage.removeItem(AUTH_STORAGE_KEY);
                    return;
                }
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
