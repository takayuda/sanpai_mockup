
/* =========================================================================
   産廃DX 処理業者 管理画面モック（第1期スコープ）
   - テーブル構成は添付ER図（companies / plants / items / units /
     pickups / pickup_items）に準拠し、業務上必要な項目のみ追加している
   - データはすべてブラウザ内のダミー。リロードで初期状態に戻る
   ========================================================================= */

/* ---------- 日付ユーティリティ ---------- */
const DOW = ['日','月','火','水','木','金','土'];
const TODAY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
const pad = n => String(n).padStart(2,'0');
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const D = n => dstr(addDays(TODAY,n));
const parseD = s => { const [y,m,dd] = s.split('-').map(Number); return new Date(y,m-1,dd); };
const fmtMd = s => { const d = parseD(s); return `${d.getMonth()+1}/${d.getDate()}（${DOW[d.getDay()]}）`; };
const fmtJp = s => { const d = parseD(s); return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${DOW[d.getDay()]}）`; };
const ymOf = s => s.slice(0,7);
/* 稼働日（日曜以外）で n 日後／n 日前を返す。ダミーデータが休業日に乗らないようにするため */
function bizDay(n) {
  let d = new Date(TODAY), c = 0, step = n < 0 ? -1 : 1;
  while (c < Math.abs(n)) { d = addDays(d, step); if (d.getDay() !== 0) c++; }
  return dstr(d);
}
function B(n) { return bizDay(n); }

/* ---------- ログイン中の担当者（権限の切替は行わない） ---------- */
const ME = {name:'田中 誠', role:'受入担当'};

/* =========================================================================
   plants：拠点（処理施設）マスタ
   - is_delivery … 持込の受入可否 / is_pickup … 引取（集荷）対応可否
   - begin_time〜end_time … 引取対応時間（営業時間・単一設定）
   - slots …  受入時間枠（複数設定可）
   ========================================================================= */
let PLANTS = [
  {id:'pl1', name:'本社工場（さいたま中間処理場）', is_delivery:true, is_pickup:true,
   begin_time:'08:00', end_time:'17:00',
   postalcode:'331-0812', pref:'埼玉県', address:'さいたま市北区宮原町0-0-0', phone:'048-000-1000',
   closed_dows:[0],
   slots:[{id:'s1', name:'午前', from:'09:00', to:'12:00'},
          {id:'s2', name:'午後', from:'13:00', to:'16:00'}]},
  {id:'pl2', name:'川口ヤード', is_delivery:true, is_pickup:false,
   begin_time:'08:30', end_time:'17:30',
   postalcode:'332-0034', pref:'埼玉県', address:'川口市並木0-0-0', phone:'048-000-2000',
   closed_dows:[0],
   slots:[{id:'s3', name:'午前', from:'08:30', to:'11:30'},
          {id:'s4', name:'午後', from:'13:00', to:'17:00'}]}
];
/* 臨時休業日（拠点別） */
let HOLIDAYS = [
  {id:'h1', plant_id:'pl1', date:B(6), reason:'設備定期点検のため臨時休業'}
];

/* =========================================================================
   companies：取引先マスタ
   - status … invited（招待中：登録用URL発行済） / active（本登録済）
   - 取引先自身が入力する項目（メールアドレス・パスワード等）は
     登録用URLからの本登録で埋まる
   ========================================================================= */
let COMPANIES = [
  {id:'c1', name:'株式会社サンプル建設', kana:'カブシキガイシャサンプルケンセツ',
   is_generator:true, is_transporter:false,
   postalcode:'330-0854', pref:'埼玉県', address:'さいたま市大宮区桜木町0-0-0',
   phone:'048-000-0001', email:'kanri@sample-kensetsu.example.jp', contact:'山田 太郎',
   invoice:'T1234567890123', bank:'埼玉りそな銀行 大宮支店 普通 1234567',
   credit:'A',
   status:'active', registered_at:'2026-04-03 09:20'},
  {id:'c2', name:'大宮運輸株式会社', kana:'オオミヤウンユカブシキガイシャ',
   is_generator:false, is_transporter:true,
   postalcode:'331-0804', pref:'埼玉県', address:'さいたま市北区土呂町0-0-0',
   phone:'048-000-0002', email:'haisha@omiya-unyu.example.jp', contact:'鈴木 一郎',
   invoice:'T2345678901234', bank:'武蔵野銀行 大宮支店 普通 2345678',
   credit:'B',
   status:'active', registered_at:'2026-04-04 14:10'},
  {id:'c3', name:'埼玉建設工業株式会社', kana:'サイタマケンセツコウギョウカブシキガイシャ',
   is_generator:true, is_transporter:true,
   postalcode:'330-0061', pref:'埼玉県', address:'さいたま市浦和区常盤0-0-0',
   phone:'048-000-0003', email:'soumu@saitama-kk.example.jp', contact:'佐々木 花子',
   invoice:'T3456789012345', bank:'埼玉りそな銀行 浦和支店 普通 3456789',
   credit:'A',
   status:'active', registered_at:'2026-04-06 08:45'},
  {id:'c5', name:'武蔵野解体株式会社', kana:'ムサシノカイタイカブシキガイシャ',
   is_generator:true, is_transporter:false,
   postalcode:'338-0001', pref:'埼玉県', address:'さいたま市中央区上落合0-0-0',
   phone:'048-000-0005', email:'info@musashino-kaitai.example.jp', contact:'渡辺 翔',
   invoice:'T5678901234567', bank:'りそな銀行 与野支店 普通 5678901',
   credit:'B',
   status:'active', registered_at:'2026-08-01 17:30'}
];

/* 取引先の登録用URL。処理業者ごとに1本を使い回し、必要なときだけ再発行する */
let INVITE_LINK = {token:'d4e5f6g7h8', issued_at:'2026-04-01 10:00'};

/* =========================================================================
   items：品目マスタ　/　units：単位マスタ
   ========================================================================= */
const ITEM_TYPES = [{v:1, t:'産業廃棄物'}, {v:2, t:'特別管理産業廃棄物'}, {v:3, t:'一般廃棄物'}];
let ITEMS = [
  {id:'i1', type:1, name:'廃プラスチック類', is_value:false},
  {id:'i2', type:1, name:'木くず',           is_value:false},
  {id:'i3', type:1, name:'金属くず',         is_value:true},
  {id:'i4', type:1, name:'ガラス・コンクリート・陶磁器くず', is_value:false},
  {id:'i5', type:1, name:'汚泥',             is_value:false},
  {id:'i6', type:1, name:'紙くず',           is_value:false},
  {id:'i7', type:1, name:'混合廃棄物',       is_value:false},
  {id:'i8', type:2, name:'廃油（引火性）',   is_value:false}
];
let UNITS = [
  {id:'u1', name:'kg'}, {id:'u2', name:'t'}, {id:'u3', name:'m3'},
  {id:'u4', name:'個'}, {id:'u5', name:'台'}, {id:'u6', name:'袋'}
];

/* =========================================================================
   pickups：予約・依頼　/　pickup_items：予約明細
   type      … drop（持込）/ pickup（引取）
   status    … pending 申請中 / approved 承認済 / rejected 差戻し
                done 計量済 / canceled 取消
   ※受付番号は排出元ポータルの仕様に合わせ「申請時」に採番する
     （ER図の receipt_number は当日の計量伝票番号として入場受付時に採番）
   ========================================================================= */
let PICKUPS = [];
let PICKUP_ITEMS = [];

let _pi = 0;
function addPickup(p, lines) {
  PICKUPS.push(p);
  lines.forEach(l => PICKUP_ITEMS.push(Object.assign({id:'pi' + (++_pi), pickup_id:p.id}, l)));
}

/* --- 承認待ち --- */
addPickup({id:'R-2026-0152', type:'pickup', status:'pending', company_id:'c1', plant_id:'pl1',
  date:B(1), begin_time:'10:00', end_time:'11:30',
  applied_at:D(-1)+' 16:42', via:'取引先ポータル', note:'搬出口は建物裏手'},
  [{item_id:'i2', unit_id:'u2', qty:1.2}, {item_id:'i3', unit_id:'u1', qty:80}, {item_id:'i7', unit_id:'u3', qty:2}]);

addPickup({id:'R-2026-0158', type:'drop', status:'pending', company_id:'c1', plant_id:'pl1',
  date:B(2), begin_time:'09:00', end_time:'12:00',
  car_number:'大宮 100 あ 12-34', driver_name:'佐藤 健', driver_tel:'090-0000-0000',
  applied_at:D(0)+' 08:12', via:'取引先ポータル', note:'フレコン8袋'},
  [{item_id:'i1', unit_id:'u2', qty:1.2}]);

addPickup({id:'R-2026-0159', type:'drop', status:'pending', company_id:'c2', plant_id:'pl1',
  date:B(2), begin_time:'09:00', end_time:'12:00',
  car_number:'大宮 100 か 55-66', driver_name:'鈴木 一郎', driver_tel:'090-1111-1111',
  applied_at:D(0)+' 08:40', via:'取引先ポータル', note:'解体系の混廃'},
  [{item_id:'i7', unit_id:'u3', qty:8}]);

addPickup({id:'R-2026-0160', type:'pickup', status:'pending', company_id:'c3', plant_id:'pl1',
  date:B(3), begin_time:'09:00', end_time:'12:00',
  applied_at:D(0)+' 09:05', via:'取引先ポータル', note:'脱水済み'},
  [{item_id:'i5', unit_id:'u2', qty:3.5}]);

addPickup({id:'R-2026-0161', type:'drop', status:'pending', company_id:'c5', plant_id:'pl1',
  date:B(4), begin_time:'13:00', end_time:'16:00',
  car_number:'所沢 400 さ 78-90', driver_name:'高橋 誠', driver_tel:'090-2222-2222',
  applied_at:D(0)+' 09:31', via:'取引先ポータル', note:''},
  [{item_id:'i1', unit_id:'u2', qty:0.6}]);

addPickup({id:'R-2026-0162', type:'pickup', status:'pending', company_id:'c5', plant_id:'pl1',
  date:B(1), begin_time:'13:00', end_time:'16:00',
  applied_at:D(0)+' 10:02', via:'電話（代行作成）', note:'解体ガラ混じり'},
  [{item_id:'i2', unit_id:'u2', qty:2.0}, {item_id:'i7', unit_id:'u3', qty:4}]);

addPickup({id:'R-2026-0163', type:'drop', status:'pending', company_id:'c1', plant_id:'pl2',
  date:B(5), begin_time:'08:30', end_time:'11:30',
  car_number:'大宮 100 あ 12-34', driver_name:'佐藤 健', driver_tel:'090-0000-0000',
  applied_at:D(0)+' 10:20', via:'取引先ポータル', note:'鉄スクラップ（有価物）'},
  [{item_id:'i3', unit_id:'u2', qty:1.8}]);

addPickup({id:'R-2026-0172', type:'pickup', status:'pending', company_id:'c1', plant_id:'pl2',
  date:B(2), begin_time:'14:00', end_time:'16:00',
  applied_at:D(0)+' 11:15', via:'取引先ポータル', note:'川口ヤードは引取対応の対象外'},
  [{item_id:'i7', unit_id:'u3', qty:3}]);

/* --- 差戻し --- */
addPickup({id:'R-2026-0155', type:'pickup', status:'rejected', company_id:'c1', plant_id:'pl1',
  date:B(-2), begin_time:'14:00', end_time:'15:00',
  applied_at:B(-4)+' 11:00', via:'取引先ポータル',
  reject_reason:'指定日の収集ルートが満車のため。別日での再申請をお願いします。',
  rejected_at:B(-3)+' 09:12', rejected_by:'配車担当 山本'},
  [{item_id:'i7', unit_id:'u3', qty:3}]);

/* --- 本日 --- */
addPickup({id:'R-2026-0164', type:'drop', status:'done', company_id:'c1', plant_id:'pl1',
  date:D(0), begin_time:'09:00', end_time:'12:00',
  car_number:'大宮 100 あ 12-34', driver_name:'佐藤 健', driver_tel:'090-0000-0000',
  applied_at:B(-2)+' 14:00', via:'取引先ポータル',
  approved_at:B(-2)+' 15:10', approved_by:'受入担当 田中',
  arrived_at:'09:12', receipt_number:1,
  weight:3640, diff:2240, weigh_memo:'フレコン内に金属片の混入あり'},
  [{item_id:'i1', unit_id:'u2', qty:1.4}]);

addPickup({id:'R-2026-0165', type:'drop', status:'approved', company_id:'c3', plant_id:'pl1',
  date:D(0), begin_time:'09:00', end_time:'12:00',
  car_number:'大宮 100 き 11-22', driver_name:'伊藤 大輔', driver_tel:'090-3333-3333',
  applied_at:B(-2)+' 16:20', via:'取引先ポータル',
  approved_at:B(-2)+' 17:00', approved_by:'受入担当 田中'},
  [{item_id:'i4', unit_id:'u2', qty:5.0}]);

addPickup({id:'R-2026-0166', type:'drop', status:'approved', company_id:'c5', plant_id:'pl1',
  date:D(0), begin_time:'13:00', end_time:'16:00',
  car_number:'大宮 100 か 55-66', driver_name:'鈴木 一郎', driver_tel:'090-1111-1111',
  applied_at:D(-1)+' 09:00', via:'取引先ポータル',
  approved_at:D(-1)+' 09:40', approved_by:'受入担当 田中'},
  [{item_id:'i2', unit_id:'u2', qty:2.2}]);

addPickup({id:'R-2026-0167', type:'pickup', status:'approved', company_id:'c1', plant_id:'pl1',
  date:D(0), begin_time:'13:30', end_time:'15:00',
  applied_at:B(-2)+' 10:00', via:'取引先ポータル',
  approved_at:B(-2)+' 11:30', approved_by:'配車担当 山本',
  dispatch_note:'4t車・ドライバー中村で手配済（台帳）'},
  [{item_id:'i7', unit_id:'u3', qty:6}]);

addPickup({id:'R-2026-0168', type:'drop', status:'approved', company_id:'c1', plant_id:'pl2',
  date:D(0), begin_time:'13:00', end_time:'17:00',
  car_number:'大宮 100 あ 33-44', driver_name:'渡辺 翔', driver_tel:'090-4444-4444',
  applied_at:D(-1)+' 13:00', via:'電話（代行作成）',
  approved_at:D(-1)+' 13:20', approved_by:'受入担当 田中'},
  [{item_id:'i7', unit_id:'u3', qty:8}]);

/* --- 翌日以降 --- */
addPickup({id:'R-2026-0169', type:'drop', status:'approved', company_id:'c3', plant_id:'pl1',
  date:B(1), begin_time:'09:00', end_time:'12:00',
  car_number:'大宮 100 き 11-22', driver_name:'伊藤 大輔', driver_tel:'090-3333-3333',
  applied_at:D(-1)+' 15:00', via:'取引先ポータル',
  approved_at:D(-1)+' 15:30', approved_by:'受入担当 田中'},
  [{item_id:'i5', unit_id:'u2', qty:4.0}]);

addPickup({id:'R-2026-0170', type:'pickup', status:'approved', company_id:'c5', plant_id:'pl1',
  date:B(1), begin_time:'10:00', end_time:'11:00',
  applied_at:D(-1)+' 16:10', via:'取引先ポータル',
  approved_at:D(-1)+' 16:40', approved_by:'配車担当 山本',
  dispatch_note:'2t車で手配（台帳）'},
  [{item_id:'i2', unit_id:'u2', qty:1.5}]);

addPickup({id:'R-2026-0171', type:'drop', status:'approved', company_id:'c1', plant_id:'pl1',
  date:B(2), begin_time:'13:00', end_time:'16:00',
  car_number:'大宮 100 か 55-66', driver_name:'鈴木 一郎', driver_tel:'090-1111-1111',
  applied_at:D(0)+' 07:50', via:'取引先ポータル',
  approved_at:D(0)+' 08:05', approved_by:'受入担当 田中'},
  [{item_id:'i1', unit_id:'u2', qty:0.9}]);

/* --- 過去の実績（実績一覧の検証用に45日ぶん生成） --- */
let _seed = 20260727;
const rnd = () => { _seed = (_seed * 1103515245 + 12345) % 2147483648; return _seed / 2147483648; };
const pick = a => a[Math.floor(rnd()*a.length)];
const round2 = n => Math.round(n*100)/100;

(function seedHistory(){
  let no = 100;
  for (let k = 45; k >= 1; k--) {
    const ds = D(-k), dow = parseD(ds).getDay();
    if (dow === 0) continue;
    const cnt = dow === 6 ? 1 : 2 + Math.floor(rnd()*3);
    for (let j = 0; j < cnt; j++) {
      const co = pick(COMPANIES.filter(c => c.status === 'active' && c.is_generator));
      const pl = pick(PLANTS);
      const it = pick(ITEMS.filter(x => x.type === 1));
      const type = rnd() < 0.3 && pl.is_pickup ? 'pickup' : 'drop';
      const slot = pick(pl.slots);
      const qty = round2(0.4 + rnd()*4);
      const net = Math.max(120, Math.round(qty * 1000 * (0.85 + rnd()*0.4)));
      const id = 'R-2026-' + pad(no++);
      addPickup({id, type, status:'done', company_id:co.id, plant_id:pl.id,
        date:ds, begin_time:slot.from, end_time:slot.to,
        car_number:'大宮 100 あ ' + (10+Math.floor(rnd()*80)) + '-' + (10+Math.floor(rnd()*80)),
        driver_name:pick(['佐藤 健','鈴木 一郎','伊藤 大輔','渡辺 翔']),
        driver_tel:'090-0000-0000',
        applied_at:D(-k-2)+' 10:00', via:'取引先ポータル',
        approved_at:D(-k-2)+' 11:00', approved_by:'受入担当 田中',
        arrived_at:pad(9+Math.floor(rnd()*6))+':'+pad(Math.floor(rnd()*6)*10),
        receipt_number:j+1, weight:net, diff: net - Math.round(qty*1000), weigh_memo:''},
        [{item_id:it.id, unit_id:'u2', qty}]);
    }
  }
})();
