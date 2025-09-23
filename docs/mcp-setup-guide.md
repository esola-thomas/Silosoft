# MCP Server Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- Claude Code configured
- Git repository initialized

## 1. Install MCP Servers

```bash
# Install all required MCP servers
npm install -g @modelcontextprotocol/server-github
npm install -g mcp-server-sqlite
npm install -g @modelcontextprotocol/server-filesystem
npm install -g mcp-server-git
npm install -g editorconfig-mcp
```

## 2. GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic) with scopes:
   - `repo` (Full control of private repositories)
   - `issues` (Read/write access to issues)
   - `actions` (Read access to Actions)
3. Copy the token
4. Update `.mcp.json`:
   ```json
   "env": {
     "GITHUB_PERSONAL_ACCESS_TOKEN": "your_actual_token_here"
   }
   ```

## 3. Database Setup

```bash
# Create database directory
mkdir -p ./backend/data

# Initialize SQLite database (optional - will be created automatically)
sqlite3 ./backend/data/silosoft.db "CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY);"
```

## 4. Project Structure Validation

Ensure these directories exist:
```bash
mkdir -p ./backend/src
mkdir -p ./frontend/src
mkdir -p ./shared
mkdir -p ./specs
```

## 5. EditorConfig Setup

Create `.editorconfig` in project root:
```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

## 6. Restart Claude Code

After all configuration changes, restart Claude Code to activate MCP servers.

## 7. Test MCP Integration

Try these commands with an agent:
- "Show me the current repository status" (GitHub MCP)
- "List all files in the backend directory" (File System MCP)
- "Check the Git commit history" (Git MCP)
- "Analyze the database schema" (SQLite MCP)

## Troubleshooting

### Common Issues
- **GitHub authentication failed**: Check token scopes and expiration
- **Database not found**: Verify path in `.mcp.json` matches actual location
- **Permission denied**: Ensure directories have proper read/write permissions
- **Server not responding**: Restart Claude Code and check MCP server logs

### Verification Commands
```bash
# Test if servers are installed
npx @modelcontextprotocol/server-github --version
npx mcp-server-sqlite --help
npx @modelcontextprotocol/server-filesystem --help
npx mcp-server-git --help
npx editorconfig-mcp --help
```

✅ **Setup Complete**: Your MCP servers are now ready for enhanced AI-assisted development!