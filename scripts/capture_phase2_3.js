import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = 4174;
const BUILD_DIR = path.resolve('build');
const SCREENSHOT_DIR = path.resolve('docs/uiux/screenshots/phase-2-3');
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
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.edge-profile-p23'),
    'about:blank',
  ]);

  await sleep(1500);

  // Discover page target
  const versionRes = await fetch('http://127.0.0.1:9223/json/list');
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

  // Helper to click by text
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

  // 1. Viewport captures across 4 standard desktop resolutions
  const viewports = [
    { w: 1280, h: 720, file: 'phase2_3_main_1280x720.png' },
    { w: 1366, h: 768, file: 'phase2_3_main_1366x768.png' },
    { w: 1600, h: 900, file: 'phase2_3_main_1600x900.png' },
    { w: 1920, h: 1080, file: 'phase2_3_main_1920x1080.png' },
  ];

  for (const vp of viewports) {
    await cdp.setViewport(vp.w, vp.h);
    await sleep(300);
    await cdp.captureScreenshot(vp.file);
  }

  // Default viewport for state captures
  await cdp.setViewport(1366, 768);
  await sleep(300);

  // Capture #1: Main workspace
  await cdp.captureScreenshot('phase2_3_main_workspace.png');

  // 2. Six Theme Captures
  const themes = [
    { id: 'warm-paper', file: 'phase2_3_theme_warm_paper.png' },
    { id: 'midnight', file: 'phase2_3_theme_midnight.png' },
    { id: 'forest', file: 'phase2_3_theme_forest.png' },
    { id: 'ocean', file: 'phase2_3_theme_ocean.png' },
    { id: 'lavender', file: 'phase2_3_theme_lavender.png' },
    { id: 'sunset', file: 'phase2_3_theme_sunset.png' },
  ];

  for (const t of themes) {
    await cdp.eval(`document.documentElement.setAttribute('data-theme', '${t.id}');`);
    await sleep(300);
    await cdp.captureScreenshot(t.file);
  }
  // Restore warm-paper default
  await cdp.eval(`document.documentElement.setAttribute('data-theme', 'warm-paper');`);
  await sleep(200);

  // Capture #2: Individual permanent deletion confirmation
  await clickByText('aside button', 'Recently Deleted');
  await sleep(400);

  // Click explicit permanent delete trash icon on the first note card in Recently Deleted
  await cdp.eval(`
    (() => {
      const delBtn = document.querySelector('button[title="Permanently Delete Note"]');
      if (delBtn) delBtn.click();
    })()
  `);
  await sleep(500);
  await cdp.captureScreenshot('phase2_3_confirm_individual_delete.png');

  // Dismiss confirmation modal (click Cancel)
  await clickByText('button', 'Cancel');
  await sleep(300);

  // Capture #3: Empty Recently Deleted confirmation
  await cdp.eval(`
    (() => {
      const emptyBtn = document.querySelector('button[aria-label="Delete All Notes in Recently Deleted"]');
      if (emptyBtn) emptyBtn.click();
    })()
  `);
  await sleep(500);
  await cdp.captureScreenshot('phase2_3_confirm_empty_trash.png');

  // Dismiss confirmation modal (click Cancel)
  await clickByText('button', 'Cancel');
  await sleep(300);

  // Return to All Notes
  await clickByText('aside button', 'All Notes');
  await sleep(300);

  // Open Settings Modal
  await cdp.eval(`
    (() => {
      const settingsBtn = document.querySelector('button[aria-label="Settings"]');
      if (settingsBtn) settingsBtn.click();
    })()
  `);
  await sleep(500);

  // Capture #4: General Settings
  await clickByText('aside button', 'General');
  await sleep(400);
  await cdp.captureScreenshot('phase2_3_settings_general.png');

  // Capture #5: Appearance Settings
  await clickByText('aside button', 'Appearance');
  await sleep(400);
  await cdp.captureScreenshot('phase2_3_settings_appearance.png');

  // Capture #6: Editor Settings
  await clickByText('aside button', 'Editor');
  await sleep(400);
  await cdp.captureScreenshot('phase2_3_settings_editor.png');

  // Capture #7: Storage Settings
  await clickByText('aside button', 'Storage');
  await sleep(400);
  await cdp.captureScreenshot('phase2_3_settings_storage.png');

  // Capture #8: Keyboard Shortcuts
  await clickByText('aside button', 'Shortcuts');
  await sleep(400);
  await cdp.captureScreenshot('phase2_3_settings_shortcuts.png');

  // Capture #9: About
  await clickByText('aside button', 'About');
  await sleep(400);
  await cdp.captureScreenshot('phase2_3_settings_about.png');

  // Close Settings Modal
  await cdp.eval(`
    (() => {
      const closeBtn = document.querySelector('button[aria-label="Close Settings"]');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await sleep(400);

  // Capture #10: Toolbar with active formatting
  await cdp.eval(`
    (() => {
      const boldBtn = document.querySelector('button[aria-label="Bold"]');
      if (boldBtn) boldBtn.click();
      const italicBtn = document.querySelector('button[aria-label="Italic"]');
      if (italicBtn) italicBtn.click();
    })()
  `);
  await sleep(300);
  await cdp.captureScreenshot('phase2_3_toolbar.png');

  // Capture #11: Theme palette popover
  await cdp.eval(`
    (() => {
      const paletteBtn = document.querySelector('button[aria-label="Color Palette Switcher"]');
      if (paletteBtn) paletteBtn.click();
    })()
  `);
  await sleep(400);
  await cdp.captureScreenshot('phase2_3_theme_palette_popover.png');

  // Close palette popover
  await cdp.eval(`document.body.click();`);
  await sleep(300);

  // Capture #12: Titlebar controls
  await cdp.captureScreenshot('phase2_3_titlebar_controls.png');

  console.log('All Phase 2.3 visual verification screenshots captured successfully!');

  cdp.close();
  edgeProc.kill();
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Capture script error:', err);
  process.exit(1);
});
