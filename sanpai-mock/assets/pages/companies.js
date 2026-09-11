
/* =========================================================================
   取引先マスタ
   社内では情報を登録せず、登録用URLを取引先に渡すだけ。
   URLは1本を使い回し、必要なときだけ再発行する（再発行すると旧URLは無効）。
   ========================================================================= */
function viewCompanies() {
  const list = COMPANIES.filter(c => c.status === 'active');
  const rows = list.map(c => {
    const i = COMPANIES.indexOf(c);
    return `<tr>
      <td><b>${esc(c.name)}</b><div class="text-secondary" style="font-size:11px">${esc(c.kana || '')}</div></td>
      <td style="font-size:13px">${companyKind(c)}</td>
      <td style="font-size:13px">${esc(c.contact || '—')}</td>
      <td style="font-size:13px">${esc(c.email || '—')}<div class="text-secondary" style="font-size:11px">${esc(c.phone || '')}</div></td>
      <td style="font-size:13px">${esc(c.invoice || '—')}</td>
      <td class="mono" style="font-size:12px">${esc(c.registered_at || '')}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-outline-secondary btn-sm" data-act="editCompany" data-i="${i}">編集</button>
        <button class="btn btn-outline-danger btn-sm ms-1" data-act="delCompany" data-i="${i}">削除</button></td></tr>`;
  }).join('');

  return pageHead('取引先',
    `<button class="btn btn-outline-primary btn-sm" data-act="csvCompanies">${ic('download')}CSV出力</button>`) +
  `<div class="card mb-4">
    <div class="card-head">${ic('link',16)}取引先の登録用URL
      <span class="sub">このURLを取引先に送ると、取引先が自分で登録できます</span></div>
    <div class="card-body">
      <div class="urlbox"><code>${INVITE_BASE}${esc(INVITE_LINK.token)}</code>
        <button class="btn btn-outline-secondary btn-sm ms-auto text-nowrap" data-act="copyInvite" data-token="${esc(INVITE_LINK.token)}">${ic('copy',14)}コピー</button></div>
      <div class="d-flex gap-2 mt-3 flex-wrap align-items-center">
        <button class="btn btn-outline-primary btn-sm mockbtn" data-act="openInvitePage" data-token="${esc(INVITE_LINK.token)}">${ic('login',15)}登録画面を開く</button>
        <button class="btn btn-outline-danger btn-sm" data-act="openReissue">URLを再発行</button>
        <span class="text-secondary ms-auto" style="font-size:12px">発行日時 ${esc(INVITE_LINK.issued_at)}</span>
      </div>
    </div>
  </div>
  <div class="table-wrap">
    <table class="table table-hover mb-0">
      <thead><tr><th style="width:24%">取引先名</th><th style="width:12%">区分</th><th style="width:12%">担当者</th>
        <th style="width:20%">連絡先</th><th style="width:14%">インボイス登録番号</th><th style="width:10%">登録日時</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7" class="text-center text-secondary py-4">登録済みの取引先はありません</td></tr>`}</tbody>
    </table>
  </div>`;
}

/* ---------- 登録用URLの再発行 ---------- */
MODALS.reissue = m => ({
  title:'登録用URLを再発行',
  body:`<div class="warnbox danger mb-3">${ic('alert',16)}<span>再発行すると現在のURLは使えなくなります。
      すでにURLを送付済みで未登録の取引先には、新しいURLを送り直す必要があります。</span></div>
    ${dl([['現在のURL', `<span style="word-break:break-all;font-size:12px">${INVITE_BASE}${esc(INVITE_LINK.token)}</span>`],
          ['発行日時', esc(INVITE_LINK.issued_at)]])}
    <div class="form-check mt-3">
      <input class="form-check-input" type="checkbox" data-mod="ack" ${m.ack ? 'checked' : ''} data-rerender="1">
      <label class="form-check-label">上記を確認しました</label></div>
    ${m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
  foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
        <button class="btn btn-outline-danger" data-act="doReissue" ${m.ack ? '' : 'disabled'}>再発行する</button>`
});

/* ---------- 取引先の編集 ---------- */
MODALS.company = m => {
  const d = m.row;
  const f = (k, label, type) => `<label class="form-label">${label}</label>
    <input type="${type || 'text'}" class="form-control" data-mod="row.${k}" value="${esc(d[k] || '')}">`;
  return {
    title:`取引先の編集`,
    body:`<div class="row g-3">
      <div class="col-12 col-md-7">${f('name','取引先名')}</div>
      <div class="col-12 col-md-5">${f('kana','フリガナ')}</div>
      <div class="col-12"><span class="form-label d-block">区分</span>
        <div class="d-flex gap-4">
          <div class="form-check"><input class="form-check-input" type="checkbox" data-mod="row.is_generator" ${d.is_generator ? 'checked' : ''}>
            <label class="form-check-label">排出事業者</label></div>
          <div class="form-check"><input class="form-check-input" type="checkbox" data-mod="row.is_transporter" ${d.is_transporter ? 'checked' : ''}>
            <label class="form-check-label">運搬業者</label></div>
        </div></div>
      <div class="col-12 col-md-6">${f('contact','担当者名')}</div>
      <div class="col-12 col-md-6">${f('phone','電話番号','tel')}</div>
      <div class="col-12 col-md-6">${f('email','メールアドレス（ログインID）','email')}</div>
      <div class="col-12 col-md-6">${f('invoice','インボイス登録番号')}</div>
      <div class="col-12 col-md-3">${f('postalcode','郵便番号')}</div>
      <div class="col-12 col-md-3">${f('pref','都道府県')}</div>
      <div class="col-12 col-md-6">${f('address','住所')}</div>
      <div class="col-12 col-md-8">${f('bank','振込先口座')}</div>
      <div class="col-12 col-md-4"><label class="form-label">与信区分</label>
        <select class="form-select" data-mod="row.credit">${opts(['A','B','C'].map(x => ({v:x,t:x})), d.credit)}</select></div>
    </div>
    ${m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="saveCompany">保存</button>`
  };
};


Object.assign(ACTIONS, {
  openReissue: d => { openModal('reissue', {ack:false}, 'modal-md'); },
  doReissue: d => {
    const m = state.modal;
  if (!m.ack) { m.err = '内容を確認してチェックを入れてください。'; renderModal(); return; }
        INVITE_LINK = {token:randToken(), issued_at:`${D(0)} ${nowHm()}`};
        closeModal();
        toast('登録用URLを再発行しました。旧URLは使えません。', 'warn');
        render();
  },
  copyInvite: d => {
    const m = state.modal;
  const url = INVITE_BASE + d.token;
        if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
        toast('登録用URLをコピーしました。');
  },
  openInvitePage: d => {
    if (IS_SINGLE) { closeModal(); state.invite = {token:d.token, form:null, done:false}; gotoRoute('invite'); }
    else { saveData(); location.href = 'invite.html?t=' + encodeURIComponent(d.token); }
  },
  editCompany: d => { openModal('company', {i:Number(d.i), row:JSON.parse(JSON.stringify(COMPANIES[Number(d.i)]))}); },
  saveCompany: d => {
    const m = state.modal;
  if (!m.row.name || !m.row.name.trim()) { m.err = '取引先名を入力してください。'; renderModal(); return; }
        Object.assign(COMPANIES[m.i], m.row);
        closeModal(); toast('保存しました。'); render();
  },
  delCompany: d => {
    const m = state.modal;
  const c = COMPANIES[Number(d.i)];
        const used = PICKUPS.filter(p => p.company_id === c.id).length;
        if (used) { toast(`「${c.name}」には予約・実績が ${used} 件あります。削除できません。`, 'err'); return; }
        if (!confirm(`取引先「${c.name}」を削除します。よろしいですか？`)) return;
        COMPANIES.splice(Number(d.i), 1);
        toast('削除しました。', 'warn'); render();
  },
  csvCompanies: d => {
    const m = state.modal;
  const rows = [['取引先名','フリガナ','排出事業者','運搬業者','担当者','メールアドレス','電話番号','郵便番号','都道府県','住所','インボイス登録番号','振込先口座','与信区分','登録日時']];
        COMPANIES.filter(c => c.status === 'active').forEach(c => rows.push([c.name, c.kana, c.is_generator ? '○' : '', c.is_transporter ? '○' : '',
          c.contact, c.email, c.phone, c.postalcode, c.pref, c.address, c.invoice, c.bank, c.credit,
          c.registered_at || '']));
        downloadCsv('取引先マスタ.csv', rows);
        toast('CSVを出力しました。');
  },
});
