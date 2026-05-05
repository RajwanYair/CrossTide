# MCP Servers — CrossTide

This repository is compatible with VS Code's current MCP server model. No committed workspace `mcp.json` is required — developer-specific servers belong in the user profile.

## Placement Policy

| Server type                         | Where it lives                          |
| ----------------------------------- | --------------------------------------- |
| Shared across many projects         | User-profile `mcp.json` (not committed) |
| Team-shared, repo-specific          | `.vscode/mcp.json` (committed)          |
| Personal experiments / opt-in tools | User profile only                       |

## Recommended Server Types

| Server Type            | Good Fit Here | Notes                                                                        |
| ---------------------- | ------------- | ---------------------------------------------------------------------------- |
| GitHub                 | Yes           | PRs, issues, labels, release and review workflows                            |
| Fetch / web            | Yes           | Docs lookup, provider API reference, OpenAPI verification                    |
| Filesystem             | Yes           | Workspace-aware read/write during agent tasks                                |
| Playwright             | Optional      | Visual regression validation, screenshot workflows                           |
| GitKraken/GitLens      | Optional      | Cross-project branch, PR review, and "start work" flows                      |
| Cloudflare (Wrangler)  | Conditional   | Worker deployment, KV namespace inspection, D1 queries. Disabled by default. |
| Repo-specific internal | Conditional   | Commit only if the whole team needs the same config                          |

## MCP Capability Classes

When choosing a server, consider all five capability classes:

- **Tools** — callable functions surfaced to chat and agent execution
- **Resources** — read-only context attachments (files, URIs, database rows)
- **Prompts** — templated prompt scaffolds exposed by the server
- **Sampling / elicitation** — the server can request structured input mid-task
- **MCP apps** — inline-rendered UI in chat where supported by the host

### Transport Types

| Transport        | Use When                                              |
| ---------------- | ----------------------------------------------------- |
| `stdio`          | Local servers started by VS Code as a subprocess      |
| `sse`            | Legacy remote servers using Server-Sent Events        |
| `streamableHttp` | Modern remote servers — preferred for new deployments |

Prefer `streamableHttp` for new remote MCP servers; `stdio` for local processes.

### Tool Discovery in Agents

When adding an agent (`.github/agents/*.agent.md`) that depends on MCP tools, list those tools in the agent's `tools:` allowlist under a comment. This makes the dependency visible without requiring the server to be running at edit time.

## Security Rules

- Never hardcode tokens or secrets in `mcp.json`.
- Prefer environment-backed values or secure input variables.
- Only trust and enable servers from known publishers.
- Use least privilege — if a server is not helping the current task, disable it.

## Windows Notes

This repository is developed primarily on Windows with PowerShell.

- Local MCP sandboxing is not available on Windows; account for this in tool trust decisions.
- If a local server needs shell commands, ensure configuration reflects PowerShell syntax.

## Operational Guidance

- Use the Chat Customizations editor to inspect which MCP servers are enabled.
- Use `MCP: List Servers` or the MCP section in Extensions to start, stop, or inspect a server.
- Disabled servers do not load tools, resources, or prompts — keep enable/disable state user-specific.
