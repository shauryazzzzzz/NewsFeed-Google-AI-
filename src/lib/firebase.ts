import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline'
});
// Request Workspace scopes needed for multi-sheet monitoring and tab creation.
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory.
let cachedAccessToken: string | null = null;

const clearCachedAccessToken = () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem('news_oauth_token');
    sessionStorage.removeItem('news_oauth_token');
  } catch (e) {
    // ignore
  }
};

// Store in storage to persist on refresh but keep safe
try {
  const saved = localStorage.getItem('news_oauth_token') || sessionStorage.getItem('news_oauth_token');
  if (saved) {
    cachedAccessToken = saved;
  }
} catch (e) {
  // ignore
}

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    // Attempt to re-load token from storage in case it was written asynchronously
    if (!cachedAccessToken) {
      try {
        const saved = localStorage.getItem('news_oauth_token') || sessionStorage.getItem('news_oauth_token');
        if (saved) {
          cachedAccessToken = saved;
        }
      } catch (e) {
        // ignore
      }
    }

    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      clearCachedAccessToken();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || (result.user as any)?.stsTokenManager?.accessToken;
    if (!accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = accessToken;
    try {
      localStorage.setItem('news_oauth_token', cachedAccessToken);
      sessionStorage.setItem('news_oauth_token', cachedAccessToken);
    } catch (e) {}
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  clearCachedAccessToken();
};

export { clearCachedAccessToken };
