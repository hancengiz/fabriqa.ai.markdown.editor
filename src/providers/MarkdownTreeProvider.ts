import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigManager } from '../config/ConfigManager';
import { ValidatedSection, ResolvedFile } from '../config/types';
import { Logger } from '../utils/Logger';

/**
 * Tree item types for the sidebar
 */
export type TreeItemType = 'section' | 'file' | 'description';

/**
 * Custom tree item with additional metadata
 */
export class MarkdownTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: TreeItemType,
    public readonly section?: ValidatedSection,
    public readonly file?: ResolvedFile
  ) {
    super(label, collapsibleState);
    this.contextValue = itemType;

    // Set icon and appearance based on type
    if (itemType === 'section') {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.tooltip = section?.description || label;
    } else if (itemType === 'file') {
      this.iconPath = new vscode.ThemeIcon('markdown');
      this.tooltip = file?.relativePath;
      this.resourceUri = file ? vscode.Uri.file(file.absolutePath) : undefined;

      // Make file clickable - open with Fabriqa editor
      if (file) {
        this.command = {
          command: 'fabriqa.openMarkdownEditor',
          title: 'Open with Fabriqa Editor',
          arguments: [file.absolutePath]
        };
      }

      // Show warning for non-existent files
      if (file && !file.exists) {
        this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('errorForeground'));
        this.tooltip = `File not found: ${file.relativePath}`;
      }
    } else if (itemType === 'description') {
      this.iconPath = new vscode.ThemeIcon('info');
    }
  }
}

/**
 * TreeView provider for the Fabriqa sidebar
 */
export class MarkdownTreeProvider implements vscode.TreeDataProvider<MarkdownTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<MarkdownTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private configManager: ConfigManager) {}

  /**
   * Refresh the tree view
   */
  public refresh(): void {
    Logger.info('Refreshing tree view');
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get tree item for display
   */
  public getTreeItem(element: MarkdownTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children of a tree item
   */
  public async getChildren(element?: MarkdownTreeItem): Promise<MarkdownTreeItem[]> {
    if (!element) {
      // Root level - return sections
      return this.getSections();
    }

    // If element is a section, return its files
    if (element.itemType === 'section' && element.section) {
      return this.getFilesForSection(element.section);
    }

    return [];
  }

  /**
   * Get all sections from config
   */
  private getSections(): MarkdownTreeItem[] {
    const config = this.configManager.getConfig();

    return config.sections.map(section => {
      const collapsibleState = section.collapsed
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.Expanded;

      return new MarkdownTreeItem(
        section.title,
        collapsibleState,
        'section',
        section
      );
    });
  }

  /**
   * Get files for a specific section
   */
  private getFilesForSection(section: ValidatedSection): MarkdownTreeItem[] {
    const items: MarkdownTreeItem[] = [];

    // Add files
    for (const file of section.files) {
      const fileItem = new MarkdownTreeItem(
        file.displayName,
        vscode.TreeItemCollapsibleState.None,
        'file',
        section,
        file
      );
      items.push(fileItem);
    }

    // If no files, show a placeholder
    if (section.files.length === 0) {
      const emptyItem = new MarkdownTreeItem(
        'No files in this section',
        vscode.TreeItemCollapsibleState.None,
        'description',
        section
      );
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      emptyItem.contextValue = 'empty';
      items.push(emptyItem);
    }

    return items;
  }

  /**
   * Get parent of a tree item
   */
  public getParent(element: MarkdownTreeItem): vscode.ProviderResult<MarkdownTreeItem> {
    if (element.itemType === 'file' || element.itemType === 'description') {
      // Parent is the section
      if (element.section) {
        const collapsibleState = element.section.collapsed
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.Expanded;

        return new MarkdownTreeItem(
          element.section.title,
          collapsibleState,
          'section',
          element.section
        );
      }
    }
    return null;
  }
}
