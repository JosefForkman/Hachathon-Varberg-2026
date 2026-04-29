const KEY = "s-halland:user-email";

export function getStoredEmail() {
    try {
        return localStorage.getItem(KEY);
    } catch {
        return null;
    }
}

export function setStoredEmail(email) {
    try {
        localStorage.setItem(KEY, email);
    } catch {}
}

export function clearStoredEmail() {
    try {
        localStorage.removeItem(KEY);
    } catch {}
}

export function isValidEmail(s) {
    return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
