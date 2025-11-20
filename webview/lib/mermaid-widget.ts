/**
 * Mermaid Diagram Widget for Live Preview Mode
 *
 * Provides interactive Mermaid diagram rendering with toggle functionality:
 * - Shows rendered diagram by default when cursor is not in code block
 * - "View Code" button to toggle to source view
 * - Click outside behavior returns to diagram view
 * - Obsidian-style interaction
 */

import { WidgetType, EditorView } from '@codemirror/view';
import mermaid from 'mermaid';

// Initialize mermaid once
let mermaidInitialized = false;

function initMermaid() {
  if (mermaidInitialized) return;

  // Detect VS Code theme (light vs dark)
  const isDark = document.body.classList.contains('vscode-dark') ||
                 document.body.classList.contains('vscode-high-contrast');

  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'var(--vscode-editor-font-family)',
  });

  mermaidInitialized = true;
}

/**
 * Widget for rendering Mermaid diagrams in Live Preview mode
 */
export class MermaidDiagramWidget extends WidgetType {
  private static widgetCounter = 0;
  private diagramId: string;

  constructor(
    readonly code: string,
    readonly view: EditorView,
    readonly from: number,
    readonly to: number
  ) {
    super();
    this.diagramId = `mermaid-widget-${Date.now()}-${MermaidDiagramWidget.widgetCounter++}`;
  }

  eq(other: MermaidDiagramWidget) {
    return this.code === other.code;
  }

  toDOM() {
    // Initialize mermaid if not already done
    initMermaid();

    // Create main container - display as block to take full width
    const container = document.createElement('div');
    container.className = 'mermaid-diagram-widget-container';
    container.style.cssText = `
      display: block;
      position: relative;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 16px;
      background: var(--vscode-editor-background);
      margin: 8px 0;
      min-height: 100px;
      width: 100%;
      box-sizing: border-box;
    `;

    // Create "View Code" button (shown on diagram hover)
    const viewCodeButton = document.createElement('button');
    viewCodeButton.className = 'mermaid-toggle-btn';
    viewCodeButton.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: middle; margin-right: 4px;">
        <path d="M4.72 3.22a.75.75 0 011.06 1.06L2.06 8l3.72 3.72a.75.75 0 11-1.06 1.06L.47 8.53a.75.75 0 010-1.06l4.25-4.25zm6.56 0a.75.75 0 10-1.06 1.06L13.94 8l-3.72 3.72a.75.75 0 101.06 1.06l4.25-4.25a.75.75 0 000-1.06l-4.25-4.25z"/>
      </svg>
      View Code
    `;
    viewCodeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 3px;
      padding: 4px 8px;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
      font-family: var(--vscode-font-family);
    `;

    // Show button on hover
    container.addEventListener('mouseenter', () => {
      viewCodeButton.style.opacity = '0.7';
    });
    container.addEventListener('mouseleave', () => {
      viewCodeButton.style.opacity = '0';
    });
    viewCodeButton.addEventListener('mouseenter', () => {
      viewCodeButton.style.opacity = '1';
      viewCodeButton.style.background = 'var(--vscode-button-hoverBackground)';
    });
    viewCodeButton.addEventListener('mouseleave', () => {
      viewCodeButton.style.background = 'var(--vscode-button-background)';
    });

    // Handle "View Code" button click
    viewCodeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Move cursor to the code block position to trigger showing raw code
      this.view.dispatch({
        selection: { anchor: this.from + 1 },
        scrollIntoView: true
      });

      // Focus the editor
      this.view.focus();
    });

    container.appendChild(viewCodeButton);

    // Create diagram container
    const diagramContainer = document.createElement('div');
    diagramContainer.className = 'mermaid-diagram-content';
    diagramContainer.style.cssText = `
      width: 100%;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    container.appendChild(diagramContainer);

    // Render the mermaid diagram asynchronously
    this.renderDiagram(diagramContainer, container);

    return container;
  }

  /**
   * Render the mermaid diagram
   */
  async renderDiagram(diagramContainer: HTMLElement, container: HTMLElement) {
    try {
      // Show loading indicator
      diagramContainer.innerHTML = `
        <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">
          Rendering diagram...
        </div>
      `;

      // Render the diagram
      const { svg } = await mermaid.render(this.diagramId, this.code);

      // Replace loading with SVG
      diagramContainer.innerHTML = svg;

      // Style the SVG
      const svgElement = diagramContainer.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.height = 'auto';
      }
    } catch (error) {
      // Show error
      console.error('Failed to render mermaid diagram:', error);

      diagramContainer.innerHTML = `
        <div style="color: var(--vscode-errorForeground); padding: 16px; text-align: center;">
          <div style="font-weight: bold; margin-bottom: 8px;">
            ⚠️ Mermaid Diagram Error
          </div>
          <div style="font-size: 11px; font-family: monospace; opacity: 0.8;">
            ${(error as Error).message || 'Invalid Mermaid syntax'}
          </div>
        </div>
      `;

      // Add error styling to container
      container.style.border = '2px solid var(--vscode-errorForeground)';
      container.style.background = 'var(--vscode-inputValidation-errorBackground)';
    }
  }

  ignoreEvent(event: Event) {
    // Let click events through to allow button interaction
    return event.type === 'mousedown' || event.type === 'click';
  }
}
