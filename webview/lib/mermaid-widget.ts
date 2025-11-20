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

  // Always use light theme (extension only supports light theme)
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    gantt: {
      titleTopMargin: 25,
      barHeight: 20,
      barGap: 4,
      topPadding: 50,
      leftPadding: 75,
      gridLineStartPadding: 35,
      fontSize: 11,
      sectionFontSize: 11,
      numberSectionStyles: 4,
      axisFormat: '%Y-%m-%d',
      useWidth: 1200, // Wider default width for better text spacing
    },
  });

  mermaidInitialized = true;
}

/**
 * Widget for rendering Mermaid diagrams in Live Preview mode
 */
export class MermaidDiagramWidget extends WidgetType {
  private static widgetCounter = 0;
  private diagramId: string;
  private clickTimeout: number | null = null;

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

    // Parse size from HTML comment (works for all diagram types)
    // Format: %% {"editorSize": {"width": 600, "height": 400}} %%
    const sizeMatch = this.code.match(/%% \{"editorSize": \{"width": (\d+), "height": (\d+)\}\} %%/);
    const customWidth = sizeMatch ? `${sizeMatch[1]}px` : '75%';
    const customHeight = sizeMatch ? `${sizeMatch[2]}px` : 'auto';
    const hasCustomSize = !!sizeMatch;

    // Create main container - resizable, let Mermaid determine default size
    const container = document.createElement('div');
    container.className = 'mermaid-diagram-widget-container';
    container.style.cssText = `
      display: block;
      position: relative;
      border: 1px solid #d4d4d4;
      border-radius: 4px;
      padding: 16px;
      background: #ffffff;
      margin: 8px 0 8px 0;
      min-height: 100px;
      width: ${customWidth};
      height: ${customHeight};
      min-width: 200px;
      max-width: 100%;
      box-sizing: border-box;
      overflow: auto;
      resize: both;
    `;

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
    `;

    // Create "Zoom" button (magnifier icon)
    const zoomButton = document.createElement('button');
    zoomButton.className = 'mermaid-zoom-btn';
    zoomButton.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
      </svg>
    `;
    zoomButton.title = 'Zoom diagram';
    zoomButton.style.cssText = `
      background: #007acc;
      color: #ffffff;
      border: none;
      border-radius: 2px;
      padding: 3px 5px;
      font-size: 9px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    `;

    // Create "Fit to Content" button
    const fitButton = document.createElement('button');
    fitButton.className = 'mermaid-fit-btn';
    fitButton.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
      </svg>
    `;
    fitButton.title = 'Fit to content size';
    fitButton.style.cssText = `
      background: #007acc;
      color: #ffffff;
      border: none;
      border-radius: 2px;
      padding: 3px 5px;
      font-size: 9px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    `;

    // Create "View Code" button (code icon)
    const viewCodeButton = document.createElement('button');
    viewCodeButton.className = 'mermaid-code-btn';
    viewCodeButton.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4.72 3.22a.75.75 0 011.06 1.06L2.06 8l3.72 3.72a.75.75 0 11-1.06 1.06L.47 8.53a.75.75 0 010-1.06l4.25-4.25zm6.56 0a.75.75 0 10-1.06 1.06L13.94 8l-3.72 3.72a.75.75 0 101.06 1.06l4.25-4.25a.75.75 0 000-1.06l-4.25-4.25z"/>
      </svg>
    `;
    viewCodeButton.title = 'View code';
    viewCodeButton.style.cssText = `
      background: #007acc;
      color: #ffffff;
      border: none;
      border-radius: 2px;
      padding: 3px 5px;
      font-size: 9px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    `;

    // Create "Reset Size" button (only if custom size exists)
    let resetButton: HTMLButtonElement | null = null;
    if (hasCustomSize) {
      resetButton = document.createElement('button');
      resetButton.className = 'mermaid-reset-btn';
      resetButton.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
      `;
      resetButton.title = 'Reset to default size';
      resetButton.style.cssText = `
        background: #007acc;
        color: #ffffff;
        border: none;
        border-radius: 2px;
        padding: 3px 5px;
        font-size: 9px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      `;
      buttonContainer.appendChild(resetButton);
    }

    buttonContainer.appendChild(fitButton);
    buttonContainer.appendChild(zoomButton);
    buttonContainer.appendChild(viewCodeButton);

    // Show buttons on hover
    container.addEventListener('mouseenter', () => {
      buttonContainer.style.opacity = '0.7';
    });
    container.addEventListener('mouseleave', () => {
      buttonContainer.style.opacity = '0';
    });
    buttonContainer.addEventListener('mouseenter', () => {
      buttonContainer.style.opacity = '1';
    });

    // Button hover effects
    if (resetButton) {
      resetButton.addEventListener('mouseenter', () => {
        resetButton!.style.background = '#005a9e';
      });
      resetButton.addEventListener('mouseleave', () => {
        resetButton!.style.background = '#007acc';
      });
    }
    fitButton.addEventListener('mouseenter', () => {
      fitButton.style.background = '#005a9e';
    });
    fitButton.addEventListener('mouseleave', () => {
      fitButton.style.background = '#007acc';
    });
    zoomButton.addEventListener('mouseenter', () => {
      zoomButton.style.background = '#005a9e';
    });
    zoomButton.addEventListener('mouseleave', () => {
      zoomButton.style.background = '#007acc';
    });
    viewCodeButton.addEventListener('mouseenter', () => {
      viewCodeButton.style.background = '#005a9e';
    });
    viewCodeButton.addEventListener('mouseleave', () => {
      viewCodeButton.style.background = '#007acc';
    });

    // Handle "Reset Size" button click
    if (resetButton) {
      resetButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Remove editor size comment from the content
        const newCode = this.code.replace(/%% \{"editorSize": \{"width": \d+, "height": \d+\}\} %%\n?/, '');

        // Get the full block text including fence markers
        const fullBlockText = this.view.state.doc.sliceString(this.from, this.to);

        // Parse the block to extract opening fence, content, and closing fence
        // Format: ```mermaid\n[content]\n```
        const fenceMatch = fullBlockText.match(/^(```\w+\n)([\s\S]*?)(\n```)$/);

        if (fenceMatch) {
          const [, openingFence, , closingFence] = fenceMatch;
          const newBlockText = openingFence + newCode + closingFence;

          // Update the document with preserved fences
          this.view.dispatch({
            changes: {
              from: this.from,
              to: this.to,
              insert: newBlockText
            }
          });
        }

        // Reset container to default size
        container.style.width = '75%';
        container.style.height = 'auto';
      });
    }

    // Handle "Fit to Content" button click
    fitButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Get the actual SVG width from the rendered diagram
      const svgElement = diagramContainer.querySelector('svg');
      if (svgElement) {
        // Get the actual rendered width of the SVG
        const svgWidth = svgElement.getBoundingClientRect().width;

        // Add padding (32px total: 16px on each side from container padding)
        const containerWidth = svgWidth + 32;

        // Set container to fit the SVG width
        container.style.width = `${containerWidth}px`;
        container.style.height = 'auto';
      }
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

    container.appendChild(buttonContainer);

    // Create diagram container
    const diagramContainer = document.createElement('div');
    diagramContainer.className = 'mermaid-diagram-content';
    diagramContainer.style.cssText = `
      width: 100%;
      min-height: 80px;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      cursor: zoom-in;
    `;

    // Handle click with delay to distinguish from double-click
    diagramContainer.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Clear any existing timeout
      if (this.clickTimeout !== null) {
        clearTimeout(this.clickTimeout);
        this.clickTimeout = null;
      }

      // Set a timeout for single click (open lightbox)
      // If double-click happens within 250ms, this will be cancelled
      this.clickTimeout = window.setTimeout(() => {
        this.openLightbox(diagramContainer);
        this.clickTimeout = null;
      }, 250);
    });

    // Handle double-click to enter edit mode
    diagramContainer.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Cancel the single-click timeout
      if (this.clickTimeout !== null) {
        clearTimeout(this.clickTimeout);
        this.clickTimeout = null;
      }

      // Move cursor to the code block position to trigger showing raw code
      this.view.dispatch({
        selection: { anchor: this.from + 1 },
        scrollIntoView: true
      });

      // Focus the editor
      this.view.focus();
    });

    // Prevent mousedown from moving cursor
    diagramContainer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    container.appendChild(diagramContainer);

    // Handle zoom button click
    zoomButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Open lightbox with the diagram
      this.openLightbox(diagramContainer);
    });

    // Render the mermaid diagram asynchronously
    this.renderDiagram(diagramContainer, container);

    // Add ResizeObserver to save custom size after user resizes
    let resizeTimeout: number | null = null;
    let initialRender = true; // Skip first observation to avoid saving 0x0

    const resizeObserver = new ResizeObserver((entries) => {
      // Skip first observation (initial render)
      if (initialRender) {
        initialRender = false;
        return;
      }

      // Debounce: wait 1 second after user stops resizing
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = window.setTimeout(() => {
        const entry = entries[0];
        if (!entry) return;

        const width = Math.round(entry.contentRect.width);
        const height = Math.round(entry.contentRect.height);

        // Only save if dimensions are reasonable (not 0x0)
        if (width > 0 && height > 0) {
          // Add or update editor size comment
          const sizeComment = `%% {"editorSize": {"width": ${width}, "height": ${height}}} %%\n`;
          const newCode = sizeComment + this.code.replace(/%% \{"editorSize": \{"width": \d+, "height": \d+\}\} %%\n?/, '');

          // Get the full block text including fence markers
          const fullBlockText = this.view.state.doc.sliceString(this.from, this.to);

          // Parse the block to extract opening fence, content, and closing fence
          // Format: ```mermaid\n[content]\n```
          const fenceMatch = fullBlockText.match(/^(```\w+\n)([\s\S]*?)(\n```)$/);

          if (fenceMatch) {
            const [, openingFence, , closingFence] = fenceMatch;
            const newBlockText = openingFence + newCode + closingFence;

            // Update the document with preserved fences
            this.view.dispatch({
              changes: {
                from: this.from,
                to: this.to,
                insert: newBlockText
              }
            });
          }
        }

        resizeTimeout = null;
      }, 1000); // 1 second delay
    });

    resizeObserver.observe(container);

    return container;
  }

  /**
   * Render the mermaid diagram
   */
  async renderDiagram(diagramContainer: HTMLElement, container: HTMLElement) {
    try {
      // Show loading indicator
      diagramContainer.innerHTML = `
        <div style="color: #717171; font-size: 12px;">
          Rendering diagram...
        </div>
      `;

      // Render the diagram
      const { svg } = await mermaid.render(this.diagramId, this.code);

      // Replace loading with SVG - render as-is
      diagramContainer.innerHTML = svg;
    } catch (error) {
      // Show error
      console.error('Failed to render mermaid diagram:', error);

      diagramContainer.innerHTML = `
        <div style="color: #e51400; padding: 16px; text-align: center;">
          <div style="font-weight: bold; margin-bottom: 8px;">
            ⚠️ Mermaid Diagram Error
          </div>
          <div style="font-size: 11px; font-family: monospace; opacity: 0.8;">
            ${(error as Error).message || 'Invalid Mermaid syntax'}
          </div>
        </div>
      `;

      // Add error styling to container
      container.style.border = '2px solid #e51400';
      container.style.background = '#f2dede';
    }
  }

  /**
   * Open lightbox with full-screen diagram view
   */
  openLightbox(diagramContainer: HTMLElement) {
    // Get the SVG from the diagram container
    const svgElement = diagramContainer.querySelector('svg');
    if (!svgElement) return;

    // Clone the SVG for the lightbox
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;

    // Get original SVG dimensions
    const viewBox = clonedSvg.getAttribute('viewBox');
    let originalWidth = parseFloat(clonedSvg.getAttribute('width') || '800');
    let originalHeight = parseFloat(clonedSvg.getAttribute('height') || '600');

    // If viewBox exists, use those dimensions
    if (viewBox) {
      const parts = viewBox.split(' ');
      if (parts.length === 4) {
        originalWidth = parseFloat(parts[2]);
        originalHeight = parseFloat(parts[3]);
      }
    }

    // Function to calculate and apply scale based on current window size
    const updateScale = () => {
      const screenWidth = window.innerWidth - 80; // 40px padding on each side
      const screenHeight = window.innerHeight - 80;
      const scaleX = screenWidth / originalWidth;
      const scaleY = screenHeight / originalHeight;
      const scale = Math.min(scaleX, scaleY, 3); // Max 3x scale for quality

      // Update SVG dimensions
      clonedSvg.style.width = `${originalWidth * scale}px`;
      clonedSvg.style.height = `${originalHeight * scale}px`;
      clonedSvg.setAttribute('width', `${originalWidth * scale}`);
      clonedSvg.setAttribute('height', `${originalHeight * scale}`);
    };

    // Create lightbox overlay
    const lightbox = document.createElement('div');
    lightbox.className = 'mermaid-lightbox';
    lightbox.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      cursor: zoom-out;
      padding: 40px;
      box-sizing: border-box;
    `;

    // Create diagram wrapper
    const diagramWrapper = document.createElement('div');
    diagramWrapper.style.cssText = `
      max-width: 95vw;
      max-height: 95vh;
      overflow: auto;
      background: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Style the cloned SVG for full-screen view - scale it up!
    clonedSvg.style.maxWidth = 'none';
    clonedSvg.style.maxHeight = 'none';

    // Apply initial scale
    updateScale();

    diagramWrapper.appendChild(clonedSvg);
    lightbox.appendChild(diagramWrapper);

    // Handle window resize - update diagram scale
    let resizeTimeout: number | null = null;
    const handleResize = () => {
      // Debounce resize events to avoid excessive recalculations
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        updateScale();
        resizeTimeout = null;
      }, 100);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function
    const cleanup = () => {
      document.body.removeChild(lightbox);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleEscape);
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout);
      }
    };

    // Close on click anywhere
    lightbox.addEventListener('click', (e) => {
      cleanup();
    });

    // Prevent clicks on the diagram from closing
    diagramWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Close on ESC key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Add to body
    document.body.appendChild(lightbox);
  }

  ignoreEvent(event: Event) {
    // Tell CodeMirror to ignore all click/mousedown events on this widget
    // This prevents cursor movement when clicking on the diagram
    // The "View Code" button has its own handler that explicitly moves the cursor
    return event.type === 'mousedown' || event.type === 'click';
  }
}
