“use strict”;
/* ========================= データ初期化 ========================= */
let data = JSON.parse(localStorage.getItem(“assetOSPro”)) || { assets:{ cash:0, bank:0, stock:0, nisa:0, land:0, building:0, carAsset:0 }, liabilities:{ loan:0, credit:0, other:0, mloan:0, mbond:0, ybond:0 }, incomeRecords:[], expenseRecords:[], history:{} };
let monthlyPie = null; let trendChart = null;
/* ========================= 保存 ========================= */
function save(){ localStorage.setItem(“assetOSPro”, JSON.stringify(data)); snapshot(); update(); }
/* ========================= タブ切替 ========================= */
function tab(i){ document.querySelectorAll(”.page”).forEach((p,idx)=>{ p.classList.toggle(“active”, idx===i); }); }
/* ========================= レコード追加 ========================= */
function pushRecord(type, cat, date, amount){ if(!date || !amount) return;
data[type+“Records”].push({ date, cat, amount: +amount }); }
/* ========================= 保存処理 ========================= */
function saveAll(){
// assets data.assets.cash = +cash.value || 0; data.assets.bank = +bank.value || 0; data.assets.stock = +stock.value || 0; data.assets.nisa = +nisa.value || 0; data.assets.land = +land.value || 0; data.assets.building = +building.value || 0; data.assets.carAsset = +carAsset.value || 0;
// liabilities data.liabilities.loan = +loan.value || 0; data.liabilities.credit = +credit.value || 0; data.liabilities.other = +otherDebt.value || 0; data.liabilities.mloan = +mloan.value || 0; data.liabilities.mbond = +mbond.value || 0; data.liabilities.ybond = +ybond.value || 0;
// income pushRecord(“income”,“salary”,income_date_salary.value,income_salary.value); pushRecord(“income”,“extra”,income_date_extra.value,income_extra.value); pushRecord(“income”,“invest”,income_date_invest.value,income_invest.value); pushRecord(“income”,“dividend”,income_date_dividend.value,income_dividend.value);
// expense const expCats = [ [“education”,“education”], [“daily”,“daily”], [“car”,“car”], [“furniture”,“furniture”], [“food”,“food”], [“house”,“house”], [“util”,“utility”], [“comm”,“communication”], [“transport”,“transport”], [“med”,“medical”], [“ent”,“entertainment”], [“other”,“other”] ];
expCats.forEach(([cat,key])=>{ const dateEl = document.getElementById(“exp_date_”+key); const valEl = document.getElementById(“exp_”+key);
pushRecord(“expense”,cat,dateEl?.value,valEl?.value); });
save(); }
/* ========================= 集計 ========================= */
function totalAssets(){ return Object.values(data.assets).reduce((a,b)=>a+b,0); }
function totalDebt(){ return Object.values(data.liabilities).reduce((a,b)=>a+b,0); }
function netWorth(){ return totalAssets() - totalDebt(); }
/* ========================= Snapshot ========================= */
function snapshot(){ const m = new Date().toISOString().slice(0,7); data.history[m] = { net: netWorth() }; }
/* ========================= UI更新 ========================= */
function update(){
document.getElementById(“netWorth”).textContent = “¥” + netWorth().toLocaleString();
document.getElementById(“totalAssets”).textContent = totalAssets().toLocaleString();
document.getElementById(“totalDebt”).textContent = totalDebt().toLocaleString();
const income = monthlySum(“income”); const expense = monthlySum(“expense”);
document.getElementById(“monthIncome”).textContent = income.toLocaleString();
document.getElementById(“monthExpense”).textContent = expense.toLocaleString();
// FIRE削除 → ダミー表示 const fire = document.getElementById(“fireRate”); if(fire) fire.textContent = “—”;
document.getElementById(“onlineStatus”).textContent = navigator.onLine ? “オンライン” : “オフライン”;
renderBS(); renderAnalysis(); renderHistory(); renderCalendar(); renderRanking(); renderTrend(); fillMonthSelect(); }
/* ========================= 月計算 ========================= */
function monthlySum(type, month){
const m = month || new Date().toISOString().slice(0,7);
return data[type+“Records”] .filter(r=>r.date.startsWith(m)) .reduce((a,b)=>a+b.amount,0); }
/* ========================= 貸借対照表 ========================= */
function renderBS(){
const el = document.getElementById(“bsView”);
el.innerHTML = `
<h3>資産</h3>
${Object.entries(data.assets).map(([k,v])=>
`<div class="row"><span>${k}</span><span>${v.toLocaleString()}</span></div>`
).join("")}
<h3>負債</h3>
${Object.entries(data.liabilities).map(([k,v])=>
`<div class="row"><span>${k}</span><span>${v.toLocaleString()}</span></div>`
).join("")}
<h3>純資産</h3>
<div class="row"><span>NET</span><span>${netWorth().toLocaleString()}</span></div>
`;
}
/* ========================= 分析（グラフ） ========================= */
function renderAnalysis(){
const ctx = document.getElementById(“monthlyPie”); if(!ctx) return;
const income = monthlySum(“income”); const expense = monthlySum(“expense”);
if(monthlyPie) monthlyPie.destroy();
monthlyPie = new Chart(ctx, { type:“doughnut”, data:{ labels:[“収入”,“支出”], datasets:[{ data:[income,expense], backgroundColor:[”#2ecc71”,”#e74c3c”] }] } }); }
/* ========================= 資産推移グラフ ========================= */
function renderTrend(){
const ctx = document.getElementById(“assetTrend”); if(!ctx) return;
const keys = Object.keys(data.history).sort(); const values = keys.map(k=>data.history[k].net);
if(trendChart) trendChart.destroy();
trendChart = new Chart(ctx,{ type:“line”, data:{ labels:keys, datasets:[{ label:“純資産推移”, data:values, borderColor:”#0a84ff”, fill:false }] } }); }
/* ========================= カレンダー ========================= */
function renderCalendar(){
const el = document.getElementById(“calendar”); if(!el) return;
const today = new Date(); const y = today.getFullYear(); const m = today.getMonth()+1;
const days = new Date(y,m,0).getDate();
let html = <div class="calendar">;
for(let d=1; d<=days; d++){
const date = ${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")};
const inc = data.incomeRecords.filter(r=>r.date===date).reduce((a,b)=>a+b.amount,0); const exp = data.expenseRecords.filter(r=>r.date===date).reduce((a,b)=>a+b.amount,0);
let cls = “”; if(inc && exp) cls=“both”; else if(inc) cls=“income”; else if(exp) cls=“expense”;
html += `
<div class="day ${cls}">
<div>${d}</div>
<div style="color:#2ecc71">${inc?"+¥"+inc:""}</div>
<div style="color:#e74c3c">${exp?"-¥"+exp:""}</div>
</div>
`;
}
html += “”; el.innerHTML = html; }
/* ========================= 支出ランキング ========================= */
function renderRanking(){
const el = document.getElementById(“expenseRanking”); if(!el) return;
const map = {};
data.expenseRecords.forEach(r=>{ map[r.cat] = (map[r.cat]||0) + r.amount; });
el.innerHTML = Object.entries(map) .sort((a,b)=>b[1]-a[1]) .map(([k,v])=>`
<div class="row">
<span>${k}</span>
<span>${v.toLocaleString()}</span>
</div>
`).join("");
}
/* ========================= 履歴 ========================= */
function renderHistory(){
const el = document.getElementById(“historyList”); if(!el) return;
const list = [ …data.incomeRecords.map(r=>({…r,type:“収入”})), …data.expenseRecords.map(r=>({…r,type:“支出”})) ];
list.sort((a,b)=>b.date.localeCompare(a.date));
el.innerHTML = list.map(r=>`
<div class="row">
<span>${r.date} ${r.cat}</span>
<span class="${r.type==="収入"?"income":"expense"}">
${r.type==="収入"?"+":"-"}¥${r.amount.toLocaleString()}
</span>
</div>
`).join("");
}
/* ========================= CSV出力 ========================= */
function exportCSV(){
let rows = [[“date”,“type”,“category”,“amount”]];
data.incomeRecords.forEach(r=>{ rows.push([r.date,“income”,r.cat,r.amount]); });
data.expenseRecords.forEach(r=>{ rows.push([r.date,“expense”,r.cat,r.amount]); });
const csv = rows.map(r=>r.join(”,”)).join(”\n”);
const blob = new Blob([csv],{type:“text/csv”});
const a = document.createElement(“a”); a.href = URL.createObjectURL(blob); a.download = “assetOS.csv”; a.click(); }
/* ========================= JSONバックアップ ========================= */
function backupJSON(){
const blob = new Blob( [JSON.stringify(data)], {type:“application/json”} );
const a = document.createElement(“a”); a.href = URL.createObjectURL(blob); a.download = “assetOS_backup.json”; a.click(); }
/* ========================= JSON復元 ========================= */
function restoreJSON(){
const file = document.getElementById(“restoreFile”).files[0]; if(!file) return;
const reader = new FileReader();
reader.onload = e=>{ data = JSON.parse(e.target.result); save(); };
reader.readAsText(file); }
/* ========================= テーマ ========================= */
function toggleTheme(){ document.body.classList.toggle(“light”); }
/* ========================= 初期化 ========================= */
update();
