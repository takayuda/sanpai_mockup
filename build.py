#!/usr/bin/env python3
"""モックのビルド。

parts/ の各パーツから処理業者の管理画面を組み立て、排出者ポータル
（emitter-portal.html）を <script type="text/html"> として同梱した
単一ファイル sanpai-mock.html を出力する。

    python3 build.py
"""
import pathlib, re

ROOT  = pathlib.Path(__file__).parent
PARTS = ROOT / 'parts'
JS = ['02_data.js','03_util.js','04_approvals.js','05_board.js','06_proxy.js',
      '07_hours.js','08_reception.js','09_actuals.js','10_masters.js','12_app.js']

admin = ((PARTS / '01_head.html').read_text(encoding='utf-8')
         + ''.join((PARTS / f).read_text(encoding='utf-8') for f in JS)
         + (PARTS / '99_tail.html').read_text(encoding='utf-8'))

emitter = (ROOT / 'emitter-portal.html').read_text(encoding='utf-8')
# 同梱版では処理業者側へのリンクは持たせない（戻る導線は親側のボタンが担当）
emitter = re.sub(r'\s*<a class="mocklink" href="[^"]*">[^<]*</a>', '', emitter)
# <script> ブロック内に埋め込むため終了タグをエスケープする（読み出し時に戻す）
emitter = emitter.replace('</script>', r'<\/script>')

BOOTSTRAP = '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>'
merged = admin.replace(BOOTSTRAP, BOOTSTRAP
    + '\n\n<!-- 排出者ポータル（添付モックをそのまま同梱。iframe で表示するため互いのCSS/JSは干渉しない） -->\n'
    + '<script type="text/html" id="emitterHtml">\n' + emitter + '\n</script>')
merged = merged.replace('<title>産廃DX｜処理業者 管理画面 モック（第1期）</title>',
                        '<title>産廃DX モック（第1期）｜処理業者 管理画面＋排出者ポータル</title>')

out = ROOT / 'sanpai-mock.html'
out.write_text(merged, encoding='utf-8')
print(f'{out.name}: {len(merged):,} bytes')
