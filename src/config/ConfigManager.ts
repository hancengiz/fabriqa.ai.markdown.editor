import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '../utils/Logger';
import {
  MarkdownConfig,
  ValidatedConfig,
  ValidatedSection,
  ResolvedFile,
  ConfigError,
  DEFAULT_SECTIONS
} from './types';

export class ConfigManager {
  private config: ValidatedConfig;
  private configPath: string;
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = this.getWorkspaceRoot();
    this.configPath = this.getConfigFilePath();
    this.config = this.loadConfig();
  }

  /**
   * Get the workspace root directory
   */
  private getWorkspaceRoot(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder is open');
    }
    return workspaceFolders[0].uri.fsPath;
  }

  /**
   * Get the path to the config file
   */
  public getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Get the full path to the config file
   */
  private getConfigFilePath(): string {
    const configSetting = vscode.workspace.getConfiguration('fabriqa').get<string>('configFile');
    const relativePath = configSetting || '.vscode/markdown-extension-config.json';
    return relativePath;
  }

  /**
   * Load and validate the configuration file
   */
  private loadConfig(): ValidatedConfig {
    const absoluteConfigPath = path.join(this.workspaceRoot, this.configPath);

    // Check if config file exists
    if (!fs.existsSync(absoluteConfigPath)) {
      Logger.warn(`Config file not found at ${absoluteConfigPath}, using defaults`);
      return this.createDefaultConfig();
    }

    try {
      // Read and parse config file
      const fileContent = fs.readFileSync(absoluteConfigPath, 'utf-8');
      const rawConfig: MarkdownConfig = JSON.parse(fileContent);

      // Validate and resolve file paths
      return this.validateConfig(rawConfig);
    } catch (error) {
      Logger.error('Failed to load config file', error);
      vscode.window.showErrorMessage(
        `Failed to load Fabriqa config file: ${error}`
      );
      return this.createDefaultConfig();
    }
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): ValidatedConfig {
    return {
      sections: DEFAULT_SECTIONS.map(section => ({
        ...section,
        collapsed: section.collapsed ?? false,
        files: []
      })),
      errors: [{
        message: 'Config file not found, using default sections',
        type: 'warning'
      }]
    };
  }

  /**
   * Validate configuration and resolve file paths
   */
  private validateConfig(rawConfig: MarkdownConfig): ValidatedConfig {
    const errors: ConfigError[] = [];
    const validatedSections: ValidatedSection[] = [];

    if (!rawConfig.sections || !Array.isArray(rawConfig.sections)) {
      errors.push({
        message: 'Config must have a "sections" array',
        type: 'error'
      });
      return { sections: [], errors };
    }

    for (const section of rawConfig.sections) {
      // Validate section structure
      if (!section.id || !section.title) {
        errors.push({
          section: section.id || 'unknown',
          message: 'Section must have "id" and "title" fields',
          type: 'error'
        });
        continue;
      }

      if (!section.files || !Array.isArray(section.files)) {
        errors.push({
          section: section.id,
          message: 'Section must have a "files" array',
          type: 'error'
        });
        continue;
      }

      // Resolve file paths
      const resolvedFiles: ResolvedFile[] = [];
      for (const filePath of section.files) {
        const resolved = this.resolveFilePath(filePath);
        resolvedFiles.push(resolved);

        if (!resolved.exists) {
          errors.push({
            section: section.id,
            file: filePath,
            message: `File not found: ${filePath}`,
            type: 'warning'
          });
        }
      }

      validatedSections.push({
        id: section.id,
        title: section.title,
        collapsed: section.collapsed ?? false,
        files: resolvedFiles,
        description: section.description
      });
    }

    return {
      sections: validatedSections,
      errors
    };
  }

  /**
   * Resolve a relative file path to absolute and check if it exists
   */
  private resolveFilePath(relativePath: string): ResolvedFile {
    const absolutePath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(this.workspaceRoot, relativePath);

    const exists = fs.existsSync(absolutePath);
    const displayName = path.basename(relativePath, '.md');

    return {
      relativePath,
      absolutePath,
      exists,
      displayName
    };
  }

  /**
   * Get the current configuration
   */
  public getConfig(): ValidatedConfig {
    return this.config;
  }

  /**
   * Reload the configuration from disk
   */
  public reload(): void {
    Logger.info('Reloading configuration');
    this.config = this.loadConfig();

    if (this.config.errors.length > 0) {
      const errorCount = this.config.errors.filter(e => e.type === 'error').length;
      const warningCount = this.config.errors.filter(e => e.type === 'warning').length;

      if (errorCount > 0) {
        vscode.window.showErrorMessage(
          `Fabriqa config has ${errorCount} error(s) and ${warningCount} warning(s). Check output for details.`
        );
      } else if (warningCount > 0) {
        vscode.window.showWarningMessage(
          `Fabriqa config has ${warningCount} warning(s). Check output for details.`
        );
      }

      // Log all errors and warnings
      for (const error of this.config.errors) {
        const prefix = error.section ? `[${error.section}]` : '';
        const fileInfo = error.file ? ` ${error.file}:` : '';
        if (error.type === 'error') {
          Logger.error(`${prefix}${fileInfo} ${error.message}`);
        } else {
          Logger.warn(`${prefix}${fileInfo} ${error.message}`);
        }
      }
    }
  }

  /**
   * Create a new config file with default sections
   */
  public async createDefaultConfigFile(): Promise<void> {
    const absoluteConfigPath = path.join(this.workspaceRoot, this.configPath);
    const configDir = path.dirname(absoluteConfigPath);

    // Create .vscode directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Create default config
    const defaultConfig: MarkdownConfig = {
      sections: DEFAULT_SECTIONS
    };

    // Write to file
    fs.writeFileSync(
      absoluteConfigPath,
      JSON.stringify(defaultConfig, null, 2),
      'utf-8'
    );

    Logger.info(`Created default config file at ${absoluteConfigPath}`);
    vscode.window.showInformationMessage(
      'Created default Fabriqa configuration file'
    );

    // Reload config
    this.reload();
  }
}
