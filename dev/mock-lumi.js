/*
 * 本地预览用的模拟宿主（仅开发调试，不进入成品页面）。
 * 在普通浏览器里模拟 LumiCapabilities.require 返回的各能力模块，
 * 让页面在没有同花顺客户端时也能渲染出完整布局，用于界面开发与截图回归。
 * 所有数值均为确定性伪随机生成，与真实行情无关。
 */
(function (global) {
  'use strict';
  let seed = 20261020;
  const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = list => list[Math.floor(rand() * list.length)];
  const round = (value, digits) => Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits);
  const delay = value => new Promise(resolve => setTimeout(() => resolve(value), 30 + rand() * 60));

  const HOLIDAYS = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'];
  const pad = v => (v < 10 ? '0' + v : '' + v);
  const dayText = date => date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  const today = global.__MOCK_TODAY__ ? new Date(global.__MOCK_TODAY__ + 'T00:00:00') : new Date();
  const days = [];
  for (let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate()); days.length < 90; cursor.setDate(cursor.getDate() - 1)) {
    const text = dayText(cursor);
    if (cursor.getDay() === 0 || cursor.getDay() === 6 || HOLIDAYS.indexOf(text) >= 0) continue;
    days.push({ date: text, date_ms: new Date(text + 'T00:00:00').getTime() });
  }

  const THEMES = [
    ['机器人', ['机器人+减速器', '人形机器人', '机器人+灵巧手']],
    ['算力', ['算力+光模块', 'AI算力', '算力租赁']],
    ['固态电池', ['固态电池', '固态电池+锂电设备']],
    ['有色金属', ['铜+有色金属', '黄金+有色金属', '稀土永磁']],
    ['低空经济', ['低空经济+无人机', '低空经济']],
    ['创新药', ['创新药', '创新药+CXO']],
    ['华为', ['华为鸿蒙', '华为+昇腾']],
    ['并购重组', ['并购重组', '资产重组']]
  ];
  const STOCK_NAMES = ['东方精工', '中大力德', '兆威机电', '五洲新春', '浙江荣泰', '新亚强', '中际旭创', '工业富联', '润泽科技', '鹏鼎控股',
    '先导智能', '赣锋锂业', '江西铜业', '紫金矿业', '山东黄金', '北方稀土', '万丰奥威', '宗申动力', '中信海直', '恒瑞医药',
    '百济神州', '药明康德', '润和软件', '常山北明', '拓维信息', '天融信', '华映科技', '上海建工', '东方智造', '光启技术',
    '金发科技', '长城军工', '御银股份', '神州数码', '浪潮信息', '软通动力', '诚邦股份', '利欧股份', '华胜天成', '粤传媒'];
  const universe = STOCK_NAMES.map((name, index) => ({
    name, code: (index % 3 === 0 ? '60' : index % 3 === 1 ? '00' : '30') + String(1000 + index * 37).padStart(4, '0'),
    market: index % 3 === 0 ? 'SH' : 'SZ', theme: THEMES[index % THEMES.length]
  }));
  universe.forEach(item => { item.thscode = item.code + '.' + item.market; });
  const EXTRA = [
    { name: '江西铜业', code: '600362', market: 'SH' }, { name: '科大讯飞', code: '002230', market: 'SZ' },
    { name: '中际旭创', code: '300308', market: 'SZ' }, { name: '贵州茅台', code: '600519', market: 'SH' },
    { name: '紫金矿业', code: '601899', market: 'SH' }, { name: '寒武纪', code: '688256', market: 'SH' },
    { name: '北方华创', code: '002371', market: 'SZ' }, { name: '中国海油', code: '600938', market: 'SH' },
    { name: '万华化学', code: '600309', market: 'SH' }, { name: '恒生电子', code: '600570', market: 'SH' },
    { name: '山东黄金', code: '600547', market: 'SH' }, { name: '许继电气', code: '000400', market: 'SZ' }
  ];
  const BASE_PRICE = { '600362': 21.6, '002230': 47.8, '300308': 135, '600519': 1470, '601899': 17.9 };

  // 情绪序列：先修复、再发酵到高潮，然后分歧退潮，再次修复
  const pools = {};
  days.slice().reverse().forEach((day, index) => {
    const wave = Math.sin(index / 6) * 0.5 + 0.5;
    const limitUp = Math.round(25 + wave * 75 + rand() * 12);
    const limitDown = Math.round(4 + (1 - wave) * 22 + rand() * 6);
    const brk = Math.round(limitUp * (0.18 + (1 - wave) * 0.25 + rand() * 0.08));
    const maxBoard = Math.max(2, Math.round(2 + wave * 5 + rand()));
    const hot = THEMES[(Math.floor(index / 5)) % THEMES.length][0];
    const items = [];
    for (let i = 0; i < Math.min(limitUp, 60); i++) {
      const stock = universe[(index * 7 + i) % universe.length];
      const themeEntry = i < limitUp * 0.35 ? THEMES.find(t => t[0] === hot) : stock.theme;
      const level = i === 0 ? maxBoard : i < 3 ? Math.max(2, maxBoard - 1 - i % 2) : i < 10 ? 2 + (i % 2) : 1;
      items.push({
        thscode: stock.thscode, name: stock.name, continue_day_cnt: level,
        limit_up_reason: pick(themeEntry[1]),
        limit_up_time: day.date + ' ' + pad(9 + Math.floor(rand() * 5)) + ':' + pad(Math.floor(rand() * 60)),
        seal_money: round(2e7 + rand() * 6e8, 0)
      });
    }
    items.sort((a, b) => b.continue_day_cnt - a.continue_day_cnt);
    pools[day.date_ms] = { limitUp, limitDown, brk, items };
  });

  const ok = payload => delay({ __mock: true, payload });
  const page = (list, total, query) => {
    const size = (query && query.size) || list.length;
    const pageNo = (query && query.page) || 1;
    return { item: list.slice((pageNo - 1) * size, pageNo * size), pagination: { total, page: pageNo, size } };
  };

  const quoteFor = identity => {
    const key = identity.market + identity.code;
    let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
    const pre = BASE_PRICE[identity.code] || round(8 + (h % 500) / 7, 2);
    const changeRate = round(((h % 23) - 9) * 0.9, 2);
    const latest = round(pre * (1 + changeRate / 100), 2);
    const nameHit = universe.concat(EXTRA).find(item => item.code === identity.code);
    return {
      10: latest, 199112: changeRate, 6: pre, 7: round(pre * 1.003, 2), 8: round(Math.max(latest, pre * (1 + (h % 11) / 100)), 2), 9: round(Math.min(latest, pre * 0.97), 2),
      13: 100000 + h * 37, 1771976: round(0.6 + (h % 40) / 10, 2), 1968584: round(1 + (h % 90) / 10, 2), 330325: changeRate > 9 ? 1.2e8 : null,
      55: nameHit ? nameHit.name : identity.code
    };
  };

  const modules = {
    'lumi/data-view': { dataHubPayload: value => (value && value.__mock ? value.payload : value) },
    'lumi/native-data-client': {
      createNativeDataClient: () => ({
        searchCandidates: args => {
          const keywords = [].concat(args.keywords || []);
          const records = [];
          keywords.forEach(keyword => {
            const text = String(keyword);
            universe.concat(EXTRA).forEach(item => {
              if (item.name === text || item.code === text) records.push({ name: item.name, code: item.code, market: item.market });
            });
            if (args.datasetId === 'global-indicators') {
              records.push({ name: text, code: 'G' + Math.abs(text.length * 7919 % 100000), market: 'GLOBAL' });
            }
          });
          return delay({ records });
        },
        createQuoteSession: args => ({
          refresh: () => delay(null).then(() => {
            const records = {};
            (args.securities || []).forEach(identity => {
              const quote = quoteFor(identity);
              if (identity.market === 'GLOBAL') { quote[10] = round(1000 + rand() * 20000, 2); quote[199112] = round(rand() * 4 - 1.6, 2); }
              records[identity.market + identity.code] = quote;
            });
            args.onState({ status: 'ready', records });
          })
        })
      })
    },
    'lumi/capabilities/market-overview': {
      requestMarketOverview: args => delay({ hotIndex: args.market === 'usshare'
        ? [{ name: '纳斯达克', risePercent: 1.32 }, { name: '标普500', risePercent: 0.74 }, { name: '道琼斯', risePercent: 0.21 }]
        : [{ name: '恒生指数', risePercent: -0.48 }] })
    },
    'lumi/capabilities/user-sectors': {
      requestUserSectors: args => {
        if (args.sectorId === '0') return delay({ stocks: EXTRA.slice(0, 6).concat(universe.slice(0, 6)).map(item => ({ market: item.market, code: item.code })) });
        if (args.sectorId) return delay({ stocks: universe.slice(10, 14).map(item => ({ market: item.market, code: item.code })) });
        return delay({ sectors: [{ sectorId: 's1', sectorName: '短线观察' }] });
      }
    },
    'lumi/capabilities/stock-info-events': {
      requestStockInfoEvents: args => delay({ news: rand() > 0.5 ? [{ title: '（模拟）' + args.code + ' 签订重大合同', time: '10:12', abstract: '', url: 'https://example.com/news', type: 'news' }] : [] })
    },
    'lumi/capabilities/capital-flow': { requestCapitalFlow: () => delay({ net: { main: round(rand() * 12000 - 4000, 0) } }) },
    'lumi/capabilities/security-belongs': { requestSecurityBelongs: () => delay({ belongs: [{ category: 'concept', name: pick(THEMES)[0], risePercent: round(rand() * 6 - 2, 2) }] }) },
    'lumi/capabilities/datahub/datahub-trading-calendar': { requestDataHubDatahubTradingCalendar: () => ok({ item: days }) },
    'lumi/capabilities/datahub/index-prices-snapshot': {
      requestDataHubIndexPricesSnapshot: args => ok({ item: String(args.thscodes || '').split(',').filter(Boolean).map(code => ({ thscode: code, price_change_ratio_pct: round(rand() * 4 - 1.5, 2), turnover: 5e11 })) })
    },
    'lumi/capabilities/datahub/index-prices-historical': {
      requestDataHubIndexPricesHistorical: args => ok({ item: days.filter(d => d.date_ms >= args.start && d.date_ms <= args.end).map((d, i) => ({
        date_ms: d.date_ms, turnover: args.thscode === '000001.SH' ? 6e11 + (pools[d.date_ms] ? pools[d.date_ms].limitUp * 4e9 : 0) : 9e11 + rand() * 1e11,
        close_price: 3800 + Math.sin(d.date_ms / 864e6) * 60
      })) })
    },
    'lumi/capabilities/datahub/prices-historical': {
      requestDataHubPricesHistorical: args => {
        const code = String(args.thscode).split('.')[0];
        const base = BASE_PRICE[code] || 20;
        return ok({ item: days.filter(d => d.date_ms >= args.start && d.date_ms <= args.end).map(d => {
          const close = round(base * (1 + Math.sin(d.date_ms / 2.6e8 + code.length) * 0.05), 2);
          return { date_ms: d.date_ms, close_price: close, open_price: round(close * 0.99, 2), high_price: round(close * 1.03, 2), low_price: round(close * 0.96, 2) };
        }) });
      }
    },
    'lumi/capabilities/datahub/ths-index-list': {
      requestDataHubThsIndexList: args => ok({ item: args.tag === 'industry'
        ? [{ name: '半导体', thscode: '881121.TI' }, { name: '有色', thscode: '881168.TI' }, { name: '油气', thscode: '881107.TI' }]
        : [{ name: '算力与芯片', thscode: '886001.TI' }, { name: '港股互联网', thscode: '886002.TI' }, { name: '黄金概念', thscode: '886003.TI' }, { name: '出口链', thscode: '886004.TI' }, { name: '机器人', thscode: '886005.TI' }] })
    },
    'lumi/capabilities/datahub/ths-index-constituents': {
      requestDataHubThsIndexConstituents: () => ok({ item: universe.slice(0, 12).map(item => ({ name: item.name, code: item.code, market: item.market, ticker: item.code })) })
    },
    'lumi/capabilities/datahub/datahub-limit-up-pool': {
      requestDataHubDatahubLimitUpPool: args => { const p = pools[args.date_ms] || { items: [], limitUp: 0 }; return ok(page(p.items, p.limitUp, args)); }
    },
    'lumi/capabilities/datahub/datahub-limit-down-pool': {
      requestDataHubDatahubLimitDownPool: args => { const p = pools[args.date_ms] || { limitDown: 0 }; return ok({ item: [], pagination: { total: p.limitDown } }); }
    },
    'lumi/capabilities/datahub/datahub-limit-break-pool': {
      requestDataHubDatahubLimitBreakPool: args => { const p = pools[args.date_ms] || { brk: 0 }; return ok({ item: [], pagination: { total: p.brk } }); }
    },
    'lumi/capabilities/datahub/datahub-limit-up-ladder': {
      requestDataHubDatahubLimitUpLadder: () => {
        const latest = pools[days[0].date_ms];
        const boards = { two_board: [], three_board: [], four_board: [], five_board: [], six_board: [], seven_over: [] };
        const keyOf = level => level >= 7 ? 'seven_over' : ['', '', 'two_board', 'three_board', 'four_board', 'five_board', 'six_board'][level];
        latest.items.filter(item => item.continue_day_cnt >= 2).forEach(item => boards[keyOf(item.continue_day_cnt)].push({ name: item.name, thscode: item.thscode, seal_nextday: null }));
        const caps = {}; Object.keys(boards).forEach(key => { if (boards[key].length) caps[key] = boards[key].length; });
        return ok({ item: [{ boards }], window: { board_caps: caps } });
      }
    },
    'lumi/capabilities/datahub/anomaly-analysis-stock': {
      requestDataHubAnomalyAnalysisStock: args => ok({ item: String(args.thscodes || '').split(',').slice(0, 2).map(code => ({ thscode: code, tag_name: '题材驱动', analysis_content: '（模拟）所属题材午后集体拉升', keyword_list: ['机器人'], stock_name: code })) })
    },
    'lumi/capabilities/datahub/datahub-dragon-tiger-list': { requestDataHubDatahubDragonTigerList: () => ok({ stock_items: [] }) }
  };

  global.LumiCapabilities = Object.freeze({
    require: id => { if (!modules[id]) throw new Error('mock 未提供模块 ' + id); return modules[id]; },
    modules: Object.freeze(Object.keys(modules)),
    __mock: true
  });
})(globalThis);
