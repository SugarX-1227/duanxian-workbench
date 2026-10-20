#!/usr/bin/env python3
"""行情客户端版的装配与本地预览工具。

用法：
  python3 tools/build.py assemble            # 用 src 源码重新装配 pages 成品（复用成品中已装配的运行库）
  python3 tools/build.py preview [输出路径]   # 生成注入模拟宿主的本地预览页（仅开发调试，不可发布）
  python3 tools/build.py check               # 检查 src 引用的模块是否都已在成品运行库中装配

说明：assemble 只替换作者源码部分，运行库原样复用。如果源码新增了运行库里没有的
LumiCapabilities 模块，check 会失败，此时需要用 Lumi 端的发布工具重新装配。
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src' / '短线交易闭环作战台-source.html'
PAGE = ROOT / 'pages' / '《短线交易闭环作战台》_中0920-6.html'
MOCK = ROOT / 'dev' / 'mock-lumi.js'
MARKER = '<!-- lumi-capabilities -->'
RUNTIME_RE = re.compile(r'<script data-lumi-diagnostics>.*?<script data-lumi-capabilities>.*?</script>', re.S)
SHA_RE = re.compile(r'\}\)\(globalThis,"[0-9a-f]{64}"\);</script>')


def read(path):
    return path.read_text(encoding='utf-8')


def runtime_block():
    match = RUNTIME_RE.search(read(PAGE))
    if not match:
        sys.exit('成品页面中找不到已装配的运行库')
    return match.group(0)


def required_modules(source):
    return sorted(set(re.findall(r"LumiCapabilities\.require\('([^']+)'\)", source)))


def check(source, block):
    missing = [mod for mod in required_modules(source) if ("'" + mod + "'") not in block and ('"' + mod + '"') not in block]
    if missing:
        sys.exit('运行库缺少模块，需要用 Lumi 发布工具重新装配：\n  ' + '\n  '.join(missing))
    return True


def assemble():
    source = read(SRC)
    if source.count(MARKER) != 1:
        sys.exit('源码中需要且只能有一个 ' + MARKER)
    block = runtime_block()
    check(source, block)
    sha = hashlib.sha256(source.encode('utf-8')).hexdigest()
    block = SHA_RE.sub('})(globalThis,"' + sha + '");</script>', block, count=1)
    PAGE.write_text(source.replace(MARKER, block), encoding='utf-8')
    print('已装配', PAGE.relative_to(ROOT), len(PAGE.read_bytes()), '字节, sourceSha256', sha)


def preview(out):
    source = read(SRC)
    banner = ('<div style="position:fixed;right:8px;bottom:8px;z-index:99;padding:3px 8px;border-radius:4px;'
              'background:#b3730a;color:#fff;font-size:11px">本地预览 · 模拟数据，非真实行情</div>')
    html = source.replace(MARKER, '<script>\n' + read(MOCK) + '\n</script>\n' + banner)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print('已生成预览', out)


if __name__ == '__main__':
    command = sys.argv[1] if len(sys.argv) > 1 else 'check'
    if command == 'assemble':
        assemble()
    elif command == 'preview':
        preview(pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'dev' / 'preview.html')
    elif command == 'check':
        check(read(SRC), runtime_block())
        print('模块检查通过：', ', '.join(required_modules(read(SRC))))
    else:
        sys.exit(__doc__)
