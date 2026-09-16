import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
	timingSafeEqual,
} from "node:crypto";
import { NextResponse } from "next/server";
import type { CustomRequest } from "@fuma-comment/server/custom";

/**
 * Reference GitHub OAuth flow for the demo. The adapter itself is auth-agnostic: it just needs a
 * `getToken(request)` that returns the signed-in reader's GitHub token. Here we implement that with a
 * standard OAuth web flow, storing the token in an httpOnly, AES-256-GCM-encrypted cookie so it never
 * reaches the browser. Bring your own auth in a real app if you already have GitHub sign-in.
 */

const TOKEN_COOKIE = "fc_gh_token";
const STATE_COOKIE = "fc_gh_state";
const SCOPE = "public_repo"; // lets the reader create/comment on discussions in a public repo
const ONE_YEAR = 60 * 60 * 24 * 365;
const STATE_TTL = 10 * 60 * 1000;

// ── AES-256-GCM (base64url of iv|tag|ciphertext) ─────────────────────────────────────────────────

let cachedKey: Buffer | undefined;

function key(): Buffer {
	if (cachedKey) return cachedKey;
	const secret = process.env.GITHUB_TOKEN_SECRET;
	if (!secret || secret.length < 32) {
		throw new Error(
			"GITHUB_TOKEN_SECRET must be set to a random string of at least 32 characters; it encrypts the reader's GitHub token.",
		);
	}
	cachedKey = createHash("sha256").update(secret).digest();
	return cachedKey;
}

function encrypt(plaintext: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key(), iv);
	const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64url");
}

function decrypt(payload: string): string {
	const buf = Buffer.from(payload, "base64url");
	const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
	decipher.setAuthTag(buf.subarray(12, 28));
	return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

function encodeState(returnUrl: string, nonce: string): string {
	return encrypt(JSON.stringify({ r: returnUrl, n: nonce, e: Date.now() + STATE_TTL }));
}

function decodeState(state: string): { returnUrl: string; nonce: string } {
	const { r, n, e } = JSON.parse(decrypt(state)) as { r: string; n: string; e: number };
	if (typeof e !== "number" || Date.now() > e) throw new Error("State expired");
	return { returnUrl: r, nonce: n };
}

// ── Cookie / token access ────────────────────────────────────────────────────────────────────────

function readCookie(header: string | null, name: string): string | null {
	if (!header) return null;
	for (const part of header.split(";")) {
		const idx = part.indexOf("=");
		if (idx === -1) continue;
		if (part.slice(0, idx).trim() !== name) continue;
		return decodeURIComponent(part.slice(idx + 1).trim());
	}
	return null;
}

function cookie(name: string, value: string, maxAge: number): string {
	const parts = [
		`${name}=${encodeURIComponent(value)}`,
		"Path=/",
		`Max-Age=${maxAge}`,
		"SameSite=Lax",
		"HttpOnly",
	];
	if (process.env.NODE_ENV === "production") parts.push("Secure");
	return parts.join("; ");
}

/** Read + decrypt the reader's GitHub token from the request cookie. Passed to the adapter as `getToken`. */
export function getTokenFromRequest(request: CustomRequest): string | null {
	const header = request.headers.get("cookie");
	const value = readCookie(
		Array.isArray(header) ? (header[0] ?? null) : (header ?? null),
		TOKEN_COOKIE,
	);
	if (!value) return null;
	try {
		return decrypt(value);
	} catch {
		return null;
	}
}

// ── OAuth route handlers (login / callback / logout) ─────────────────────────────────────────────

const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_ACCESS_TOKEN = "https://github.com/login/oauth/access_token";
const CALLBACK_PATH = "/api/comments/oauth/callback";

function origin(request: Request): string {
	const h = request.headers;
	const proto = h.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
	const host = h.get("x-forwarded-host") ?? h.get("host") ?? new URL(request.url).host;
	return `${proto}://${host}`;
}

function sameOrigin(candidate: string | null, self: string): string {
	if (!candidate) return `${self}/`;
	try {
		const parsed = new URL(candidate, self);
		return parsed.origin === self ? parsed.href : `${self}/`;
	} catch {
		return `${self}/`;
	}
}

export function login(request: Request): NextResponse {
	const self = origin(request);
	const returnUrl = sameOrigin(new URL(request.url).searchParams.get("return"), self);
	const nonce = randomBytes(16).toString("base64url");
	const params = new URLSearchParams({
		client_id: process.env.GITHUB_CLIENT_ID ?? "",
		redirect_uri: `${self}${CALLBACK_PATH}`,
		scope: SCOPE,
		state: encodeState(returnUrl, nonce),
	});

	const response = NextResponse.redirect(`${GITHUB_AUTHORIZE}?${params.toString()}`);
	response.headers.append("Set-Cookie", cookie(STATE_COOKIE, nonce, STATE_TTL / 1000));
	return response;
}

export async function callback(request: Request): Promise<NextResponse> {
	const self = origin(request);
	const url = new URL(request.url);
	const state = url.searchParams.get("state");
	const nonce = readCookie(request.headers.get("cookie"), STATE_COOKIE);

	let returnUrl: string;
	try {
		if (!state) throw new Error("Missing state");
		const decoded = decodeState(state);
		// `state` is only CSRF protection if it is bound to the browser that started the flow.
		const sent = Buffer.from(decoded.nonce ?? "");
		const held = Buffer.from(nonce ?? "");
		if (sent.length !== held.length || !timingSafeEqual(sent, held)) {
			throw new Error("State mismatch");
		}
		// Re-check the origin: the return URL was captured when the flow started, from a request whose
		// forwarded headers this app does not control.
		returnUrl = sameOrigin(decoded.returnUrl, self);
	} catch {
		return NextResponse.json({ message: "Invalid or expired sign-in state" }, { status: 400 });
	}

	const code = url.searchParams.get("code");
	if (url.searchParams.get("error") || !code) {
		const response = NextResponse.redirect(returnUrl);
		response.headers.append("Set-Cookie", cookie(STATE_COOKIE, "", 0));
		return response;
	}

	let accessToken: string;
	try {
		const res = await fetch(GITHUB_ACCESS_TOKEN, {
			method: "POST",
			headers: { Accept: "application/json", "User-Agent": "fuma-comment-example" },
			body: new URLSearchParams({
				client_id: process.env.GITHUB_CLIENT_ID ?? "",
				client_secret: process.env.GITHUB_CLIENT_SECRET ?? "",
				code,
			}),
		});
		const data = (await res.json()) as { access_token?: string; error?: string };
		if (!data.access_token) throw new Error(data.error ?? "no access_token");
		accessToken = data.access_token;
	} catch {
		return NextResponse.json({ message: "GitHub sign-in failed" }, { status: 502 });
	}

	const response = NextResponse.redirect(returnUrl);
	response.headers.append("Set-Cookie", cookie(STATE_COOKIE, "", 0));
	response.headers.append("Set-Cookie", cookie(TOKEN_COOKIE, encrypt(accessToken), ONE_YEAR));
	return response;
}

export function logout(request: Request): NextResponse {
	const self = origin(request);
	const returnUrl = sameOrigin(new URL(request.url).searchParams.get("return"), self);
	const response = NextResponse.redirect(returnUrl);
	response.headers.append("Set-Cookie", cookie(TOKEN_COOKIE, "", 0));
	return response;
}
