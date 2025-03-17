# RebelFlow - Node-Based Automation & Workflow Tool

## Project Overview
RebelFlow is a modular, visual workflow automation tool designed for CAD, game development, and scripting. Users can create, manage, and automate processes using a node-based interface.

## Folder Structure
```
RebelFlow/
├── src/                    # Source code for RebelFlow
│   ├── core/               # Core functionality (workflow execution)
│   ├── nodes/              # Node system (different types of automation nodes)
│   ├── ui/                 # User interface components
│   ├── backend/            # Backend logic for node execution
│   ├── scripts/            # User-created scripts for automation
│   ├── plugins/            # External plugins support
│   ├── tests/              # Unit tests
│   ├── utils/              # Utility functions
│   └── config/             # Configuration files
├── docs/                   # Documentation and guides
│   ├── README.md           # Overview of the project
│   ├── API.md              # API documentation
│   ├── INSTALL.md          # Installation guide
│   ├── USAGE.md            # How to use RebelFlow
│   └── ROADMAP.md          # Future feature plans
├── assets/                 # Icons, UI elements, images
├── examples/               # Example workflows and scripts
├── tests/                  # Automated tests for stability
└── package.json            # Project dependencies (if using Node.js)
```

## Tech Stack
- **Frontend (UI):** Electron + React (for cross-platform UI)
- **Backend:** Python (for automation engine) or TypeScript
- **Database:** SQLite or JSON-based storage (for workflow saving)
- **Scripting Engine:** Python, JavaScript, or Lua support

## Initial Features
- **Node-based visual editor** – Drag-and-drop interface for workflow creation.
- **Custom script execution** – Allows users to connect nodes for automation.
- **Plugin-based system** – Users can extend functionality with custom scripts.
- **Live execution preview** – See how workflows execute in real-time.
- **Cross-platform compatibility** – Desktop app (Windows/Linux/Mac).

## Next Steps
1. Define core automation nodes and execution engine.
2. Implement UI framework for node-based workflow creation.
3. Develop backend logic for executing node-based workflows.
4. Integrate plugin support for expanding automation capabilities.
5. Upload example workflows for testing and refinement.
