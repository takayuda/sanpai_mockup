
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

/* =========================================================================
   画面定義
   ========================================================================= */
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
   画面状態
   ========================================================================= */
const state = {
  route:'approvals', plantId:'all', modal:null, emitter:false,
  approval:{sel:null, type:'all', keyword:''},
  board:{date:D(0), tab:'all', showVoid:false},
  proxy:null,
  hours:{plantId:'pl1', month:ymOf(D(0))},
  reception:{q:'', date:D(0)},
  actuals:{from:D(-30), to:D(0), companyId:'', itemId:'', type:'', diffOnly:false},
  master:{},
  invite:{token:null, form:null}
};
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
