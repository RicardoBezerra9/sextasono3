
// === Enhancements (não-destrutivo) ===
(function(){
  function moneyBR(n){ try{return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}catch(e){ return 'R$ '+(Math.round(n*100)/100).toFixed(2).replace('.',',')} }
  function generateSlots(start='09:00', end='20:00', stepMin=30){
    const slots=[]; let [h,m]=start.split(':').map(Number); const [eh,em]=end.split(':').map(Number);
    while(h<eh || (h===eh && m<=em)){
      const t = String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
      slots.push(t); m+=stepMin; if(m>=60){h++; m-=60;}
      if(h>eh || (h===eh && m>em)) break;
    } return slots;
  }
  window.__b1helpers = window.__b1helpers || {moneyBR, generateSlots};

  window.renderThreeBrandCards = function(base){
    const row = document.getElementById('brandCardsRow'); if(!row) return;
    const titleEl = document.getElementById('vehicleChosenText'); if(titleEl){
      titleEl.textContent = `${base.marca} ${base.modelo} ${base.ano} · ${base.versao}`;
    }
    row.innerHTML='';
    const pMoura = Number(base.price||0);
    const pHeliar = +(pMoura * 0.97).toFixed(2);
    const pEcon  = +(pHeliar * 0.90).toFixed(2);
    function range(p,pct){const min=+(p*(1-pct)).toFixed(2), max=+(p*(1+pct)).toFixed(2); return `${moneyBR(min)} ~ ${moneyBR(max)}`}

    const cards=[
      {brand:'Moura',img:'assets/img/bateria_moura.png',price:pMoura,install:pMoura/10,model:base.modelCode||'M60AD SLI',ah:base.ah||'60',garantia:base.garantia||'18 meses',range:range(pMoura,0.02),
        benefits:['Maior Assistência Nacional','Original de Montadora ~70%','Mais Vendida e Alta Durabilidade']},
      {brand:'Heliar',img:'assets/img/bateria_heliar.png',price:pHeliar,install:pHeliar/10,model:'Equivalente',ah:base.ah||'60',garantia:base.garantia||'18 meses',range:range(pHeliar,0.03),
        benefits:['Original de Montadora','Garantia Nacional','Boa durabilidade']},
      {brand:'Econômica',img:'assets/img/bateria_economica.png',price:pEcon,install:pEcon/10,model:'Equivalente',ah:base.ah||'60',garantia:base.garantia||'18 meses',range:range(pEcon,0.01),
        benefits:['Menor custo imediato','Garantia Local','Média durabilidade']},
    ];

    cards.forEach(c=>{
      const el = document.createElement('div');
      el.className='brand-card';
      el.innerHTML = `
        <div class="top-line">
          <div class="brand">${c.brand}</div>
          <div class="select-icon" data-brand="${c.brand}" title="Selecionar">✔</div>
        </div>
        <img src="${c.img}" alt="Bateria ${c.brand}" />
        <div class="price">${moneyBR(c.price)}</div>
        <div class="install">(10x ${moneyBR(c.install)})</div>
        <div class="specs">
          <div><strong>Modelo:</strong> ${c.model}</div>
          <div><strong>Amperagem:</strong> ${c.ah} Ah</div>
          <div><strong>Garantia:</strong> ${c.garantia}</div>
        </div>
        <div class="avg90">Média últimos 90 dias: ${c.range}</div>
        <ul class="benefits">
          ${c.benefits.map(b=>`<li>${b}</li>`).join('')}
        </ul>
      `;
      row.appendChild(el);
    });

    row.querySelectorAll('.select-icon').forEach(ic=>{
      ic.addEventListener('click', ()=>{
        row.querySelectorAll('.select-icon').forEach(o=>o.classList.remove('selected'));
        row.querySelectorAll('.brand-card').forEach(c=>c.classList.remove('selected'));
        ic.classList.add('selected');
        ic.closest('.brand-card').classList.add('selected');
        const brand = ic.dataset.brand;
        let price = pMoura;
        if(brand==='Heliar') price = pHeliar;
        if(brand==='Econômica') price = pEcon;
        window.__selectedBrand = brand;
        window.__selectedPrice = price;
        const orderSec = document.getElementById('orderSection');
        if(orderSec) { orderSec.classList.remove('hidden'); orderSec.scrollIntoView({behavior:'smooth',block:'start'}); }
        const line = document.getElementById('installmentDynamicLine'); if(line) line.textContent='';
      });
    });
  };

  window.buildWhatsAppMessage = function(){
    const nome = (document.getElementById('name')||{value:''}).value || '';
    const uf = (document.getElementById('stateUF')||{value:'PB'}).value || 'PB';
    const brand = window.__selectedBrand || 'Moura';
    const baseModel = (window.selectedVehicle && window.selectedVehicle.bateria) ? window.selectedVehicle.bateria : 'M60AD SLI 60 Ah';
    const ahMatch = baseModel.match(/(\d+)\s*Ah/i);
    const ah = ahMatch ? (ahMatch[1] + ' Ah') : ((window.selectedVehicle && window.selectedVehicle.ah) ? (window.selectedVehicle.ah+' Ah') : '');
    const garantia = (window.selectedVehicle && window.selectedVehicle.garantia) ? window.selectedVehicle.garantia : '18 meses';
    const modelForBrand = (brand==='Moura') ? baseModel : 'Equivalente';
    const price = Number(window.__selectedPrice || (window.selectedVehicle && window.selectedVehicle.preco) || 0);

    let paymentMethod = '';
    const payRadios = document.querySelectorAll('input[name="payment"]');
    payRadios.forEach(r=>{ if(r.checked) paymentMethod = r.value; });
    const instSel = document.getElementById('installments');
    let instText = '';
    if(paymentMethod==='credito' && instSel && instSel.value) {
      const m = instSel.value.match(/^(\d+)x/);
      let n = m ? parseInt(m[1],10) : 1;
      if(!n || n<1) n=1;
      const parcela = (price / n);
      instText = n+'x de R$ '+(parcela.toFixed(2).replace('.',','));
    } else if(paymentMethod==='debito' || paymentMethod==='pix' || paymentMethod==='dinheiro') {
      instText = 'à vista';
    }

    let entregaTipo = 'Agendada';
    const imm = document.querySelector('input[name="deliveryTime'][value='imediato']");
    const agd = document.querySelector('input[name="deliveryTime'][value='agendar']");
    if(imm && imm.checked) entregaTipo = 'Imediata';
    if(agd && agd.checked) entregaTipo = 'Agendada';
    const dateISO = (document.getElementById('scheduleDate')||{value:''}).value || '';
    const timeStr = (document.getElementById('scheduleTime')||{value:''}).value || '';
    function fmtDateBR(iso){ if(!iso) return ''; const p=iso.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
    const dataBR = dateISO ? fmtDateBR(dateISO) : '';

    function rand6(){ return String(Math.floor(Math.random()*1e6)).padStart(6,'0'); }
    const pedido = (uf||'PB') + rand6();

    let congrats = '';
    if(brand==='Moura') {
      congrats = `Parabéns ${nome}, a Moura é qualidade e confiança no mercado brasileiro.`;
    } else if(brand==='Heliar') {
      congrats = `Parabéns ${nome}, você fez uma ótima compra. A Heliar está presente no Brasil há mais de 90 anos.`;
    } else {
      congrats = `Parabéns ${nome}, uma boa economia em um ótimo momento.`;
    }
    const footer = 'Estamos felizes em te entregar a melhor solução neste momento que quer muita confiança. @bateria1';

    let msg = '';
    msg += congrats + "\n\n";
    msg += 'Pedido: ' + pedido + '\n\n';
    msg += 'Bateria escolhida:\n';
    msg += '• Marca: ' + brand + '\n';
    msg += '• Modelo: ' + modelForBrand + '\n';
    if(ah) msg += '• Amperagem: ' + ah + '\n';
    if(garantia) msg += '• Garantia: ' + garantia + '\n';
    if(paymentMethod==='credito' && instText && instText!=='à vista') {
      msg += '• Total: ' + instText + '\n\n';
    } else {
      msg += '• Total: R$ ' + price.toFixed(2).replace('.',',') + (instText && instText!=='à vista' ? ' ('+instText+')' : '') + '\n\n';
    }
    msg += 'Entrega:\n';
    msg += '• Tipo: ' + entregaTipo + '\n';
    if(dataBR) msg += '• Data: ' + dataBR + '\n';
    if(timeStr) msg += '• Hora: ' + timeStr + '\n\n';
    msg += 'Pagamento: Apenas na entrega\n\n';
    msg += footer;
    return msg;
  };

  document.addEventListener('DOMContentLoaded', ()=>{
    const btn = document.getElementById('submitOrder') || document.getElementById('solicitarEntrega') || document.getElementById('finalizarPedido');
    if(btn){
      btn.addEventListener('click', (e)=>{ e && e.preventDefault && e.preventDefault(); e && e.stopPropagation && e.stopPropagation();
        try{
          const numberEl = document.getElementById('whatsNumber');
          const phone = numberEl ? numberEl.value.replace(/\D/g,'') : '5583999999999';
          const url = 'https://wa.me/'+phone+'?text='+encodeURIComponent(window.buildWhatsAppMessage());
          window.open(url, '_blank');
        }catch(e){ console.warn(e); }
      });
    }
    const timePanel = document.getElementById('timePickerPanel');
    if(timePanel){
      timePanel.innerHTML = __b1helpers.generateSlots('09:00','20:00',30).map(t=>`<button type="button" data-time="${t}">${t}</button>`).join(' ');
      timePanel.addEventListener('click', (e)=>{
        if(e.target.tagName==='BUTTON'){
          const inputTime = document.getElementById('scheduleTime');
          const timeBtn = document.getElementById('timePickerBtn');
          inputTime.value = e.target.dataset.time;
          if(timeBtn) timeBtn.textContent = e.target.dataset.time;
        }
      });
    }
  });
})();


// === Appended: date helpers + installment updater + picker bindings ===
function todayISO(){
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
function tomorrowISO(){
  const d = new Date();
  d.setDate(d.getDate()+1);
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
function updateInstallmentLine(){
  const line = document.getElementById('installmentDynamicLine');
  if(!line) return;
  const price = Number(window.__selectedPrice||0);
  const payRadios = document.querySelectorAll('input[name="payment"]');
  let method = ''; payRadios.forEach(r=>{ if(r.checked) method=r.value; });
  if(method!=='credito' || !price){ line.textContent=''; return; }
  const sel = document.getElementById('installments');
  let n = 10;
  if(sel && sel.value){
    const m = sel.value.match(/^(\d+)x/); n = m ? parseInt(m[1],10) : 10;
  }
  if(n<1) n=1;
  const parcela = price / n;
  line.textContent = `Você pagará: ${n}x de R$ ${parcela.toFixed(2).replace('.',',')} (sem juros)`;
}

document.addEventListener('DOMContentLoaded', ()=>{
  // Day picker toggle and set
  const dayBtn = document.getElementById('dayPickerBtn');
  const dayPanel = document.getElementById('dayPickerPanel');
  if(dayBtn && dayPanel){
    dayBtn.addEventListener('click', ()=>{
      dayPanel.classList.toggle('open');
    });
    dayPanel.addEventListener('click', (e)=>{
      if(e.target.tagName==='BUTTON'){
        const v = e.target.dataset.day;
        const input = document.getElementById('scheduleDate');
        if(v==='today'){ input.value = todayISO(); dayBtn.textContent='Hoje'; }
        if(v==='tomorrow'){ input.value = tomorrowISO(); dayBtn.textContent='Amanhã'; }
        dayPanel.classList.remove('open');
      }
    });
  }
  // Time picker toggle (if not already bound)
  const timeBtn = document.getElementById('timePickerBtn');
  const timePanel = document.getElementById('timePickerPanel');
  if(timeBtn && timePanel){
    timeBtn.addEventListener('click', ()=>{
      timePanel.classList.toggle('open');
    });
  }
  // Payment listeners for installment line
  const payRadios = document.querySelectorAll('input[name="payment"]');
  payRadios.forEach(r=> r.addEventListener('change', updateInstallmentLine));
  const instSel = document.getElementById('installments');
  if(instSel) instSel.addEventListener('change', updateInstallmentLine);
});

function __hideWAPreviewIfAny(){
  try{
    var el = document.getElementById('waPreview') || document.querySelector('.wa-preview, #wa-preview');
    if(el){ el.textContent=''; el.style.display='none'; }
  }catch(e){}
}
document.addEventListener('DOMContentLoaded', __hideWAPreviewIfAny);
