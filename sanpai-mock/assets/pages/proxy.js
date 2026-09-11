
/* =========================================================================
   予約の代行作成（電話で受けた予約・集荷依頼を社内が入力）
   ========================================================================= */
const blankLine = () => ({item_id:'', qty:'', unit_id:''});
const blankProxy = () => ({
  company_id:'', plant_id: state.plantId !== 'all' ? state.plantId : PLANTS[0].id, type:'', date:'', slotId:'',
  begin_time:'', end_time:'',
  lines:[blankLine()],
  car_number:'', site_name:'', site_addr:'',
  note:'', errors:[]
});

function viewProxy() {
  if (!state.proxy) state.proxy = blankProxy();
  const d = state.proxy;
  const pl = plant(d.plant_id);
  const slotOpts = (pl.slots || []).map(s => ({v:s.id, t:`${s.name}　${s.from} 〜 ${s.to}`}));
  const cl = d.date ? isClosed(d.plant_id, d.date) : null;
  const err = d.errors.length ? `<div class="alert alert-danger"><b>入力内容を確認してください</b>
    <ul class="mb-0 mt-2">${d.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : '';

  const lines = d.lines.map((l,i) => `<div class="border rounded p-3 mb-2">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <b style="font-size:13px;color:var(--ink-sub)">品目 ${i+1}</b>
      ${d.lines.length > 1 ? `<button class="btn btn-outline-danger btn-sm btn-icon" data-act="pxRemoveLine" data-idx="${i}" aria-label="削除">${ic('trash',15)}</button>` : ''}
    </div>
    <div class="row g-2">
      <div class="col-12 col-md-6"><label class="form-label">品目<span class="req">必須</span></label>
        <select class="form-select" data-px="lines.${i}.item_id">${opts(ITEMS.map(x => ({v:x.id, t:x.name})), l.item_id)}</select></div>
      <div class="col-6 col-md-3"><label class="form-label">申告数量<span class="req">必須</span></label>
        <input type="text" inputmode="decimal" class="form-control" data-px="lines.${i}.qty" value="${esc(l.qty)}"></div>
      <div class="col-6 col-md-3"><label class="form-label">単位<span class="req">必須</span></label>
        <select class="form-select" data-px="lines.${i}.unit_id">${opts(o1(UNITS), l.unit_id)}</select></div>
    </div>
  </div>`).join('');

  return pageHead('予約の代行作成',
    `<button class="btn btn-outline-secondary btn-sm" data-act="pxReset">入力内容をクリア</button>`) +
  err +
  `<div style="max-width:860px">
    <div class="card mb-3"><div class="card-head">申請元</div><div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-md-6"><label class="form-label">取引先<span class="req">必須</span></label>
          <select class="form-select" data-px="company_id">${opts(COMPANIES.filter(c => c.status === 'active').map(c => ({v:c.id, t:c.name})), d.company_id)}</select></div>
        <div class="col-12 col-md-6"><label class="form-label">拠点<span class="req">必須</span></label>
          <select class="form-select" data-px="plant_id">${opts(o1(PLANTS), d.plant_id, false)}</select></div>
      </div>
      <div class="mt-3"><span class="form-label d-block">受入方法<span class="req">必須</span></span>
        <div class="btn-group" role="group">
          ${[['pickup','引取'],['drop','持込']].map(([v,t]) =>
            `<button type="button" class="btn ${d.type === v ? 'btn-primary' : 'btn-outline-secondary'}" data-act="pxType" data-v="${v}">${t}</button>`).join('')}
        </div>
        ${d.type === 'drop' && !pl.is_delivery ? `<div class="warnbox danger mt-2">${ic('alert',15)}<span>この拠点は持込の受入に対応していません</span></div>` : ''}
        ${d.type === 'pickup' && !pl.is_pickup ? `<div class="warnbox danger mt-2">${ic('alert',15)}<span>この拠点は引取に対応していません</span></div>` : ''}
      </div>
    </div></div>

    ${d.type ? `<div class="card mb-3"><div class="card-head">日時</div><div class="card-body">
      <div class="mb-3"><label class="form-label">${d.type === 'drop' ? '搬入日' : '引取希望日'}<span class="req">必須</span></label>
        <input type="date" class="form-control" style="max-width:220px" data-px="date" value="${d.date}" min="${minDate()}">
        ${cl ? `<div class="warnbox danger mt-2">${ic('alert',15)}<span>この日は休業です（${esc(cl.reason)}）</span></div>` : ''}
        ${d.date && !cl && isPastDeadline(d.plant_id, d.date) ? `<div class="warnbox mt-2">${ic('alert',15)}
          <span>取引先の受付は締切（${esc(deadlineAt(d.plant_id, d.date))}）を過ぎています。社内からは登録できます。</span></div>` : ''}</div>
      ${d.type === 'drop'
        ? `<div class="mb-0"><label class="form-label">受入時間枠<span class="req">必須</span></label>
            <select class="form-select" style="max-width:420px" data-px="slotId">${opts(slotOpts, d.slotId)}</select></div>`
        : `<div class="row g-2" style="max-width:420px">
            <div class="col-6"><label class="form-label">希望開始<span class="req">必須</span></label>
              <input type="time" step="1800" class="form-control" data-px="begin_time" value="${d.begin_time}"></div>
            <div class="col-6"><label class="form-label">希望終了<span class="req">必須</span></label>
              <input type="time" step="1800" class="form-control" data-px="end_time" value="${d.end_time}"></div>
          </div>`}
    </div></div>
    <div class="card mb-3"><div class="card-head">廃棄物の内容</div><div class="card-body">
      ${lines}
      <button class="btn btn-outline-primary btn-sm" data-act="pxAddLine">${ic('plus',15)}品目を追加</button>
    </div></div>
    ${d.type === 'drop' ? `<div class="card mb-3"><div class="card-head">車両<span class="sub">1予約につき1台</span></div><div class="card-body">
      <div style="max-width:340px"><label class="form-label">車両ナンバー<span class="req">必須</span></label>
        <input type="text" class="form-control" data-px="car_number" value="${esc(d.car_number)}" placeholder="大宮 100 あ 12-34"></div>
    </div></div>` : `<div class="card mb-3"><div class="card-head">引取場所</div><div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-md-5"><label class="form-label">現場名<span class="req">必須</span></label>
          <input type="text" class="form-control" data-px="site_name" value="${esc(d.site_name)}" placeholder="例：大宮第一現場"></div>
        <div class="col-12 col-md-7"><label class="form-label">住所<span class="req">必須</span></label>
          <input type="text" class="form-control" data-px="site_addr" value="${esc(d.site_addr)}" placeholder="例：埼玉県さいたま市大宮区桜木町0-0-0"></div>
      </div></div></div>`}
    <div class="card mb-3"><div class="card-head">連絡事項<span class="sub">任意</span></div><div class="card-body">
      <textarea class="form-control" rows="2" data-px="note"></textarea>
    </div></div>
    <button class="btn btn-primary" data-act="pxSubmit">この内容で登録する</button>`
    : ''}
  </div>`;
}

function pxValidate() {
  const d = state.proxy, e = [];
  if (!d.company_id) e.push('取引先を選択してください。');
  if (!d.type) e.push('受入方法を選択してください。');
  if (!d.date) e.push('日付を入力してください。');
  else if (d.date < D(0)) e.push('過去の日付は指定できません。');
  if (d.type === 'drop') {
    if (!d.slotId) e.push('受入時間枠を選択してください。');
    if (!d.car_number.trim()) e.push('車両ナンバーを入力してください。');
  } else if (d.type === 'pickup') {
    if (!d.site_name.trim()) e.push('引取場所の現場名を入力してください。');
    if (!d.site_addr.trim()) e.push('引取場所の住所を入力してください。');
    if (!d.begin_time) e.push('引取希望時間の開始を入力してください。');
    if (!d.end_time) e.push('引取希望時間の終了を入力してください。');
    if (d.begin_time && d.end_time && d.end_time <= d.begin_time) e.push('終了時間は開始時間より後にしてください。');
  }
  d.lines.forEach((l,i) => {
    const n = `品目 ${i+1}：`;
    if (!l.item_id) e.push(n + '品目を選択してください。');
    if (!String(l.qty).trim()) e.push(n + '申告数量を入力してください。');
    else if (isNaN(Number(l.qty))) e.push(n + '申告数量は数字で入力してください。');
    if (!l.unit_id) e.push(n + '単位を選択してください。');
  });
  d.errors = e;
  return e.length === 0;
}
function pxSubmit() {
  if (!pxValidate()) { render(); return; }
  const d = state.proxy, now = new Date(), pl = plant(d.plant_id);
  const s = (pl.slots || []).find(x => x.id === d.slotId);
  const p = {
    id: nextPickupNo(), type:d.type, status:'pending',
    company_id:d.company_id, plant_id:d.plant_id, date:d.date,
    begin_time: d.type === 'drop' ? s.from : d.begin_time,
    end_time:   d.type === 'drop' ? s.to   : d.end_time,
    applied_at:`${D(0)} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    via:'電話（代行作成）', note:d.note
  };
  if (d.type === 'drop') Object.assign(p, {car_number:d.car_number});
  else Object.assign(p, {site_name:d.site_name, site_addr:d.site_addr});
  PICKUPS.unshift(p);
  d.lines.forEach(l => PICKUP_ITEMS.push({id:'pi' + (++_pi), pickup_id:p.id,
    item_id:l.item_id, unit_id:l.unit_id, qty:Number(l.qty)}));
  state.proxy = blankProxy();
  state.route = 'approvals';
  state.approval.sel = p.id;
  toast(`${p.id} を登録しました。`);
  render();
}

Object.assign(ACTIONS, {
  pxType: d => { state.proxy.type = d.v; state.proxy.slotId = ''; state.proxy.errors = []; render(); },
  pxAddLine: d => { state.proxy.lines.push(blankLine()); render(); },
  pxRemoveLine: d => {
    const m = state.modal;
  state.proxy.lines.splice(Number(d.idx), 1);
        if (!state.proxy.lines.length) state.proxy.lines.push(blankLine());
        render();
  },
  pxReset: d => { state.proxy = blankProxy(); render(); },
  pxSubmit: d => { pxSubmit(); },
});

INPUT_HOOKS.push((e, d, val) => {
  if (!d.px) return;
  setPath(state.proxy, d.px, val);
  if (d.px === 'date') render();
  return true;
});
CHANGE_HOOKS.push((e, d, val, structural) => {
  if (!d.px) return;
  setPath(state.proxy, d.px, val);
  if (d.px === 'plant_id') state.proxy.slotId = '';
  if (structural) render();
  return true;
});
