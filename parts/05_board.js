
/* =========================================================================
   予約一覧ボード（日別）
   持込・引取で同じ列構成・同じ列幅にそろえる
   ========================================================================= */
const BOARD_COLS = `<colgroup>
  <col style="width:9%"><col style="width:8%"><col style="width:14%"><col style="width:16%">
  <col style="width:10%"><col style="width:7%"><col style="width:9%">
  <col style="width:10%"><col style="width:17%"></colgroup>`;
const BOARD_HEAD = `<thead><tr>
  <th>受付番号</th><th>時間</th><th>取引先</th><th>品目・申告数量</th>
  <th>車両ナンバー</th><th>ドライバー</th><th>メモ</th><th>ステータス</th><th></th></tr></thead>`;

function boardRow(p) {
  const isDrop = p.type === 'drop';
  return `<tr>
    <td class="mono">${p.id}</td>
    <td class="mono nowrap">${timeRange(p)}</td>
    <td>${esc(company(p.company_id).name)}</td>
    <td style="font-size:13px">${esc(linesText(p.id))}</td>
    <td class="mono" style="font-size:13px">${esc(p.car_number || '—')}</td>
    <td style="font-size:13px">${esc(p.driver_name || '—')}</td>
    <td style="font-size:12px">${esc((isDrop ? p.note : p.dispatch_note) || '—')}</td>
    <td>${stBadge(p.status)}${p.arrived_at ? `<div class="text-secondary" style="font-size:11px">着車 ${esc(p.arrived_at)}</div>` : ''}</td>
    <td class="text-end text-nowrap">
      <button class="btn btn-outline-secondary btn-sm" data-act="openPickupDetail" data-id="${p.id}">詳細</button>
      ${p.status === 'approved' ? `<button class="btn btn-outline-primary btn-sm ms-1" data-act="${isDrop ? 'openChangeSlot' : 'openChangeVisit'}" data-id="${p.id}">${isDrop ? '枠変更' : '日時変更'}</button>
      <button class="btn btn-outline-danger btn-sm ms-1" data-act="openCancel" data-id="${p.id}">取消</button>` : ''}
    </td></tr>`;
}
const boardTable = rows => `<table class="table table-hover board-tbl mb-0">${BOARD_COLS}${BOARD_HEAD}
  <tbody>${rows.map(boardRow).join('')}</tbody></table>`;

function viewBoard() {
  const b = state.board, ds = b.date;
  const plants = PLANTS.filter(pl => plantScope().includes(pl.id));

  const blocks = plants.map(pl => {
    const cl = isClosed(pl.id, ds);
    const all = PICKUPS.filter(p => p.plant_id === pl.id && p.date === ds && !['pending','rejected'].includes(p.status));
    const drops = all.filter(p => p.type === 'drop');
    const picks = all.filter(p => p.type === 'pickup').sort((x,y) => x.begin_time < y.begin_time ? -1 : 1);
    const groups = (pl.slots || []).map(s => ({s, rows:drops.filter(p => p.begin_time === s.from && p.end_time === s.to)}));
    const other = drops.filter(p => !groups.some(g => g.rows.includes(p)));

    const dropHtml = b.tab === 'pickup' || !pl.is_delivery ? '' :
      groups.map(g => `<div class="card mb-3">
        <div class="card-head">持込　${g.s.name}　${g.s.from} 〜 ${g.s.to}<span class="sub">${g.rows.length} 件</span></div>
        ${g.rows.length ? boardTable(g.rows) : `<div class="p-3 text-secondary" style="font-size:14px">予約はありません</div>`}
      </div>`).join('') +
      (other.length ? `<div class="card mb-3"><div class="card-head">持込　枠外の時間<span class="sub">${other.length} 件</span></div>
        ${boardTable(other)}</div>` : '');

    const pickHtml = b.tab === 'drop' || !pl.is_pickup ? '' : `<div class="card mb-3">
      <div class="card-head">引取（集荷）　${pl.begin_time} 〜 ${pl.end_time}<span class="sub">${picks.length} 件</span></div>
      ${picks.length ? boardTable(picks) : `<div class="p-3 text-secondary" style="font-size:14px">予約はありません</div>`}
    </div>`;

    return `<div class="mb-2">
      <div class="d-flex align-items-center gap-2 mb-2">
        <h2 style="font-size:16px;font-weight:700;margin:0">${ic('factory',16)} ${esc(pl.name)}</h2>
        ${cl ? `<span class="badge b-rejected">休業：${esc(cl.reason)}</span>`
             : `<span class="badge b-neutral">持込 ${drops.length} 件／引取 ${picks.length} 件</span>`}
      </div>
      ${cl && !all.length ? `<div class="empty mb-3">休業日です（${esc(cl.reason)}）</div>` : dropHtml + pickHtml}
    </div>`;
  }).join('');

  return pageHead('予約一覧ボード',
    `<button class="btn btn-outline-primary btn-sm" data-act="exportBoard">${ic('download')}CSV出力</button>`) +
  `<div class="filterbar">
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-act="boardShift" data-n="-1" aria-label="前日">${ic('left')}</button>
      <input type="date" class="form-control form-control-sm" style="width:170px" data-act="boardDate" value="${ds}">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-act="boardShift" data-n="1" aria-label="翌日">${ic('right')}</button>
      <button class="btn btn-outline-primary btn-sm" data-act="boardToday">本日</button>
    </div>
    <div class="ms-2 fw-bold">${fmtJp(ds)}${ds === D(0) ? '　<span class="badge b-method b-sq">本日</span>' : ''}</div>
    <div class="ms-auto">
      <div class="btn-group btn-group-sm" role="group">
        ${[['all','すべて'],['drop','持込'],['pickup','引取']].map(([v,t]) =>
          `<button type="button" class="btn ${b.tab === v ? 'btn-primary' : 'btn-outline-secondary'}" data-act="boardTab" data-tab="${v}">${t}</button>`).join('')}
      </div>
    </div>
  </div>
  ${blocks}`;
}

/* ---------- 受入時間枠の変更 ---------- */
var MODALS_CHANGESLOT = m => {
  const p = pk(m.id), pl = plant(p.plant_id);
  const slotOpts = (pl.slots || []).map(s => ({v:s.id, t:`${s.name}　${s.from} 〜 ${s.to}`}));
  return {
    title:`${p.id} の受入時間枠を変更`,
    body:`<div class="mb-3"><label class="form-label">搬入日</label>
        <input type="date" class="form-control" data-mod="date" value="${m.date || p.date}"></div>
      <div class="mb-3"><label class="form-label">受入時間枠</label>
        <select class="form-select" data-mod="slotId">${opts(slotOpts, m.slotId, false)}</select></div>
      <div class="mb-0"><label class="form-label">変更理由<span class="req">必須</span></label>
        <input type="text" class="form-control" data-mod="reason" value="${esc(m.reason || '')}" placeholder="例：午前の着車が集中したため">
        ${m.err ? `<div class="text-danger mt-1" style="font-size:13px">${esc(m.err)}</div>` : ''}</div>`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="doChangeSlot" data-id="${p.id}">変更する</button>`
  };
};

/* ---------- 訪問日時の変更 ---------- */
var MODALS_CHANGEVISIT = m => {
  const p = pk(m.id);
  return {
    title:`${p.id} の訪問日時を変更`,
    body:`<div class="row g-2 mb-3">
        <div class="col-12 col-sm-5"><label class="form-label">訪問日</label>
          <input type="date" class="form-control" data-mod="date" value="${m.date || p.date}"></div>
        <div class="col-6 col-sm-3"><label class="form-label">開始</label>
          <input type="time" class="form-control" step="1800" data-mod="begin_time" value="${m.begin_time || p.begin_time}"></div>
        <div class="col-6 col-sm-3"><label class="form-label">終了</label>
          <input type="time" class="form-control" step="1800" data-mod="end_time" value="${m.end_time || p.end_time}"></div>
      </div>
      <div class="mb-3"><label class="form-label">集荷手配メモ<span class="opt">任意</span></label>
        <input type="text" class="form-control" data-mod="dispatch_note" value="${esc(m.dispatch_note != null ? m.dispatch_note : (p.dispatch_note || ''))}"></div>
      <div class="mb-0"><label class="form-label">変更理由<span class="req">必須</span></label>
        <input type="text" class="form-control" data-mod="reason" value="${esc(m.reason || '')}" placeholder="例：同方面の集荷とルートを合わせるため">
        ${m.err ? `<div class="text-danger mt-1" style="font-size:13px">${esc(m.err)}</div>` : ''}</div>`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="doChangeVisit" data-id="${p.id}">変更する</button>`
  };
};

/* ---------- 取消 ---------- */
var MODALS_CANCEL = m => {
  const p = pk(m.id);
  return {
    title:`${p.id} を取消`,
    body:`<p>${fmtJp(p.date)}／${typeLabel(p.type)}／${esc(company(p.company_id).name)}<br>${esc(linesText(p.id))}</p>
      <div class="mb-0"><label class="form-label">取消理由<span class="req">必須</span></label>
        <input type="text" class="form-control" data-mod="reason" value="${esc(m.reason || '')}" placeholder="例：取引先からの電話連絡により取消">
        ${m.err ? `<div class="text-danger mt-1" style="font-size:13px">${esc(m.err)}</div>` : ''}</div>`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">やめる</button>
          <button class="btn btn-outline-danger" data-act="doCancel" data-id="${p.id}">取消する</button>`
  };
};
