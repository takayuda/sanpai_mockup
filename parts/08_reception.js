
/* =========================================================================
   入場受付・計量
   ========================================================================= */
/* 申告数量の重量換算（kg）。t/kg 以外の単位は換算しない */
function declaredKg(pickupId) {
  return linesOf(pickupId).reduce((s,l) => {
    const u = unit(l.unit_id).name;
    if (u === 't') return s + Number(l.qty) * 1000;
    if (u === 'kg') return s + Number(l.qty);
    return s;
  }, 0);
}
const todayList = () => PICKUPS.filter(p => p.date === D(0) && inScope(p) && ['approved','arrived','done'].includes(p.status));
function nextReceiptNumber(plantId, ds) {
  const n = PICKUPS.filter(p => p.plant_id === plantId && p.date === ds && p.receipt_number)
    .reduce((a,p) => Math.max(a, p.receipt_number), 0);
  return n + 1;
}

function viewReception() {
  const q = state.reception.q.trim();
  let list = todayList();
  if (q) list = list.filter(p => (p.id + (p.car_number || '') + company(p.company_id).name).includes(q));
  list.sort((a,b) => a.begin_time < b.begin_time ? -1 : 1);

  const st = p => p.status === 'done' ? {t:'計量済', c:'b-approved'}
    : p.status === 'arrived' ? {t:'入場済（計量待ち）', c:'b-pending'} : {t:'未着', c:'b-neutral'};

  const rows = list.map(p => {
    const s = st(p);
    return `<tr>
      <td class="mono">${p.id}${p.receipt_number ? `<div class="text-secondary" style="font-size:11px">伝票 No.${p.receipt_number}</div>` : ''}</td>
      <td>${tBadge(p.type)}</td>
      <td class="mono nowrap">${timeRange(p)}</td>
      <td>${esc(company(p.company_id).name)}<div class="text-secondary" style="font-size:11px">${esc(plantShort(p.plant_id))}</div></td>
      <td style="font-size:13px">${esc(linesText(p.id))}</td>
      <td class="mono" style="font-size:13px">${esc(p.car_number || '—')}</td>
      <td>${p.weight != null ? `<b>${num(p.weight)}</b> kg` : '—'}</td>
      <td><span class="badge ${s.c}">${s.t}</span>${p.arrived_at ? `<div class="text-secondary" style="font-size:11px">入場 ${esc(p.arrived_at)}</div>` : ''}</td>
      <td class="text-end text-nowrap">
        ${p.status === 'approved' ? `<button class="btn btn-primary btn-sm" data-act="doArrive" data-id="${p.id}">入場受付</button>` : ''}
        ${p.status === 'arrived' ? `<button class="btn btn-primary btn-sm" data-act="openWeigh" data-id="${p.id}">計量入力</button>` : ''}
        ${p.status === 'done' ? `<button class="btn btn-outline-secondary btn-sm" data-act="openPickupDetail" data-id="${p.id}">実績を見る</button>` : ''}
        ${p.status !== 'done' ? `<button class="btn btn-outline-danger btn-sm ms-1" data-act="openRefuse" data-id="${p.id}">受入不可</button>` : ''}
      </td></tr>`;
  }).join('');

  const arrived = list.filter(p => p.status === 'arrived').length;
  const done = list.filter(p => p.status === 'done').length;
  const netToday = list.filter(p => p.weight).reduce((s,p) => s + p.weight, 0);

  return pageHead('入場受付・計量',
    `<button class="btn btn-outline-primary btn-sm" data-act="openSpot">${ic('plus',15)}飛び込み搬入を登録</button>`) +
  `<div class="row g-3 mb-3">
    <div class="col-6 col-lg-3">${kpi('本日の予定', list.length + ' <small>件</small>')}</div>
    <div class="col-6 col-lg-3">${kpi('入場済（計量待ち）', arrived + ' <small>件</small>', '', arrived ? 'alert-kpi' : '')}</div>
    <div class="col-6 col-lg-3">${kpi('計量済', done + ' <small>件</small>')}</div>
    <div class="col-6 col-lg-3">${kpi('本日の正味重量', num(netToday) + ' <small>kg</small>')}</div>
  </div>
  <div class="filterbar">
    <div class="f" style="flex:1"><label>検索</label>
      <input type="text" class="form-control" data-act="recQ" value="${esc(state.reception.q)}" placeholder="受付番号・車両ナンバー・取引先" autocomplete="off"></div>
    <div class="align-self-center fw-bold">${fmtJp(D(0))}</div>
  </div>
  <div class="table-wrap">
    <table class="table table-hover mb-0">
      <thead><tr><th>受付番号</th><th>区分</th><th>時間</th><th>取引先・拠点</th><th>申告内容</th><th>車両ナンバー</th><th>正味重量</th><th>状態</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="9" class="text-center text-secondary py-4">該当する予約がありません</td></tr>`}</tbody>
    </table>
  </div>`;
}

/* ---------- 計量モーダル ---------- */
function weighInit(id) {
  return {
    id, total_weight:'', car_weight:'',
    lines: linesOf(id).map(l => ({id:l.id, item_id:l.item_id, unit_id:l.unit_id, qty:l.qty, actual_qty:dec(l.qty)})),
    diff_reason:''
  };
}
var MODALS_WEIGH = m => {
  const p = pk(m.id);
  const net = Number(m.total_weight) - Number(m.car_weight);
  const netOk = m.total_weight !== '' && m.car_weight !== '' && net > 0;
  const dec_kg = declaredKg(p.id);
  const diff = netOk ? net - dec_kg : 0;
  const hasDiff = netOk && dec_kg > 0 && Math.abs(diff) / dec_kg > 0.1;

  const lineRows = m.lines.map((l,i) => {
    const d = Number(l.actual_qty) - Number(l.qty);
    return `<tr>
      <td><select class="form-select form-select-sm" data-mod="lines.${i}.item_id" data-rerender="1">${opts(o1(ITEMS), l.item_id, false)}</select></td>
      <td class="num">${dec(l.qty)}</td>
      <td class="num"><input type="text" inputmode="decimal" class="form-control form-control-sm text-end" style="width:96px" data-mod="lines.${i}.actual_qty" data-rerender="1" value="${esc(l.actual_qty)}"></td>
      <td><select class="form-select form-select-sm" style="width:90px" data-mod="lines.${i}.unit_id" data-rerender="1">${opts(o1(UNITS), l.unit_id, false)}</select></td>
      <td class="num ${Math.abs(d) > 0.001 ? 'text-danger fw-bold' : ''}">${d > 0 ? '+' : ''}${dec(d)}</td>
      <td>${m.lines.length > 1 ? `<button class="btn btn-outline-danger btn-sm btn-icon" data-act="weighRemoveLine" data-idx="${i}" aria-label="削除">${ic('trash',14)}</button>` : ''}</td>
    </tr>`;
  }).join('');

  return {
    title:`計量入力　${p.id}　${esc(company(p.company_id).name)}`,
    body:`<div class="row g-3 mb-3">
        <div class="col-6 col-md-3"><label class="form-label">総重量（kg）<span class="req">必須</span></label>
          <input type="text" inputmode="numeric" class="form-control" data-mod="total_weight" data-rerender="1" value="${esc(m.total_weight)}" placeholder="例：6120"></div>
        <div class="col-6 col-md-3"><label class="form-label">空車重量（kg）<span class="req">必須</span></label>
          <input type="text" inputmode="numeric" class="form-control" data-mod="car_weight" data-rerender="1" value="${esc(m.car_weight)}" placeholder="例：2480"></div>
        <div class="col-12 col-md-6">${kpi('正味重量（自動算出）', netOk ? num(net) + ' <small>kg</small>' : '<small class="text-secondary">総重量・空車重量を入力</small>',
          netOk && dec_kg ? `申告 ${num(dec_kg)} kg ／ 差異 ${diff > 0 ? '+' : ''}${num(diff)} kg` : '')}</div>
      </div>
      <h6 style="font-size:14px;font-weight:700">実搬入内容</h6>
      <div class="table-wrap mb-2"><table class="table table-sm mb-0">
        <thead><tr><th style="width:34%">品目</th><th class="num">申告</th><th class="num">実数量</th><th>単位</th><th class="num">差異</th><th></th></tr></thead>
        <tbody>${lineRows}</tbody></table></div>
      <button class="btn btn-outline-primary btn-sm mb-3" data-act="weighAddLine">${ic('plus',15)}品目を追加</button>
      ${hasDiff ? `<div class="mb-3"><label class="form-label">差異理由<span class="req">必須</span></label>
        <select class="form-select" data-mod="diff_reason">${opts([
          {v:'実測差（申告は目安）',t:'実測差（申告は目安）'},{v:'品目の相違',t:'品目の相違'},
          {v:'積込時に追加発生分あり',t:'積込時に追加発生分あり'},{v:'異物混入',t:'異物混入'},{v:'その他',t:'その他'}], m.diff_reason)}</select></div>` : ''}
      ${m.err ? `<div class="text-danger" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="doWeigh" data-id="${p.id}">実績を確定する</button>`
  };
};

/* ---------- 飛び込み搬入 ---------- */
var MODALS_SPOT = m => {
  const net = Number(m.total_weight) - Number(m.car_weight);
  return {
    title:'飛び込み搬入の登録',
    body:`<div class="row g-3">
        <div class="col-12 col-md-6"><label class="form-label">取引先<span class="req">必須</span></label>
          <select class="form-select" data-mod="company_id">${opts(o1(COMPANIES), m.company_id)}</select></div>
        <div class="col-12 col-md-6"><label class="form-label">拠点<span class="req">必須</span></label>
          <select class="form-select" data-mod="plant_id">${opts(o1(PLANTS.filter(p => p.is_delivery)), m.plant_id, false)}</select></div>
        <div class="col-12 col-md-6"><label class="form-label">品目<span class="req">必須</span></label>
          <select class="form-select" data-mod="item_id">${opts(o1(ITEMS), m.item_id)}</select></div>
        <div class="col-6 col-md-3"><label class="form-label">数量<span class="req">必須</span></label>
          <input type="text" inputmode="decimal" class="form-control" data-mod="qty" value="${esc(m.qty || '')}"></div>
        <div class="col-6 col-md-3"><label class="form-label">単位<span class="req">必須</span></label>
          <select class="form-select" data-mod="unit_id">${opts(o1(UNITS), m.unit_id)}</select></div>
        <div class="col-12 col-md-6"><label class="form-label">車両ナンバー</label>
          <input type="text" class="form-control" data-mod="car_number" value="${esc(m.car_number || '')}"></div>
        <div class="col-6 col-md-3"><label class="form-label">総重量(kg)<span class="req">必須</span></label>
          <input type="text" inputmode="numeric" class="form-control" data-mod="total_weight" data-rerender="1" value="${esc(m.total_weight || '')}"></div>
        <div class="col-6 col-md-3"><label class="form-label">空車重量(kg)<span class="req">必須</span></label>
          <input type="text" inputmode="numeric" class="form-control" data-mod="car_weight" data-rerender="1" value="${esc(m.car_weight || '')}"></div>
        <div class="col-12">${kpi('正味重量', m.total_weight && m.car_weight ? num(net) + ' <small>kg</small>' : '—')}</div>
      </div>
      ${m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="doSpot">実績として登録</button>`
  };
};

/* ---------- 受入拒否・集荷不可 ---------- */
var MODALS_REFUSE = m => {
  const p = pk(m.id);
  return {
    title:`${p.id} の${p.type === 'drop' ? '受入拒否' : '集荷不可'}を記録`,
    body:`<div class="mb-0"><label class="form-label">理由<span class="req">必須</span></label>
        <select class="form-select" data-mod="reason">${opts(
          (p.type === 'drop'
            ? ['異物混入のため受入不可','契約外品目のため受入不可','車両・書類不備','その他']
            : ['現場都合により集荷不可','荷量が想定を大きく超過','進入不可（道幅・駐車）','その他']
          ).map(x => ({v:x,t:x})), m.reason)}</select>
        ${m.err ? `<div class="text-danger mt-1" style="font-size:13px">${esc(m.err)}</div>` : ''}</div>`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">やめる</button>
          <button class="btn btn-outline-danger" data-act="doRefuse" data-id="${p.id}">記録する</button>`
  };
};
