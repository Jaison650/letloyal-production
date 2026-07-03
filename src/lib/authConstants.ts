/**
 * authConstants.ts — Edge-safe constants ONLY.
 * NO imports here (no jsonwebtoken, no bcryptjs, no db) so this file can be
 * pulled into the Edge runtime (middleware) without bundling Node.js packages.
 */
export const MERCHANT_COOKIE_NAME = 'letloyal_merchant_session';
export const ADMIN_COOKIE_NAME    = 'letloyal_admin_session';
export const CUSTOMER_COOKIE_NAME = 'letloyal_customer_session';
