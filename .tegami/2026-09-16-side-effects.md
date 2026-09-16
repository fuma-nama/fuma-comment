---
packages:
  "npm:@fuma-comment/server": patch
  "npm:@fuma-comment/react": patch
  "npm:@fuma-comment/next": patch
  "npm:@fuma-comment/github-discussions": patch
---

### Declare `sideEffects` for better tree-shaking

All packages now declare `sideEffects` in their `package.json`, so bundlers can drop unused imports
instead of keeping every module alive.
