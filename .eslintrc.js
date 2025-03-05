module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Disable unused variables warning
    '@typescript-eslint/no-unused-vars': 'off',
    
    // Disable explicit any warnings
    '@typescript-eslint/no-explicit-any': 'off',
    
    // You can add other rule overrides as needed
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-empty-interface': 'off'
  }
};
