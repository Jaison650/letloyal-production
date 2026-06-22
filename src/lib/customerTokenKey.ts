// src/lib/customerTokenKey.ts
// Client-safe constant: the localStorage key for the customer JWT.
//
// Kept in its OWN module (not customerAuth.ts) so client code such as
// customerSession.ts can import the key WITHOUT dragging the server-only
// customerAuth module into the client bundle. customerAuth imports
// `jsonwebtoken` and runs a top-level CUSTOMER_JWT_SECRET check that throws
// in production — on the client that env var is undefined, so any client
// import of customerAuth crashes the page on hydration.
export const TOKEN_KEY = 'll_customer_token';
