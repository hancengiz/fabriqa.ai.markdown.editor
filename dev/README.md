# Development Simulator

This directory contains development tools that are **NOT included** in the packaged extension.

## Web Simulator

The `simulator.html` file provides a standalone web-based testing environment for the Fabriqa markdown editor.

### How to Use

1. **Build the extension first**:
   ```bash
   npm run build
   ```

2. **Open the simulator**:
   - Simply open `dev/simulator.html` in your web browser (Chrome, Firefox, Safari, etc.)
   - Or use a local server:
     ```bash
     npx serve dev
     ```

3. **Test the editor**:
   - Click "Load Sample Markdown" to populate the editor
   - Switch between Light/Dark themes
   - Test Live Preview, Source, and Reading modes
   - Watch the console log for debugging

### Features

- ✅ Simulates VS Code API (`acquireVsCodeApi`)
- ✅ Theme switching (Light/Dark)
- ✅ Mode switching (Live Preview, Source, Reading)
- ✅ Console logging for debugging
- ✅ Sample markdown content
- ✅ Real-time testing without rebuilding extension

### Why Use This?

**Benefits:**
- 🚀 **Faster iteration**: No need to rebuild and reinstall the extension
- 🐛 **Easier debugging**: Browser DevTools with breakpoints, console, network tab
- 🎨 **Visual testing**: Quickly test themes and styles
- 💻 **No VS Code required**: Test editor logic independently

**When to use extension vs simulator:**
- Use **simulator** for: Editor logic, rendering, mode switching, theme testing
- Use **extension** for: VS Code integration, file system, settings, commands

### Limitations

- Doesn't test VS Code-specific features (file system, settings persistence, commands)
- Simulates VS Code API messages (not real bidirectional communication)
- Doesn't test extension activation or lifecycle events

### Troubleshooting

**"Failed to load webview.js"**
- Run `npm run build` to compile the webview bundle

**Changes not reflecting**
- Hard refresh the browser (Cmd+Shift+R / Ctrl+Shift+F5)
- Rebuild with `npm run build` if you changed webview code

**Console errors**
- Check the simulator's console panel (right side)
- Open browser DevTools (F12) for detailed stack traces
