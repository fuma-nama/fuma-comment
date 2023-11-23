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
  },
};
