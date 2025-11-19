/**
 * Configuration file structure for Fabriqa Markdown Editor
 * Located at .vscode/markdown-extension-config.json
 */

export interface MarkdownConfig {
  sections: ConfigSection[];
}

export interface ConfigSection {
  id: string;
  title: string;
  collapsed?: boolean;
  files: string[];
  description?: string;
}

export interface ValidatedConfig {
  sections: ValidatedSection[];
  errors: ConfigError[];
}

export interface ValidatedSection {
  id: string;
  title: string;
  collapsed: boolean;
  files: ResolvedFile[];
  description?: string;
}

export interface ResolvedFile {
  relativePath: string;
  absolutePath: string;
  exists: boolean;
  displayName: string;
}

export interface ConfigError {
  section?: string;
  file?: string;
  message: string;
  type: 'warning' | 'error';
}

/**
 * Default configuration sections based on the spec
 */
export const DEFAULT_SECTIONS: ConfigSection[] = [
  {
    id: 'specs',
    title: 'SPECS',
    collapsed: false,
    files: [],
    description: 'Build complex features with structured planning'
  },
  {
    id: 'agent-hooks',
    title: 'AGENT HOOKS',
    collapsed: false,
    files: [],
    description: 'Automate repetitive tasks with smart triggers'
  },
  {
    id: 'agent-steering',
    title: 'AGENT STEERING',
    collapsed: false,
    files: [],
    description: 'Guide agent behavior and responses'
  },
  {
    id: 'mcp-servers',
    title: 'MCP SERVERS',
    collapsed: false,
    files: [],
    description: 'Connect external tools and data sources'
  }
];
