// 交互流程回归：写计划 → 盘中盯计划 → 复盘对照 → 次日清单转计划 → 生成日志
// node dev/flow.js <preview.html> <输出目录>
const path = require('path');
const playwright = require('playwright');
(async () => {
  const [file, outDir = '.'] = process.argv.slice(2);
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  const problems = [];
  page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') problems.push(msg.type() + ': ' + msg.text()); });
  page.on('pageerror', err => problems.push('pageerror: ' + err.message));
  await page.goto('file://' + path.resolve(file));
  await page.waitForTimeout(2500);
  await page.click('.tab[data-pane="pre"]');
  const today = await page.evaluate(() => { const d = new Date(); const p = v => (v < 10 ? '0' : '') + v; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); });
  await page.fill('#plan-date', today); await page.dispatchEvent('#plan-date', 'change');
  const add = async (stock, type, low, high, stop, pos, logic) => {
    await page.fill('#plan-stock', stock); await page.selectOption('#plan-type', type);
    await page.fill('#plan-low', low); await page.fill('#plan-high', high); await page.fill('#plan-stop', stop);
    await page.fill('#plan-pos', pos); await page.fill('#plan-logic', logic);
    await page.click('#plan-add'); await page.waitForTimeout(300);
  };
  await add('600362', '低吸', '19', '23', '18', '3', '铜价新高，有色回踩低吸');
  await add('中际旭创', '半路', '100', '110', '95', '3', '算力主线分歧转一致');
  await add('紫金矿业', '打板', '', '', '', '2', '');
  await page.fill('#plan-rule', '高潮期不追后排'); await page.dispatchEvent('#plan-rule', 'change');
  await page.screenshot({ path: path.join(outDir, 'flow-plan.png'), clip: { x: 0, y: 0, width: 1360, height: 520 } });
  await page.click('.tab[data-pane="intraday"]'); await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'flow-intraday.png'), fullPage: true });
  await page.click('.tab[data-pane="review"]'); await page.waitForTimeout(2000);
  await page.click('#next-to-plan'); await page.waitForTimeout(300);
  console.log('next-note:', await page.textContent('#next-note'));
  await page.fill('#journal-note', '高潮期只做核心，后排一律不碰'); await page.dispatchEvent('#journal-note', 'change');
  await page.click('#log-toggle');
  console.log((await page.textContent('#log-preview')).slice(0, 1800));
  await page.click('.bias-row[data-bias="revenge"]');
  await page.screenshot({ path: path.join(outDir, 'flow-review.png'), fullPage: true });
  console.log('loop:', await page.textContent('#loop-steps'));
  console.log(problems.length ? problems.join('\n') : '无 console 错误');
  await browser.close();
})();
