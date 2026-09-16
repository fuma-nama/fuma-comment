---
packages:
  "npm:@fuma-comment/github-discussions": minor
---

### New package: GitHub Discussions adapter

Store comments in GitHub Discussions via `@fuma-comment/github-discussions`. GitHub is the store, the
moderation, and the identity, so there's no database and no separate auth — a good fit for a docs site or
blog. `createGithubDiscussionsAdapter` returns both `storage` and `auth` (spread into `NextComment`); it's
auth-agnostic through a `getToken(request)` callback, and supports `@mention` autocomplete via
`repository.mentionableUsers`.

Comments round-trip between the editor's content and GitHub-flavored Markdown. Headings, lists and quotes
authored on GitHub degrade to paragraphs, and images without dimensions become links, since the editor
cannot represent them.
