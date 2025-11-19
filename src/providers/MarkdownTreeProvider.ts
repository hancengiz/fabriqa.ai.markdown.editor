import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigManager } from '../config/ConfigManager';
import { ValidatedSection, ResolvedFile } from '../config/types';
import { Logger } from '../utils/Logger';

/**
 * Tree item types for the sidebar
 */
export type TreeItemType = 'section' | 'folder' | 'file' | 'description';

/**
 * Folder structure for organizing files
 */
interface FolderNode {
  name: string;
  path: string;
  files: ResolvedFile[];
  subfolders: Map<string, FolderNode>;
}

/**
 * Custom tree item with additional metadata
 */
export class MarkdownTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: TreeItemType,
    public readonly section?: ValidatedSection,
    public readonly file?: ResolvedFile,
    public readonly folderNode?: FolderNode
  ) {
    super(label, collapsibleState);
    this.contextValue = itemType;

    // Set icon and appearance based on type
    if (itemType === 'section') {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.tooltip = section?.description || label;
    } else if (itemType === 'folder') {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.tooltip = folderNode?.path || label;
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

    // If element is a section, return its files and folders
    if (element.itemType === 'section' && element.section) {
      return this.getFilesForSection(element.section);
    }

    // If element is a folder, return its contents
    if (element.itemType === 'folder' && element.folderNode && element.section) {
      return this.getFolderContents(element.folderNode, element.section);
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
   * Find common path prefix for all files
   */
  private findCommonPrefix(files: ResolvedFile[]): string {
    if (files.length === 0) {
      return '';
    }

    // Get all path parts for first file
    const firstParts = files[0].relativePath.split(path.sep);

    // Find how many parts are common to all files
    let commonDepth = 0;
    for (let i = 0; i < firstParts.length - 1; i++) {
      const part = firstParts[i];
      const allHavePart = files.every(file => {
        const parts = file.relativePath.split(path.sep);
        return parts.length > i && parts[i] === part;
      });

      if (allHavePart) {
        commonDepth = i + 1;
      } else {
        break;
      }
    }

    // Return common prefix
    if (commonDepth > 0) {
      return firstParts.slice(0, commonDepth).join(path.sep);
    }

    return '';
  }

  /**
   * Build folder hierarchy from flat file list
   */
  private buildFolderHierarchy(files: ResolvedFile[]): FolderNode {
    const root: FolderNode = {
      name: '',
      path: '',
      files: [],
      subfolders: new Map()
    };

    // Find and strip common prefix
    const commonPrefix = this.findCommonPrefix(files);
    const prefixLength = commonPrefix ? commonPrefix.length + 1 : 0;

    for (const file of files) {
      // Strip common prefix from path
      let relativePath = file.relativePath;
      if (prefixLength > 0) {
        relativePath = relativePath.substring(prefixLength);
      }

      const parts = relativePath.split(path.sep);

      // If file is at root level (after stripping prefix)
      if (parts.length === 1) {
        root.files.push(file);
        continue;
      }

      // Navigate/create folder structure
      let current = root;
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];

        if (!current.subfolders.has(folderName)) {
          const folderPath = parts.slice(0, i + 1).join(path.sep);
          current.subfolders.set(folderName, {
            name: folderName,
            path: folderPath,
            files: [],
            subfolders: new Map()
          });
        }

        current = current.subfolders.get(folderName)!;
      }

      // Add file to its parent folder
      current.files.push(file);
    }

    return root;
  }

  /**
   * Get files for a specific section (with folder hierarchy)
   */
  private getFilesForSection(section: ValidatedSection): MarkdownTreeItem[] {
    const items: MarkdownTreeItem[] = [];

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
      return items;
    }

    // Build folder hierarchy
    const root = this.buildFolderHierarchy(section.files);

    // Add root-level files
    for (const file of root.files) {
      const fileItem = new MarkdownTreeItem(
        file.displayName,
        vscode.TreeItemCollapsibleState.None,
        'file',
        section,
        file
      );
      items.push(fileItem);
    }

    // Add folders
    for (const [folderName, folderNode] of root.subfolders) {
      const folderItem = new MarkdownTreeItem(
        folderName,
        vscode.TreeItemCollapsibleState.Collapsed,
        'folder',
        section,
        undefined,
        folderNode
      );
      items.push(folderItem);
    }

    return items;
  }

  /**
   * Get contents of a folder
   */
  private getFolderContents(folder: FolderNode, section: ValidatedSection): MarkdownTreeItem[] {
    const items: MarkdownTreeItem[] = [];

    // Add files in this folder
    for (const file of folder.files) {
      const fileItem = new MarkdownTreeItem(
        file.displayName,
        vscode.TreeItemCollapsibleState.None,
        'file',
        section,
        file
      );
      items.push(fileItem);
    }

    // Add subfolders
    for (const [folderName, folderNode] of folder.subfolders) {
      const folderItem = new MarkdownTreeItem(
        folderName,
        vscode.TreeItemCollapsibleState.Collapsed,
        'folder',
        section,
        undefined,
        folderNode
      );
      items.push(folderItem);
    }

    return items;
  }

  /**
   * Get parent of a tree item
   */
  public getParent(element: MarkdownTreeItem): vscode.ProviderResult<MarkdownTreeItem> {
    if (element.itemType === 'file' || element.itemType === 'description' || element.itemType === 'folder') {
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
