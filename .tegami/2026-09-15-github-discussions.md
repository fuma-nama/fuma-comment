---
packages:
  "npm:@fuma-comment/server": minor
---

### Add GitHub Discussions adapter

Store comments in GitHub Discussions via `@fuma-comment/server/adapters/github-discussions`. GitHub is the
store, the moderation, and the identity, so there's no database and no separate auth — a good fit for a docs
site or blog. `createGithubDiscussionsAdapter` returns both `storage` and `auth` (spread into `NextComment`);
it's auth-agnostic through a `getToken(request)` callback, and supports `@mention` autocomplete via
`repository.mentionableUsers`.

`marked` is an optional peer dependency, used to convert stored Markdown back into the editor's content.
