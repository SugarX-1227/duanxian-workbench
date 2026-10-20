// 本地预览截图与运行时错误检查：node dev/shot.js <preview.html> <输出目录> [YYYY-MM-DD]
// 依赖全局安装的 playwright；逐个页签截图，并把页面 console 的 error/warn 打印出来。
const path = require('path');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); }

(async () => {
  const [file, outDir = '.', today] = process.argv.slice(2);
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  const problems = [];
  page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') problems.push(msg.type() + ': ' + msg.text()); });
  page.on('pageerror', err => problems.push('pageerror: ' + err.message));
  if (today) await page.addInitScript(t => { window.__MOCK_TODAY__ = t; }, today);
  await page.goto('file://' + path.resolve(file));
  await page.waitForTimeout(2500);
  for (const pane of ['pre', 'emotion', 'intraday', 'review']) {
    await page.click('.tab[data-pane="' + pane + '"]');
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(outDir, 'pane-' + pane + '.png'), fullPage: true });
  }
  console.log(problems.length ? problems.join('\n') : '无 console 错误');
  await browser.close();
})();
