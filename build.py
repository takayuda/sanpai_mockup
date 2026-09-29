#!/usr/bin/env python3
"""単一ファイル版のビルド。

sanpai-mock/ の各ファイル（CSS・JS・排出者ポータル）をひとつにまとめて
sanpai-mock.html を出力する。分割版がソースで、こちらは配布用の副産物。

    python3 build.py
"""
import pathlib, re

ROOT = pathlib.Path(__file__).parent
SRC  = ROOT / 'sanpai-mock'
PAGES = ['index','approvals','board','proxy','hours','reception','actuals',
         'companies','invite','masters']

css = (SRC / 'assets/app.css').read_text(encoding='utf-8')
js  = (SRC / 'assets/data.js').read_text(encoding='utf-8')
js += (SRC / 'assets/core.js').read_text(encoding='utf-8')
for name in PAGES:
    js += f"\n/* ===== {name} ===== */\n" + (SRC / f'assets/pages/{name}.js').read_text(encoding='utf-8')

# 単体で完結しているページ（排出者ポータル・処理業者の追加）は iframe で同梱する
def embed(name):
    h = (SRC / name).read_text(encoding='utf-8')
    h = re.sub(r'\s*<a class="mocklink" href="[^"]*">[^<]*</a>', '', h)
    return h.replace('</script>', r'<\/script>')

emitter = embed('emitter.html')
processor_add = embed('processor-add.html')

router = """
/* =========================================================================
   単一ファイル版のルーティング（分割版ではページ遷移で切り替える）
   ========================================================================= */
const unesc = id => (document.getElementById(id).textContent || '')
  .replace(/<\\\\\\/script>/g, '<\\/script>');
const EMITTER_HTML = unesc('emitterHtml');
const PROCESSOR_ADD_HTML = unesc('processorAddHtml');
const VIEWS = {
  index:viewIndex, approvals:viewApprovals, board:viewBoard, proxy:viewProxy,
  hours:viewHours, reception:viewReception, actuals:viewActuals,
  m_companies:viewCompanies, m_plants:() => viewMaster('m_plants'),
  m_items:() => viewMaster('m_items'), m_units:() => viewMaster('m_units'),
  invite:viewInvite,
  emitter:() => `<iframe id="elEmitFrame" class="emitframe-inline" title="排出者ポータル"></iframe>`,
  processor_add:() => `<iframe id="elAddFrame" class="emitframe-inline" title="処理業者の追加"></iframe>`
};
const AFTER = {
  emitter:() => {
    const f = document.getElementById('elEmitFrame');
    if (f && !f.dataset.loaded) { f.srcdoc = EMITTER_HTML; f.dataset.loaded = '1'; }
  },
  processor_add:() => {
    const f = document.getElementById('elAddFrame');
    if (f && !f.dataset.loaded) { f.srcdoc = PROCESSOR_ADD_HTML; f.dataset.loaded = '1'; }
  }
};
function gotoRoute(r) {
  if (!VIEWS[r]) r = 'index';
  PAGE = {route:r, view:VIEWS[r], after:AFTER[r], chrome:(r === 'invite' ? 'plain' : 'admin')};
  if (r === 'invite' && !state.invite.token) state.invite = {token:INVITE_LINK.token, form:null, done:false};
  applyChromeMode();
  render();
  if (location.hash !== '#' + r) history.replaceState(null, '', '#' + r);
}
const startRoute = location.hash.slice(1) || 'index';
mount(startRoute, VIEWS[startRoute] || viewIndex);
gotoRoute(startRoute);
window.addEventListener('hashchange', () => {
  const r = location.hash.slice(1);
  if (VIEWS[r] && r !== PAGE.route) gotoRoute(r);
});
"""

html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>産廃DX モック（第1期）｜処理業者 管理画面＋排出者ポータル</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<main class="content" id="elView"></main>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

<!-- 取引先から見える画面（分割版のファイルをそのまま同梱） -->
<script type="text/html" id="emitterHtml">
{emitter}
</script>
<script type="text/html" id="processorAddHtml">
{processor_add}
</script>

<script>
window.SINGLE_FILE = true;
{js}
{router}
</script>
</body>
</html>
"""
out = ROOT / 'sanpai-mock.html'
out.write_text(html, encoding='utf-8')
print(f'{out.name}: {len(html):,} bytes')
