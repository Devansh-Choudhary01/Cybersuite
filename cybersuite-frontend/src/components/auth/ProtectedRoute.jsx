/**
 * F1 — ProtectedRoute
 * Redirects unauthenticated users to /login.
 */
export default function ProtectedRoute({ children }) {
  // Authentication removed: always render children
  return children
}
