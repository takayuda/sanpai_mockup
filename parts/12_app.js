
/* =========================================================================
   ルーティング・描画
   ========================================================================= */
const VIEWS = {
  approvals: viewApprovals, board: viewBoard, proxy: viewProxy,
  hours: viewHours, reception: viewReception, actuals: viewActuals,
  m_companies: viewCompanies, invite: viewInvite
};
Object.keys(MASTERS).forEach(k => VIEWS[k] = () => viewMaster(k));

const MODALS = {
  approve: MODALS_APPROVE, reject: MODALS_REJECT, pickup: MODALS_PICKUP,
  changeSlot: MODALS_CHANGESLOT, changeVisit: MODALS_CHANGEVISIT, cancel: MODALS_CANCEL,
  slot: MODALS_SLOT, holiday: MODALS_HOLIDAY, plantFlag: MODALS_PLANTFLAG,
  weigh: MODALS_WEIGH, spot: MODALS_SPOT, refuse: MODALS_REFUSE,
  invite: MODALS_INVITE, company: MODALS_COMPANY, master: MODALS_MASTER
};

/* 同じファイルに排出者ポータルが同梱されていれば、その場で切り替える。
   同梱されていない（processor-admin.html 単体）場合はヘッダーのリンクで遷移する */
const EMITTER_HTML = ((document.getElementById('emitterHtml') || {}).textContent || '')
  .replace(/<\\\/script>/g, '<\/script>');   /* 埋め込み時にエスケープした終了タグを戻す */

const nowHm = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
let lastRoute = null;

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

function renderSidebar() {
  document.getElementById('elSidebar').innerHTML = NAV.map(sec => {
    const items = sec.items.map(it => {
      const cnt = it.badge ? pendingCount() : 0;
      return `<a href="#${it.route}" class="navitem ${state.route === it.route ? 'active' : ''}" data-act="go" data-route="${it.route}">
        <span class="ico">${ic(it.ico, 17)}</span><span>${it.label}</span>
        ${cnt ? `<span class="cnt">${cnt}</span>` : ''}</a>`;
    }).join('');
    return `<div class="navsec">${sec.sec}</div>${items}`;
  }).join('');
}

function renderChrome() {
  const ps = document.getElementById('elPlantSel');
  if (!ps.options.length) {
    ps.innerHTML = `<option value="all">すべての拠点</option>` +
      PLANTS.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('elMenuBtn').innerHTML = ic('menu');
    document.getElementById('elEmitterBtn').innerHTML = ic('login',15) + '排出者側の画面';
  }
  ps.value = state.plantId;
  const n = pendingCount();
  document.getElementById('elNotifBtn').innerHTML =
    ic('bell') + (n ? ` <span class="badge b-rejected b-sq" style="padding:1px 6px">${n}</span>` : '');
}

const BRAND_HTML = '産廃予約管理システム<span>株式会社エコクリーン埼玉（処理業者）</span>';
const BRAND_INVITE = '産廃予約システム<span>取引先アカウント登録</span>';

function render() {
  const y = window.scrollY;
  /* 排出者ポータル表示中は管理画面のガワを隠す */
  const frame = document.getElementById('elEmitFrame'), back = document.getElementById('elBackBtn');
  frame.hidden = !state.emitter; back.hidden = !state.emitter;
  document.querySelector('.topbar').style.display = state.emitter ? 'none' : '';
  document.getElementById('elSidebar').style.display = state.emitter ? 'none' : '';
  document.getElementById('elView').style.display = state.emitter ? 'none' : '';
  if (state.emitter) {
    if (!frame.dataset.loaded) { frame.srcdoc = EMITTER_HTML; frame.dataset.loaded = '1'; }
    back.innerHTML = ic('login',15) + '処理業者側の画面に戻る';
    if (location.hash !== '#emitter') history.replaceState(null, '', '#emitter');
    return;
  }
  const isInvite = state.route === 'invite';
  document.body.classList.toggle('invite-mode', isInvite);
  document.querySelector('.topbar .brand').innerHTML = isInvite ? BRAND_INVITE : BRAND_HTML;
  ['elPlantSel','elNotifBtn','elEmitterBtn','elMenuBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isInvite ? 'none' : '';
  });
  const af = document.activeElement, fk = focusKey(af);
  const pos = af && af.setSelectionRange ? (af.selectionStart || 0) : 0;
  renderChrome();
  renderSidebar();
  document.getElementById('elView').innerHTML = VIEWS[state.route]();
  if (state.route !== lastRoute) { window.scrollTo(0,0); lastRoute = state.route; }
  else window.scrollTo(0, y);
  restoreFocus(fk, pos);
  const hash = state.route === 'invite' ? `#invite/${state.invite.token}` : '#' + state.route;
  if (location.hash !== hash) history.replaceState(null, '', hash);
}
function go(route) {
  state.route = route;
  document.getElementById('elSidebar').classList.remove('open');
  render();
}

/* =========================================================================
   イベント
   ========================================================================= */
document.addEventListener('input', e => {
  const d = e.target.dataset;
  const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (d.px)  { setPath(state.proxy, d.px, val); if (d.px === 'date') render(); return; }
  if (d.mod) { modBind(d.mod, val); if (d.rerender) renderModal(); return; }
  if (d.inv) { state.invite.form[d.inv] = val; return; }
  if (d.act === 'apFilter') { state.approval[d.key] = val; render(); return; }
  if (d.act === 'recQ')     { state.reception.q = val; render(); return; }
  if (d.act === 'acFilter') { state.actuals[d.key] = val; render(); return; }
});
/* テキスト入力の change は blur 時に発火し、再描画するとクリック対象のボタンが
   作り直されてクリックが失われる。再描画はセレクト・チェック・日付のみに限定する */
document.addEventListener('change', e => {
  const d = e.target.dataset;
  const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  const structural = e.target.tagName === 'SELECT' || ['checkbox','radio','date'].includes(e.target.type);
  if (d.px) {
    setPath(state.proxy, d.px, val);
    if (d.px === 'plant_id') { state.proxy.slotId = ''; }
    if (d.px === 'date') state.proxy.slotId = state.proxy.slotId;
    if (structural) render();
    return;
  }
  if (d.mod) { modBind(d.mod, val); if (structural) renderModal(); return; }
  if (d.inv) { state.invite.form[d.inv] = val; return; }
  if (d.act === 'boardDate')   { state.board.date = val; render(); return; }
  if (d.act === 'acFilter')    { state.actuals[d.key] = val; if (structural) render(); return; }
  if (d.act === 'apFilter')    { state.approval[d.key] = val; if (structural) render(); return; }
  if (d.act === 'switchPlant') { state.plantId = val; state.approval.sel = null; render(); return; }
});

function modBind(key, val) {
  const m = state.modal; if (!m) return;
  if (key.startsWith('row.')) { setPath(m.row, key.slice(4), val); return; }
  setPath(m, key, val);
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, d = el.dataset;
  if (el.tagName === 'A' && a !== 'openEmitter') e.preventDefault();
  if (['SELECT','INPUT','TEXTAREA'].includes(el.tagName)) return;
  const m = state.modal;

  switch (a) {
    /* ---- 共通 ---- */
    case 'go': go(d.route); break;
    case 'openEmitter':
      if (!EMITTER_HTML) return;            /* 単体ファイルのときはリンクとして遷移させる */
      e.preventDefault();
      state.emitter = true;
      document.getElementById('elSidebar').classList.remove('open');
      render(); break;
    case 'backToAdmin': state.emitter = false; render(); break;
    case 'toggleNav': document.getElementById('elSidebar').classList.toggle('open'); break;
    case 'closeModal': closeModal(); render(); break;
    case 'openNotif':
      toast(`承認待ち ${pendingCount()} 件（通知チャネルはLINE／LINE WORKS等を想定・要確定）`);
      go('approvals'); break;

    /* ---- 承認キュー ---- */
    case 'selApproval': state.approval.sel = d.id; render(); break;
    case 'openPickupDetail': openModal('pickup', {id:d.id}); break;
    case 'openApprove': {
      const p = pk(d.id), pl = plant(p.plant_id);
      const s = slotOf(pl, p) || (pl.slots || [])[0] || {};
      openModal('approve', {id:d.id, date:p.date, slotId:s.id,
        begin_time:p.begin_time, end_time:p.end_time, dispatch_note:p.dispatch_note || '', comment:''});
      break;
    }
    case 'openReject': openModal('reject', {id:d.id, reason:''}); break;
    case 'pickAlt':
      m.reason = (m.reason ? m.reason.replace(/\s*$/,'') + '\n' : '') + `代替候補：${d.label}（${d.sub}）`;
      renderModal(); break;
    case 'doApprove': {
      const p = pk(m.id), pl = plant(p.plant_id);
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
      render(); break;
    }
    case 'doReject': {
      if (!m.reason || !m.reason.trim()) { m.err = '理由を入力してください。'; renderModal(); return; }
      const p = pk(m.id);
      p.status = 'rejected'; p.reject_reason = m.reason.trim();
      p.rejected_at = `${D(0)} ${nowHm()}`; p.rejected_by = `${ME.role} ${ME.name.split(' ')[0]}`;
      closeModal(); state.approval.sel = null;
      toast(`${p.id} に変更依頼を送りました。取引先が修正して再申請します。`, 'warn');
      render(); break;
    }

    /* ---- 予約一覧ボード ---- */
    case 'boardShift': state.board.date = dstr(addDays(parseD(state.board.date), Number(d.n))); render(); break;
    case 'boardToday': state.board.date = D(0); render(); break;
    case 'boardTab': state.board.tab = d.tab; render(); break;
    case 'openChangeSlot': {
      const p = pk(d.id), pl = plant(p.plant_id), s = slotOf(pl, p) || (pl.slots || [])[0] || {};
      openModal('changeSlot', {id:d.id, date:p.date, slotId:s.id, reason:''}); break;
    }
    case 'doChangeSlot': {
      if (!m.reason || !m.reason.trim()) { m.err = '変更理由を入力してください。'; renderModal(); return; }
      const p = pk(m.id), pl = plant(p.plant_id);
      const s = (pl.slots || []).find(x => x.id === m.slotId);
      if (!s) { m.err = '受入時間枠を選択してください。'; renderModal(); return; }
      const before = `${fmtMd(p.date)} ${timeRange(p)}`;
      p.date = m.date; p.begin_time = s.from; p.end_time = s.to;
      closeModal(); toast(`${p.id} の受入時間枠を変更し、取引先へ通知しました。`); render(); break;
    }
    case 'openChangeVisit': {
      const p = pk(d.id);
      openModal('changeVisit', {id:d.id, date:p.date, begin_time:p.begin_time, end_time:p.end_time,
        dispatch_note:p.dispatch_note || '', reason:''}); break;
    }
    case 'doChangeVisit': {
      if (!m.reason || !m.reason.trim()) { m.err = '変更理由を入力してください。'; renderModal(); return; }
      if (m.end_time <= m.begin_time) { m.err = '終了時刻は開始時刻より後にしてください。'; renderModal(); return; }
      const p = pk(m.id);
      Object.assign(p, {date:m.date, begin_time:m.begin_time, end_time:m.end_time, dispatch_note:m.dispatch_note});
      closeModal(); toast(`${p.id} の訪問日時を変更し、取引先へ通知しました。`); render(); break;
    }
    case 'openCancel': openModal('cancel', {id:d.id, reason:''}, 'modal-md'); break;
    case 'doCancel': {
      if (!m.reason || !m.reason.trim()) { m.err = '取消理由を入力してください。'; renderModal(); return; }
      const p = pk(m.id);
      p.status = 'canceled'; p.cancel_reason = m.reason.trim(); p.canceled_at = `${D(0)} ${nowHm()}`;
      closeModal(); toast(`${p.id} を取消しました。`, 'warn'); render(); break;
    }
    case 'exportBoard': {
      const ds = state.board.date;
      const rows = [['日付','受付番号','区分','ステータス','拠点','時間','取引先','品目・申告数量','車両ナンバー','ドライバー','連絡先','集荷手配メモ']];
      PICKUPS.filter(p => p.date === ds && inScope(p) && !['pending','rejected'].includes(p.status))
        .forEach(p => rows.push([ds, p.id, typeLabel(p.type), STATUS[p.status].t, plant(p.plant_id).name,
          timeRange(p), company(p.company_id).name, linesText(p.id),
          p.car_number || '', p.driver_name || '', p.driver_tel || '', p.dispatch_note || '']));
      downloadCsv(`予約一覧_${ds}.csv`, rows);
      toast('CSVを出力しました。'); break;
    }

    /* ---- 代行入力 ---- */
    case 'pxType': state.proxy.type = d.v; state.proxy.slotId = ''; state.proxy.errors = []; render(); break;
    case 'pxAddLine': state.proxy.lines.push(blankLine()); render(); break;
    case 'pxRemoveLine':
      state.proxy.lines.splice(Number(d.idx), 1);
      if (!state.proxy.lines.length) state.proxy.lines.push(blankLine());
      render(); break;
    case 'pxReset': state.proxy = blankProxy(); render(); break;
    case 'pxSubmit': pxSubmit(); break;

    /* ---- 受付時間・休業日 ---- */
    case 'hoursPlant': state.hours.plantId = d.id; render(); break;
    case 'hoursMonth': state.hours.month = shiftMonth(state.hours.month, Number(d.n)); render(); break;
    case 'goHours': state.hours.plantId = d.id; go('hours'); break;
    case 'openSlot': openModal('slot', {plantId:d.plant, slotId:d.slot || null}, 'modal-md'); break;
    case 'saveSlot': {
      const pl = plant(m.plantId);
      const s = (pl.slots || []).find(x => x.id === m.slotId);
      const name = m.name != null ? m.name : (s ? s.name : '');
      const from = m.from != null ? m.from : (s ? s.from : '');
      const to   = m.to   != null ? m.to   : (s ? s.to   : '');
      if (!name.trim() || !from || !to) { m.err = '名称・開始・終了をすべて入力してください。'; renderModal(); return; }
      if (to <= from) { m.err = '終了は開始より後にしてください。'; renderModal(); return; }
      if (s) { Object.assign(s, {name:name.trim(), from, to}); }
      else {
        pl.slots.push({id:'s' + Date.now().toString(36), name:name.trim(), from, to});
        pl.slots.sort((x,y) => x.from < y.from ? -1 : 1);
      }
      closeModal(); toast('受入時間枠を保存しました。'); render(); break;
    }
    case 'delSlot': {
      const pl = plant(d.plant);
      const s = pl.slots.find(x => x.id === d.slot);
      if (!confirm(`受入時間枠「${s.name} ${s.from}〜${s.to}」を削除します。よろしいですか？`)) return;
      pl.slots = pl.slots.filter(x => x.id !== d.slot);
      toast('受入時間枠を削除しました。', 'warn'); render(); break;
    }
    case 'saveHours': {
      const pl = plant(d.id);
      const b = document.querySelector('[data-hours="begin_time"]').value;
      const t = document.querySelector('[data-hours="end_time"]').value;
      if (!b || !t || t <= b) { toast('引取対応時間を確認してください。', 'err'); return; }
      pl.begin_time = b; pl.end_time = t;
      toast('引取対応時間を保存しました。'); render(); break;
    }
    case 'saveDows': {
      const pl = plant(d.id);
      pl.closed_dows = [...document.querySelectorAll('[data-dow]')].filter(x => x.checked).map(x => Number(x.dataset.dow));
      toast('定休日を保存しました。'); render(); break;
    }
    case 'openPlantFlag': openModal('plantFlag', {plantId:d.plant, flag:d.flag, ack:false}, 'modal-md'); break;
    case 'doPlantFlag': {
      if (!m.ack) { m.err = '内容を確認してチェックを入れてください。'; renderModal(); return; }
      const pl = plant(m.plantId);
      pl[m.flag] = !pl[m.flag];
      closeModal();
      toast(`${pl.name} の${m.flag === 'is_delivery' ? '持込受入' : '引取対応'}を${pl[m.flag] ? '開始' : '停止'}しました。`, pl[m.flag] ? '' : 'warn');
      render(); break;
    }
    case 'openHoliday': openModal('holiday', {plantId:state.hours.plantId, date:d.date}, 'modal-md'); break;
    case 'saveHoliday': {
      if (!m.reason || !String(m.reason).trim()) { m.err = '理由を入力してください。'; renderModal(); return; }
      const pl = plant(m.plantId), ex = holidayOf(pl.id, d.date);
      if (ex) ex.reason = String(m.reason).trim();
      else HOLIDAYS.push({id:'h' + Date.now().toString(36), plant_id:pl.id, date:d.date, reason:String(m.reason).trim()});
      closeModal(); toast(`${fmtMd(d.date)} を臨時休業にしました。`); render(); break;
    }
    case 'delHoliday': {
      const h = HOLIDAYS.find(x => x.id === d.id);
      HOLIDAYS = HOLIDAYS.filter(x => x.id !== d.id);
      closeModal(); toast('臨時休業を解除しました。'); render(); break;
    }

    /* ---- 入場受付・計量 ---- */
    case 'doArrive': {
      const p = pk(d.id);
      p.status = 'arrived'; p.arrived_at = nowHm();
      p.receipt_number = nextReceiptNumber(p.plant_id, p.date);
      toast(`${p.id} を入場受付しました（伝票 No.${p.receipt_number}）。`); render(); break;
    }
    case 'openWeigh': openModal('weigh', weighInit(d.id), 'modal-xl'); break;
    case 'weighAddLine': m.lines.push({id:null, item_id:'', unit_id:'u2', qty:0, actual_qty:''}); renderModal(); break;
    case 'weighRemoveLine': m.lines.splice(Number(d.idx), 1); renderModal(); break;
    case 'doWeigh': {
      const p = pk(m.id);
      const g = Number(m.total_weight), c = Number(m.car_weight);
      if (m.total_weight === '' || m.car_weight === '' || isNaN(g) || isNaN(c)) { m.err = '総重量・空車重量を数字で入力してください。'; renderModal(); return; }
      if (g <= c) { m.err = '総重量は空車重量より大きい値を入力してください。'; renderModal(); return; }
      if (m.lines.some(l => !l.item_id || !l.unit_id || l.actual_qty === '' || isNaN(Number(l.actual_qty)) || Number(l.actual_qty) <= 0)) {
        m.err = '実数量は品目ごとに正の数で入力してください。'; renderModal(); return;
      }
      const net = g - c, dk = declaredKg(p.id);
      const hasDiff = dk > 0 && Math.abs(net - dk) / dk > 0.1;
      if (hasDiff && !m.diff_reason) { m.err = '差異理由を選択してください。'; renderModal(); return; }
      PICKUP_ITEMS = PICKUP_ITEMS.filter(l => l.pickup_id !== p.id);
      m.lines.forEach(l => PICKUP_ITEMS.push({id:l.id || 'pi' + (++_pi), pickup_id:p.id,
        item_id:l.item_id, unit_id:l.unit_id, qty:Number(l.qty) || 0, actual_qty:Number(l.actual_qty)}));
      Object.assign(p, {status:'done', total_weight:g, car_weight:c, weight:net,
        diff: dk ? net - dk : 0, diff_reason: m.diff_reason || ''});
      closeModal(); toast(`${p.id} の実績を確定しました（正味 ${num(net)} kg）。`); render(); break;
    }
    case 'openSpot': openModal('spot', {company_id:'', plant_id:PLANTS.filter(p => p.is_delivery)[0].id,
      item_id:'', qty:'', unit_id:'u2', car_number:'', total_weight:'', car_weight:''}); break;
    case 'doSpot': {
      if (!m.company_id || !m.item_id || !m.unit_id || !String(m.qty).trim()) { m.err = '取引先・品目・数量・単位を入力してください。'; renderModal(); return; }
      const g = Number(m.total_weight), c = Number(m.car_weight);
      if (!m.total_weight || !m.car_weight || isNaN(g) || isNaN(c) || g <= c) { m.err = '総重量・空車重量を確認してください。'; renderModal(); return; }
      const id = nextPickupNo(), net = g - c;
      PICKUPS.unshift({id, type:'drop', status:'done', company_id:m.company_id, plant_id:m.plant_id,
        date:D(0), begin_time:nowHm(), end_time:nowHm(),
        car_number:m.car_number || '', driver_name:'', driver_tel:'',
        applied_at:`${D(0)} ${nowHm()}`, via:'飛び込み',
        approved_at:`${D(0)} ${nowHm()}`, approved_by:`${ME.role} ${ME.name.split(' ')[0]}`,
        arrived_at:nowHm(), receipt_number:nextReceiptNumber(m.plant_id, D(0)),
        total_weight:g, car_weight:c, weight:net, diff:0, diff_reason:'飛び込み搬入（予約なし）'});
      PICKUP_ITEMS.push({id:'pi' + (++_pi), pickup_id:id, item_id:m.item_id, unit_id:m.unit_id,
        qty:Number(m.qty), actual_qty:Number(m.qty)});
      closeModal(); toast(`飛び込み搬入 ${id} を実績登録しました。`); render(); break;
    }
    case 'openRefuse': openModal('refuse', {id:d.id, reason:''}, 'modal-md'); break;
    case 'doRefuse': {
      if (!m.reason) { m.err = '理由を選択してください。'; renderModal(); return; }
      const p = pk(m.id);
      p.status = 'canceled'; p.cancel_reason = m.reason; p.canceled_at = `${D(0)} ${nowHm()}`;
      closeModal(); toast(`${p.id} を「${m.reason}」として記録しました。`, 'warn'); render(); break;
    }

    /* ---- 実績一覧 ---- */
    case 'exportActuals': {
      const rows = [['受付番号','日付','伝票番号','区分','取引先','拠点','品目','申告数量','単位','実数量','総重量kg','空車重量kg','正味重量kg','差異kg','差異理由','入場時刻']];
      filteredActuals().forEach(p => linesOf(p.id).forEach(l => rows.push([
        p.id, p.date, p.receipt_number || '', typeLabel(p.type), company(p.company_id).name, plant(p.plant_id).name,
        item(l.item_id).name, l.qty, unit(l.unit_id).name, l.actual_qty != null ? l.actual_qty : '',
        p.total_weight, p.car_weight, p.weight, p.diff, p.diff_reason || '', p.arrived_at || ''])));
      downloadCsv(`実績一覧_${state.actuals.from}_${state.actuals.to}.csv`, rows);
      toast(`実績 ${filteredActuals().length} 件をCSV出力しました。`); break;
    }

    /* ---- 取引先マスタ ---- */
    case 'newInvite': {
      let n = COMPANIES.length + 1;
      while (COMPANIES.find(x => x.id === 'c' + n)) n++;
      const c = {id:'c' + n, name:'', kana:'', is_generator:false, is_transporter:false,
        postalcode:'', pref:'', address:'', phone:'', email:'', contact:'',
        invoice:'', bank:'', credit:'',
        status:'invited', token:randToken(), invited_at:`${D(0)} ${nowHm()}`, registered_at:null};
      COMPANIES.push(c);
      openModal('invite', {id:c.id}, 'modal-md');
      break;
    }
    case 'showInvite': openModal('invite', {id:d.id}, 'modal-md'); break;
    case 'copyInvite': {
      const url = INVITE_BASE + d.token;
      if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
      toast('登録用URLをコピーしました。'); break;
    }
    case 'openInvitePage':
      closeModal();
      state.invite = {token:d.token, form:null, done:false};
      go('invite'); break;
    case 'doInvite': {
      const c = COMPANIES.find(x => x.token === d.token), f = state.invite.form, e2 = [];
      if (!f.name.trim()) e2.push('会社名を入力してください。');
      if (!f.is_generator && !f.is_transporter) e2.push('区分を1つ以上選択してください。');
      if (!f.contact.trim()) e2.push('ご担当者名を入力してください。');
      if (!f.phone.trim()) e2.push('電話番号を入力してください。');
      if (!f.email.trim()) e2.push('メールアドレスを入力してください。');
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e2.push('メールアドレスの形式を確認してください。');
      if (f.password.length < 8) e2.push('パスワードは8文字以上で入力してください。');
      if (f.password !== f.password2) e2.push('パスワード（確認）が一致しません。');
      f.errors = e2;
      if (e2.length) { render(); return; }
      Object.assign(c, {status:'active', name:f.name.trim(), kana:f.kana,
        is_generator:!!f.is_generator, is_transporter:!!f.is_transporter,
        contact:f.contact, email:f.email, phone:f.phone,
        postalcode:f.postalcode, pref:f.pref, address:f.address, invoice:f.invoice, bank:f.bank,
        registered_at:`${D(0)} ${nowHm()}`});
      state.invite.done = true;
      toast('本登録が完了しました。');
      render(); break;
    }
    case 'editCompany': openModal('company', {i:Number(d.i), row:JSON.parse(JSON.stringify(COMPANIES[Number(d.i)]))}); break;
    case 'saveCompany': {
      if (!m.row.name || !m.row.name.trim()) { m.err = '取引先名を入力してください。'; renderModal(); return; }
      Object.assign(COMPANIES[m.i], m.row);
      closeModal(); toast('保存しました。'); render(); break;
    }
    case 'delCompany': {
      const c = COMPANIES[Number(d.i)];
      if (!confirm(`取引先「${c.name || '未登録'}」を削除します。よろしいですか？`)) return;
      COMPANIES.splice(Number(d.i), 1);
      toast('削除しました。', 'warn'); render(); break;
    }
    case 'csvCompanies': {
      const rows = [['取引先名','フリガナ','排出事業者','運搬業者','担当者','メールアドレス','電話番号','郵便番号','都道府県','住所','インボイス登録番号','振込先口座','与信区分','状態','招待日時','登録日時']];
      COMPANIES.forEach(c => rows.push([c.name, c.kana, c.is_generator ? '○' : '', c.is_transporter ? '○' : '',
        c.contact, c.email, c.phone, c.postalcode, c.pref, c.address, c.invoice, c.bank, c.credit,
        c.status === 'active' ? '本登録済' : '招待中', c.invited_at || '', c.registered_at || '']));
      downloadCsv('取引先マスタ.csv', rows);
      toast('CSVを出力しました。'); break;
    }

    /* ---- 拠点・品目・単位マスタ ---- */
    case 'mAdd': {
      const mm = MASTERS[d.m], row = {};
      mm.cols.forEach(c => setPath(row, c.k, c.type === 'bool' ? false : ''));
      if (d.m === 'm_plants') Object.assign(row, {slots:[], closed_dows:[0], begin_time:'08:00', end_time:'17:00'});
      openModal('master', {m:d.m, idx:null, row}); break;
    }
    case 'mEdit': openModal('master', {m:d.m, idx:Number(d.i), row:JSON.parse(JSON.stringify(MASTERS[d.m].data()[Number(d.i)]))}); break;
    case 'mDel': {
      const arr = MASTERS[d.m].data(), i = Number(d.i);
      if (!confirm(`${MASTERS[d.m].title}の「${arr[i].name}」を削除します。よろしいですか？`)) return;
      const removed = arr.splice(i, 1)[0];
      toast('削除しました。', 'warn'); render(); break;
    }
    case 'mSave': {
      const mm = MASTERS[m.m], arr = mm.data();
      const miss = mm.cols.filter(c => c.req && !getPath(m.row, c.k));
      if (miss.length) { m.err = `必須項目が未入力です：${miss.map(c => c.label).join('、')}`; renderModal(); return; }
      if (m.idx == null) {
        const pref = (arr[0] && arr[0].id ? String(arr[0].id).replace(/\d+$/,'') : 'x');
        let n = arr.length + 1;
        while (arr.find(x => x.id === pref + n)) n++;
        m.row.id = pref + n;
        arr.push(m.row);
      } else {
        Object.assign(arr[m.idx], m.row);
      }
      closeModal(); toast('保存しました。'); render(); break;
    }
    case 'mCsv': {
      const mm = MASTERS[d.m];
      const rows = [mm.cols.map(c => c.label)];
      mm.data().forEach(r => rows.push(mm.cols.map(c => {
        const v = getPath(r, c.k);
        return typeof v === 'boolean' ? (v ? '○' : '') : (v == null ? '' : v);
      })));
      downloadCsv(`${mm.title}.csv`, rows);
      toast('CSVを出力しました。'); break;
    }
  }
});

/* =========================================================================
   初期化
   ========================================================================= */
function applyHash() {
  const h = location.hash.slice(1);
  if (h === 'emitter' && EMITTER_HTML) { state.emitter = true; return true; }
  if (state.emitter) state.emitter = false;
  if (h.startsWith('invite/')) {
    state.invite = {token:h.slice(7), form:null, done:false};
    state.route = 'invite';
    return true;
  }
  if (VIEWS[h] && h !== 'invite') { state.route = h; return true; }
  return false;
}
applyHash();
window.addEventListener('hashchange', () => { if (applyHash()) render(); });
render();
