/* =========================================================================
   取引先の本登録画面　※本番では取引先側アプリの画面。モック用に同梱
   ========================================================================= */
function viewInvite() {
  const f0 = state.invite.form;
  if (state.invite.done) {
    return `<div class="invitewrap">
      <div class="card"><div class="card-body text-center p-4">
        <div style="color:var(--success)">${ic('check',44)}</div>
        <h1 style="font-size:22px;font-weight:700;margin:8px 0">登録が完了しました</h1>
        <p class="mb-3">${esc(f0.email)} でログインできます。</p>
        <div><button class="btn btn-outline-secondary btn-sm mockbtn" data-act="go" data-route="m_companies">処理業者側の管理画面に戻る</button></div>
      </div></div></div>`;
  }
  if (state.invite.token !== INVITE_LINK.token)
    return `<div class="invitewrap"><div class="empty">この登録用URLは無効です。処理業者にご確認ください。</div></div>`;
  if (!state.invite.form) state.invite.form = {
    name:'', kana:'', is_generator:true, is_transporter:false,
    contact:'', email:'', password:'', password2:'',
    phone:'', postalcode:'', pref:'', address:'', invoice:'', bank:'', errors:[]
  };
  const f = state.invite.form;
  const err = f.errors.length ? `<div class="alert alert-danger"><b>入力内容を確認してください</b>
    <ul class="mb-0 mt-2">${f.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : '';
  const fi = (k, label, type, ph, req) => `<label class="form-label">${label}${req ? '<span class="req">必須</span>' : '<span class="opt">任意</span>'}</label>
    <input type="${type || 'text'}" class="form-control" data-inv="${k}" value="${esc(f[k])}" placeholder="${ph || ''}">`;
  return `<div class="invitewrap">
    <div class="text-center mb-3">
      <div class="text-secondary" style="font-size:13px">株式会社エコクリーン埼玉 からの招待</div>
      <h1 style="font-size:22px;font-weight:700;margin:4px 0">取引先アカウントの登録</h1>
    </div>
    ${err}
    <div class="card"><div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-md-7">${fi('name','会社名','text','例：株式会社サンプル建設',1)}</div>
        <div class="col-12 col-md-5">${fi('kana','フリガナ','text','')}</div>
        <div class="col-12"><span class="form-label d-block">区分<span class="req">必須</span></span>
          <div class="d-flex gap-4">
            <div class="form-check"><input class="form-check-input" type="checkbox" data-inv="is_generator" ${f.is_generator ? 'checked' : ''}>
              <label class="form-check-label">排出事業者</label></div>
            <div class="form-check"><input class="form-check-input" type="checkbox" data-inv="is_transporter" ${f.is_transporter ? 'checked' : ''}>
              <label class="form-check-label">運搬業者</label></div>
          </div></div>
        <div class="col-12 col-md-6">${fi('contact','ご担当者名','text','',1)}</div>
        <div class="col-12 col-md-6">${fi('phone','電話番号','tel','',1)}</div>
        <div class="col-12">${fi('email','メールアドレス（ログインID）','email','',1)}</div>
        <div class="col-12 col-md-6">${fi('password','パスワード','password','8文字以上',1)}</div>
        <div class="col-12 col-md-6">${fi('password2','パスワード（確認）','password','',1)}</div>
        <div class="col-12 col-md-4">${fi('postalcode','郵便番号','text','')}</div>
        <div class="col-12 col-md-8">${fi('pref','都道府県','text','')}</div>
        <div class="col-12">${fi('address','住所','text','')}</div>
        <div class="col-12 col-md-6">${fi('invoice','インボイス登録番号','text','')}</div>
        <div class="col-12 col-md-6">${fi('bank','振込先口座','text','')}</div>
      </div>
      <button class="btn btn-primary w-100 mt-4" data-act="doInvite" data-token="${esc(INVITE_LINK.token)}">この内容で登録する</button>
    </div></div>
    <div class="text-center mt-3">
      <button class="btn btn-outline-secondary btn-sm mockbtn" data-act="go" data-route="m_companies">処理業者側の管理画面に戻る</button>
    </div>
  </div>`;
}


Object.assign(ACTIONS, {
  doInvite: d => {
    const m = state.modal;
  const f = state.invite.form, e2 = [];
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
        let n = COMPANIES.length + 1;
        while (COMPANIES.find(x => x.id === 'c' + n)) n++;
        COMPANIES.push({id:'c' + n, name:f.name.trim(), kana:f.kana,
          is_generator:!!f.is_generator, is_transporter:!!f.is_transporter,
          contact:f.contact, email:f.email, phone:f.phone,
          postalcode:f.postalcode, pref:f.pref, address:f.address,
          invoice:f.invoice, bank:f.bank, credit:'',
          status:'active', registered_at:`${D(0)} ${nowHm()}`});
        state.invite.done = true;
        toast('本登録が完了しました。');
        render();
  },
});

INPUT_HOOKS.push((e, d, val) => {
  if (!d.inv) return;
  state.invite.form[d.inv] = val;
  return true;
});
CHANGE_HOOKS.push(INPUT_HOOKS[INPUT_HOOKS.length - 1]);
