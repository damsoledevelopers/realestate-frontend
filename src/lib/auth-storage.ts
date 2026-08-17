const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const SESSION_KEY = 'sessionId';
export const REMEMBER_EMAIL_KEY = 'rememberEmail';

export function getStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  const sessionId =
    localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || null;
  return {
    token,
    userJson,
    sessionId,
    isPersistent: Boolean(localStorage.getItem(TOKEN_KEY)),
  };
}

export function setStoredAuth(
  token: string,
  userJson: string,
  remember: boolean,
  sessionId?: string | null
) {
  clearStoredAuth();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, userJson);
  if (sessionId) {
    storage.setItem(SESSION_KEY, sessionId);
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
