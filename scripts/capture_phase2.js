import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = 4173;
const BUILD_DIR = path.resolve('build');
const SCREENSHOT_DIR = path.resolve('docs/uiux/screenshots/phase-2');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

// 1. Static HTTP Server
function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    let filePath = path.join(BUILD_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(BUILD_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

// 2. CDP Client over native WebSocket
class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  ready() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      console.warn('Eval exception:', res.exceptionDetails);
    }
    return res?.result?.value;
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
  }

  close() {
    this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const server = await startServer();

  // Launch Edge
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.edge-profile'),
    'about:blank',
  ]);

  await sleep(1500);

  // Discover page target
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await versionRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  console.log('Connecting to target:', pageTarget.webSocketDebuggerUrl);

  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.ready();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  console.log('Navigating to http://127.0.0.1:' + PORT);
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}` });
  await sleep(2500);

  // Helper to reset modal states
  async function resetState() {
    await cdp.eval(`
      (() => {
        const store = window.__NOTIFY_STORE__; // if available
        // Close modals via document escape if open
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      })()
    `);
    await sleep(200);
  }

  // Helper to click by selector or text
  async function clickSelector(selector) {
    await cdp.eval(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (el) el.click();
      })()
    `);
    await sleep(400);
  }

  async function clickByText(selector, text) {
    await cdp.eval(`
      (() => {
        const els = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
        const target = els.find(e => e.textContent.includes(${JSON.stringify(text)}));
        if (target) target.click();
      })()
    `);
    await sleep(400);
  }

  // 1. Viewport captures
  const viewports = [
    { w: 1280, h: 720, file: 'phase2_main_1280x720.png' },
    { w: 1366, h: 768, file: 'phase2_main_1366x768.png' },
    { w: 1600, h: 900, file: 'phase2_main_1600x900.png' },
    { w: 1920, h: 1080, file: 'phase2_main_1920x1080.png' },
  ];

  for (const vp of viewports) {
    await cdp.setViewport(vp.w, vp.h);
    await sleep(300);
    await cdp.captureScreenshot(vp.file);
  }

  // Set default standard laptop for remaining state captures
  await cdp.setViewport(1366, 768);
  await sleep(200);

  // 2. Six Theme Captures
  const themes = [
    { id: 'warm-paper', file: 'phase2_theme_warm_paper_1366x768.png' },
    { id: 'midnight', file: 'phase2_theme_midnight_1366x768.png' },
    { id: 'forest', file: 'phase2_theme_forest_1366x768.png' },
    { id: 'ocean', file: 'phase2_theme_ocean_1366x768.png' },
    { id: 'lavender', file: 'phase2_theme_lavender_1366x768.png' },
    { id: 'sunset', file: 'phase2_theme_sunset_1366x768.png' },
  ];

  for (const t of themes) {
    await cdp.eval(`document.documentElement.setAttribute('data-theme', '${t.id}');`);
    await sleep(300);
    await cdp.captureScreenshot(t.file);
  }
  // Restore warm-paper default
  await cdp.eval(`document.documentElement.setAttribute('data-theme', 'warm-paper');`);
  await sleep(200);

  // 3. Collapsed Sidebar
  await cdp.eval(`
    (() => {
      const toggle = document.querySelector('button[title*="Toggle Sidebar"], button[aria-label="Toggle Sidebar"]');
      if (toggle) toggle.click();
    })()
  `);
  await sleep(400);
  await cdp.captureScreenshot('phase2_sidebar_collapsed_1366x768.png');

  // Restore sidebar
  await cdp.eval(`
    (() => {
      const toggle = document.querySelector('button[title*="Show Sidebar"], button[aria-label="Show Sidebar"], button[title*="Toggle Sidebar"]');
      if (toggle) toggle.click();
    })()
  `);
  await sleep(400);

  // 4. Selected Folder
  await clickByText('aside button', 'Personal');
  await sleep(300);
  await cdp.captureScreenshot('phase2_folder_selected_1366x768.png');

  // 5. Selected Tag
  await clickByText('aside button', '#work');
  await sleep(300);
  await cdp.captureScreenshot('phase2_tag_selected_1366x768.png');

  // 6. Hovered Tag / Tag Action Menu Open
  await cdp.eval(`
    (() => {
      const groupDiv = Array.from(document.querySelectorAll('aside div')).find(el => el.textContent.includes('#work') && el.querySelector('button[title="Tag actions"]'));
      if (groupDiv) {
        const menuBtn = groupDiv.querySelector('button[title="Tag actions"]');
        if (menuBtn) menuBtn.click();
      }
    })()
  `);
  await sleep(400);
  await cdp.captureScreenshot('phase2_tag_menu_1366x768.png');

  // 7. Edit Tag Dialog
  await cdp.eval(`
    (() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Edit tag'));
      if (editBtn) editBtn.click();
    })()
  `);
  await sleep(500);
  await cdp.captureScreenshot('phase2_tag_edit_dialog_1366x768.png');

  // Close Edit Tag dialog (click Cancel)
  await clickByText('button', 'Cancel');
  await sleep(300);

  // 8. Delete Tag Dialog
  await cdp.eval(`
    (() => {
      const groupDiv = Array.from(document.querySelectorAll('aside div')).find(el => el.textContent.includes('#work') && el.querySelector('button[title="Tag actions"]'));
      if (groupDiv) {
        const menuBtn = groupDiv.querySelector('button[title="Tag actions"]');
        if (menuBtn) menuBtn.click();
      }
    })()
  `);
  await sleep(300);
  await cdp.eval(`
    (() => {
      const delBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Delete tag'));
      if (delBtn) delBtn.click();
    })()
  `);
  await sleep(500);
  await cdp.captureScreenshot('phase2_tag_delete_dialog_1366x768.png');

  // Close Delete Tag dialog (click Cancel)
  await clickByText('button', 'Cancel');
  await sleep(300);

  // 9. Recently Deleted View
  await clickByText('aside button', 'Recently Deleted');
  await sleep(400);
  await cdp.captureScreenshot('phase2_recently_deleted_1366x768.png');

  // 10. Theme Quick Switcher Popover
  await clickByText('aside button', 'All Notes'); // back to all notes
  await sleep(300);
  await cdp.eval(`
    (() => {
      const paletteBtn = document.querySelector('button[aria-label="Color Palette Switcher"]');
      if (paletteBtn) paletteBtn.click();
    })()
  `);
  await sleep(400);
  await cdp.captureScreenshot('phase2_theme_picker_1366x768.png');

  // Close palette picker
  await cdp.eval(`document.body.click();`);
  await sleep(300);

  // 11. Settings Modal Categories
  await cdp.eval(`
    (() => {
      const settingsBtn = document.querySelector('button[aria-label="Settings"]');
      if (settingsBtn) settingsBtn.click();
    })()
  `);
  await sleep(500);

  const settingsCats = [
    { cat: 'General', file: 'phase2_settings_general_1366x768.png' },
    { cat: 'Appearance', file: 'phase2_settings_appearance_1366x768.png' },
    { cat: 'Editor', file: 'phase2_settings_editor_1366x768.png' },
    { cat: 'Storage', file: 'phase2_settings_storage_1366x768.png' },
    { cat: 'Shortcuts', file: 'phase2_settings_shortcuts_1366x768.png' },
    { cat: 'About', file: 'phase2_settings_about_1366x768.png' },
  ];

  for (const sc of settingsCats) {
    await clickByText('aside button', sc.cat);
    await sleep(400);
    await cdp.captureScreenshot(sc.file);
  }

  // Close Settings modal
  await cdp.eval(`
    (() => {
      const closeBtn = document.querySelector('button[aria-label="Close Settings"]');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await sleep(400);

  // 12. Active Toolbar Formatting state
  await cdp.eval(`
    (() => {
      // Focus editor and select formatted text or simulate formatting
      const editorEl = document.querySelector('.ProseMirror');
      if (editorEl) {
        editorEl.focus();
      }
      // Toggle bold and italic
      const boldBtn = document.querySelector('button[aria-label="Bold"]');
      if (boldBtn) boldBtn.click();
      const italicBtn = document.querySelector('button[aria-label="Italic"]');
      if (italicBtn) italicBtn.click();
    })()
  `);
  await sleep(400);
  await cdp.captureScreenshot('phase2_toolbar_active_1366x768.png');

  console.log('All visual verification captures complete!');

  cdp.close();
  edgeProc.kill();
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Capture script error:', err);
  process.exit(1);
});
