/**
 * index.ts
 * 
 * Main entry point for the RebelFlow library.
 * Exports all modules for easy importing.
 */

// Export core module
export * as core from './core';

// Export nodes module
export * as nodes from './nodes';

// Re-export for convenience
import core from './core';
import nodes from './nodes';

// Default export for the library
export default {
  core,
  nodes
};
