
/* =========================================================================
   画面一覧（ポータル）
   ========================================================================= */
const PORTAL = [
  {sec:'受付・承認', items:[
    ['approvals','予約の承認','申請中の予約・依頼を承認する／変更依頼を返す'],
    ['board','確定した予約','承認済の予約を拠点別・日別に確認し、枠や訪問日時を調整する'],
    ['proxy','予約の代行作成','電話で受けた予約・集荷依頼を社内で入力する']
  ]},
  {sec:'稼働設定', items:[
    ['hours','受付時間・休業日','受入時間枠・引取対応時間・予約の締切・休業日を設定する']
  ]},
  {sec:'実績', items:[
    ['reception','計量入力','着車時間・正味重量・含まれていた品目を記録する'],
    ['actuals','実績一覧','実績の検索・差異の確認・CSV出力']
  ]},
  {sec:'マスタ', items:[
    ['m_companies','取引先','登録用URLの管理と、本登録済み取引先の編集'],
    ['m_plants','拠点','処理施設の基本情報'],
    ['m_items','品目','品目・廃棄物区分・有価物'],
    ['m_units','単位','数量の単位']
  ]},
  {sec:'取引先から見える画面（モック）', items:[
    ['emitter','排出者ポータル','取引先が予約を申請する画面'],
    ['invite','取引先アカウントの登録','登録用URLを開いたときの画面']
  ]}
];

function viewIndex() {
  const today = PICKUPS.filter(p => p.date === D(0) && inScope(p) && !['canceled','rejected','pending'].includes(p.status));
  return pageHead('画面一覧',
    `<button class="btn btn-outline-danger btn-sm" data-act="resetData">${ic('trash',15)}データを初期化</button>`) +
  `<div class="row g-3 mb-4">
    <div class="col-6 col-lg-3">${kpi('承認待ち', pendingCount() + ' <small>件</small>', '', pendingCount() ? 'alert-kpi' : '')}</div>
    <div class="col-6 col-lg-3">${kpi('本日の予約', today.length + ' <small>件</small>')}</div>
    <div class="col-6 col-lg-3">${kpi('未計量', today.filter(p => p.status === 'approved').length + ' <small>件</small>')}</div>
    <div class="col-6 col-lg-3">${kpi('取引先', COMPANIES.length + ' <small>社</small>')}</div>
  </div>
  ${PORTAL.map(sec => `<h2 style="font-size:15px;font-weight:700;margin:22px 0 10px">${sec.sec}</h2>
    <div class="row g-3">
      ${sec.items.map(([r,t,desc]) => {
        /* 取引先の登録画面は、発行中のURL（トークン付き）で開く */
        const href = (r === 'invite' && !IS_SINGLE) ? `invite.html?t=${INVITE_LINK.token}` : hrefOf(r);
        const act  = (r === 'invite' && !IS_SINGLE) ? '' : `data-act="go" data-route="${r}"`;
        return `<div class="col-12 col-md-6 col-xl-4">
        <a class="portal-card" href="${href}" ${act}>
          <span class="ico">${ic((NAV.flatMap(s => s.items).find(x => x.route === r) || {ico:'login'}).ico, 18)}</span>
          <span><b>${t}</b><small>${desc}</small></span>
        </a></div>`; }).join('')}
    </div>`).join('')}
  <p class="hint mt-4">データはブラウザ内のダミーです。ページを移動しても引き継がれ、
    「データを初期化」で最初の状態に戻ります（日付が変わったときも作り直されます）。</p>`;
}
