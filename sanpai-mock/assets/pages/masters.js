/* =========================================================================
   拠点・品目・単位マスタ
   ========================================================================= */
const MASTERS = {
  m_plants: {
    title:'拠点', data:() => PLANTS,
    cols:[
      {k:'name', label:'拠点名', type:'text', list:true, req:true},
      {k:'is_delivery', label:'持込受入', type:'bool', list:true},
      {k:'is_pickup', label:'引取対応', type:'bool', list:true},
      {k:'begin_time', label:'引取対応 開始', type:'time', list:true},
      {k:'end_time', label:'引取対応 終了', type:'time', list:true},
      {k:'postalcode', label:'郵便番号', type:'text'},
      {k:'pref', label:'都道府県', type:'text'},
      {k:'address', label:'住所', type:'text', list:true},
      {k:'phone', label:'電話番号', type:'text', list:true}
    ]
  },
  m_items: {
    title:'品目', data:() => ITEMS,
    cols:[
      {k:'name', label:'品目名', type:'text', list:true, req:true},
      {k:'type', label:'廃棄物区分', type:'select', list:true, opts:() => ITEM_TYPES, fmt:v => itemTypeName(v), req:true},
      {k:'is_value', label:'有価物', type:'bool', list:true}
    ]
  },
  m_units: {
    title:'単位', data:() => UNITS,
    cols:[{k:'name', label:'単位', type:'text', list:true, req:true}]
  }
};

function cellText(col, row) {
  const v = getPath(row, col.k);
  if (col.type === 'bool') return v ? `<span class="badge b-approved b-sq">${ic('check',13)}</span>` : '<span class="text-secondary">—</span>';
  if (col.fmt) return v == null || v === '' ? '<span class="text-secondary">—</span>' : col.fmt(v);
  if (col.type === 'select' && col.opts) {
    const o = col.opts().find(x => String(x.v) === String(v));
    return o ? esc(o.t) : (v ? esc(v) : '<span class="text-secondary">—</span>');
  }
  return v == null || v === '' ? '<span class="text-secondary">—</span>' : esc(v);
}
function viewMaster(route) {
  const m = MASTERS[route], rows = m.data(), cols = m.cols.filter(c => c.list);
  return pageHead(m.title,
    `<button class="btn btn-primary btn-sm" data-act="mAdd" data-m="${route}">${ic('plus',15)}新規登録</button>
     <button class="btn btn-outline-primary btn-sm" data-act="mCsv" data-m="${route}">${ic('download')}CSV出力</button>`) +
  `<div class="table-wrap"><table class="table table-hover mb-0">
    <thead><tr>${cols.map(c => `<th>${esc(c.label)}</th>`).join('')}<th></th></tr></thead>
    <tbody>${rows.length ? rows.map((r,i) => `<tr>
      ${cols.map(c => `<td>${cellText(c, r)}</td>`).join('')}
      <td class="text-end text-nowrap">
        ${route === 'm_plants' ? `<button class="btn btn-outline-secondary btn-sm" data-act="goHours" data-id="${r.id}">時間設定</button>` : ''}
        <button class="btn btn-outline-secondary btn-sm ms-1" data-act="mEdit" data-m="${route}" data-i="${i}">編集</button>
        <button class="btn btn-outline-danger btn-sm ms-1" data-act="mDel" data-m="${route}" data-i="${i}">削除</button></td>
    </tr>`).join('') : `<tr><td colspan="${cols.length + 1}" class="text-center text-secondary py-4">登録がありません</td></tr>`}</tbody>
  </table></div>`;
}
MODALS.master = m => {
  const mm = MASTERS[m.m], d = m.row;
  const field = c => {
    const v = getPath(d, c.k);
    const lbl = `<label class="form-label">${esc(c.label)}${c.req ? '<span class="req">必須</span>' : ''}</label>`;
    if (c.type === 'bool') return `<div class="form-check mt-4"><input class="form-check-input" type="checkbox" data-mod="row.${c.k}" ${v ? 'checked' : ''}>
      <label class="form-check-label">${esc(c.label)}</label></div>`;
    if (c.type === 'select') return `${lbl}<select class="form-select" data-mod="row.${c.k}">${opts(c.opts(), v)}</select>`;
    if (c.type === 'time') return `${lbl}<input type="time" step="1800" class="form-control" data-mod="row.${c.k}" value="${esc(v || '')}">`;
    return `${lbl}<input type="text" class="form-control" data-mod="row.${c.k}" value="${esc(v || '')}">`;
  };
  return {
    title:`${mm.title}　${m.idx == null ? '新規登録' : '編集'}`,
    body:`<div class="row g-3">${mm.cols.map(c => `<div class="col-12 col-md-6">${field(c)}</div>`).join('')}</div>
      ${m.err ? `<div class="text-danger mt-2" style="font-size:13px">${esc(m.err)}</div>` : ''}`,
    foot:`<button class="btn btn-outline-secondary" data-act="closeModal">キャンセル</button>
          <button class="btn btn-primary" data-act="mSave">保存</button>`
  };
};

Object.assign(ACTIONS, {
  mAdd: d => {
    const m = state.modal;
  const mm = MASTERS[d.m], row = {};
        mm.cols.forEach(c => setPath(row, c.k, c.type === 'bool' ? false : ''));
        if (d.m === 'm_plants') Object.assign(row, {slots:[], closed_dows:[0], begin_time:'08:00', end_time:'17:00'});
        openModal('master', {m:d.m, idx:null, row});
  },
  mEdit: d => {
    const m = state.modal;
  openModal('master', {m:d.m, idx:Number(d.i), row:JSON.parse(JSON.stringify(MASTERS[d.m].data()[Number(d.i)]))});
  },
  mDel: d => {
    const m = state.modal;
  const arr = MASTERS[d.m].data(), i = Number(d.i), row = arr[i];
        /* 使用中のマスタは削除させない（予約・実績の参照が壊れるため） */
        const used = d.m === 'm_plants' ? PICKUPS.filter(p => p.plant_id === row.id).length
                   : d.m === 'm_items'  ? PICKUP_ITEMS.filter(l => l.item_id === row.id).length
                   : d.m === 'm_units'  ? PICKUP_ITEMS.filter(l => l.unit_id === row.id).length : 0;
        if (used) { toast(`「${row.name}」は予約・実績で ${used} 件使われています。削除できません。`, 'err'); return; }
        if (!confirm(`${MASTERS[d.m].title}の「${row.name}」を削除します。よろしいですか？`)) return;
        arr.splice(i, 1);
        if (d.m === 'm_plants') {                       /* 選択中の拠点が消えたら戻す */
          if (state.plantId === row.id) state.plantId = 'all';
          if (state.hours.plantId === row.id) state.hours.plantId = (PLANTS[0] || {}).id;
        }
        toast('削除しました。', 'warn'); render();
  },
  mSave: d => {
    const m = state.modal;
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
        closeModal(); toast('保存しました。'); render();
  },
  mCsv: d => {
    const m = state.modal;
  const mm = MASTERS[d.m];
        const rows = [mm.cols.map(c => c.label)];
        mm.data().forEach(r => rows.push(mm.cols.map(c => {
          const v = getPath(r, c.k);
          return typeof v === 'boolean' ? (v ? '○' : '') : (v == null ? '' : v);
        })));
        downloadCsv(`${mm.title}.csv`, rows);
        toast('CSVを出力しました。');
  },
  goHours: d => { state.hours.plantId = d.id; go('hours'); },
});
