# RebelFlow

RebelFlow is a powerful node-based automation tool designed for CAD, game development, and scripting workflows. It provides a visual programming interface that allows users to create complex automation pipelines without writing code.

![RebelFlow Logo](assets/logo.png) <!-- To be added later -->

## Features

- **Visual Node-Based Editor**: Create workflows by connecting nodes in a visual canvas
- **Multi-Domain Automation**: Support for CAD operations, game development tasks, and general scripting
- **Extensible Architecture**: Plugin system for adding custom nodes and functionality
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Script Integration**: Execute Python, JavaScript, and Lua scripts within workflows
- **Real-Time Preview**: See your workflow results as you build
- **Version Control**: Track changes and collaborate with others

## Project Status

RebelFlow is currently in early development. We are focusing on building the core infrastructure and basic functionality.

- **Current Phase**: Core Infrastructure Development
- **Active Module**: Core (Event System)
- **Next Milestone**: Basic Node System Implementation

See [NEXT_STEPS.md](development/NEXT_STEPS.md) for detailed development roadmap.

## Development

### Project Structure

```
RebelFlow/
├── src/                    # Source code
│   ├── core/               # Core functionality (workflow execution)
│   ├── nodes/              # Node system (different types of automation nodes)
│   ├── ui/                 # User interface components
│   ├── backend/            # Backend logic for node execution
│   ├── scripts/            # User-created scripts for automation
│   ├── plugins/            # External plugins support
│   ├── tests/              # Unit tests
│   ├── utils/              # Utility functions
│   └── config/             # Configuration files
├── development/            # Development tracking and documentation
│   ├── CURRENT_MODULE.md   # Currently active module
│   ├── CURRENT_FEATURE.md  # Feature being implemented
│   ├── NEXT_STEPS.md       # Development roadmap
│   └── CONTEXT_NOTES.md    # Development context for continuity
└── docs/                   # Documentation
    ├── api/                # API documentation
    ├── user-guide/         # User guides and tutorials
    └── development/        # Development guidelines
```

### Development Approach

RebelFlow follows a modular development approach with test-driven development practices:

1. **Module Independence**: Each module is self-contained with clear interfaces
2. **Test-Driven Development**: Tests are written before implementation
3. **Documentation First**: APIs and interfaces are documented before coding
4. **Incremental Development**: Features are built in small, testable increments

## Getting Started

*Coming soon - The project is in early development and not yet ready for use.*

## License

*To be determined*

## Contributing

*Contribution guidelines will be added as the project matures.*
