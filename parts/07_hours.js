
/* =========================================================================
   受付時間・休業日の設定（拠点ごと）
   ========================================================================= */
function monthDays(ym) {
  const [y,m] = ym.split('-').map(Number);
  const first = new Date(y, m-1, 1), last = new Date(y, m, 0);
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(dstr(new Date(y, m-1, d)));
  while (cells.length % 7) cells.push(null);
  return cells;
}
const shiftMonth = (ym, n) => {
  const [y,m] = ym.split('-').map(Number);
  const d = new Date(y, m-1+n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
};
const monthLabel = ym => `${ym.split('-')[0]}年${Number(ym.split('-')[1])}月`;
/* 今後の予約件数（受入可否を切り替えるときの影響確認に使う） */
function futureCount(plantId, type) {
  return PICKUPS.filter(p => p.plant_id === plantId && p.type === type &&
    p.date >= D(0) && ['pending','approved'].includes(p.status)).length;
}

function viewHours() {
  const h = state.hours, pl = plant(h.plantId);
  const cells = monthDays(h.month);
  const cal = cells.map(ds => {
    if (!ds) return `<div class="day blank"></div>`;
    const d = parseD(ds), cl = isClosed(pl.id, ds), c = countOf(pl.id, ds);
    const hol = holidayOf(pl.id, ds);
    const cls = [cl ? 'off' : (c.drop + c.pickup > 0 ? 'busy' : ''), ds === D(0) ? 'today' : ''].join(' ');
    return `<button class="day ${cls}" data-act="openHoliday" data-date="${ds}">
      <div class="d">${d.getDate()}</div>
      <div class="m">${cl ? (hol ? '臨時休業' : '定休日') : `持込 ${c.drop}／引取 ${c.pickup}`}</div></button>`;
  }).join('');

  const slots = (pl.slots || []).map(s => `<div class="slotchip">
      <span><b>${esc(s.from)} 〜 ${esc(s.to)}</b><span class="text-secondary ms-2" style="font-size:12px">${esc(s.name)}</span></span>
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-act="openSlot" data-plant="${pl.id}" data-slot="${s.id}" aria-label="編集">${ic('edit',14)}</button>
      <button class="del" data-act="delSlot" data-plant="${pl.id}" data-slot="${s.id}" aria-label="削除">${ic('trash',15)}</button>
    </div>`).join('');

  const holidays = HOLIDAYS.filter(x => x.plant_id === pl.id && x.date >= D(-30)).sort((a,b) => a.date < b.date ? -1 : 1);

  const flagLine = (flag, label) => `<div class="d-flex align-items-center gap-2 mb-3 pb-3" style="border-bottom:1px solid var(--line)">
    <span style="font-size:14px">${label}</span>
    <span class="badge ${pl[flag] ? 'b-approved' : 'b-neutral'}">${pl[flag] ? '対応する' : '対応しない'}</span>
    <button class="btn btn-outline-secondary btn-sm ms-auto" data-act="openPlantFlag" data-plant="${pl.id}" data-flag="${flag}">変更</button>
  </div>`;

  return pageHead('受付時間・休業日') +
  `<ul class="nav nav-tabs mb-3">${PLANTS.map(x =>
    `<li class="nav-item"><a class="nav-link ${h.plantId === x.id ? 'active' : ''}" href="#" data-act="hoursPlant" data-id="${x.id}">${esc(x.name)}</a></li>`).join('')}</ul>

  <div class="row g-3 mb-3">
    <div class="col-12 col-lg-6">
      <div class="card h-100"><div class="card-head">${ic('truck',16)}持込の受入時間枠</div>
        <div class="card-body">
          ${flagLine('is_delivery','持込の受入')}
          ${pl.is_delivery ? `<div class="d-flex flex-wrap gap-2 mb-3">${slots || '<span class="text-secondary" style="font-size:14px">受入時間枠が未設定です</span>'}</div>
          <button class="btn btn-outline-primary btn-sm" data-act="openSlot" data-plant="${pl.id}">${ic('plus',15)}時間枠を追加</button>` : ''}
        </div></div>
    </div>
    <div class="col-12 col-lg-6">
      <div class="card h-100"><div class="card-head">${ic('clock',16)}引取の対応時間</div>
        <div class="card-body">
          ${flagLine('is_pickup','引取（集荷）')}
          ${pl.is_pickup ? `<div class="row g-2" style="max-width:340px">
            <div class="col-6"><label class="form-label">開始</label>
              <input type="time" step="1800" class="form-control" data-hours="begin_time" value="${pl.begin_time}"></div>
            <div class="col-6"><label class="form-label">終了</label>
              <input type="time" step="1800" class="form-control" data-hours="end_time" value="${pl.end_time}"></div>
          </div>
          <button class="btn btn-primary btn-sm mt-3" data-act="saveHours" data-id="${pl.id}">保存</button>` : ''}
        </div></div>
    </div>
  </div>

  <div class="card mb-3"><div class="card-head">${ic('clock',16)}予約の締切
      <span class="sub">この期限を過ぎると取引先は予約・変更できません（社内からは登録できます）</span></div>
    <div class="card-body">
      <div class="row g-2 align-items-end" style="max-width:520px">
        <div class="col-6 col-md-4"><label class="form-label">予約日の何日前まで</label>
          <select class="form-select" data-deadline="days">${opts([
            {v:0,t:'当日'},{v:1,t:'前日'},{v:2,t:'2日前'},{v:3,t:'3日前'},{v:7,t:'7日前'}], pl.deadline_days, false)}</select></div>
        <div class="col-6 col-md-4"><label class="form-label">締切時刻</label>
          <input type="time" step="900" class="form-control" data-deadline="time" value="${pl.deadline_time}"></div>
        <div class="col-12 col-md-4"><button class="btn btn-primary w-100" data-act="saveDeadline" data-id="${pl.id}">保存</button></div>
      </div>
      <div class="mt-3" style="font-size:13px;color:var(--ink-sub)">
        現在の設定：<b>${deadlineLabel(pl)}</b> まで受付（例：${fmtMd(D(3))} の予約は ${esc(deadlineAt(pl.id, D(3)))} まで）</div>
    </div></div>

  <div class="card mb-3"><div class="card-head">${ic('calendar',16)}定休日</div><div class="card-body">
    <div class="d-flex flex-wrap gap-3">
      ${DOW.map((d,i) => `<div class="form-check">
        <input class="form-check-input" type="checkbox" data-dow="${i}" ${(pl.closed_dows || []).includes(i) ? 'checked' : ''}>
        <label class="form-check-label">${d}曜日</label></div>`).join('')}
    </div>
    <button class="btn btn-primary btn-sm mt-3" data-act="saveDows" data-id="${pl.id}">保存</button>
  </div></div>

  <div class="card"><div class="card-head">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-act="hoursMonth" data-n="-1" aria-label="前月">${ic('left')}</button>
      <span>${monthLabel(h.month)}</span>
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-act="hoursMonth" data-n="1" aria-label="翌月">${ic('right')}</button>
      <span class="sub ms-2">日付をクリックして臨時休業日を登録・解除</span></div>
    <div class="card-body">
      <div class="cal mb-2">${DOW.map(d => `<div class="dow">${d}</div>`).join('')}</div>
      <div class="cal">${cal}</div>
      ${holidays.length ? `<h6 class="mt-4 mb-2" style="font-size:14px;font-weight:700">臨時休業日</h6>
      <div class="table-wrap"><table class="table table-sm mb-0">
        <thead><tr><th style="width:220px">日付</th><th>理由</th><th style="width:100px"></th></tr></thead>
        <tbody>${holidays.map(x => `<tr><td class="mono">${fmtJp(x.date)}</td><td>${esc(x.reason)}</td>
          <td class="text-end"><button class="btn btn-outline-danger btn-sm" data-act="delHoliday" data-id="${x.id}">解除</button></td></tr>`).join('')}</tbody></table></div>` : ''}
    </div></div>`;
}

/* ---------- 受入時間枠の追加・編集 ---------- */
var MODALS_SLOT = m => {
  const pl = plant(m.plantId);
  const s = (pl.slots || []).find(x => x.id === m.slotId) || {};
  return {
    title:`受入時間枠の${m.slotId ? '編集' : '追加'}`,
    body:`<div class="row g-3">
      <div class="col-12 col-md-4"><label class="form-label">名称<span class="req">必須</span></label>
        <input type="text" class="form-control" data-mod="name" value="${esc(m.name != null ? m.name : (s.name || ''))}" placeholder="例：午前"></div>
      <div class="col-6 col-md-4"><label class="form-label">開始<span class="req">必須</span></label>
        <input type="time" step="1800" class="form-control" data-mod="from" value="${esc(m.from != null ? m.from : (s.from || ''))}"></div>
      <div class="col-6 col-md-4"><label class="form-label">終了<span class="req">必須</span></label>
        <input type="time" step="1800" class="form-control" data-mod="to" value="${esc(m.to != null ? m.to : (s.to || ''))}"></div>
    </div>
    ${m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="saveSlot">保存</button>`
  };
};

/* ---------- 持込受入・引取対応の切替（誤操作防止のため確認を挟む） ---------- */
var MODALS_PLANTFLAG = m => {
  const pl = plant(m.plantId), on = pl[m.flag];
  const label = m.flag === 'is_delivery' ? '持込の受入' : '引取（集荷）';
  const type = m.flag === 'is_delivery' ? 'drop' : 'pickup';
  const fc = futureCount(pl.id, type);
  return {
    title:`${esc(pl.name)}：${label}を${on ? '停止' : '開始'}`,
    body:`${on
      ? `<div class="warnbox danger mb-3">${ic('alert',16)}<span>停止すると、取引先ポータルから${label}の予約ができなくなります。</span></div>
         ${fc ? `<div class="warnbox mb-3">${ic('alert',16)}<span>本日以降に${label}の予約が <b>${fc} 件</b> 残っています。個別の連絡が必要です。</span></div>` : ''}`
      : `<p>${label}の受付を開始します。取引先ポータルの予約画面に表示されるようになります。</p>`}
      <div class="form-check mt-3">
        <input class="form-check-input" type="checkbox" data-mod="ack" ${m.ack ? 'checked' : ''} data-rerender="1">
        <label class="form-check-label">上記を確認しました</label></div>
      ${m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn ${on ? 'btn-outline-danger' : 'btn-primary'}" data-act="doPlantFlag" ${m.ack ? '' : 'disabled'}>
            ${on ? '停止する' : '開始する'}</button>`
  };
};

/* ---------- 臨時休業日 ---------- */
var MODALS_HOLIDAY = m => {
  const pl = plant(m.plantId), hol = holidayOf(pl.id, m.date);
  const dow = parseD(m.date).getDay();
  const isDow = (pl.closed_dows || []).includes(dow);
  const c = countOf(pl.id, m.date);
  return {
    title:fmtJp(m.date),
    body:`${dl([
      ['稼働', isDow ? '定休日' : (hol ? `臨時休業：${esc(hol.reason)}` : '稼働日')],
      ['予約', `持込 ${c.drop} 件／引取 ${c.pickup} 件`]
    ])}
    ${isDow ? '' : `
      <div class="mt-3"><label class="form-label">臨時休業の理由<span class="req">必須</span></label>
        <input type="text" class="form-control" data-mod="reason" value="${esc(m.reason != null ? m.reason : (hol ? hol.reason : ''))}" placeholder="例：設備定期点検">
        ${m.err ? `<div class="text-danger mt-1" style="font-size:13px">${esc(m.err)}</div>` : ''}
        ${c.drop + c.pickup > 0 ? `<div class="warnbox danger mt-3">${ic('alert',15)}<span>この日には予約があります。取引先への連絡が必要です。</span></div>` : ''}
      </div>`}`,
    foot:`${hol ? `<button class="btn btn-outline-danger me-auto" data-act="delHoliday" data-id="${hol.id}">解除</button>` : ''}
      <button class="btn btn-outline-secondary" data-act="closeModal">閉じる</button>
      ${isDow ? '' : `<button class="btn btn-primary" data-act="saveHoliday" data-date="${m.date}">臨時休業にする</button>`}`
  };
};
