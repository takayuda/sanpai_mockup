
/* =========================================================================
   予約の承認
   ========================================================================= */
/* 変更依頼のときに提示する代替候補（稼働日と受入時間枠から作る） */
function findAlternatives(p) {
  const out = [], pl = plant(p.plant_id);
  for (let k = 1; k <= 14 && out.length < 4; k++) {
    const ds = D(k);
    if (ds === p.date || isClosed(pl.id, ds)) continue;
    const c = countOf(pl.id, ds);
    if (p.type === 'drop') {
      (pl.slots || []).forEach(s => {
        if (out.length >= 4) return;
        out.push({label:`${fmtMd(ds)} ${s.from}〜${s.to}`, sub:`持込 ${c.drop} 件`});
      });
    } else {
      out.push({label:fmtMd(ds), sub:`引取 ${c.pickup} 件`});
    }
  }
  return out;
}

function viewApprovals() {
  const f = state.approval;
  let list = pendingList();
  if (f.type !== 'all') list = list.filter(p => p.type === f.type);
  if (f.keyword) {
    const k = f.keyword;
    list = list.filter(p => (p.id + company(p.company_id).name + linesText(p.id)).includes(k));
  }
  list.sort((a,b) => a.date === b.date ? (a.applied_at < b.applied_at ? -1 : 1) : (a.date < b.date ? -1 : 1));
  if (!list.find(p => p.id === f.sel)) f.sel = list.length ? list[0].id : null;

  const todays = PICKUPS.filter(p => p.date === D(0) && inScope(p) && !['canceled','rejected','pending'].includes(p.status));
  const urgent = list.filter(p => p.date <= D(1)).length;

  const rows = list.map(p => `<tr class="clickable ${p.id === f.sel ? 'sel' : ''}" data-act="selApproval" data-id="${p.id}">
      <td class="mono nowrap">${p.id}<div class="text-secondary" style="font-size:11px">${esc(p.applied_at)}</div></td>
      <td>${tBadge(p.type)}</td>
      <td>${esc(company(p.company_id).name)}</td>
      <td class="mono nowrap">${fmtMd(p.date)}<div class="text-secondary" style="font-size:11px">${timeRange(p)}</div></td>
      <td class="nowrap" style="font-size:13px">${esc(plantShort(p.plant_id))}</td>
      <td style="font-size:13px">${esc(linesText(p.id))}</td>
    </tr>`).join('');

  return pageHead('予約の承認') +
  `<div class="row g-3 mb-3">
    <div class="col-6 col-lg-3">${kpi('承認待ち', pendingCount() + ' <small>件</small>', urgent ? `うち明日まで ${urgent} 件` : '', urgent ? 'alert-kpi' : '')}</div>
    <div class="col-6 col-lg-3">${kpi('本日の持込', todays.filter(p => p.type === 'drop').length + ' <small>件</small>')}</div>
    <div class="col-6 col-lg-3">${kpi('本日の引取', todays.filter(p => p.type === 'pickup').length + ' <small>件</small>')}</div>
    <div class="col-6 col-lg-3">${kpi('差戻し中', PICKUPS.filter(p => p.status === 'rejected' && inScope(p)).length + ' <small>件</small>')}</div>
  </div>

  <div class="filterbar">
    <div class="f"><label>区分</label>
      <select class="form-select form-select-sm" data-act="apFilter" data-key="type">
        ${opts([{v:'all',t:'すべて'},{v:'drop',t:'持込'},{v:'pickup',t:'引取'}], f.type, false)}
      </select></div>
    <div class="f" style="flex:1"><label>キーワード</label>
      <input type="text" class="form-control form-control-sm" data-act="apFilter" data-key="keyword" value="${esc(f.keyword)}" placeholder="受付番号・取引先・品目"></div>
  </div>

  <div class="row g-3">
    <div class="col-12 col-xl-7">
      <div class="table-wrap">
        <table class="table table-hover mb-0">
          <thead><tr><th>受付番号</th><th>区分</th><th>取引先</th><th>希望日時</th><th>拠点</th><th>品目・申告数量</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" class="text-center text-secondary py-4">承認待ちはありません</td></tr>`}</tbody>
        </table>
      </div>
    </div>
    <div class="col-12 col-xl-5">
      <div class="sticky-col">${f.sel ? approvalDetail(pk(f.sel)) : `<div class="empty">左の一覧から案件を選択してください</div>`}</div>
    </div>
  </div>`;
}

function approvalDetail(p) {
  if (!p) return '';
  const co = company(p.company_id), pl = plant(p.plant_id);
  const cl = isClosed(p.plant_id, p.date);
  const rows = [
    ['受付番号', `<span class="mono">${p.id}</span>`],
    ['区分', tBadge(p.type)],
    ['取引先', esc(co.name)],
    ['拠点', esc(pl.name)],
    [p.type === 'drop' ? '搬入希望日' : '引取希望日', fmtJp(p.date)],
    [p.type === 'drop' ? '受入時間枠' : '希望時間', timeRange(p)]
  ];
  if (p.type === 'drop') rows.push(['車両ナンバー', esc(p.car_number)]);
  else rows.push(['引取場所', `${esc(p.site_name || '')}<div class="text-secondary" style="font-size:12px">${esc(p.site_addr || '')}</div>`]);
  if (p.note) rows.push(['連絡事項', esc(p.note)]);
  rows.push(['申請', `${esc(p.via)}　${esc(p.applied_at)}`]);

  const alerts = [];
  if (cl) alerts.push({d:1, t:`${fmtMd(p.date)} は休業日です（${cl.reason}）`});
  if (p.type === 'drop' && !pl.is_delivery) alerts.push({d:1, t:`${pl.name} は持込の受入に対応していません`});
  if (p.type === 'pickup' && !pl.is_pickup) alerts.push({d:1, t:`${pl.name} は引取に対応していません`});

  return `<div class="card mb-3">
    <div class="card-head">${p.id}　${tBadge(p.type)}　${stBadge(p.status)}</div>
    <div class="card-body">
      ${alerts.length ? `<div class="d-flex flex-column gap-2 mb-3">${alerts.map(a =>
        `<div class="warnbox ${a.d ? 'danger' : ''}">${ic('alert',15)}<span>${esc(a.t)}</span></div>`).join('')}</div>` : ''}
      ${dl(rows)}
      <h6 class="mt-3 mb-2" style="font-size:14px;font-weight:700">申告内容</h6>
      <div class="table-wrap"><table class="table table-sm mb-0">
        <thead><tr><th>品目</th><th>区分</th><th class="num">申告数量</th></tr></thead>
        <tbody>${linesOf(p.id).map(l => `<tr>
          <td>${esc(item(l.item_id).name)}${item(l.item_id).is_value ? ' <span class="badge b-neutral b-sq">有価物</span>' : ''}</td>
          <td style="font-size:12px">${itemTypeName(item(l.item_id).type)}</td>
          <td class="num">${dec(l.qty)} ${esc(unit(l.unit_id).name)}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="divline"></div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-primary" data-act="openApprove" data-id="${p.id}">${ic('check')}承認する</button>
        <button class="btn btn-outline-danger" data-act="openReject" data-id="${p.id}">変更依頼</button>
      </div>
    </div>
  </div>`;
}

/* ---------- 承認 ---------- */
MODALS.approve = m => {
  const p = pk(m.id), pl = plant(p.plant_id), isDrop = p.type === 'drop';
  const slotOpts = (pl.slots || []).map(s => ({v:s.id, t:`${s.name}　${s.from} 〜 ${s.to}`}));
  const body = isDrop
    ? `<div class="row g-3">
         <div class="col-12 col-sm-5"><label class="form-label">搬入日</label>
           <input type="date" class="form-control" data-mod="date" value="${m.date || p.date}" min="${minDate()}"></div>
         <div class="col-12 col-sm-7"><label class="form-label">受入時間枠<span class="req">必須</span></label>
           <select class="form-select" data-mod="slotId">${opts(slotOpts, m.slotId, false)}</select></div>
         <div class="col-12"><label class="form-label">取引先への連絡事項<span class="opt">任意</span></label>
           <textarea class="form-control" rows="2" data-mod="comment">${esc(m.comment || '')}</textarea></div>
       </div>`
    : `<div class="row g-2">
         <div class="col-12 col-sm-5"><label class="form-label">訪問日<span class="req">必須</span></label>
           <input type="date" class="form-control" data-mod="date" value="${m.date || p.date}" min="${minDate()}"></div>
         <div class="col-6 col-sm-3"><label class="form-label">開始<span class="req">必須</span></label>
           <input type="time" class="form-control" step="1800" data-mod="begin_time" value="${m.begin_time || p.begin_time}"></div>
         <div class="col-6 col-sm-3"><label class="form-label">終了<span class="req">必須</span></label>
           <input type="time" class="form-control" step="1800" data-mod="end_time" value="${m.end_time || p.end_time}"></div>
         <div class="col-12 mt-3"><label class="form-label">集荷手配メモ<span class="opt">任意</span></label>
           <input type="text" class="form-control" data-mod="dispatch_note" value="${esc(m.dispatch_note || '')}" placeholder="例：4t車・ドライバー中村で手配済（台帳）"></div>
         <div class="col-12 mt-3"><label class="form-label">取引先への連絡事項<span class="opt">任意</span></label>
           <textarea class="form-control" rows="2" data-mod="comment">${esc(m.comment || '')}</textarea></div>
       </div>`;
  return {
    title:`${p.id} を承認`,
    body: body + (m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''),
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="doApprove" data-id="${p.id}">承認する</button>`
  };
};

/* ---------- 変更依頼 ---------- */
MODALS.reject = m => {
  const p = pk(m.id), alts = findAlternatives(p);
  return {
    title:`${p.id} に変更依頼`,
    body:`<div class="mb-3"><label class="form-label">理由<span class="req">必須</span></label>
        <textarea class="form-control" rows="3" data-mod="reason" placeholder="例：指定日は臨時休業のため、別日への変更をお願いします。">${esc(m.reason || '')}</textarea>
        ${m.err ? `<div class="text-danger mt-1" style="font-size:13px">${esc(m.err)}</div>` : ''}</div>
      ${alts.length ? `<label class="form-label">代替候補</label>
      <div class="d-flex flex-wrap gap-2">${alts.map(a =>
        `<button type="button" class="btn btn-outline-primary btn-sm" data-act="pickAlt" data-label="${esc(a.label)}" data-sub="${esc(a.sub)}">
          ${esc(a.label)}<span class="text-secondary ms-2" style="font-size:12px">${esc(a.sub)}</span></button>`).join('')}</div>` : ''}`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-outline-danger" data-act="doReject" data-id="${p.id}">変更依頼を送る</button>`
  };
};


Object.assign(ACTIONS, {
  selApproval: d => { state.approval.sel = d.id; render(); },
  openApprove: d => {
    const m = state.modal;
  const p = pk(d.id), pl = plant(p.plant_id);
        const s = slotOf(pl, p) || (pl.slots || [])[0] || {};
        openModal('approve', {id:d.id, date:p.date, slotId:s.id,
          begin_time:p.begin_time, end_time:p.end_time, dispatch_note:p.dispatch_note || '', comment:''});
  },
  openReject: d => { openModal('reject', {id:d.id, reason:''}); },
  pickAlt: d => {
    const m = state.modal;
  m.reason = (m.reason ? m.reason.replace(/\s*$/,'') + '\n' : '') + `代替候補：${d.label}（${d.sub}）`;
        renderModal();
  },
  doApprove: d => {
    const m = state.modal;
  const p = pk(m.id), pl = plant(p.plant_id);
        if (m.date && m.date < D(0)) { m.err = '過去の日付は指定できません。'; renderModal(); return; }
        if (p.type === 'drop') {
          const s = (pl.slots || []).find(x => x.id === m.slotId);
          if (!s) { m.err = '受入時間枠を選択してください。'; renderModal(); return; }
          p.date = m.date || p.date; p.begin_time = s.from; p.end_time = s.to;
        } else {
          if (!m.date || !m.begin_time || !m.end_time) { m.err = '訪問日時を入力してください。'; renderModal(); return; }
          if (m.end_time <= m.begin_time) { m.err = '終了時刻は開始時刻より後にしてください。'; renderModal(); return; }
          Object.assign(p, {date:m.date, begin_time:m.begin_time, end_time:m.end_time, dispatch_note:m.dispatch_note || ''});
        }
        p.status = 'approved'; p.approved_at = `${D(0)} ${nowHm()}`; p.approved_by = `${ME.role} ${ME.name.split(' ')[0]}`;
        if (m.comment) p.approve_comment = m.comment;
        closeModal(); state.approval.sel = null;
        toast(`${p.id} を承認しました。取引先へ通知を送信しました。`);
        render();
  },
  doReject: d => {
    const m = state.modal;
  if (!m.reason || !m.reason.trim()) { m.err = '理由を入力してください。'; renderModal(); return; }
        const p = pk(m.id);
        p.status = 'rejected'; p.reject_reason = m.reason.trim();
        p.rejected_at = `${D(0)} ${nowHm()}`; p.rejected_by = `${ME.role} ${ME.name.split(' ')[0]}`;
        closeModal(); state.approval.sel = null;
        toast(`${p.id} に変更依頼を送りました。取引先が修正して再申請します。`, 'warn');
        render();
  },
});

INPUT_HOOKS.push((e, d, val) => {
  if (d.act === 'apFilter') { state.approval[d.key] = val; render(); return true; }
});
CHANGE_HOOKS.push((e, d, val, structural) => {
  if (d.act === 'apFilter') { state.approval[d.key] = val; if (structural) render(); return true; }
});
