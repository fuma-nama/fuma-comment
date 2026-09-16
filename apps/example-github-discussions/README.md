# Example: GitHub Discussions

Comments stored in **GitHub Discussions** via
[`@fuma-comment/github-discussions`](../../packages/github-discussions).
No database and no separate auth: GitHub is the store, the moderation, and the identity. Readers sign in
with their own GitHub account and comment, reply, and react; each page maps to one Discussion.

## Setup

1. A **public** repo with **Discussions enabled** and a category for comments.
2. A **GitHub OAuth App** whose callback is `<your-origin>/api/comments/oauth/callback` (add
   `http://localhost:3000/...` for local dev).
3. Get the repo + category node ids:
   ```bash
   gh api graphql -f query='{ repository(owner:"you", name:"repo"){ id discussionCategories(first:25){nodes{ id name }} } }'
   ```
4. Copy `.env.example` to `.env.local` and fill it in.
5. `pnpm dev` and open http://localhost:3000.

## How it's wired

- `lib/comment.config.ts` — builds the adapter (`createGithubDiscussionsAdapter`) from env. It's both the
  storage and the auth provider; you only supply `getToken` (how to read the reader's GitHub token).
- `app/api/comments/[...comment]/route.ts` — mounts `NextComment` with the adapter, `role: "database"`
  (so `ownerLogins` can moderate), and `mention: { enabled: true }`.
- `lib/github-oauth.ts` + `app/api/comments/oauth/*` — a reference GitHub OAuth flow that stores the
  reader's token in an httpOnly, encrypted cookie. The adapter core is auth-agnostic; swap this for your
  own GitHub sign-in if you already have one.
- `app/page.client.tsx` — the `<Comments>` widget.

The adapter converts between the editor's content and GitHub-flavored Markdown; `marked` (its only dependency) handles the parse direction.
