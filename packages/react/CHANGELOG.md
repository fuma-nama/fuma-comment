# @fuma-comment/react

## 1.1.0

### Patch Changes

- c8e8cc0: Improve UI

## 1.0.0

### Major Changes

- 29025f4: Migrate to Tailwind CSS v4

  Use it like:

  ```css
  @import "tailwindcss";
  @import "@fuma-comment/react/preset.css";

  /* path of `@fuma-comment/react` relative to the CSS file */
  @source '../node_modules/@fuma-comment/react/dist/**/*.js';
  ```

## 0.6.0

### Minor Changes

- 878ca15: Combine `StorageProvider` into `CommentsProvider`
- 878ca15: Support comment mentions
- 878ca15: Change usage of `CustomComment`

## 0.5.0

### Minor Changes

- 5787885: Require `width` and `height` on uploaded image

### Patch Changes

- 89ad865: Reduce re-renderings
- 5787885: Support custom image renderers

## 0.4.2

### Patch Changes

- 811c1dc: Optimize performance

## 0.4.1

### Patch Changes

- f03423a: Lazy load editor component

## 0.4.0

### Minor Changes

- b45a063: Support Roles
- b45a063: Make the `page` parameter required on all API endpoints

## 0.3.1

### Patch Changes

- c329a6e: Bump deps

## 0.3.0

### Minor Changes

- 56e6e1a: Change the time sorting of replies

## 0.2.0

### Minor Changes

- 4e9b6b8: Support Tailwind CSS presets
- f3fcb1d: Improve render logic

## 0.1.1

### Patch Changes

- 2ca6406: Fix conflicting prefixes

## 0.1.0

### Minor Changes

- 60bf12f: Support image uploading
- d52b02c: Support rich text editor
