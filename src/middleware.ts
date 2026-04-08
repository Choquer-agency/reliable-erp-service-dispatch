// Auth redirects are handled client-side via AuthGate component.
// Middleware is intentionally minimal to avoid Next.js 16 deprecation warnings.
export default function middleware() {
  // no-op
}

export const config = {
  matcher: [],
};
