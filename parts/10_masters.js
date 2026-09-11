
/* =========================================================================
   取引先マスタ
   社内では情報を登録せず、登録用URLを発行して取引先に渡すだけ。
   取引先が URL から社名・連絡先・ログイン情報を本登録する。
   ========================================================================= */
const INVITE_BASE = 'https://sanpai.example.jp/invite/';
const randToken = () => Math.random().toString(36).slice(2,10) + Math.random().toString(36).slice(2,4);

function viewCompanies() {
  const rows = COMPANIES.map((c,i) => c.status === 'invited'
    ? `<tr class="dim">
        <td colspan="5" style="font-size:13px">未登録（登録用URL発行済　${esc(c.invited_at)}）</td>
        <td><span class="badge b-pending">招待中</span></td>
        <td class="text-end text-nowrap">
          <button class="btn btn-outline-primary btn-sm" data-act="showInvite" data-id="${c.id}">${ic('link',14)}登録用URL</button>
          <button class="btn btn-outline-danger btn-sm ms-1" data-act="delCompany" data-i="${i}">削除</button></td></tr>`
    : `<tr>
        <td><b>${esc(c.name)}</b><div class="text-secondary" style="font-size:11px">${esc(c.kana || '')}</div></td>
        <td style="font-size:13px">${companyKind(c)}</td>
        <td style="font-size:13px">${esc(c.contact || '—')}</td>
        <td style="font-size:13px">${esc(c.email || '—')}<div class="text-secondary" style="font-size:11px">${esc(c.phone || '')}</div></td>
        <td style="font-size:13px">${esc(c.invoice || '—')}</td>
        <td><span class="badge b-approved">本登録済</span><div class="text-secondary" style="font-size:11px">${esc(c.registered_at || '')}</div></td>
        <td class="text-end text-nowrap">
          <button class="btn btn-outline-secondary btn-sm" data-act="editCompany" data-i="${i}">編集</button>
          <button class="btn btn-outline-danger btn-sm ms-1" data-act="delCompany" data-i="${i}">削除</button></td></tr>`).join('');

  return pageHead('取引先',
    `<button class="btn btn-primary btn-sm" data-act="newInvite">${ic('link',15)}登録用URLを発行</button>
     <button class="btn btn-outline-primary btn-sm" data-act="csvCompanies">${ic('download')}CSV出力</button>`) +
  `<div class="table-wrap">
    <table class="table table-hover mb-0">
      <thead><tr><th style="width:24%">取引先名</th><th style="width:12%">区分</th><th style="width:12%">担当者</th>
        <th style="width:20%">連絡先</th><th style="width:14%">インボイス登録番号</th><th style="width:10%">状態</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

/* ---------- 登録用URL ---------- */
var MODALS_INVITE = m => {
  const c = company(m.id);
  return {
    title:'登録用URL',
    body:`<div class="urlbox"><code>${INVITE_BASE}${esc(c.token)}</code>
        <button class="btn btn-outline-secondary btn-sm ms-auto text-nowrap" data-act="copyInvite" data-token="${esc(c.token)}">${ic('copy',14)}コピー</button></div>
      <div class="d-flex gap-2 mt-3 flex-wrap">
        <button class="btn btn-outline-primary btn-sm mockbtn" data-act="openInvitePage" data-token="${esc(c.token)}">${ic('login',15)}登録画面を開く</button>
      </div>`,
    foot:`<button class="btn btn-primary" data-act="closeModal">閉じる</button>`
  };
};

/* ---------- 取引先の編集 ---------- */
var MODALS_COMPANY = m => {
  const d = m.row;
  const f = (k, label, type) => `<label class="form-label">${label}</label>
    <input type="${type || 'text'}" class="form-control" data-mod="row.${k}" value="${esc(d[k] || '')}">`;
  return {
    title:`取引先の編集`,
    body:`<div class="row g-3">
      <div class="col-12 col-md-7">${f('name','取引先名')}</div>
      <div class="col-12 col-md-5">${f('kana','フリガナ')}</div>
      <div class="col-12"><span class="form-label d-block">区分</span>
        <div class="d-flex gap-4">
          <div class="form-check"><input class="form-check-input" type="checkbox" data-mod="row.is_generator" ${d.is_generator ? 'checked' : ''}>
            <label class="form-check-label">排出事業者</label></div>
          <div class="form-check"><input class="form-check-input" type="checkbox" data-mod="row.is_transporter" ${d.is_transporter ? 'checked' : ''}>
            <label class="form-check-label">運搬業者</label></div>
        </div></div>
      <div class="col-12 col-md-6">${f('contact','担当者名')}</div>
      <div class="col-12 col-md-6">${f('phone','電話番号','tel')}</div>
      <div class="col-12 col-md-6">${f('email','メールアドレス（ログインID）','email')}</div>
      <div class="col-12 col-md-6">${f('invoice','インボイス登録番号')}</div>
      <div class="col-12 col-md-3">${f('postalcode','郵便番号')}</div>
      <div class="col-12 col-md-3">${f('pref','都道府県')}</div>
      <div class="col-12 col-md-6">${f('address','住所')}</div>
      <div class="col-12 col-md-8">${f('bank','振込先口座')}</div>
      <div class="col-12 col-md-4"><label class="form-label">与信区分</label>
        <select class="form-select" data-mod="row.credit">${opts(['A','B','C'].map(x => ({v:x,t:x})), d.credit)}</select></div>
    </div>
    ${m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="saveCompany">保存</button>`
  };
};

/* =========================================================================
   取引先の本登録画面　※本番では取引先側アプリの画面。モック用に同梱
   ========================================================================= */
function viewInvite() {
  const c = COMPANIES.find(x => x.token === state.invite.token);
  if (!c) return `<div class="invitewrap"><div class="empty">この登録用URLは無効です。</div></div>`;
  if (!state.invite.form) state.invite.form = {
    name:'', kana:'', is_generator:true, is_transporter:false,
    contact:'', email:'', password:'', password2:'',
    phone:'', postalcode:'', pref:'', address:'', invoice:'', bank:'', errors:[]
  };
  const f = state.invite.form;
  if (state.invite.done) {
    return `<div class="invitewrap">
      <div class="card"><div class="card-body text-center p-4">
        <div style="color:var(--success)">${ic('check',44)}</div>
        <h1 style="font-size:22px;font-weight:700;margin:8px 0">登録が完了しました</h1>
        <p class="mb-3">${esc(f.email)} でログインできます。</p>
        <a class="btn btn-primary" href="emitter-portal.html">排出者ポータルを開く</a>
        <div class="mt-3"><button class="btn btn-outline-secondary btn-sm mockbtn" data-act="go" data-route="m_companies">処理業者側の管理画面に戻る</button></div>
      </div></div></div>`;
  }
  const err = f.errors.length ? `<div class="alert alert-danger"><b>入力内容を確認してください</b>
    <ul class="mb-0 mt-2">${f.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : '';
  const fi = (k, label, type, ph, req) => `<label class="form-label">${label}${req ? '<span class="req">必須</span>' : '<span class="opt">任意</span>'}</label>
    <input type="${type || 'text'}" class="form-control" data-inv="${k}" value="${esc(f[k])}" placeholder="${ph || ''}">`;
  return `<div class="invitewrap">
    <div class="text-center mb-3">
      <div class="text-secondary" style="font-size:13px">株式会社エコクリーン埼玉 からの招待</div>
      <h1 style="font-size:22px;font-weight:700;margin:4px 0">取引先アカウントの登録</h1>
    </div>
    ${err}
    <div class="card"><div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-md-7">${fi('name','会社名','text','例：株式会社サンプル建設',1)}</div>
        <div class="col-12 col-md-5">${fi('kana','フリガナ','text','')}</div>
        <div class="col-12"><span class="form-label d-block">区分<span class="req">必須</span></span>
          <div class="d-flex gap-4">
            <div class="form-check"><input class="form-check-input" type="checkbox" data-inv="is_generator" ${f.is_generator ? 'checked' : ''}>
              <label class="form-check-label">排出事業者</label></div>
            <div class="form-check"><input class="form-check-input" type="checkbox" data-inv="is_transporter" ${f.is_transporter ? 'checked' : ''}>
              <label class="form-check-label">運搬業者</label></div>
          </div></div>
        <div class="col-12 col-md-6">${fi('contact','ご担当者名','text','',1)}</div>
        <div class="col-12 col-md-6">${fi('phone','電話番号','tel','',1)}</div>
        <div class="col-12">${fi('email','メールアドレス（ログインID）','email','',1)}</div>
        <div class="col-12 col-md-6">${fi('password','パスワード','password','8文字以上',1)}</div>
        <div class="col-12 col-md-6">${fi('password2','パスワード（確認）','password','',1)}</div>
        <div class="col-12 col-md-4">${fi('postalcode','郵便番号','text','')}</div>
        <div class="col-12 col-md-8">${fi('pref','都道府県','text','')}</div>
        <div class="col-12">${fi('address','住所','text','')}</div>
        <div class="col-12 col-md-6">${fi('invoice','インボイス登録番号','text','')}</div>
        <div class="col-12 col-md-6">${fi('bank','振込先口座','text','')}</div>
      </div>
      <button class="btn btn-primary w-100 mt-4" data-act="doInvite" data-token="${esc(c.token)}">この内容で登録する</button>
    </div></div>
    <div class="text-center mt-3">
      <button class="btn btn-outline-secondary btn-sm mockbtn" data-act="go" data-route="m_companies">処理業者側の管理画面に戻る</button>
    </div>
  </div>`;
}

/* =========================================================================
   拠点・品目・単位マスタ
   ========================================================================= */
function getPath(o, p) { return p.split('.').reduce((t,k) => (t == null ? t : t[k]), o); }
function setPath(o, p, v) {
  const ks = p.split('.'); let t = o;
  for (let i = 0; i < ks.length - 1; i++) { if (t[ks[i]] == null) t[ks[i]] = {}; t = t[ks[i]]; }
  t[ks[ks.length-1]] = v;
}
const MASTERS = {
  m_plants: {
    title:'拠点', data:() => PLANTS,
    cols:[
      {k:'name', label:'拠点名', type:'text', list:true, req:true},
      {k:'is_delivery', label:'持込受入', type:'bool', list:true},
      {k:'is_pickup', label:'引取対応', type:'bool', list:true},
      {k:'begin_time', label:'引取対応 開始', type:'time', list:true},
      {k:'end_time', label:'引取対応 終了', type:'time', list:true},
      {k:'postalcode', label:'郵便番号', type:'text'},
      {k:'pref', label:'都道府県', type:'text'},
      {k:'address', label:'住所', type:'text', list:true},
      {k:'phone', label:'電話番号', type:'text', list:true}
    ]
  },
  m_items: {
    title:'品目', data:() => ITEMS,
    cols:[
      {k:'name', label:'品目名', type:'text', list:true, req:true},
      {k:'type', label:'廃棄物区分', type:'select', list:true, opts:() => ITEM_TYPES, fmt:v => itemTypeName(v), req:true},
      {k:'is_value', label:'有価物', type:'bool', list:true}
    ]
  },
  m_units: {
    title:'単位', data:() => UNITS,
    cols:[{k:'name', label:'単位', type:'text', list:true, req:true}]
  }
};

function cellText(col, row) {
  const v = getPath(row, col.k);
  if (col.type === 'bool') return v ? `<span class="badge b-approved b-sq">${ic('check',13)}</span>` : '<span class="text-secondary">—</span>';
  if (col.fmt) return v == null || v === '' ? '<span class="text-secondary">—</span>' : col.fmt(v);
  if (col.type === 'select' && col.opts) {
    const o = col.opts().find(x => String(x.v) === String(v));
    return o ? esc(o.t) : (v ? esc(v) : '<span class="text-secondary">—</span>');
  }
  return v == null || v === '' ? '<span class="text-secondary">—</span>' : esc(v);
}
function viewMaster(route) {
  const m = MASTERS[route], rows = m.data(), cols = m.cols.filter(c => c.list);
  return pageHead(m.title,
    `<button class="btn btn-primary btn-sm" data-act="mAdd" data-m="${route}">${ic('plus',15)}新規登録</button>
     <button class="btn btn-outline-primary btn-sm" data-act="mCsv" data-m="${route}">${ic('download')}CSV出力</button>`) +
  `<div class="table-wrap"><table class="table table-hover mb-0">
    <thead><tr>${cols.map(c => `<th>${esc(c.label)}</th>`).join('')}<th></th></tr></thead>
    <tbody>${rows.length ? rows.map((r,i) => `<tr>
      ${cols.map(c => `<td>${cellText(c, r)}</td>`).join('')}
      <td class="text-end text-nowrap">
        ${route === 'm_plants' ? `<button class="btn btn-outline-secondary btn-sm" data-act="goHours" data-id="${r.id}">時間設定</button>` : ''}
        <button class="btn btn-outline-secondary btn-sm ms-1" data-act="mEdit" data-m="${route}" data-i="${i}">編集</button>
        <button class="btn btn-outline-danger btn-sm ms-1" data-act="mDel" data-m="${route}" data-i="${i}">削除</button></td>
    </tr>`).join('') : `<tr><td colspan="${cols.length + 1}" class="text-center text-secondary py-4">登録がありません</td></tr>`}</tbody>
  </table></div>`;
}
var MODALS_MASTER = m => {
  const mm = MASTERS[m.m], d = m.row;
  const field = c => {
    const v = getPath(d, c.k);
    const lbl = `<label class="form-label">${esc(c.label)}${c.req ? '<span class="req">必須</span>' : ''}</label>`;
    if (c.type === 'bool') return `<div class="form-check mt-4"><input class="form-check-input" type="checkbox" data-mod="row.${c.k}" ${v ? 'checked' : ''}>
      <label class="form-check-label">${esc(c.label)}</label></div>`;
    if (c.type === 'select') return `${lbl}<select class="form-select" data-mod="row.${c.k}">${opts(c.opts(), v)}</select>`;
    if (c.type === 'time') return `${lbl}<input type="time" step="1800" class="form-control" data-mod="row.${c.k}" value="${esc(v || '')}">`;
    return `${lbl}<input type="text" class="form-control" data-mod="row.${c.k}" value="${esc(v || '')}">`;
  };
  return {
    title:`${mm.title}　${m.idx == null ? '新規登録' : '編集'}`,
    body:`<div class="row g-3">${mm.cols.map(c => `<div class="col-12 col-md-6">${field(c)}</div>`).join('')}</div>
      ${m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="mSave">保存</button>`
  };
};
