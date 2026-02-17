// Authentication Manager for ccooffee.de
import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready before binding events
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    bindEvents() {
        console.log('🔗 Binding Auth Events...');

        // Listen to auth state changes (Moved here to ensure DOM is ready)
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            if (user) {
                console.log('✅ User logged in:', user.email);
                await this.loadUserProfile(user.uid);

                // 1. Try to migrate local data if cloud is empty
                await this.migrateLocalStorageData();

                // 2. Fetch latest data (either existing cloud data or just migrated)
                const brews = await this.getBrews();
                const drinks = await this.getDrinks();
                const shops = await this.getShops();

                // 3. Sync App
                window.dispatchEvent(new CustomEvent('auth-data-loaded', {
                    detail: { brews, drinks, shops }
                }));

                this.updateUI(true);
                this.closeAuthModal(); // Auto-close modal on login
            } else {
                console.log('❌ User logged out');

                // Clear App Data
                window.dispatchEvent(new CustomEvent('auth-logout'));

                this.updateUI(false);
                // Auto-open modal if not logged in
                setTimeout(() => {
                    if (!this.currentUser) this.showLoginModal();
                }, 100);
            }
        });

        // Helper to safely add listener
        const addListener = (id, event, handler) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(event, handler);
                console.log(`✅ Bound '${event}' listener to #${id}`);
            } else {
                console.warn(`❌ Element with ID '#${id}' not found for event binding`);
            }
        };

        // Login Button (Navbar)
        addListener('login-btn', 'click', () => {
            console.log('🖱️ Login button clicked');
            this.showLoginModal();
        });

        // Google Sign-In Button
        addListener('google-auth-btn', 'click', () => {
            console.log('🖱️ Google auth button clicked');
            this.signInWithGoogle();
        });

        // User Avatar (Toggle Profile)
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', (e) => {
                console.log('🖱️ Avatar clicked');
                e.stopPropagation();
                this.toggleProfileDropdown();
            });
            console.log('✅ Bound click listener to .user-avatar');
        } else {
            console.warn('❌ .user-avatar not found');
        }

        // Logout Button
        const logoutBtn = document.querySelector('.profile-menu-item');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('🖱️ Logout clicked');
                this.logout();
            });
            console.log('✅ Bound click listener to logout button');
        }

        // Close Modal
        const closeBtn = document.querySelector('#auth-modal .close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeAuthModal());
        }

        // Auth Form Switcher (Toggle Login/Signup)
        addListener('auth-switch-btn', 'click', () => {
            const mode = document.getElementById('auth-form').dataset.mode;
            // Toggle mode
            this.switchAuthMode(mode === 'login' ? 'signup' : 'login');
        });

        // Auth Form Submit
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
            console.log('✅ Bound submit listener to #auth-form');
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('profile-dropdown');
            const userProfile = document.getElementById('user-profile');

            if (dropdown && !dropdown.classList.contains('hidden') &&
                userProfile && !userProfile.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    // Google Sign-In
    async signInWithGoogle() {
        // Clear previous errors
        const errorEl = document.getElementById('auth-error');
        errorEl.textContent = '';
        errorEl.style.display = 'none';

        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Creating user profile (non-blocking)
            try {
                // Check if user exists in Firestore, if not create profile
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        email: user.email,
                        displayName: user.displayName || user.email.split('@')[0],
                        photoURL: user.photoURL,
                        createdAt: serverTimestamp(),
                        brews: [],
                        drinks: [],
                        shops: []
                    });
                    console.log('✅ New Google user profile created');
                }
            } catch (firestoreError) {
                console.warn('⚠️ Firestore profile creation failed (likely permission issue), but Auth successful:', firestoreError);
                // We do NOT block login here. The listener in init() will handle the UI update.
            }

            console.log('✅ Google Sign-In successful');
            this.closeAuthModal();
        } catch (error) {
            console.error('Google Sign-In error:', error);

            let msg = 'Fehler bei der Google-Anmeldung.';
            if (error.code === 'auth/popup-closed-by-user') msg = 'Anmeldung abgebrochen.';
            if (error.code === 'auth/cancelled-popup-request') msg = 'Anfrage abgebrochen.';
            if (error.code === 'auth/operation-not-allowed') msg = 'Google-Anmeldung ist nicht aktiviert (siehe Firebase Console).';
            if (error.code === 'auth/unauthorized-domain') msg = 'Domain nicht autorisiert (siehe Firebase Console).';

            errorEl.textContent = msg;
            errorEl.style.color = '#e74c3c';
            errorEl.style.display = 'block';
        }
    }

    // Show login modal
    showLoginModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.remove('hidden');
        // Small delay to allow display:flex to apply before opacity transition
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
        this.switchAuthMode('login');
    }

    // Show signup modal
    showSignupModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
        this.switchAuthMode('signup');
    }

    // Close auth modal
    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.remove('visible');

        // Wait for transition to finish before hiding
        setTimeout(() => {
            modal.classList.add('hidden');
            document.getElementById('auth-form').reset();
            document.getElementById('auth-error').textContent = '';
        }, 300); // Match transition duration in CSS
    }

    // Switch between login and signup modes
    switchAuthMode(mode) {
        const title = document.getElementById('auth-title');
        const submitBtn = document.getElementById('auth-submit');
        const switchText = document.getElementById('auth-switch-text');
        const switchBtn = document.getElementById('auth-switch-btn');
        const displayNameField = document.getElementById('display-name-field');

        // Set data-mode attribute which is used by the event listener
        document.getElementById('auth-form').dataset.mode = mode;

        if (mode === 'login') {
            title.textContent = 'Anmelden';
            submitBtn.textContent = 'Anmelden';
            switchText.textContent = 'Noch kein Konto?';
            switchBtn.textContent = 'Registrieren';
            displayNameField.classList.add('hidden');
        } else {
            title.textContent = 'Registrieren';
            submitBtn.textContent = 'Konto erstellen';
            switchText.textContent = 'Bereits ein Konto?';
            switchBtn.textContent = 'Anmelden';
            displayNameField.classList.remove('hidden');
        }
    }

    // Handle auth form submission
    async handleAuthSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const mode = form.dataset.mode;
        const email = form.email.value.trim();
        const password = form.password.value;
        const errorEl = document.getElementById('auth-error');

        errorEl.textContent = '';
        errorEl.style.display = 'none';

        try {
            if (mode === 'signup') {
                const displayName = form['display-name'].value.trim();
                // Create user account
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Update profile with display name
                if (displayName) {
                    await updateProfile(user, { displayName });
                }

                // Create user profile in Firestore (non-blocking)
                try {
                    await setDoc(doc(db, 'users', user.uid), {
                        email: user.email,
                        displayName: displayName || email.split('@')[0],
                        createdAt: serverTimestamp(),
                        brews: [],
                        drinks: [],
                        shops: []
                    });
                    console.log('✅ User profile created in Firestore');
                } catch (fsError) {
                    console.warn('⚠️ Firestore profile creation failed:', fsError);
                }

                console.log('✅ User registered successfully');
            } else {
                // Sign in existing user
                await signInWithEmailAndPassword(auth, email, password);
                console.log('✅ User logged in successfully');
            }

            this.closeAuthModal();
        } catch (error) {
            console.error('Auth error:', error);
            let errorMessage = 'Ein Fehler ist aufgetreten: ' + error.message;

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Diese E-Mail wird bereits verwendet.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Ungültige E-Mail-Adresse.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Passwort muss mindestens 6 Zeichen lang sein.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Falsche E-Mail oder Passwort.';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Ungültige Anmeldedaten.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Login-Methode nicht aktiviert (siehe Firebase Console).';
                    break;
            }

            errorEl.textContent = errorMessage;
            errorEl.style.display = 'block';
            errorEl.style.color = '#e74c3c';
        }
    }

    // Sign out
    async logout() {
        try {
            await signOut(auth);
            console.log('✅ User logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Load user profile from Firestore
    async loadUserProfile(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Update display name if available
                if (userData.displayName && this.currentUser) {
                    document.getElementById('user-display-name').textContent = userData.displayName;
                }
                // Update points
                const points = userData.points || 0;
                document.getElementById('user-points').textContent = `ccooffee points: ${points}`;
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    // Grant points to user
    async grantPoints(amount) {
        if (!this.currentUser) return;
        try {
            const userRef = doc(db, 'users', this.currentUser.uid);
            // Use Firestore increment for atomic updates
            // We need to import increment first, but to keep it simple with current imports, 
            // we will read-modify-write or use simple update if we assume single client.
            // Better to standard read-write for now to avoid import issues if not available in current block.
            // Actually, let's just use the current data since we load it.

            // Re-fetch to be safe
            const userDoc = await getDoc(userRef);
            let currentPoints = 0;
            if (userDoc.exists()) {
                currentPoints = userDoc.data().points || 0;
            }

            const newPoints = currentPoints + amount;
            await updateDoc(userRef, { points: newPoints });

            // Update UI
            document.getElementById('user-points').textContent = `ccooffee points: ${newPoints}`;

            // Visual feedback
            const pointsEl = document.getElementById('user-points');
            pointsEl.style.color = 'var(--color-gold-bright)';
            pointsEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                pointsEl.style.color = '';
                pointsEl.style.transform = '';
            }, 500);

            console.log(`🌟 Granted ${amount} points. New total: ${newPoints}`);
        } catch (error) {
            console.error('Error granting points:', error);
        }
    }

    // Update UI based on auth state
    updateUI(isLoggedIn) {
        const userProfile = document.getElementById('user-profile');
        const loginBtn = document.getElementById('login-btn');

        if (isLoggedIn && this.currentUser) {
            // Show user profile
            userProfile.classList.remove('hidden');
            loginBtn.classList.add('hidden');

            const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            document.getElementById('user-display-name').textContent = displayName;
            document.getElementById('user-email').textContent = this.currentUser.email;

            // Get initials for avatar
            const initials = displayName.substring(0, 2).toUpperCase();
            document.getElementById('user-avatar-text').textContent = initials;
        } else {
            // Show login button
            userProfile.classList.add('hidden');
            loginBtn.classList.remove('hidden');
        }
    }

    // Toggle profile dropdown
    toggleProfileDropdown() {
        const dropdown = document.getElementById('profile-dropdown');
        dropdown.classList.toggle('hidden');
    }

    // Migrate existing localStorage data to Firestore
    async migrateLocalStorageData() {
        if (!this.currentUser) return;

        try {
            const userDocRef = doc(db, 'users', this.currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            // Only migrate if user doc exists and no data has been migrated
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const hasData = userData.brews?.length > 0 || userData.drinks?.length > 0 || userData.shops?.length > 0;

                if (!hasData) {
                    // Get data from localStorage
                    const brews = JSON.parse(localStorage.getItem('brews') || '[]');
                    const drinks = JSON.parse(localStorage.getItem('drinks') || '[]');
                    const shops = JSON.parse(localStorage.getItem('shops') || '[]');

                    if (brews.length > 0 || drinks.length > 0 || shops.length > 0) {
                        // Migrate to Firestore
                        await updateDoc(userDocRef, {
                            brews,
                            drinks,
                            shops,
                            points: 0 // Initialize points
                        });
                        console.log('📦 Migrated localStorage data to Firestore');
                    }
                }
            }
        } catch (error) {
            console.error('Error migrating data:', error);
        }
    }

    // Get user's brews from Firestore
    async getBrews() {
        if (!this.currentUser) return [];
        try {
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            return userDoc.exists() ? (userDoc.data().brews || []) : [];
        } catch (error) {
            console.error('Error getting brews:', error);
            return [];
        }
    }

    // Save user's brews to Firestore
    async saveBrews(brews) {
        if (!this.currentUser) return;
        try {
            await updateDoc(doc(db, 'users', this.currentUser.uid), { brews });
        } catch (error) {
            console.error('Error saving brews:', error);
        }
    }

    // Get user's drinks from Firestore
    async getDrinks() {
        if (!this.currentUser) return [];
        try {
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            return userDoc.exists() ? (userDoc.data().drinks || []) : [];
        } catch (error) {
            console.error('Error getting drinks:', error);
            return [];
        }
    }

    // Save user's drinks to Firestore
    async saveDrinks(drinks) {
        if (!this.currentUser) return;
        try {
            await updateDoc(doc(db, 'users', this.currentUser.uid), { drinks });
        } catch (error) {
            console.error('Error saving drinks:', error);
        }
    }

    // Get user's shops from Firestore
    async getShops() {
        if (!this.currentUser) return [];
        try {
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            return userDoc.exists() ? (userDoc.data().shops || []) : [];
        } catch (error) {
            console.error('Error getting shops:', error);
            return [];
        }
    }

    // Save user's shops to Firestore
    async saveShops(shops) {
        if (!this.currentUser) return;
        try {
            await updateDoc(doc(db, 'users', this.currentUser.uid), { shops });
        } catch (error) {
            console.error('Error saving shops:', error);
        }
    }
}

// Create global instance
const authManager = new AuthManager();
window.authManager = authManager;
