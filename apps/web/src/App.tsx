/**
 * TMC Studio - Main App Component
 * Thin composition shell - all logic extracted to AppShell and BoardPage
 * 
 * PR-REFACTOR-11.5: App.tsx reduced from ~1300 lines to ~20 lines
 */

import { AppShell } from './app/AppShell';

/**
 * App entry point - pure composition only
 * All global concerns handled by AppShell:
 * - Auth modals
 * - Billing modals
 * - Projects drawer
 * - Settings
 * - Footer
 * 
 * All board concerns handled by BoardPage (via AppShell):
 * - TopBar
 * - Canvas
 * - Inspector
 * - Steps bar
 * - Command palette
 */
export default function App() {
  return <AppShell />;
}
