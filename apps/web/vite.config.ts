/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { contentSecurityPolicy } from './csp';

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  test: {
    name: 'web',
    environment: 'jsdom',
    // Os testes de contraste leem as cores declaradas em global.css.
    css: { include: [/global\.css/] },
  },
});
