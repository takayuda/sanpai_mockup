
/* =========================================================================
   実績一覧
   ========================================================================= */
function filteredActuals() {
  const f = state.actuals;
  return PICKUPS.filter(p =>
    p.status === 'done' && inScope(p) &&
    p.date >= f.from && p.date <= f.to &&
    (!f.companyId || p.company_id === f.companyId) &&
    (!f.type || p.type === f.type) &&
    (!f.itemId || linesOf(p.id).some(l => l.item_id === f.itemId)) &&
    (!f.diffOnly || (p.diff_reason && p.diff_reason !== ''))
  ).sort((a,b) => a.date === b.date ? (a.id < b.id ? 1 : -1) : (a.date < b.date ? 1 : -1));
}

function viewActuals() {
  const f = state.actuals, list = filteredActuals();
  const net = list.reduce((s,p) => s + (p.weight || 0), 0);
  const diffs = list.filter(p => p.diff_reason).length;

  const rows = list.slice(0, 200).map(p => `<tr class="clickable" data-act="openPickupDetail" data-id="${p.id}">
      <td class="mono">${p.id}</td>
      <td class="mono">${fmtMd(p.date)}</td>
      <td class="mono">${p.receipt_number ? 'No.' + p.receipt_number : '—'}</td>
      <td>${tBadge(p.type)}${p.via === '飛び込み' ? ' <span class="badge b-neutral b-sq">飛込</span>' : ''}</td>
      <td>${esc(company(p.company_id).name)}</td>
      <td class="nowrap" style="font-size:13px">${esc(plantShort(p.plant_id))}</td>
      <td style="font-size:13px">${linesOf(p.id).map(l => esc(item(l.item_id).name)).join('／')}</td>
      <td class="num">${linesOf(p.id).map(l => dec(l.qty) + unit(l.unit_id).name).join('／')}</td>
      <td class="num">${linesOf(p.id).map(l => l.actual_qty != null ? dec(l.actual_qty) + unit(l.unit_id).name : '—').join('／')}</td>
      <td class="num">${num(p.total_weight)}</td>
      <td class="num">${num(p.car_weight)}</td>
      <td class="num fw-bold">${num(p.weight)}</td>
      <td class="num ${p.diff_reason ? 'text-danger' : ''}">${p.diff > 0 ? '+' : ''}${num(p.diff)}
        ${p.diff_reason ? `<div class="text-secondary" style="font-size:11px">${esc(p.diff_reason)}</div>` : ''}</td>
    </tr>`).join('');

  return pageHead('実績一覧',
    `<button class="btn btn-outline-primary btn-sm" data-act="exportActuals">${ic('download')}CSV出力</button>`) +
  `<div class="row g-3 mb-3">
    <div class="col-6 col-lg-3">${kpi('実績件数', list.length + ' <small>件</small>')}</div>
    <div class="col-6 col-lg-3">${kpi('正味重量 合計', num(net) + ' <small>kg</small>', net >= 1000 ? `${dec(net/1000)} t` : '')}</div>
    <div class="col-6 col-lg-3">${kpi('1件あたり平均', list.length ? num(Math.round(net / list.length)) + ' <small>kg</small>' : '—')}</div>
    <div class="col-6 col-lg-3">${kpi('差異の記録あり', diffs + ' <small>件</small>')}</div>
  </div>
  <div class="filterbar">
    <div class="f"><label>開始日</label><input type="date" class="form-control form-control-sm" data-act="acFilter" data-key="from" value="${f.from}"></div>
    <div class="f"><label>終了日</label><input type="date" class="form-control form-control-sm" data-act="acFilter" data-key="to" value="${f.to}"></div>
    <div class="f"><label>取引先</label><select class="form-select form-select-sm" data-act="acFilter" data-key="companyId">${opts(o1(COMPANIES), f.companyId, 'すべて')}</select></div>
    <div class="f"><label>品目</label><select class="form-select form-select-sm" data-act="acFilter" data-key="itemId">${opts(o1(ITEMS), f.itemId, 'すべて')}</select></div>
    <div class="f"><label>区分</label><select class="form-select form-select-sm" data-act="acFilter" data-key="type">${opts([{v:'drop',t:'持込'},{v:'pickup',t:'引取'}], f.type, 'すべて')}</select></div>
    <div class="f align-self-end"><div class="form-check"><input class="form-check-input" type="checkbox" data-act="acFilter" data-key="diffOnly" ${f.diffOnly ? 'checked' : ''}>
      <label class="form-check-label" style="font-size:13px">差異のある実績のみ</label></div></div>
  </div>
  <div class="table-wrap">
    <table class="table table-hover mb-0">
      <thead><tr><th>受付番号</th><th>日付</th><th>伝票No</th><th>区分</th><th>取引先</th><th>拠点</th><th>品目</th>
        <th class="num">申告</th><th class="num">実数</th><th class="num">総重量</th><th class="num">空車重量</th><th class="num">正味重量</th><th class="num">差異(kg)</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="13" class="text-center text-secondary py-4">該当する実績がありません</td></tr>`}</tbody>
    </table>
  </div>
  ${list.length > 200 ? `<p class="hint mt-2">先頭200件を表示（全 ${list.length} 件）。CSVは全件出力されます。</p>` : ''}`;
}
