module.exports = {
  extends: ["custom/react-internal"],
  overrides: [
    {
      files: ["postcss.config.js", "tailwind.config.js", "next.config.js"],
      env: {
        node: true,
      },
    },
  ],
  rules: {
    "@typescript-eslint/no-invalid-void-type": "off",
    // we have bundler and React.js to handle this
    "import/no-cycle": "warn",
    "tailwindcss/no-custom-classname": [
      "warn",
      {
        whitelist: ["is-editor-empty", "tiptap"],
      },
    ],
  },
};
