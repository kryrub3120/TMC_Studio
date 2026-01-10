/**
 * Commitlint Configuration for TMC Studio
 * 
 * Enforces Conventional Commits specification:
 * https://www.conventionalcommits.org/
 * 
 * Format: <type>(<scope>): <subject>
 * 
 * Examples:
 *   feat(board): add zone ellipse shape
 *   fix(store): resolve undo memory leak
 *   refactor(app): extract keyboard shortcuts hook
 *   docs: update architecture documentation
 *   chore(deps): upgrade react to 18.3
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  
  rules: {
    // Type must be one of the following
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Formatting, missing semicolons, etc.
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding or updating tests
        'build',    // Changes to build system or dependencies
        'ci',       // CI configuration changes
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Reverts a previous commit
      ],
    ],
    
    // Scope should be one of our packages/areas
    'scope-enum': [
      1, // Warning only (optional but recommended)
      'always',
      [
        // Packages
        'core',
        'board',
        'ui',
        'presets',
        'web',
        
        // App areas
        'app',
        'store',
        'canvas',
        'animation',
        'export',
        'auth',
        'cloud',
        
        // Infrastructure
        'deps',
        'config',
        'ci',
        'netlify',
        'supabase',
      ],
    ],
    
    // Subject rules
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 72],
    
    // Header rules
    'header-max-length': [2, 'always', 100],
    
    // Body rules
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    
    // Footer rules
    'footer-leading-blank': [2, 'always'],
  },
};
