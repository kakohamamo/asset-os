"use strict";

/* =========================
  安全DOM取得
========================= */
const $ = (id) => document.getElementById(id);

/* =========================
  データ
========================= */

let data = JSON.parse(localStorage.getItem("assetOSPro")) || {
  assets: {
    cash: 0, bank: 0, stock: 0, nisa: 0,
    land: 0, building: 0, carAsset: 0
  },
  liabilities: {
    loan: 0, credit: 0, other: 0,
    mloan: 0, mbond: 0, ybond: 0
  },
  incomeRecords: [],
  expenseRecords: [],
  history: {}
};

/* =========================
  保存
========================= */
function save(){
  localStorage.setItem("assetOSPro", JSON.stringify(data));
  snapshot();
  update();
}

/* =========================
  タブ
========================= */
function tab(i){
  document.querySelectorAll(".page").forEach((p,idx)=>{
    p.classList.toggle("active", idx===i);
  });
}

/* =========================
  レコード追加
========================= */
function pushRecord(type, cat, date, amount){
  if(!date || !amount) return;
  data[type+"Records"].push({
    date,
    cat,
    amount: Number(amount) || 0
  });
}

/* =========================
  保存処理
========================= */
function saveAll(){

  /* ---- assets ---- */
  data.assets.cash = +$("cash")?.value || 0;
  data.assets.bank = +$("bank")?.value || 0;
  data.assets.stock = +$("stock")?.value || 0;
  data.assets.nisa = +$("nisa")?.value || 0;
  data.assets.land = +$("land")?.value || 0;
  data.assets.building = +$("building")?.value || 0;
  data.assets.carAsset = +$("carAsset")?.value || 0;

  /* ---- liabilities ---- */
  data.liabilities.loan = +$("loan")?.value || 0;
  data.liabilities.credit = +$("credit")?.value || 0;
  data.liabilities.other = +$("otherDebt")?.value || 0;
  data.liabilities.mloan = +$("mloan")?.value || 0;
  data.liabilities.mbond = +$("mbond")?.value || 0;
  data.liabilities.ybond = +$("ybond")?.value || 0;

  /* ---- income ---- */
  pushRecord("income","salary",$("income_date_salary")?.value,$("income_salary")?.value);
  pushRecord("income","extra",$("income_date_extra")?.value,$("income_extra")?.value);
  pushRecord("income","invest",$("income_date_invest")?.value,$("income_invest")?.value);
  pushRecord("income","dividend",$("income_date_dividend")?.value,$("income_dividend")?.value);

  /* ---- expense ---- */
  const ex = [
    "education","daily","car","furniture","food",
    "house","util","comm","transport","med","ent","other"
  ];

  ex.forEach(k=>{
    pushRecord(
      "expense",
      k,
      $("exp_date_"+k)?.value,
      $("exp_"+k)?.value
    );
  });

  save();
}

/* =========================
  計算
========================= */

function totalAssets(){
  return Object.values(data.assets).reduce((a,b)=>a+b,0);
}

function totalDebt(){
  return Object.values(data.liabilities).reduce((a,b)=>a+b,0);
}

function net(){
  return totalAssets() - totalDebt();
}

/* =========================
  snapshot
========================= */
function snapshot(){
  const m = new Date().toISOString().slice(0,7);
  data.history[m] = { net: net() };
}

/* =========================
  UI更新
========================= */

function update(){

  const netEl = $("netWorth");
  if(netEl) netEl.textContent = "¥" + net().toLocaleString();

  const aEl = $("totalAssets");
  if(aEl) aEl.textContent = totalAssets().toLocaleString();

  const dEl = $("totalDebt");
  if(dEl) dEl.textContent = totalDebt().toLocaleString();

  const sEl = $("onlineStatus");
  if(sEl) sEl.textContent = navigator.onLine ? "オンライン" : "オフライン";

  renderBS();
  renderHistory();
  renderRanking();
  renderCalendar();
  renderTrend();
}

/* =========================
  貸借対照表
========================= */
function renderBS(){

  const el = $("bsView");
  if(!el) return;

  el.innerHTML = `
  <h3>資産</h3>
  ${Object.entries(data.assets).map(([k,v])=>
    `<div class="row"><span>${k}</span><span>${v}</span></div>`
  ).join("")}

  <h3>負債</h3>
  ${Object.entries(data.liabilities).map(([k,v])=>
    `<div class="row"><span>${k}</span><span>${v}</span></div>`
  ).join("")}

  <h3>純資産</h3>
  <div class="row"><span>NET</span><span>${net()}</span></div>
  `;
}

/* =========================
  履歴
========================= */
function renderHistory(){

  const el = $("historyList");
  if(!el) return;

  const list = [
    ...data.incomeRecords.map(r=>({...r,type:"in"})),
    ...data.expenseRecords.map(r=>({...r,type:"out"}))
  ];

  list.sort((a,b)=>b.date.localeCompare(a.date));

  el.innerHTML = list.map(r=>`
    <div class="row">
      <span>${r.date} ${r.cat}</span>
      <span>${r.type==="in" ? "+" : "-"}${r.amount}</span>
    </div>
  `).join("");
}

/* =========================
  支出ランキング
========================= */
function renderRanking(){

  const el = $("expenseRanking");
  if(!el) return;

  const map = {};

  data.expenseRecords.forEach(r=>{
    map[r.cat] = (map[r.cat]||0) + r.amount;
  });

  el.innerHTML = Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .map(([k,v])=>`
      <div class="row">
        <span>${k}</span>
        <span>${v}</span>
      </div>
    `).join("");
}

/* =========================
  カレンダー
========================= */
function renderCalendar(){

  const el = $("calendar");
  if(!el) return;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth()+1;
  const days = new Date(y,m,0).getDate();

  let html = `<div class="calendar">`;

  for(let d=1; d<=days; d++){

    const date = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

    const inc = data.incomeRecords
      .filter(r=>r.date===date)
      .reduce((a,b)=>a+b.amount,0);

    const exp = data.expenseRecords
      .filter(r=>r.date===date)
      .reduce((a,b)=>a+b.amount,0);

    html += `
      <div class="day">
        <div>${d}</div>
        <div style="color:green">${inc?inc:""}</div>
        <div style="color:red">${exp?exp:""}</div>
      </div>
    `;
  }

  html += `</div>`;
  el.innerHTML = html;
}

/* =========================
  資産推移（簡易）
========================= */
function renderTrend(){

  const el = $("assetTrend");
  if(!el) return;

  const keys = Object.keys(data.history);
  const vals = keys.map(k=>data.history[k].net);

  if(!window.Chart) return;

  new Chart(el,{
    type:"line",
    data:{
      labels:keys,
      datasets:[{
        data:vals,
        borderColor:"#0a84ff"
      }]
    }
  });
}

/* =========================
  初期起動
========================= */
update();