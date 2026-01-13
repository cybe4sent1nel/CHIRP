import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createClerkClient } from '@clerk/backend';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY
});

export const protect = async (req, res, next) => {
    try {
        // Skip auth for OPTIONS preflight requests
        if (req.method === 'OPTIONS') {
            console.log('[AUTH] Skipping auth for OPTIONS preflight');
            return next();
        }
        
        console.log('[AUTH] Checking authentication...');
        
        // First try Clerk authentication
        try {
            const clerkAuth = req.auth();
            if (clerkAuth?.userId) {
                console.log('[AUTH] Clerk auth successful, userId:', clerkAuth.userId);
                req.userId = clerkAuth.userId;
                return next();
            }
        } catch (clerkError) {
            console.log('[AUTH] Clerk auth failed, trying JWT...');
        }

        // Fall back to custom JWT token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('[AUTH] No authorization header found');
            return res.status(401).json({success: false, message: "Not authorized - missing token"})
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix
        console.log('[AUTH] Attempting to verify JWT token...');

        // Decode header first to detect token algorithm
        const decodedHeader = jwt.decode(token, { complete: true });
        const alg = decodedHeader?.header?.alg;

        // If token is RS* (Clerk-signed), try Clerk SDK verification
        if (alg && alg.startsWith('RS')) {
            console.log('[AUTH] Detected RS* token, attempting Clerk backend verification (multi-method)...');

            // Diagnostic: list available methods on clerkClient to help debug runtime
            try {
                const clientFns = Object.keys(clerkClient).filter(k => typeof clerkClient[k] === 'function');
                console.log('[AUTH] Clerk client methods:', clientFns.join(', '));
            } catch (listErr) {
                console.log('[AUTH] Failed to list clerkClient methods:', listErr && listErr.message ? listErr.message : listErr);
            }

            // Try a sequence of possible verification methods that different Clerk SDK versions expose.
            // Special-case `authenticateRequest` which often expects the request object rather than a token string.
            const tryFns = [
                'authenticateRequest',
                'verifyToken',
                'verifyJwt',
                'verifyJwtToken',
                'verifySessionToken',
                'verifySession',
                'sessions.verifyJwt',
                'jwt.verify',
                'debugRequestState'
            ];

            for (const fnName of tryFns) {
                try {
                    let result;

                    if (fnName === 'authenticateRequest' && typeof clerkClient.authenticateRequest === 'function') {
                        // Try calling with the Express `req` first (preferred)
                        try {
                            result = await clerkClient.authenticateRequest(req);
                        } catch (e) {
                            // Fallback: some SDK variants accept a plain object with headers
                            try {
                                result = await clerkClient.authenticateRequest({ headers: { authorization: `Bearer ${token}` } });
                            } catch (e2) {
                                // Do NOT pass the raw token string to authenticateRequest (some implementations try to parse it as a URL)
                                console.log('[AUTH] authenticateRequest fallbacks failed, skipping token-string fallback to avoid parse errors');
                                throw e2;
                            }
                        }
                    } else if (fnName.includes('.')) {
                        // nested access like sessions.verifyJwt
                        const parts = fnName.split('.');
                        let cur = clerkClient;
                        for (const p of parts) cur = cur?.[p];
                        if (typeof cur === 'function') result = await cur.call(clerkClient, token);
                        else continue;
                    } else if (typeof clerkClient[fnName] === 'function') {
                        // Most other functions accept the token string
                        result = await clerkClient[fnName](token);
                    } else {
                        continue;
                    }

                    const payload = result || {};
                    // Different SDKs return different shapes; attempt common locations
                    const candidateId = payload?.userId || payload?.sub || payload?.user_id || payload?.uid || payload?.session?.userId || payload?.claims?.sub || payload?.session?.user_id;
                    if (candidateId) {
                        req.userId = candidateId;
                        console.log('[AUTH] Clerk token verified via', fnName, 'userId:', req.userId);
                        return next();
                    }

                    // If function returned but no user id, log and continue trying others
                    console.log('[AUTH] Clerk method', fnName, 'returned but no user id. Result keys:', Object.keys(payload || {}).join(','));
                } catch (err) {
                    console.log('[AUTH] Clerk method', fnName, 'failed:', err && err.message ? err.message : err);
                }
            }

            console.error('[AUTH] All Clerk verification attempts failed for RS token -- attempting JWKS verification fallback');

            // JWKS fallback: fetch issuer JWKS and verify signature using x5c if available
            try {
                const rawDecoded = jwt.decode(token, { complete: true });
                const kid = rawDecoded?.header?.kid;
                const iss = rawDecoded?.payload?.iss;
                if (!iss) throw new Error('No issuer in token payload');

                const jwksUrl = iss.replace(/\/$/, '') + '/.well-known/jwks.json';
                console.log('[AUTH] Fetching JWKS from', jwksUrl);

                const resp = await fetch(jwksUrl, { method: 'GET' });
                if (!resp.ok) throw new Error('Failed to fetch JWKS: ' + resp.status);
                const jwks = await resp.json();
                const keys = jwks.keys || [];
                const key = keys.find(k => k.kid === kid) || keys[0];
                if (!key) throw new Error('No JWK found for token');

                // Prefer x5c certificate if present, otherwise convert JWK (n/e) to a KeyObject
                let pubKeyObject;
                if (key.x5c && key.x5c.length) {
                    const cert = key.x5c[0];
                    const formatted = cert.match(/.{1,64}/g).join('\n');
                    const certPem = `-----BEGIN CERTIFICATE-----\n${formatted}\n-----END CERTIFICATE-----`;
                    try {
                        pubKeyObject = crypto.createPublicKey(certPem);
                    } catch (e) {
                        throw new Error('Failed to create public key from x5c certificate: ' + e.message);
                    }
                } else if (key.n && key.e) {
                    try {
                        // Use Node's JWK import support to create a KeyObject directly
                        const jwk = { kty: 'RSA', n: key.n, e: key.e };
                        pubKeyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
                    } catch (e) {
                        throw new Error('Failed to create public key from JWK (n/e): ' + e.message);
                    }
                }

                if (!pubKeyObject) throw new Error('No public key material available in JWKS');

                // Ensure we pass a PEM string (some jwt libraries expect PEM, not KeyObject)
                let pubKeyForVerify;
                try {
                    pubKeyForVerify = pubKeyObject.export({ type: 'spki', format: 'pem' });
                } catch (e) {
                    // Fallback: if export fails, try passing the KeyObject directly
                    pubKeyForVerify = pubKeyObject;
                }

                // Verify token using the PEM or KeyObject
                const verifiedPayload = jwt.verify(token, pubKeyForVerify, { algorithms: ['RS256', 'RS384', 'RS512'] });
                const candidateId = verifiedPayload.sub || verifiedPayload.userId || verifiedPayload.user_id;
                if (candidateId) {
                    req.userId = candidateId;
                    console.log('[AUTH] JWKS verification succeeded, userId:', req.userId);
                    return next();
                }
                console.error('[AUTH] JWKS verification succeeded but no user id in payload');
            } catch (jwksErr) {
                console.error('[AUTH] JWKS verification failed:', jwksErr && jwksErr.message ? jwksErr.message : jwksErr);
            }

            return res.status(401).json({ success: false, message: 'Not authorized - unsupported token algorithm' });
        }

        // For HS* tokens, verify using local secret
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256', 'HS384', 'HS512'] });
        } catch (verifyErr) {
            console.error('[AUTH] JWT verify failed. Token header:', decodedHeader?.header);
            throw verifyErr;
        }
        
        if (!decoded._id && !decoded.userId) {
            console.error('[AUTH] Token has no user ID');
            return res.status(401).json({success: false, message: "Invalid token - no user ID"})
        }

        // Set userId on req for easy access in controllers
        req.userId = decoded._id || decoded.userId;
        console.log('[AUTH] JWT verified, userId:', req.userId);
        next();
    } catch (error) {
        console.error('[AUTH] Authentication error:', error.message);
        return res.status(401).json({success: false, message: "Not authorized - " + error.message})
    }
}

// Helper function to get userId from request (works for both Clerk and custom JWT)
export const getUserId = (req) => {
    return req.userId || req.auth()?.userId;
}