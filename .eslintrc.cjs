module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', 'build', 'node_modules', 'client', 'sample-data', 'uploads', 'server/routes-simple.ts', 'server/storage.ts', 'server/vite.ts', 'tailwind.config.ts', 'server/adminAuth.js'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
  },
  overrides: [
    {
      files: ['server/**/*.{ts,tsx,js}'],
      plugins: ['import'],
      rules: {
        'import/extensions': 'off',
      },
    },
  ],
};
