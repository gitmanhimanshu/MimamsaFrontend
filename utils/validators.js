// Lightweight client-side validators shared across auth screens.

// Mirrors the basic check the browser does for <input type="email"> in the web
// app — accepts anything with "name@host.tld" shape, rejecting blank inputs and
// obvious typos. Backend remains the source of truth.
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^\S+@\S+\.\S+$/.test(email.trim());
};
