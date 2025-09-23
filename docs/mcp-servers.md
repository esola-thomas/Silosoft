# MCP Servers Documentation for Silosoft Card Game

**Last Updated**: 2025-09-15
**Project**: Silosoft
**MCP Version**: 2025 Standard

## Overview

This document describes the Model Context Protocol (MCP) server configuration for the Silosoft card game project. MCP servers provide AI agents with enhanced capabilities for repository management, database operations, file system access, and development workflow automation.

## Configured MCP Servers

### 1. GitHub Server (High Priority)
**Purpose**: Official GitHub integration for repository management and CI/CD workflows

**Configuration**:
```json
"github": {
  "command": "npx",
  "args": ["@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "github_pat_placeholder"
  }
}
```

**Capabilities**:
- Repository browsing and code analysis
- Issue and PR management automation
- GitHub Actions workflow monitoring
- Code security scanning integration
- Automated commit message generation

**Setup Instructions**:
1. Create a GitHub Personal Access Token with `repo`, `issues`, and `actions` scopes
2. Replace `github_pat_placeholder` in `.mcp.json` with your actual token
3. Restart Claude Code to activate the server

**Usage Examples**:
- "Analyze the current PR for performance impacts"
- "Create an issue for the card validation bug"
- "Check the status of GitHub Actions for the latest commit"

### 2. SQLite Server (High Priority)
**Purpose**: Database management for game state and card definitions

**Configuration**:
```json
"sqlite": {
  "command": "npx",
  "args": [
    "mcp-server-sqlite",
    "--db-path",
    "./backend/data/silosoft.db"
  ]
}
```

**Capabilities**:
- Direct database schema exploration
- Game state debugging and analysis
- Card data validation and management
- Performance query analysis
- Database migration assistance

**Setup Instructions**:
1. Ensure SQLite database exists at `./backend/data/silosoft.db`
2. Install the MCP SQLite server: `npm install -g mcp-server-sqlite`
3. Database will be created automatically if it doesn't exist

**Usage Examples**:
- "Show me the current game state for game ID 12345"
- "Analyze the performance of card lookup queries"
- "Validate that all feature cards have proper requirements"

### 3. File System Server (Medium Priority)
**Purpose**: Enhanced file management for game assets and configuration

**Configuration**:
```json
"filesystem": {
  "command": "npx",
  "args": [
    "@modelcontextprotocol/server-filesystem",
    "./backend",
    "./frontend",
    "./shared",
    "./specs"
  ]
}
```

**Capabilities**:
- Advanced file operations across project directories
- Automated asset organization
- Configuration file management
- Batch operations on game data files
- File pattern analysis and validation

**Setup Instructions**:
1. Install the MCP filesystem server: `npm install -g @modelcontextprotocol/server-filesystem`
2. Directories are automatically accessible as configured
3. Permissions are limited to specified directories for security

**Usage Examples**:
- "Organize all card definition files in the shared directory"
- "Find all React components that need PropTypes validation"
- "Update all configuration files with the new database path"

### 4. Git Server (Medium Priority)
**Purpose**: Enhanced Git operations and version control

**Configuration**:
```json
"git": {
  "command": "npx",
  "args": ["mcp-server-git"]
}
```

**Capabilities**:
- Automated commit message generation
- Branch management for feature development
- Conflict resolution assistance
- Version tracking for game mechanics
- Release preparation automation

**Setup Instructions**:
1. Install the MCP Git server: `npm install -g mcp-server-git`
2. Ensure Git is properly configured in your repository
3. Server automatically detects the current Git repository

**Usage Examples**:
- "Create a feature branch for the new card shuffling algorithm"
- "Generate a commit message for the recent game engine changes"
- "Help resolve the merge conflict in the GameState model"

### 5. EditorConfig Server (Low Priority)
**Purpose**: Consistent code formatting across the React/Express codebase

**Configuration**:
```json
"editorconfig": {
  "command": "npx",
  "args": ["editorconfig-mcp"]
}
```

**Capabilities**:
- Automated code formatting
- Style consistency enforcement
- Integration with existing ESLint/Prettier setup
- Project-wide formatting validation

**Setup Instructions**:
1. Install the EditorConfig MCP server: `npm install -g editorconfig-mcp`
2. Ensure `.editorconfig` file exists in project root
3. Configure formatting rules for JavaScript/TypeScript files

**Usage Examples**:
- "Format all JavaScript files according to our style guide"
- "Validate that all new components follow our formatting rules"
- "Apply consistent indentation across the entire codebase"

## Agent Integration

### Updated Agents with MCP Access

#### Frontend Integration Specialist
**MCP Tools**: GitHub, File System, EditorConfig
**Enhanced Capabilities**:
- Direct repository management for frontend development
- Advanced component organization and asset management
- Automated code formatting for consistent styling

#### DevOps Deployment Specialist
**MCP Tools**: GitHub, File System, Git
**Enhanced Capabilities**:
- GitHub Actions CI/CD automation
- Infrastructure as Code version control
- Deployment artifact management

#### Performance Testing Specialist
**MCP Tools**: GitHub, SQLite
**Enhanced Capabilities**:
- Automated performance test execution in GitHub Actions
- Direct database performance analysis
- Performance regression detection in PR reviews

#### Project Architect
**MCP Tools**: GitHub, File System, Git
**Enhanced Capabilities**:
- Repository-wide architectural analysis
- Cross-file dependency mapping
- Technical debt identification through Git history

## Security Considerations

### Token Management
- Store GitHub PAT in environment variables, not in version control
- Use minimal required scopes for GitHub token
- Rotate tokens regularly (every 90 days recommended)

### File System Access
- MCP filesystem server is limited to specified directories
- Cannot access system files or files outside project scope
- All file operations are logged for audit purposes

### Database Security
- SQLite database contains only game data, no sensitive information
- Database file should be included in backup strategies
- Consider encryption for production deployments

## Troubleshooting

### Common Issues

#### GitHub Server Not Connecting
**Symptoms**: "GitHub server unavailable" or authentication errors
**Solutions**:
1. Verify GitHub PAT is correctly set in `.mcp.json`
2. Check token permissions include required scopes
3. Ensure token hasn't expired
4. Restart Claude Code after configuration changes

#### SQLite Database Errors
**Symptoms**: "Database not found" or connection errors
**Solutions**:
1. Verify database path in `.mcp.json` is correct
2. Ensure directory exists and has write permissions
3. Check SQLite is installed on system
4. Create database manually if needed: `sqlite3 ./backend/data/silosoft.db`

#### File System Permission Errors
**Symptoms**: "Access denied" or "Directory not found"
**Solutions**:
1. Verify directories exist and are accessible
2. Check file/directory permissions
3. Ensure paths in `.mcp.json` are correct and absolute
4. Restart Claude Code after path changes

### Performance Optimization

#### MCP Server Response Times
- GitHub server: 200-500ms typical response time
- SQLite server: 50-100ms for simple queries
- File system server: 100-200ms for file operations
- Git server: 200-300ms for repository operations

#### Optimization Tips
1. Use specific queries rather than broad searches
2. Limit file system operations to necessary directories
3. Cache frequently accessed data when possible
4. Monitor MCP server logs for performance insights

## Development Workflow Integration

### Recommended Usage Patterns

#### Feature Development Workflow
1. **Planning**: Use Project Architect with GitHub/Git MCP for architectural analysis
2. **Implementation**: Use Frontend/DevOps agents with File System MCP for development
3. **Testing**: Use Performance Testing agent with SQLite/GitHub MCP for validation
4. **Deployment**: Use DevOps agent with GitHub/Git MCP for release management

#### Code Review Process
1. Automated formatting with EditorConfig MCP
2. Performance analysis with SQLite MCP
3. GitHub PR integration for automated checks
4. Git history analysis for impact assessment

#### Bug Investigation
1. Database analysis with SQLite MCP for game state issues
2. File system search with File System MCP for related code
3. GitHub issue tracking for bug lifecycle management
4. Git history analysis for regression identification

## Future Enhancements

### Planned Additions
- **Testing MCP Server**: Automated test execution and reporting
- **Deployment MCP Server**: Direct deployment management
- **Monitoring MCP Server**: Real-time application monitoring integration

### Configuration Evolution
- OAuth integration for enhanced GitHub security
- Multi-database support for production scaling
- Custom MCP servers for game-specific operations

---

**For Support**: Check GitHub issues or contact the development team
**Documentation Version**: 1.0.0
**Next Review**: 2025-10-15