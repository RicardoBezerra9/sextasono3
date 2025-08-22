(function(){
  const SAMPLE = [
    "1.0 Flex", "1.0 Turbo", "1.3 Flex", "1.6 Flex", "1.6 16V",
    "1.8 Flex", "2.0 Flex", "2.0 Turbo", "2.2 Diesel", "2.8 Diesel",
    "3.0 V6", "3.0 Diesel", "3.5 V6", "Hybrid 1.8", "Electric"
  ];
  function attach(el){
    if(!el || el.dataset.mvApplied) return;
    el.setAttribute('list', 'mv-datalist');
    el.dataset.mvApplied = '1';
  }
  function boot(){
    // cria datalist se não existir
    if(!document.getElementById('mv-datalist')){
      const dl = document.createElement('datalist'); dl.id = 'mv-datalist';
      const list = (window.MOTOR_VERSAO_LIST||SAMPLE);
      list.forEach(v=>{ const o=document.createElement('option'); o.value=v; dl.appendChild(o); });
      document.body.appendChild(dl);
    }
    const candidates = [
      'input[name=versao]','input[name=versão]','input[name=motorizacao]','input[name=motorização]',
      '#versao','#versão','#motorizacao','#motorização'
    ];
    candidates.forEach(sel=> document.querySelectorAll(sel).forEach(attach));
  }
  if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();