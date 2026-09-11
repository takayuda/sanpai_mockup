/* =========================================================================
   共通処理（全ページで読み込む）
   - 画面の枠（ヘッダー・サイドバー・モーダル）の生成
   - 画面ごとのスクリプトは ACTIONS / MODALS に処理を登録する
   ========================================================================= */

/* ---------- アイコン ---------- */
const ICONS = {
  inbox:'<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  clipboard:'<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>',
  phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  truck:'<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  chart:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  factory:'<path d="M3 21h18"/><path d="M5 21V9l6 4V9l6 4V5h2v16"/><line x1="8" y1="17" x2="8" y2="17.01"/><line x1="13" y1="17" x2="13" y2="17.01"/>',
  box:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  hash:'<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  menu:'<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  mail:'<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  check:'<polyline points="20 6 9 17 4 12"/>',
  alert:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  x:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  left:'<polyline points="15 18 9 12 15 6"/>',
  right:'<polyline points="9 18 15 12 9 6"/>',
  edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  login:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
  chevronDown:'<polyline points="6 9 12 15 18 9"/>',
  chevronRight:'<polyline points="9 18 15 12 9 6"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>'
};
const ic = (n, size) => `<svg class="ic" width="${size || 18}" height="${size || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- 取引先の登録用URL ---------- */
const INVITE_BASE = 'https://sanpai.example.jp/invite/';
const randToken = () => Math.random().toString(36).slice(2,10) + Math.random().toString(36).slice(2,4);

/* ---------- ページ定義 ---------- */
const PAGES = {
  index:       {file:'index.html',     title:'画面一覧'},
  approvals:   {file:'approvals.html', title:'予約の承認'},
  board:       {file:'board.html',     title:'確定した予約'},
  proxy:       {file:'proxy.html',     title:'予約の代行作成'},
  hours:       {file:'hours.html',     title:'受付時間・休業日'},
  reception:   {file:'reception.html', title:'計量入力'},
  actuals:     {file:'actuals.html',   title:'実績一覧'},
  m_companies: {file:'companies.html', title:'取引先'},
  m_plants:    {file:'plants.html',    title:'拠点'},
  m_items:     {file:'items.html',     title:'品目'},
  m_units:     {file:'units.html',     title:'単位'},
  invite:      {file:'invite.html',    title:'取引先アカウントの登録'},
  emitter:     {file:'emitter.html',   title:'排出者ポータル'}
};
/* 単一ファイル版ではページ遷移せずハッシュで切り替える */
const IS_SINGLE = !!window.SINGLE_FILE;
const hrefOf = r => IS_SINGLE ? '#' + r : PAGES[r].file;

/* =========================================================================
   共通ユーティリティ
   ========================================================================= */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num = n => Number(n ?? 0).toLocaleString('ja-JP');
const dec = (n, d=2) => Number(n ?? 0).toFixed(d).replace(/\.?0+$/,'');
const opts = (list, cur, ph) =>
  (ph === false ? '' : `<option value="">${ph || '選択してください'}</option>`) +
  list.map(o => `<option value="${esc(o.v)}"${String(o.v) === String(cur) ? ' selected':''}>${esc(o.t)}</option>`).join('');
const o1 = (arr, key='id', label='name') => arr.map(x => ({v:x[key], t:x[label]}));

const company = id => COMPANIES.find(x => x.id === id) || {};
const plant   = id => PLANTS.find(x => x.id === id) || {};
const item    = id => ITEMS.find(x => x.id === id) || {};
const unit    = id => UNITS.find(x => x.id === id) || {};
const pk      = id => PICKUPS.find(x => x.id === id);
/* 一覧では拠点名の括弧書きを落として表示する */
const plantShort = id => (plant(id).name || '').replace(/（.*?）/g, '');
const linesOf = id => PICKUP_ITEMS.filter(x => x.pickup_id === id);
const itemTypeName = t => (ITEM_TYPES.find(x => x.v === Number(t)) || {}).t || '—';

const lineText = l => `${item(l.item_id).name} ${dec(l.qty)}${unit(l.unit_id).name}`;
const linesText = id => linesOf(id).map(lineText).join(' ／ ');
const typeLabel = t => t === 'drop' ? '持込' : '引取';
const timeRange = p => `${p.begin_time} 〜 ${p.end_time}`;
const companyKind = c => [c.is_generator ? '排出事業者' : '', c.is_transporter ? '運搬業者' : ''].filter(Boolean).join('／') || '—';

/* kg 表記（1,000kg 以上は t を併記） */
const kg = v => v == null || v === '' ? '—' : `${num(v)} kg` + (Math.abs(v) >= 1000 ? `（${dec(v/1000)} t）` : '');

/* ---------- ステータス ---------- */
const STATUS = {
  pending:  {t:'申請中', c:'b-pending'},
  approved: {t:'承認済', c:'b-approved'},
  rejected: {t:'差戻し', c:'b-rejected'},
  done:     {t:'計量済', c:'b-neutral'},
  canceled: {t:'取消',   c:'b-neutral'}
};
const stBadge = s => `<span class="badge ${STATUS[s].c}">${STATUS[s].t}</span>`;
const tBadge  = t => `<span class="badge b-method b-sq">${typeLabel(t)}</span>`;

/* ---------- 拠点の稼働・時間枠 ---------- */
const holidayOf = (plantId, ds) => HOLIDAYS.find(h => h.plant_id === plantId && h.date === ds);
function isClosed(plantId, ds) {
  const pl = plant(plantId);
  if (!pl.id) return false;
  if ((pl.closed_dows || []).includes(parseD(ds).getDay())) return {reason:'定休日'};
  const h = holidayOf(plantId, ds);
  return h ? {reason:h.reason} : false;
}
/* 指定日の予約件数（上限は設けない。承認判断の参考情報として表示する） */
function countOf(plantId, ds) {
  const t = PICKUPS.filter(p => p.plant_id === plantId && p.date === ds && !['canceled','rejected'].includes(p.status));
  return {
    drop: t.filter(p => p.type === 'drop').length,
    pickup: t.filter(p => p.type === 'pickup').length,
    pendingDrop: t.filter(p => p.type === 'drop' && p.status === 'pending').length,
    pendingPickup: t.filter(p => p.type === 'pickup' && p.status === 'pending').length
  };
}
const slotOf = (pl, p) => (pl.slots || []).find(s => s.from === p.begin_time && s.to === p.end_time);
const inHours = (pl, p) => p.begin_time >= pl.begin_time && p.end_time <= pl.end_time;

/* ---------- 予約の締切（取引先が自分で予約・変更できる期限） ---------- */
const nowStamp = () => { const d = new Date(); return `${D(0)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
/* 指定日の予約に対する締切日時（例：前日17:00） */
function deadlineAt(plantId, ds) {
  const pl = plant(plantId);
  const d = addDays(parseD(ds), -(pl.deadline_days == null ? 1 : pl.deadline_days));
  return `${dstr(d)} ${pl.deadline_time || '17:00'}`;
}
/* 締切を過ぎているか（過ぎていても社内は登録・変更できる） */
const isPastDeadline = (plantId, ds) => deadlineAt(plantId, ds) <= nowStamp();
/* 予約日として選べる最小の日付（過去日は不可） */
const minDate = () => D(0);
const deadlineLabel = pl => `${pl.deadline_days === 0 ? '当日' : pl.deadline_days === 1 ? '前日' : pl.deadline_days + '日前'} ${pl.deadline_time}`;


const NAV = [
  {sec:'受付・承認', items:[
    {route:'approvals', label:'予約の承認',     ico:'inbox', badge:true},
    {route:'board',     label:'確定した予約',   ico:'clipboard'},
    {route:'proxy',     label:'予約の代行作成', ico:'phone'}
  ]},
  {sec:'稼働設定', items:[
    {route:'hours',     label:'受付時間・休業日', ico:'clock'}
  ]},
  {sec:'実績', items:[
    {route:'reception', label:'計量入力',       ico:'truck'},
    {route:'actuals',   label:'実績一覧',       ico:'chart'}
  ]},
  {sec:'マスタ', items:[
    {route:'m_companies', label:'取引先', ico:'users'},
    {route:'m_plants',    label:'拠点',   ico:'factory'},
    {route:'m_items',     label:'品目',   ico:'box'},
    {route:'m_units',     label:'単位',   ico:'hash'}
  ]}
];


/* =========================================================================
   画面の状態（ページをまたぐものは sessionStorage で引き継ぐ）
   ========================================================================= */
const UI_KEY = 'sanpai-mock-ui';
const defaultState = () => ({
  route:'approvals', plantId:'all', modal:null, emitter:false,
  approval:{sel:null, type:'all', keyword:''},
  board:{date:D(0), tab:'all', showVoid:false},
  proxy:null,
  hours:{plantId:'pl1', month:ymOf(D(0))},
  reception:{q:'', date:D(0)},
  actuals:{from:D(-30), to:D(0), companyId:'', itemId:'', type:'', diffOnly:false},
  master:{},
  invite:{token:null, form:null, done:false}
});
const state = defaultState();
(function restoreUI() {
  try {
    const o = JSON.parse(sessionStorage.getItem(UI_KEY) || 'null');
    if (!o) return;
    if (o.plantId) state.plantId = o.plantId;
    ['board','hours','reception','actuals'].forEach(k => Object.assign(state[k], o[k] || {}));
    if (o.approval) { state.approval.type = o.approval.type; state.approval.keyword = o.approval.keyword; }
  } catch (e) {}
})();
function saveUI() {
  try {
    sessionStorage.setItem(UI_KEY, JSON.stringify({
      plantId:state.plantId, board:state.board, hours:state.hours,
      reception:{q:state.reception.q, date:state.reception.date}, actuals:state.actuals,
      approval:{type:state.approval.type, keyword:state.approval.keyword}
    }));
  } catch (e) {}
}
/* ヘッダーの拠点セレクタで対象を絞り込む */
const plantScope = () => state.plantId === 'all' ? PLANTS.map(p => p.id) : [state.plantId];
const inScope = p => plantScope().includes(p.plant_id);

/* ---------- トースト ---------- */
function toast(msg, kind) {
  const host = document.getElementById('elToast');
  const el = document.createElement('div');
  el.className = 'toast-item' + (kind ? ' ' + kind : '');
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/* ---------- モーダル ---------- */
let bsModal = null;
function openModal(kind, payload, size) {
  state.modal = Object.assign({kind}, payload || {});
  document.getElementById('elModalDialog').className =
    'modal-dialog modal-dialog-scrollable ' + (size || 'modal-lg');
  renderModal();
  if (!bsModal) {
    bsModal = new bootstrap.Modal(document.getElementById('appModal'));
    document.getElementById('appModal').addEventListener('hidden.bs.modal', () => { state.modal = null; });
  }
  bsModal.show();
}
function closeModal() { if (bsModal) bsModal.hide(); state.modal = null; }
function renderModal() {
  if (!state.modal) return;
  const m = MODALS[state.modal.kind](state.modal);
  document.getElementById('elModalTitle').innerHTML = m.title;
  document.getElementById('elModalBody').innerHTML = m.body;
  document.getElementById('elModalFoot').innerHTML = m.foot || '';
}

/* ---------- CSV 出力 ---------- */
function downloadCsv(filename, rows) {
  const csv = rows.map(r => r.map(v => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  }).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- 共通パーツ ---------- */
function pageHead(title, actions) {
  return `<div class="page-h"><h1>${title}</h1>
    <div class="ms-auto d-flex gap-2 flex-wrap">${actions || ''}</div></div>`;
}
function dl(pairs) {
  return `<dl class="dl">${pairs.map(([k,v]) => `<dt>${k}</dt><dd>${v == null || v === '' ? '<span class="text-secondary">—</span>' : v}</dd>`).join('')}</dl>`;
}
function kpi(t, v, sub, cls) {
  return `<div class="kpi ${cls || ''}"><div class="t">${t}</div><div class="v">${v}${sub ? ` <small>${sub}</small>` : ''}</div></div>`;
}
const pendingList = () => PICKUPS.filter(p => p.status === 'pending' && inScope(p));
const pendingCount = () => pendingList().length;



/* ---------- 複数のページで使う採番・換算 ---------- */
/* 申告数量の重量換算（kg）。t/kg 以外の単位は換算しない */
function declaredKg(pickupId) {
  return linesOf(pickupId).reduce((s,l) => {
    const u = unit(l.unit_id).name;
    if (l.qty == null) return s;
    if (u === 't') return s + Number(l.qty) * 1000;
    if (u === 'kg') return s + Number(l.qty);
    return s;
  }, 0);
}
function nextPickupNo() {
  const n = PICKUPS.map(p => Number(p.id.slice(-4))).reduce((a,b) => Math.max(a,b), 0);
  return 'R-2026-' + String(n + 1).padStart(4, '0');
}

/* =========================================================================
   画面の枠（ヘッダー・サイドバー・モーダル）
   ========================================================================= */
const CHROME = `
<header class="topbar">
  <button class="btn btn-outline-secondary btn-sm btn-icon d-lg-none" data-act="toggleNav" aria-label="メニュー" id="elMenuBtn"></button>
  <div class="brand" id="elBrand"></div>
  <div class="ms-auto d-flex align-items-center gap-2">
    <a class="btn btn-outline-secondary btn-sm mockbtn" id="elEmitterBtn" data-act="openEmitter"></a>
    <select class="form-select form-select-sm" style="width:auto;" data-act="switchPlant" id="elPlantSel" aria-label="拠点"></select>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-act="openNotif" aria-label="通知" id="elNotifBtn"></button>
  </div>
</header>
<nav class="sidebar" id="elSidebar" aria-label="メインメニュー"></nav>
<div class="modal fade" id="appModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-scrollable" id="elModalDialog">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title" id="elModalTitle"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button></div>
      <div class="modal-body" id="elModalBody"></div>
      <div class="modal-footer" id="elModalFoot"></div>
    </div>
  </div>
</div>
<div class="toast-host" id="elToast"></div>`;

const BRAND_ADMIN  = '産廃予約管理システム<span>株式会社エコクリーン埼玉（処理業者）</span>';
const BRAND_INVITE = '産廃予約システム<span>取引先アカウント登録</span>';

let PAGE = {route:'approvals', view:() => '', chrome:'admin'};

function applyChromeMode() {
  const plain = PAGE.chrome === 'plain';
  document.body.classList.toggle('invite-mode', plain);
  document.getElementById('elBrand').innerHTML = plain ? BRAND_INVITE : BRAND_ADMIN;
  ['elPlantSel','elNotifBtn','elEmitterBtn','elMenuBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = plain ? 'none' : '';
  });
}
function buildChrome() {
  document.body.insertAdjacentHTML('afterbegin', CHROME);
  applyChromeMode();
  if (PAGE.chrome === 'plain') return;
  const ps = document.getElementById('elPlantSel');
  ps.innerHTML = `<option value="all">すべての拠点</option>` +
    PLANTS.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  ps.value = state.plantId;
  document.getElementById('elMenuBtn').innerHTML = ic('menu');
  const em = document.getElementById('elEmitterBtn');
  em.innerHTML = ic('login',15) + '排出者側の画面';
  em.href = hrefOf('emitter');
}

function renderSidebar() {
  document.getElementById('elSidebar').innerHTML =
    `<a href="${hrefOf('index')}" class="navitem ${PAGE.route === 'index' ? 'active' : ''}" data-act="go" data-route="index">
       <span class="ico">${ic('grid',17)}</span><span>画面一覧</span></a>` +
    NAV.map(sec => {
      const items = sec.items.map(it => {
        const cnt = it.badge ? pendingCount() : 0;
        return `<a href="${hrefOf(it.route)}" class="navitem ${PAGE.route === it.route ? 'active' : ''}" data-act="go" data-route="${it.route}">
          <span class="ico">${ic(it.ico, 17)}</span><span>${it.label}</span>
          ${cnt ? `<span class="cnt">${cnt}</span>` : ''}</a>`;
      }).join('');
      return `<div class="navsec">${sec.sec}</div>${items}`;
    }).join('');
}

/* ---------- 入力中のフォーカスを保つ ---------- */
function focusKey(el) {
  if (!el || !el.dataset) return null;
  const d = el.dataset;
  if (d.px)  return 'px:'  + d.px;
  if (d.mod) return 'mod:' + d.mod;
  if (d.inv) return 'inv:' + d.inv;
  if (d.key) return 'key:' + d.key;
  return null;
}
function restoreFocus(key, pos) {
  if (!key) return;
  const i = key.indexOf(':'), t = key.slice(0, i), v = key.slice(i+1);
  const el = document.querySelector(`[data-${t}="${window.CSS && CSS.escape ? CSS.escape(v) : v}"]`);
  if (!el) return;
  el.focus({preventScroll:true});
  try { el.setSelectionRange(pos, pos); } catch (e) {}
}

function render() {
  const y = window.scrollY;
  const af = document.activeElement, fk = focusKey(af);
  const pos = af && af.setSelectionRange ? (af.selectionStart || 0) : 0;
  if (PAGE.chrome !== 'plain') {
    renderSidebar();
    const n = pendingCount();
    document.getElementById('elNotifBtn').innerHTML =
      ic('bell') + (n ? ` <span class="badge b-rejected b-sq" style="padding:1px 6px">${n}</span>` : '');
    document.getElementById('elPlantSel').value = state.plantId;
  }
  document.getElementById('elView').innerHTML = PAGE.view();
  if (PAGE.after) PAGE.after();
  window.scrollTo(0, y);
  restoreFocus(fk, pos);
  saveData(); saveUI();
}

/* 画面遷移（分割版はページ遷移、単一ファイル版はハッシュ切替） */
function go(route) {
  saveData(); saveUI();
  if (IS_SINGLE) gotoRoute(route);
  else location.href = hrefOf(route);
}

/* ページごとのスクリプトから呼ぶ。route はサイドバーの選択表示に使う */
function mount(route, view, opts) {
  PAGE = {route, view, chrome:(opts && opts.chrome) || 'admin'};
  buildChrome();
  render();
}

/* =========================================================================
   イベント（画面ごとの処理は ACTIONS に登録する）
   ========================================================================= */
const ACTIONS = {};
const MODALS = {};
const INPUT_HOOKS = [];    /* ページごとの入力処理（登録された順に試す） */
const CHANGE_HOOKS = [];

document.addEventListener('input', e => {
  const d = e.target.dataset;
  const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (d.mod) { modBind(d.mod, val); if (d.rerender) renderModal(); return; }
  for (const h of INPUT_HOOKS) if (h(e, d, val, false)) return;
});
/* テキスト入力の change はフォーカスが外れた瞬間に発火する。ここで再描画すると
   クリックしようとしたボタンが作り直されてクリックが失われるため、
   再描画はセレクト・チェックボックス・日付だけに限定する */
document.addEventListener('change', e => {
  const d = e.target.dataset;
  const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  const structural = e.target.tagName === 'SELECT' || ['checkbox','radio','date'].includes(e.target.type);
  if (d.mod) { modBind(d.mod, val); if (structural) renderModal(); return; }
  if (d.act === 'switchPlant') { state.plantId = val; state.approval.sel = null; render(); return; }
  for (const h of CHANGE_HOOKS) if (h(e, d, val, structural)) return;
});

function modBind(key, val) {
  const m = state.modal; if (!m) return;
  if (key.startsWith('row.')) { setPath(m.row, key.slice(4), val); return; }
  if (key.startsWith('pi.')) {          /* 計量時の「含まれていた品目」 */
    const id = key.slice(3);
    m.items = m.items || [];
    if (val) { if (!m.items.includes(id)) m.items.push(id); }
    else m.items = m.items.filter(x => x !== id);
    return;
  }
  setPath(m, key, val);
}
function getPath(o, p) { return p.split('.').reduce((t,k) => (t == null ? t : t[k]), o); }
function setPath(o, p, v) {
  const ks = p.split('.'); let t = o;
  for (let i = 0; i < ks.length - 1; i++) { if (t[ks[i]] == null) t[ks[i]] = {}; t = t[ks[i]]; }
  t[ks[ks.length-1]] = v;
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act;
  if (['SELECT','INPUT','TEXTAREA'].includes(el.tagName)) return;
  if (el.tagName === 'A') e.preventDefault();   /* 遷移は ACTIONS 側で行う */
  const fn = ACTIONS[a];
  if (fn) { fn(el.dataset, el, e); saveData(); }
});

const nowHm = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ---------- 全ページ共通の操作 ---------- */
Object.assign(ACTIONS, {
  toggleNav: () => document.getElementById('elSidebar').classList.toggle('open'),
  closeModal: () => { closeModal(); render(); },
  openNotif: () => {
    toast(`承認待ち ${pendingCount()} 件（通知チャネルはLINE／LINE WORKS等を想定・要確定）`);
    go('approvals');
  },
  openPickupDetail: d => openModal('pickup', {id:d.id}),
  go: d => go(d.route),
  openEmitter: () => go('emitter'),
  resetData: () => {
    if (!confirm('入力した内容をすべて破棄して、最初の状態に戻します。よろしいですか？')) return;
    resetData(); toast('データを初期化しました。'); render();
  }
});

/* ---------- 予約詳細 ---------- */
MODALS.pickup = m => {
  const p = pk(m.id), co = company(p.company_id), pl = plant(p.plant_id);
  const rows = [
    ['受付番号', `<span class="mono">${p.id}</span>`],
    ['ステータス', stBadge(p.status)],
    ['区分', typeLabel(p.type)],
    ['取引先', esc(co.name)],
    ['拠点', esc(pl.name)],
    ['日付', fmtJp(p.date)],
    ['時間', timeRange(p)],
    ['申請', `${esc(p.via)}　${esc(p.applied_at)}`]
  ];
  if (p.type === 'drop') rows.push(['車両ナンバー', esc(p.car_number)]);
  else rows.push(['引取場所', `${esc(p.site_name || '')}／${esc(p.site_addr || '')}`]);
  linesOf(p.id).forEach((l,i) => rows.push([`品目 ${i+1}`,
    `${esc(item(l.item_id).name)}${l.qty != null ? `　申告 ${dec(l.qty)} ${esc(unit(l.unit_id).name)}` : '　<span class="text-secondary">（申告になし）</span>'}`]));
  if (p.note) rows.push(['連絡事項', esc(p.note)]);
  if (p.approved_at) rows.push(['承認', `${esc(p.approved_at)}／${esc(p.approved_by)}`]);
  if (p.dispatch_note) rows.push(['集荷手配メモ', esc(p.dispatch_note)]);
  if (p.reject_reason) rows.push(['変更依頼の理由', `${esc(p.reject_reason)}<div class="text-secondary" style="font-size:12px">${esc(p.rejected_at || '')}</div>`]);
  if (p.cancel_reason) rows.push(['取消理由', esc(p.cancel_reason)]);
  if (p.arrived_at) rows.push(['着車時間', `${esc(p.arrived_at)}${p.receipt_number ? `　伝票番号 No.${p.receipt_number}` : ''}`]);
  if (p.weight != null) rows.push(
    ['正味重量', `<b>${kg(p.weight)}</b>`],
    ['申告との差異', `${p.diff > 0 ? '+' : ''}${num(p.diff)} kg`]);
  if (p.weigh_memo) rows.push(['計量時の備考', esc(p.weigh_memo)]);
  return {
    title:`予約詳細 ${p.id}`,
    body: dl(rows),
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">閉じる</button>`
  };
};
