/**
 * capture-board.mjs — render a real 4-3-3 build-up in the live TMC engine
 * and export true PNG frames of the board canvas to apps/web/public/.
 *
 * The landing page uses real product renders (not mockups). This drives the
 * actual app at localhost:3000/app in a headless browser, injects a clean
 * tactic into the board model, and screenshots the rendered <canvas> per step.
 *
 * Run (dev server must be up on :3000):
 *   pnpm --filter @tmc/web exec playwright install chromium   # first time only
 *   node scripts/capture-board.mjs
 *
 * Output: apps/web/public/board-step-1.png, board-step-2.png, board-step-3.png
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const URL = process.env.TMC_URL || 'http://localhost:3000/app';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../apps/web/public');
const TARGET_W = 1600;

function buildBoard(existing, stepIndex) {
  let c = 0;
  const uid = () => Date.now() + '-' + c++ + '-' + Math.random().toString(36).slice(2, 7);
  const P = (n, x, y, team, gk = false) => ({ id: uid(), type: 'player', position: { x, y }, team, number: n, shape: 'circle', isGoalkeeper: gk, orientation: 0 });
  const A = (x1, y1, x2, y2, type = 'pass', cc = null, color = '#2EE6A6') => {
    const a = { id: uid(), type: 'arrow', arrowType: type, startPoint: { x: x1, y: y1 }, endPoint: { x: x2, y: y2 }, color, strokeWidth: 6, endHead: 'arrow' };
    if (cc) a.curveControl = { x: cc[0], y: cc[1] };
    return a;
  };
  const ball = (x, y) => ({ id: uid(), type: 'ball', position: { x, y }, variant: 'single' });
  const home = [
    P(1, 95, 340, 'home', true), P(2, 210, 150, 'home'), P(5, 195, 285, 'home'), P(6, 195, 395, 'home'), P(3, 210, 530, 'home'),
    P(8, 420, 215, 'home'), P(4, 380, 340, 'home'), P(10, 420, 465, 'home'), P(7, 665, 175, 'home'), P(9, 720, 340, 'home'), P(11, 665, 505, 'home'),
  ];
  const away = [P(1, 960, 340, 'away', true), P(4, 560, 255, 'away'), P(6, 560, 425, 'away'), P(8, 650, 340, 'away'), P(7, 790, 210, 'away'), P(11, 790, 470, 'away')];
  const base = [...home, ...away];
  const steps = [
    { id: uid(), name: 'Ustawienie 4-3-3', duration: 1200, elements: [...base, ball(140, 340)] },
    { id: uid(), name: 'Rozegranie', duration: 1200, elements: [...base, ball(360, 340), A(120, 360, 192, 393, 'pass', [150, 420]), A(200, 393, 372, 345, 'pass', [290, 400]), A(665, 175, 812, 152, 'run')] },
    { id: uid(), name: 'Wejscie w pole karne', duration: 1200, elements: [...base, ball(902, 340), A(388, 340, 706, 344, 'pass', [545, 298]), A(720, 340, 910, 340, 'shoot'), A(665, 505, 818, 558, 'run')] },
  ];
  const board = existing && existing.pitchConfig ? existing : {
    version: '1.0.0', name: '', createdAt: new Date().toISOString(),
    pitchConfig: { width: 1050, height: 680, padding: 40, gridSize: 10 },
    teamSettings: {
      home: { name: 'Team 1', primaryColor: '#ef4444', secondaryColor: '#ffffff', goalkeeperColor: '#fbbf24' },
      away: { name: 'Team 2', primaryColor: '#3b82f6', secondaryColor: '#ffffff', goalkeeperColor: '#f97316' },
    },
    squad: [], squadVisibility: {},
  };
  board.name = 'Build-up 4-3-3';
  board.steps = steps;
  board.currentStepIndex = stepIndex;
  board.updatedAt = new Date().toISOString();
  return board;
}

function captureInPage(targetW) {
  const cv = document.querySelector('canvas');
  const W = cv.width, H = cv.height;
  const t = document.createElement('canvas'); t.width = W; t.height = H;
  const tc = t.getContext('2d'); tc.drawImage(cv, 0, 0);
  const d = tc.getImageData(0, 0, W, H).data;
  const sum = (i) => d[i] + d[i + 1] + d[i + 2];
  let minX = W, minY = H, maxX = 0, maxY = 0; const s = 3, th = 28;
  for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) { const i = (y * W + x) * 4; if (sum(i) > th) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; } }
  const pad = Math.round(W * 0.008);
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(W, maxX + pad); maxY = Math.min(H, maxY + pad);
  const cw = maxX - minX, ch = maxY - minY, sc = targetW / cw;
  const o = document.createElement('canvas'); o.width = Math.round(cw * sc); o.height = Math.round(ch * sc);
  const oc = o.getContext('2d'); oc.imageSmoothingQuality = 'high';
  oc.drawImage(cv, minX, minY, cw, ch, 0, 0, o.width, o.height);
  return o.toDataURL('image/png');
}

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000, deviceScaleFactor: 2 } });
  const fs = await import('node:fs/promises');
  await fs.mkdir(OUT, { recursive: true });
  for (let k = 0; k < 3; k++) {
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.evaluate(([idx, fnStr]) => {
      const build = eval('(' + fnStr + ')');
      const existing = JSON.parse(localStorage.getItem('tmc-studio-board') || 'null');
      localStorage.setItem('tmc-studio-board', JSON.stringify(build(existing, idx)));
    }, [k, buildBoard.toString()]);
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const dataUrl = await page.evaluate(captureInPage, TARGET_W);
    const b64 = dataUrl.split(',')[1];
    const file = path.join(OUT, 'board-step-' + (k + 1) + '.png');
    await fs.writeFile(file, Buffer.from(b64, 'base64'));
    console.log('wrote', file);
  }
  await browser.close();
  console.log('\nDone. 3 real board frames are in apps/web/public/.');
};

run().catch((e) => { console.error(e); process.exit(1); });
