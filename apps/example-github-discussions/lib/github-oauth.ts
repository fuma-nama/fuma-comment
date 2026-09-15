import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { CustomRequest } from "@fuma-comment/server/custom";

/**
 * Reference GitHub OAuth flow for the demo. The adapter itself is auth-agnostic: it just needs a
 * `getToken(request)` that returns the signed-in reader's GitHub token. Here we implement that with a
 * standard OAuth web flow, storing the token in an httpOnly, AES-256-GCM-encrypted cookie so it never
 * reaches the browser. Bring your own auth in a real app if you already have GitHub sign-in.
 */

const COOKIE = "fc_gh_token";
const SCOPE = "public_repo"; // lets the reader create/comment on discussions in a public repo
const ONE_YEAR = 60 * 60 * 24 * 365;

function secret(): string {
	return process.env.GITHUB_TOKEN_SECRET ?? "";
}

// ── AES-256-GCM (base64url of iv|tag|ciphertext) ─────────────────────────────────────────────────

function key(): Buffer {
	return createHash("sha256").update(secret()).digest();
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

function encodeState(returnUrl: string): string {
	return encrypt(JSON.stringify({ r: returnUrl, e: Date.now() + 10 * 60 * 1000 }));
}

function decodeState(state: string): string {
	const { r, e } = JSON.parse(decrypt(state)) as { r: string; e: number };
	if (typeof e !== "number" || Date.now() > e) throw new Error("State expired");
	return r;
}

// ── Cookie / token access ────────────────────────────────────────────────────────────────────────

function headerValue(v: string | readonly string[] | undefined): string | null {
	if (v == null) return null;
	return Array.isArray(v) ? (v[0] ?? null) : (v as string);
}

/** Read + decrypt the reader's GitHub token from the request cookie. Passed to the adapter as `getToken`. */
export function getTokenFromRequest(request: CustomRequest): string | null {
	const header = headerValue(request.headers.get("cookie"));
	if (!header) return null;
	for (const part of header.split(";")) {
		const idx = part.indexOf("=");
		if (idx === -1) continue;
		if (part.slice(0, idx).trim() !== COOKIE) continue;
		try {
			return decrypt(decodeURIComponent(part.slice(idx + 1).trim()));
		} catch {
			return null;
		}
	}
	return null;
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

function cookie(value: string, maxAge: number): string {
	const parts = [
		`${COOKIE}=${encodeURIComponent(value)}`,
		"Path=/",
		`Max-Age=${maxAge}`,
		"SameSite=Lax",
		"HttpOnly",
	];
	if (process.env.NODE_ENV === "production") parts.push("Secure");
	return parts.join("; ");
}

export function login(request: Request): NextResponse {
	const self = origin(request);
	const returnUrl = sameOrigin(new URL(request.url).searchParams.get("return"), self);
	const params = new URLSearchParams({
		client_id: process.env.GITHUB_CLIENT_ID ?? "",
		redirect_uri: `${self}${CALLBACK_PATH}`,
		scope: SCOPE,
		state: encodeState(returnUrl),
	});
	return NextResponse.redirect(`${GITHUB_AUTHORIZE}?${params.toString()}`);
}

export async function callback(request: Request): Promise<NextResponse> {
	const self = origin(request);
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");

	let returnUrl = `${self}/`;
	if (state) {
		try {
			returnUrl = decodeState(state);
		} catch {
			return NextResponse.json({ message: "Invalid or expired sign-in state" }, { status: 400 });
		}
	}
	if (url.searchParams.get("error") || !code) return NextResponse.redirect(returnUrl);

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
	response.headers.append("Set-Cookie", cookie(encrypt(accessToken), ONE_YEAR));
	return response;
}

export function logout(request: Request): NextResponse {
	const self = origin(request);
	const returnUrl = sameOrigin(new URL(request.url).searchParams.get("return"), self);
	const response = NextResponse.redirect(returnUrl);
	response.headers.append("Set-Cookie", cookie("", 0));
	return response;
}
