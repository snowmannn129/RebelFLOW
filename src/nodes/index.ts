/**
 * index.ts
 * 
 * Main entry point for the node system.
 * Exports all node-related modules.
 */

// Base node interfaces and classes
export * from './base';

// Core node types
export * from './types';

// Node connection system
export * from './connection';

// Node validation mechanisms
export * from './validation';

// Import for default export
import * as base from './base';
import * as types from './types';
import * as connection from './connection';
import * as validation from './validation';

// Default export
export default {
  base,
  types,
  connection,
  validation
};
