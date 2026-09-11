
/* =========================================================================
   確定した予約（日別）
   持込・引取で同じ列構成・同じ列幅にそろえる
   ========================================================================= */
const BOARD_COLS = `<colgroup>
  <col style="width:9%"><col style="width:8%"><col style="width:14%"><col style="width:16%">
  <col style="width:10%"><col style="width:7%"><col style="width:9%">
  <col style="width:10%"><col style="width:17%"></colgroup>`;
const BOARD_HEAD = `<thead><tr>
  <th>受付番号</th><th>時間</th><th>取引先</th><th>品目・申告数量</th>
  <th>車両ナンバー</th><th>引取場所</th><th>メモ</th><th>ステータス</th><th></th></tr></thead>`;

function boardRow(p) {
  const isDrop = p.type === 'drop';
  return `<tr>
    <td class="mono">${p.id}</td>
    <td class="mono nowrap">${timeRange(p)}</td>
    <td>${esc(company(p.company_id).name)}</td>
    <td style="font-size:13px">${esc(linesText(p.id))}</td>
    <td class="mono" style="font-size:13px">${esc(p.car_number || '—')}</td>
    <td style="font-size:12px">${isDrop ? '—' : esc(p.site_name || '—')}</td>
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
    const all = PICKUPS.filter(p => p.plant_id === pl.id && p.date === ds && !['pending','rejected','canceled'].includes(p.status));
    const voids = PICKUPS.filter(p => p.plant_id === pl.id && p.date === ds && ['rejected','canceled'].includes(p.status));
    const drops = all.filter(p => p.type === 'drop');
    const picks = all.filter(p => p.type === 'pickup').sort((x,y) => x.begin_time < y.begin_time ? -1 : 1);
    const groups = (pl.slots || []).map(s => ({s, rows:drops.filter(p => p.begin_time === s.from && p.end_time === s.to)}));
    const other = drops.filter(p => !groups.some(g => g.rows.includes(p)));

    /* 対応していない拠点でも、予約が残っていれば必ず表示する */
    const dropHtml = b.tab === 'pickup' || (!pl.is_delivery && !drops.length) ? '' :
      (pl.is_delivery ? groups : []).map(g => `<div class="card mb-3">
        <div class="card-head">持込　${g.s.name}　${g.s.from} 〜 ${g.s.to}<span class="sub">${g.rows.length} 件</span></div>
        ${g.rows.length ? boardTable(g.rows) : `<div class="p-3 text-secondary" style="font-size:14px">予約はありません</div>`}
      </div>`).join('') +
      (other.length ? `<div class="card mb-3"><div class="card-head">持込　枠外の時間<span class="sub">${other.length} 件</span></div>
        ${boardTable(other)}</div>` : '');

    const pickHtml = b.tab === 'drop' || (!pl.is_pickup && !picks.length) ? '' : `<div class="card mb-3">
      <div class="card-head">引取（集荷）　${pl.begin_time} 〜 ${pl.end_time}<span class="sub">${picks.length} 件</span>
        ${!pl.is_pickup ? '<span class="badge b-pending b-sq">この拠点は引取対応外</span>' : ''}</div>
      ${picks.length ? boardTable(picks) : `<div class="p-3 text-secondary" style="font-size:14px">予約はありません</div>`}
    </div>`;

    return `<div class="mb-2">
      <div class="d-flex align-items-center gap-2 mb-2">
        <h2 style="font-size:16px;font-weight:700;margin:0">${ic('factory',16)} ${esc(pl.name)}</h2>
        ${cl ? `<span class="badge b-rejected">休業：${esc(cl.reason)}</span>`
             : `<span class="badge b-neutral">持込 ${drops.length} 件／引取 ${picks.length} 件</span>`}
      </div>
      ${cl && !all.length ? `<div class="empty mb-3">休業日です（${esc(cl.reason)}）</div>` : dropHtml + pickHtml}
      ${b.showVoid && voids.length ? `<div class="card mb-3">
        <div class="card-head">取消・差戻し<span class="sub">${voids.length} 件</span></div>
        <table class="table board-tbl mb-0">${BOARD_COLS}${BOARD_HEAD}
          <tbody>${voids.map(p => `<tr class="dim">
            <td class="mono">${p.id}</td>
            <td class="mono nowrap">${timeRange(p)}</td>
            <td>${esc(company(p.company_id).name)}</td>
            <td style="font-size:13px">${esc(linesText(p.id))}</td>
            <td class="mono" style="font-size:13px">${esc(p.car_number || '—')}</td>
            <td style="font-size:12px">${p.type === 'drop' ? '—' : esc(p.site_name || '—')}</td>
            <td style="font-size:12px">${esc(p.reject_reason || p.cancel_reason || '—')}</td>
            <td>${stBadge(p.status)}</td>
            <td class="text-end text-nowrap">
              <button class="btn btn-outline-secondary btn-sm" data-act="openPickupDetail" data-id="${p.id}">詳細</button></td>
          </tr>`).join('')}</tbody></table>
      </div>` : ''}
    </div>`;
  }).join('');

  return pageHead('確定した予約',
    `<button class="btn btn-outline-primary btn-sm" data-act="exportBoard">${ic('download')}CSV出力</button>`) +
  `<div class="filterbar">
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-act="boardShift" data-n="-1" aria-label="前日">${ic('left')}</button>
      <input type="date" class="form-control form-control-sm" style="width:170px" data-act="boardDate" value="${ds}">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-act="boardShift" data-n="1" aria-label="翌日">${ic('right')}</button>
      <button class="btn btn-outline-primary btn-sm" data-act="boardToday">本日</button>
    </div>
    <div class="ms-2 fw-bold">${fmtJp(ds)}${ds === D(0) ? '　<span class="badge b-method b-sq">本日</span>' : ''}</div>
    <div class="ms-auto d-flex align-items-center gap-3">
      <div class="form-check mb-0"><input class="form-check-input" type="checkbox" data-act="boardVoid" ${b.showVoid ? 'checked' : ''}>
        <label class="form-check-label" style="font-size:13px">取消・差戻しも表示</label></div>
      <div class="btn-group btn-group-sm" role="group">
        ${[['all','すべて'],['drop','持込'],['pickup','引取']].map(([v,t]) =>
          `<button type="button" class="btn ${b.tab === v ? 'btn-primary' : 'btn-outline-secondary'}" data-act="boardTab" data-tab="${v}">${t}</button>`).join('')}
      </div>
    </div>
  </div>
  ${blocks}`;
}

/* ---------- 受入時間枠の変更 ---------- */
MODALS.changeSlot = m => {
  const p = pk(m.id), pl = plant(p.plant_id);
  const slotOpts = (pl.slots || []).map(s => ({v:s.id, t:`${s.name}　${s.from} 〜 ${s.to}`}));
  return {
    title:`${p.id} の受入時間枠を変更`,
    body:`<div class="mb-3"><label class="form-label">搬入日</label>
        <input type="date" class="form-control" data-mod="date" value="${m.date || p.date}" min="${minDate()}"></div>
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
MODALS.changeVisit = m => {
  const p = pk(m.id);
  return {
    title:`${p.id} の訪問日時を変更`,
    body:`<div class="row g-2 mb-3">
        <div class="col-12 col-sm-5"><label class="form-label">訪問日</label>
          <input type="date" class="form-control" data-mod="date" value="${m.date || p.date}" min="${minDate()}"></div>
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
MODALS.cancel = m => {
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

Object.assign(ACTIONS, {
  boardShift: d => { state.board.date = dstr(addDays(parseD(state.board.date), Number(d.n))); render(); },
  boardToday: d => { state.board.date = D(0); render(); },
  boardTab: d => { state.board.tab = d.tab; render(); },
  openChangeSlot: d => {
    const m = state.modal;
  const p = pk(d.id), pl = plant(p.plant_id), s = slotOf(pl, p) || (pl.slots || [])[0] || {};
        openModal('changeSlot', {id:d.id, date:p.date, slotId:s.id, reason:''});
  },
  doChangeSlot: d => {
    const m = state.modal;
  if (!m.reason || !m.reason.trim()) { m.err = '変更理由を入力してください。'; renderModal(); return; }
        if (m.date < D(0)) { m.err = '過去の日付は指定できません。'; renderModal(); return; }
        const p = pk(m.id), pl = plant(p.plant_id);
        const s = (pl.slots || []).find(x => x.id === m.slotId);
        if (!s) { m.err = '受入時間枠を選択してください。'; renderModal(); return; }
        const before = `${fmtMd(p.date)} ${timeRange(p)}`;
        p.date = m.date; p.begin_time = s.from; p.end_time = s.to;
        closeModal(); toast(`${p.id} の受入時間枠を変更し、取引先へ通知しました。`); render();
  },
  openChangeVisit: d => {
    const m = state.modal;
  const p = pk(d.id);
        openModal('changeVisit', {id:d.id, date:p.date, begin_time:p.begin_time, end_time:p.end_time,
          dispatch_note:p.dispatch_note || '', reason:''});
  },
  doChangeVisit: d => {
    const m = state.modal;
  if (!m.reason || !m.reason.trim()) { m.err = '変更理由を入力してください。'; renderModal(); return; }
        if (m.date < D(0)) { m.err = '過去の日付は指定できません。'; renderModal(); return; }
        if (m.end_time <= m.begin_time) { m.err = '終了時刻は開始時刻より後にしてください。'; renderModal(); return; }
        const p = pk(m.id);
        Object.assign(p, {date:m.date, begin_time:m.begin_time, end_time:m.end_time, dispatch_note:m.dispatch_note});
        closeModal(); toast(`${p.id} の訪問日時を変更し、取引先へ通知しました。`); render();
  },
  openCancel: d => { openModal('cancel', {id:d.id, reason:''}, 'modal-md'); },
  doCancel: d => {
    const m = state.modal;
  if (!m.reason || !m.reason.trim()) { m.err = '取消理由を入力してください。'; renderModal(); return; }
        const p = pk(m.id);
        p.status = 'canceled'; p.cancel_reason = m.reason.trim(); p.canceled_at = `${D(0)} ${nowHm()}`;
        closeModal(); toast(`${p.id} を取消しました。`, 'warn'); render();
  },
  exportBoard: d => {
    const m = state.modal;
  const ds = state.board.date;
        const rows = [['日付','受付番号','区分','ステータス','拠点','時間','取引先','品目・申告数量','車両ナンバー','引取場所','住所','メモ']];
        PICKUPS.filter(p => p.date === ds && inScope(p) && !['pending','rejected'].includes(p.status))
          .forEach(p => rows.push([ds, p.id, typeLabel(p.type), STATUS[p.status].t, plant(p.plant_id).name,
            timeRange(p), company(p.company_id).name, linesText(p.id),
            p.car_number || '', p.site_name || '', p.site_addr || '', (p.type === 'drop' ? p.note : p.dispatch_note) || '']));
        downloadCsv(`予約一覧_${ds}.csv`, rows);
        toast('CSVを出力しました。');
  },
});

CHANGE_HOOKS.push((e, d, val) => {
  if (d.act === 'boardDate') { state.board.date = val; render(); return true; }
  if (d.act === 'boardVoid') { state.board.showVoid = val; render(); return true; }
});
