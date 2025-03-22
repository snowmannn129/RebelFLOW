# RebelFLOW Development Procedure

## Backup Standard

RebelFLOW follows the RebelSUITE backup standard. Backups are created after major milestones:
- Phase completions
- Release types (Alpha, Beta, Full)
- Major development advancements
- Scheduled dates

Backups are stored as ZIP files in `C:\Users\snowm\Desktop\VSCode\Backup` with the naming format:
`RebelFLOW_(mmddyyyy)_(current time).zip`

To create a backup, run:
```powershell
.\backup_project.ps1 -ProgramName "RebelFLOW" -MilestoneType "<milestone type>"
```

Backup history is documented below in chronological order.

## 1. Development Environment & Execution
- RebelFLOW is developed in VSCode on Windows 11 using PowerShell
- Built using TypeScript/JavaScript with Node.js and React
- All development follows a test-driven approach with rigorous validation
- All UI elements must be rigorously tested and functional before submission
- All modules must connect properly before requesting approval

## 2. Project Structure
RebelFLOW follows a modular structure:

```
RebelFLOW/
├── src/                 # Source code
│   ├── core/            # Core functionality
│   │   ├── event/       # Event system
│   │   ├── workflow/    # Workflow execution engine
│   │   ├── node/        # Node system architecture
│   │   ├── connection/  # Node connection system
│   │   ├── validation/  # Node validation mechanisms
│   ├── ui/              # User interface components
│   │   ├── canvas/      # Node editor canvas
│   │   ├── nodes/       # Node visualization components
│   │   ├── connections/ # Connection rendering system
│   │   ├── panels/      # UI panels
│   │   ├── properties/  # Node property editors
│   │   ├── themes/      # Theme support
│   ├── backend/         # Backend logic
│   │   ├── serialization/ # Workflow serialization/deserialization
│   │   ├── storage/     # Workflow storage system
│   │   ├── history/     # Execution history and logging
│   │   ├── validation/  # Workflow validation
│   ├── scripting/       # Scripting support
│   │   ├── python/      # Python script execution
│   │   ├── javascript/  # JavaScript/TypeScript support
│   │   ├── lua/         # Lua integration
│   ├── integration/     # Integration with other RebelSUITE components
│   │   ├── cad/         # RebelCAD integration
│   │   ├── engine/      # RebelENGINE integration
│   │   ├── code/        # RebelCODE integration
│   ├── utils/           # Utility functions
│   │   ├── logging/     # Logging utilities
│   │   ├── file/        # File operations
│   │   ├── math/        # Math utilities
│   ├── index.ts         # Program entry point
├── tests/               # Test files
│   ├── core/            # Core tests
│   ├── ui/              # UI tests
│   ├── backend/         # Backend tests
│   ├── scripting/       # Scripting tests
│   ├── integration/     # Integration tests
│   ├── utils/           # Utility tests
├── docs/                # Documentation
│   ├── core/            # Core documentation
│   ├── ui/              # UI documentation
│   ├── backend/         # Backend documentation
│   ├── scripting/       # Scripting documentation
│   ├── integration/     # Integration documentation
│   ├── api/             # API documentation
│   ├── user-guide/      # User guide
├── development/         # Development tools and scripts
│   ├── scripts/         # Development scripts
│   ├── templates/       # Code templates
│   ├── tools/           # Development tools
├── package.json         # Project configuration
├── tsconfig.json        # TypeScript configuration
├── jest.config.js       # Jest test configuration
├── .eslintrc.js         # ESLint configuration
├── RebelFLOW_Progress_Tracker.md  # Progress tracking
```

## 3. Functional Testing & UI Verification
RebelFLOW follows a rigorous testing process:

### Unit Tests for Core Components
- Each function/class must have unit tests before submission
- Tests should cover edge cases, exceptions, and normal behavior
- Store all test scripts in tests/ directory
- Use Jest for JavaScript/TypeScript testing

### UI Component Testing
- Ensure all buttons, menus, and inputs work
- Verify UI elements correctly trigger backend functions
- Use automated UI testing frameworks (e.g., Testing Library, Cypress)
- Create visual regression tests for UI components

### Integration Testing
- After every UI implementation:
  - Test every event handler (button clicks, keyboard shortcuts)
  - Ensure UI updates reflect backend actions
  - Simulate user input to test flow
  - Test node connections and workflow execution

### Functional Feature Testing
- Write test scenarios for every feature:
  - Node System: Test node creation, configuration, and deletion
  - Connection System: Test connecting nodes, validating connections
  - Workflow Execution: Test workflow execution with various node types
  - Scripting: Test script execution nodes with different languages
  - UI: Test canvas interaction, node placement, connection drawing

### Regression Testing
- Do not break previous features when adding new code
- Before approving new code, re-run all tests
- Maintain a test suite that can be run automatically

## 4. TypeScript/JavaScript Coding Standards & Best Practices
- Follow modern TypeScript/JavaScript conventions
- Use consistent naming conventions:
  - PascalCase for class names and React components
  - camelCase for function and variable names
  - UPPER_SNAKE_CASE for constants
- Each file should be ≤ 300-500 lines
- If a file exceeds this, split it into multiple modules
- Use JSDoc comments for all functions and classes

Example:
```typescript
/**
 * Creates a new workflow node of the specified type
 * @param nodeType - The type of node to create
 * @param position - The position on the canvas
 * @returns The created node
 */
function createNode(nodeType: NodeType, position: Vector2): Node {
    try {
        const node = new Node(nodeType, position);
        logger.debug(`Created node of type ${nodeType} at position (${position.x}, ${position.y})`);
        return node;
    } catch (error) {
        logger.error(`Failed to create node: ${error.message}`);
        throw error;
    }
}
```

- Use proper error handling:
```typescript
try {
    const workflow = await loadWorkflow(workflowId);
    return workflow;
} catch (error) {
    logger.error(`Failed to load workflow: ${error.message}`);
    return createEmptyWorkflow();
}
```

- Use logging instead of console statements:
```typescript
import { Logger } from '../utils/logging/logger';
const logger = new Logger('NodeSystem');
// ...
logger.debug('Node system initialized');
logger.error(`Failed to connect nodes: ${error.message}`);
```

## 5. Managing Development Complexity
- Only implement one feature/component per development session
- Keep functions short and modular
- Use TypeScript interfaces and types for better code organization
- Implement proper error handling and logging
- Track dependencies in package.json
- Use module bundlers (webpack, rollup) for optimized builds

## 6. Core Features & Modules
RebelFLOW has the following core modules:

### Core Module (src/core/)
- Event System
  - Event dispatching
  - Event listening
  - Event propagation
- Workflow Execution Engine
  - Node execution
  - Data flow management
  - Execution context
- Node System
  - Base node interfaces
  - Node type definitions
  - Node factories
- Connection System
  - Connection management
  - Data type validation
  - Connection routing
- Validation System
  - Node validation
  - Connection validation
  - Workflow validation

### UI Module (src/ui/)
- Canvas System
  - Node editor canvas
  - Zoom and pan functionality
  - Grid and snapping
- Node Visualization
  - Node rendering
  - Node interaction (select, move, resize)
  - Node styling
- Connection Visualization
  - Connection rendering
  - Connection interaction (create, delete)
  - Connection styling
- Property Editors
  - Node property editing
  - Type-specific editors
  - Validation feedback
- Panels and Layout
  - Node library panel
  - Properties panel
  - Workflow control panel
  - Layout management

### Backend Module (src/backend/)
- Serialization
  - Workflow serialization
  - Workflow deserialization
  - Version management
- Storage
  - Workflow storage
  - Workflow retrieval
  - Workflow management
- History and Logging
  - Execution history
  - Execution logging
  - Debugging information
- Validation
  - Workflow validation
  - Error reporting
  - Warning detection

### Scripting Module (src/scripting/)
- Python Integration
  - Python script execution
  - Python environment management
  - Python library integration
- JavaScript/TypeScript Integration
  - JS/TS script execution
  - Node.js integration
  - NPM package support
- Lua Integration
  - Lua script execution
  - Lua environment management
  - Lua library integration

### Integration Module (src/integration/)
- RebelCAD Integration
  - CAD model access
  - CAD operation automation
  - CAD event handling
- RebelENGINE Integration
  - Game logic automation
  - Asset processing
  - Build automation
- RebelCODE Integration
  - Code generation
  - Code analysis
  - Refactoring automation

## 7. Automation for Testing
- Run All Tests Automatically:
```powershell
npm test
```

- Run Tests with Coverage:
```powershell
npm run test:coverage
```

- Run UI Tests:
```powershell
npm run test:ui
```

- Run Linting:
```powershell
npm run lint
```

- Run Type Checking:
```powershell
npm run type-check
```

- Run End-to-End Tests:
```powershell
npm run test:e2e
```

## 8. Development Workflow
- Task Breakdown:
  1. Break large tasks into smaller steps
  2. Create detailed implementation plan
  3. Write tests first (Test-Driven Development)
  4. Implement the feature
  5. Verify with tests
  6. Document the implementation

- Approval Workflow:
  1. Generate code and tests
  2. Test thoroughly before requesting approval
  3. Ensure UI elements properly connect to the backend
  4. Once approved, update progress tracker
  5. Move to the next task

## 9. Best Practices for Development
- Use Git for version control:
```powershell
git add .
git commit -m "Implemented node connection validation system"
```

- Create GitHub issues for tracking:
```powershell
.\scripts\create_github_issue.ps1 -title "Fix performance issue in node rendering" -body "Node rendering becomes slow with large workflows" -labels "bug,performance,high-priority"
```

- Keep modules focused:
  - No single file should exceed 500 lines
  - Split complex functionality into multiple files
  - Use proper abstraction and encapsulation

- Ensure proper resource management:
  - Clean up event listeners
  - Dispose of resources when components unmount
  - Monitor memory usage

- Optimize performance:
  - Use efficient data structures
  - Implement virtualization for large node graphs
  - Use web workers for CPU-intensive tasks
  - Implement proper caching mechanisms

## 10. Progress Tracking
- Update RebelFLOW_Progress_Tracker.md after completing each task
- Run progress update script:
```powershell
.\scripts\update_progress.ps1
```

- Generate GitHub issues from progress tracker:
```powershell
.\scripts\generate_github_issues.ps1
```

- Update GitHub issues status:
```powershell
.\scripts\update_github_issues.ps1
```

## 11. Integration with RebelSUITE
- Define clear integration points with other RebelSUITE components:
  - RebelCAD: Automate CAD operations and workflows
  - RebelENGINE: Create game logic and asset processing pipelines
  - RebelCODE: Generate code and automate coding tasks
  - RebelDESK: Share common UI components and themes

- Implement shared data formats and APIs
- Create plugin interfaces for cross-application functionality
- Establish unified asset management across the suite

## Final Notes
- Your goal is to develop a comprehensive node-based automation tool
- Every UI element must be tested for functionality before requesting approval
- All features must be verified using unit, UI, and integration tests
- Do NOT generate untested or disconnected UI components
- DO ensure all modules connect properly before moving to the next task

## Backup: Development - 03/19/2025 03:14:56

* Backup created: RebelFLOW_03192025_031456.zip
* Location: C:\Users\snowm\Desktop\VSCode\Backup\RebelFLOW_03192025_031456.zip


## Backup: Development - 03/21/2025 18:13:14

* Backup created: RebelFLOW_03212025_181314.zip
* Location: C:\Users\snowm\Desktop\VSCode\Backup\RebelFLOW_03212025_181314.zip

