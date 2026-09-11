
/* =========================================================================
   計量入力
   構内では品目ごとの計量ができないため、記録するのは
   「総正味重量」と「含まれていた品目」「着車時間」「備考」のみ
   ========================================================================= */
const dayList = ds => PICKUPS.filter(p => p.date === ds && inScope(p) && ['approved','done'].includes(p.status));
function nextReceiptNumber(plantId, ds) {
  const n = PICKUPS.filter(p => p.plant_id === plantId && p.date === ds && p.receipt_number)
    .reduce((a,p) => Math.max(a, p.receipt_number), 0);
  return n + 1;
}

function viewReception() {
  const q = state.reception.q.trim(), ds = state.reception.date;
  let list = dayList(ds);
  if (q) list = list.filter(p => (p.id + (p.car_number || '') + company(p.company_id).name).includes(q));
  list.sort((a,b) => a.begin_time < b.begin_time ? -1 : 1);

  const rows = list.map(p => `<tr>
      <td class="mono nowrap">${p.id}${p.receipt_number ? `<div class="text-secondary" style="font-size:11px">伝票 No.${p.receipt_number}</div>` : ''}</td>
      <td>${tBadge(p.type)}</td>
      <td class="mono nowrap">${timeRange(p)}</td>
      <td>${esc(company(p.company_id).name)}<div class="text-secondary" style="font-size:11px">${esc(plantShort(p.plant_id))}</div></td>
      <td style="font-size:13px">${esc(linesText(p.id))}</td>
      <td class="mono" style="font-size:13px">${p.type === 'drop' ? esc(p.car_number || '—') : esc(p.site_name || '—')}</td>
      <td class="mono">${esc(p.arrived_at || '—')}</td>
      <td class="num">${p.weight != null ? `<b>${num(p.weight)}</b> kg` : '—'}</td>
      <td>${p.status === 'done' ? '<span class="badge b-approved">計量済</span>' : '<span class="badge b-pending">未計量</span>'}</td>
      <td class="text-end text-nowrap">
        ${p.status === 'approved'
          ? `<button class="btn btn-primary btn-sm" data-act="openWeigh" data-id="${p.id}">計量入力</button>`
          : `<button class="btn btn-outline-secondary btn-sm" data-act="openPickupDetail" data-id="${p.id}">実績を見る</button>`}
      </td></tr>`).join('');

  const yet = list.filter(p => p.status === 'approved').length;
  const done = list.filter(p => p.status === 'done').length;
  const net = list.filter(p => p.weight).reduce((s,p) => s + p.weight, 0);

  return pageHead('計量入力',
    `<button class="btn btn-outline-primary btn-sm" data-act="openSpot">${ic('plus',15)}飛び込み搬入を登録</button>`) +
  `<div class="row g-3 mb-3">
    <div class="col-6 col-lg-3">${kpi('この日の予定', list.length + ' <small>件</small>')}</div>
    <div class="col-6 col-lg-3">${kpi('未計量', yet + ' <small>件</small>', '', yet ? 'alert-kpi' : '')}</div>
    <div class="col-6 col-lg-3">${kpi('計量済', done + ' <small>件</small>')}</div>
    <div class="col-6 col-lg-3">${kpi('正味重量 合計', num(net) + ' <small>kg</small>')}</div>
  </div>
  <div class="filterbar">
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-act="recShift" data-n="-1" aria-label="前日">${ic('left')}</button>
      <input type="date" class="form-control form-control-sm" style="width:170px" data-act="recDate" value="${ds}">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-act="recShift" data-n="1" aria-label="翌日">${ic('right')}</button>
      <button class="btn btn-outline-primary btn-sm" data-act="recToday">本日</button>
    </div>
    <div class="ms-2 fw-bold">${fmtJp(ds)}${ds === D(0) ? '　<span class="badge b-method b-sq">本日</span>' : ''}</div>
    <div class="f ms-auto" style="min-width:260px"><label>検索</label>
      <input type="text" class="form-control form-control-sm" data-act="recQ" value="${esc(state.reception.q)}" placeholder="受付番号・車両ナンバー・取引先" autocomplete="off"></div>
  </div>
  <div class="table-wrap">
    <table class="table table-hover mb-0">
      <thead><tr><th>受付番号</th><th>区分</th><th>時間</th><th>取引先・拠点</th><th>申告内容</th>
        <th>車両ナンバー／集荷先</th><th>着車時間</th><th class="num">正味重量</th><th>状態</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="10" class="text-center text-secondary py-4">該当する予約がありません</td></tr>`}</tbody>
    </table>
  </div>`;
}

/* ---------- 計量モーダル ---------- */
function weighInit(id) {
  return {id, arrived_at:nowHm(), weight:'', items:linesOf(id).map(l => l.item_id), memo:''};
}
/* 表示中の日付。過去日の計量漏れもここから入力できる */
const recDate = () => state.reception.date;
/* 品目のチェックボックス（申告にあった品目は申告数量を併記） */
function itemChecks(lines, checked, prefix) {
  return `<div class="itemgrid">${ITEMS.map(it => {
    const l = lines.find(x => x.item_id === it.id);
    return `<label class="itemchk ${checked.includes(it.id) ? 'on' : ''}">
      <input class="form-check-input" type="checkbox" data-mod="${prefix}.${it.id}" data-rerender="1" ${checked.includes(it.id) ? 'checked' : ''}>
      <span>${esc(it.name)}${l && l.qty != null ? `<small>申告 ${dec(l.qty)} ${esc(unit(l.unit_id).name)}</small>` : ''}</span>
    </label>`;
  }).join('')}</div>`;
}

MODALS.weigh = m => {
  const p = pk(m.id), dk = declaredKg(p.id);
  const w = Number(m.weight);
  const diff = m.weight !== '' && !isNaN(w) ? w - dk : null;
  return {
    title:`計量入力　${p.id}　${esc(company(p.company_id).name)}`,
    body:`<div class="row g-3 mb-3">
        <div class="col-6 col-md-3"><label class="form-label">着車時間<span class="req">必須</span></label>
          <input type="time" class="form-control" data-mod="arrived_at" value="${esc(m.arrived_at)}"></div>
        <div class="col-6 col-md-4"><label class="form-label">正味重量（kg）<span class="req">必須</span></label>
          <input type="text" inputmode="numeric" class="form-control" data-mod="weight" data-rerender="1" value="${esc(m.weight)}" placeholder="例：3640"></div>
        <div class="col-12 col-md-5">${kpi('申告数量（重量換算）', dk ? num(dk) + ' <small>kg</small>' : '—',
          diff != null && dk ? `差異 ${diff > 0 ? '+' : ''}${num(diff)} kg` : '')}</div>
      </div>
      <label class="form-label">含まれていた品目<span class="req">必須</span></label>
      ${itemChecks(linesOf(p.id), m.items, 'pi')}
      <div class="mt-3"><label class="form-label">備考<span class="opt">任意</span></label>
        <textarea class="form-control" rows="2" data-mod="memo" placeholder="荷姿、異物の混入、当日の状況など">${esc(m.memo)}</textarea></div>
      ${m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
    foot:`<button class="btn btn-link btn-sm text-secondary me-auto p-0" style="font-size:12px" data-act="openRefuse" data-id="${p.id}">受入不可として記録</button>
          <button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="doWeigh" data-id="${p.id}">実績を確定する</button>`
  };
};

/* ---------- 飛び込み搬入 ---------- */
MODALS.spot = m => ({
  title:'飛び込み搬入の登録',
  body:`<div class="row g-3 mb-3">
      <div class="col-12 col-md-6"><label class="form-label">取引先<span class="req">必須</span></label>
        <select class="form-select" data-mod="company_id">${opts(COMPANIES.map(c => ({v:c.id, t:c.name})), m.company_id)}</select></div>
      <div class="col-12 col-md-6"><label class="form-label">拠点<span class="req">必須</span></label>
        <select class="form-select" data-mod="plant_id">${opts(o1(PLANTS.filter(x => x.is_delivery)), m.plant_id, false)}</select></div>
      <div class="col-6 col-md-3"><label class="form-label">着車時間<span class="req">必須</span></label>
        <input type="time" class="form-control" data-mod="arrived_at" value="${esc(m.arrived_at)}"></div>
      <div class="col-6 col-md-4"><label class="form-label">正味重量（kg）<span class="req">必須</span></label>
        <input type="text" inputmode="numeric" class="form-control" data-mod="weight" value="${esc(m.weight)}"></div>
      <div class="col-12 col-md-5"><label class="form-label">車両ナンバー<span class="opt">任意</span></label>
        <input type="text" class="form-control" data-mod="car_number" value="${esc(m.car_number)}"></div>
    </div>
    <label class="form-label">含まれていた品目<span class="req">必須</span></label>
    ${itemChecks([], m.items, 'pi')}
    <div class="mt-3"><label class="form-label">備考<span class="opt">任意</span></label>
      <textarea class="form-control" rows="2" data-mod="memo">${esc(m.memo)}</textarea></div>
    ${m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
  foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
        <button class="btn btn-primary" data-act="doSpot">実績として登録</button>`
});

/* ---------- 受入不可・集荷不可 ---------- */
MODALS.refuse = m => {
  const p = pk(m.id);
  return {
    title:`${p.id} を${p.type === 'drop' ? '受入不可' : '集荷不可'}として記録`,
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

Object.assign(ACTIONS, {
  recShift: d => { state.reception.date = dstr(addDays(parseD(state.reception.date), Number(d.n))); render(); },
  recToday: d => { state.reception.date = D(0); render(); },
  openWeigh: d => { openModal('weigh', weighInit(d.id), 'modal-lg'); },
  doWeigh: d => {
    const m = state.modal;
  const p = pk(m.id), w = Number(m.weight);
        if (!m.arrived_at) { m.err = '着車時間を入力してください。'; renderModal(); return; }
        if (m.weight === '' || isNaN(w) || w <= 0) { m.err = '正味重量を数字で入力してください。'; renderModal(); return; }
        if (!m.items.length) { m.err = '含まれていた品目を1つ以上選んでください。'; renderModal(); return; }
        const dk = declaredKg(p.id);
        const before = linesOf(p.id);
        PICKUP_ITEMS = PICKUP_ITEMS.filter(l => l.pickup_id !== p.id);
        m.items.forEach(id => {
          const old = before.find(l => l.item_id === id);
          PICKUP_ITEMS.push(old || {id:'pi' + (++_pi), pickup_id:p.id, item_id:id, unit_id:'u2', qty:null});
        });
        Object.assign(p, {status:'done', arrived_at:m.arrived_at, weight:w,
          diff: dk ? w - dk : 0, weigh_memo:m.memo || '',
          receipt_number: p.receipt_number || nextReceiptNumber(p.plant_id, p.date)});
        closeModal();
        toast(`${p.id} の実績を確定しました（正味 ${num(w)} kg／伝票 No.${p.receipt_number}）。`);
        render();
  },
  openSpot: d => {
    const m = state.modal;
  openModal('spot', {company_id:'', plant_id:PLANTS.filter(p => p.is_delivery)[0].id,
        items:[], car_number:'', weight:'', arrived_at:nowHm(), memo:''});
  },
  doSpot: d => {
    const m = state.modal;
  const w = Number(m.weight);
        if (!m.company_id) { m.err = '取引先を選択してください。'; renderModal(); return; }
        if (m.weight === '' || isNaN(w) || w <= 0) { m.err = '正味重量を数字で入力してください。'; renderModal(); return; }
        if (!m.items.length) { m.err = '含まれていた品目を1つ以上選んでください。'; renderModal(); return; }
        const id = nextPickupNo();
        PICKUPS.unshift({id, type:'drop', status:'done', company_id:m.company_id, plant_id:m.plant_id,
          date:recDate(), begin_time:m.arrived_at, end_time:m.arrived_at,
          car_number:m.car_number || '',
          applied_at:`${D(0)} ${nowHm()}`, via:'飛び込み',
          approved_at:`${D(0)} ${nowHm()}`, approved_by:`${ME.role} ${ME.name.split(' ')[0]}`,
          arrived_at:m.arrived_at, receipt_number:nextReceiptNumber(m.plant_id, recDate()),
          weight:w, diff:0, weigh_memo:m.memo || ''});
        m.items.forEach(it => PICKUP_ITEMS.push({id:'pi' + (++_pi), pickup_id:id, item_id:it, unit_id:'u2', qty:null}));
        closeModal();
        toast(`飛び込み搬入 ${id} を実績登録しました。`);
        render();
  },
  openRefuse: d => { closeModal(); setTimeout(() => openModal('refuse', {id:d.id, reason:''}, 'modal-md'), 250); },
  doRefuse: d => {
    const m = state.modal;
  if (!m.reason) { m.err = '理由を選択してください。'; renderModal(); return; }
        const p = pk(m.id);
        p.status = 'canceled'; p.cancel_reason = m.reason; p.canceled_at = `${D(0)} ${nowHm()}`;
        closeModal(); toast(`${p.id} を「${m.reason}」として記録しました。`, 'warn'); render();
  },
});

INPUT_HOOKS.push((e, d, val) => {
  if (d.act === 'recQ') { state.reception.q = val; render(); return true; }
});
CHANGE_HOOKS.push((e, d, val) => {
  if (d.act === 'recDate') { state.reception.date = val; render(); return true; }
});
