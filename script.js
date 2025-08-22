// Script principal para Baterias 1

// Dados carregados do arquivo JSON
let data = [];
let vehiclesList = [];
let selectedCity = null;
// Variável global para armazenar a localização do usuário (latitude e longitude)
let userLocation = null;
let selectedVehicle = null;

// Lista de capitais brasileiras + Campina Grande
const cities = [
  'Rio Branco, AC',
  'Maceió, AL',
  'Macapá, AP',
  'Manaus, AM',
  'Salvador, BA',
  'Fortaleza, CE',
  'Brasília, DF',
  'Vitória, ES',
  'Goiânia, GO',
  'São Luís, MA',
  'Cuiabá, MT',
  'Campo Grande, MS',
  'Belo Horizonte, MG',
  'Belém, PA',
  'João Pessoa, PB',
  'Curitiba, PR',
  'Recife, PE',
  'Teresina, PI',
  'Rio de Janeiro, RJ',
  'Natal, RN',
  'Porto Velho, RO',
  'Boa Vista, RR',
  'Porto Alegre, RS',
  'Florianópolis, SC',
  'São Paulo, SP',
  'Aracaju, SE',
  'Palmas, TO',
  'Campina Grande, PB'
];

// Elementos da UI
const selectionModal = document.getElementById('selectionModal');
const cityListEl = document.getElementById('cityList');
const cityInput = document.getElementById('cityInput');
const vehicleInput = document.getElementById('vehicleInput');
const vehicleListEl = document.getElementById('vehicleList');
const selectVehicleBtn = document.getElementById('selectVehicle');
const useLocationBtn = document.getElementById('useLocation');
const batteryCard = document.getElementById('batteryCard');
const orderSection = document.getElementById('orderSection');
const orderForm = document.getElementById('orderForm');
const progressSteps = document.querySelectorAll('.progress-step');
const formSteps = document.querySelectorAll('.form-step');
const orderSummary = document.getElementById('orderSummary');

// Carrega dados a partir de uma variável global definida em bateriasData.js
async function loadData() {
  // Se a variável não estiver definida, aborta
  if (!window.bateriasData) {
    console.error('Dados de baterias não encontrados. Certifique-se de incluir bateriasData.js.');
    return;
  }
  data = window.bateriasData;
  // Construir lista de veículos únicos (marca + modelo + ano)
  const seen = new Set();
  vehiclesList = data.map((item) => {
    // Inclui a motorização/versão no identificador único para permitir pesquisa mais detalhada.
    const key = `${item.marca} ${item.modelo} ${item.ano} ${item.versao}`;
    if (!seen.has(key)) {
      seen.add(key);
      return {
        key,
        marca: item.marca,
        modelo: item.modelo,
        ano: item.ano,
        versao: item.versao,
        bateria: item.bateria,
        tecnologia: item.tecnologia,
        preco: item.preco,
        garantia: item.garantia,
        cca: item.cca,
        peso: item.peso,
      };
    }
    return null;
  }).filter(Boolean);
  // Popular datalist de veículos
  populateVehicleList();
}

// Preenche o datalist de cidades
function populateCityList() {
  cityListEl.innerHTML = '';
  cities.sort().forEach((city) => {
    const option = document.createElement('option');
    option.value = city;
    cityListEl.appendChild(option);
  });
}

// Abre o modal de seleção
function openSelectionModal() {
  selectionModal.classList.remove('hidden');
  cityInput.focus();
}

// Fecha o modal de seleção
function closeSelectionModal() {
  selectionModal.classList.add('hidden');
}

// Usa geolocalização para preencher cidade (simples)
function useLocation() {
  if (!navigator.geolocation) {
    alert('Geolocalização não suportada');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      // Salva a posição para uso posterior
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      // Marca como localização atual (pode ser substituída manualmente)
      cityInput.value = 'Minha localização';
    },
    (err) => {
      alert('Não foi possível obter localização');
    }
  );
}

// Filtra sugestões de veículos conforme digitação
// Popula datalist de veículos
function populateVehicleList() {
  if (!vehicleListEl) return;
  vehicleListEl.innerHTML = '';
  vehiclesList.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.key;
    vehicleListEl.appendChild(option);
  });
}

// Selecionar veículo via botão
function selectVehicle() {
  const city = cityInput.value.trim();
  if (!city) {
    alert('Selecione uma cidade.');
    return;
  }
  const vehicleKey = vehicleInput.value.trim();
  if (!vehicleKey) {
    alert('Digite e selecione um veículo válido.');
    return;
  }
  // Encontrar veículo na lista (ignora diferenças de maiúsculas e acentos)
  // Função de normalização: ignora diferenças de caixa, acentos e tipos de hífen
  const normalize = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[-–—]/g, '') // remove hífens e travessões
      .replace(/\s+/g, ' ') // normaliza espaços consecutivos
      .trim();
  };
  const vKeyNorm = normalize(vehicleKey);
  // Tenta encontrar correspondência exata pelo valor normalizado
  selectedVehicle = vehiclesList.find((v) => normalize(v.key) === vKeyNorm);
  if (!selectedVehicle) {
    // Se não encontrar exato, tenta localizar por correspondência parcial (fuzzy)
    selectedVehicle = vehiclesList.find((v) => normalize(v.key).includes(vKeyNorm));
    if (!selectedVehicle) {
      alert('Veículo não encontrado.');
      return;
    }
  }
  selectedCity = city;
  closeSelectionModal();
  showBatteryCard();
  showOrderSection();
  // Rola suavemente até a seção de pedido assim que a bateria for selecionada
  orderSection.scrollIntoView({ behavior: 'smooth' });
}

// Exibe cartão com informações da bateria recomendada
function showBatteryCard() {
  // Limpa cartão atual
  batteryCard.innerHTML = '';
  if (!selectedVehicle) return;
  // Seleciona imagem conforme tecnologia
  const tech = selectedVehicle.tecnologia.toUpperCase();
  let imgSrc = 'bateria_sli.png';
  if (tech.includes('EFB')) {
    imgSrc = 'bateria_efb.png';
  } else if (tech.includes('AGM')) {
    imgSrc = 'bateria_agm.png';
  }
  const price = selectedVehicle.preco;
  const monthly = (price / 10).toFixed(2);
  const discount = (price * 0.97).toFixed(2);
  // Calcular amperagem a partir do código da bateria
  let amperagem = '';
  const match = selectedVehicle.bateria.match(/(\d+)/);
  if (match) {
    amperagem = match[1];
  }
  // Texto da garantia (se numérico, acrescenta "meses de garantia")
  let garantiaText = '';
  if (selectedVehicle.garantia) {
    const g = selectedVehicle.garantia.toString();
    if (/\D/.test(g)) {
      garantiaText = g;
    } else {
      garantiaText = g + ' meses de garantia';
    }
  }
  // Gera HTML do cartão seguindo o modelo do site base
  const cardHTML = `
    <div class="battery-banner">Encontramos a bateria recomendada!</div>
    <div class="battery-header">
      <img src="${imgSrc}" alt="Bateria" />
      <div>
        <span class="installments">Em 10× sem juros de</span>
        <div class="battery-price">R$ ${monthly.replace('.', ',')}</div>
        <div class="battery-cash">valor à vista R$ ${price.toFixed(2).replace('.', ',')}</div>
      </div>
    </div>
    <div class="battery-discount">Com DESCONTO via PIX ou Dinheiro: R$ ${discount.replace('.', ',')}</div>
    <div class="battery-specs">
      <p>Modelo: <strong>${selectedVehicle.bateria}</strong> / Amperagem: <strong>${amperagem ? amperagem + ' Ah' : 'N/A'}</strong></p>
      <p>Tecnologia: <strong>${selectedVehicle.tecnologia}</strong> / CCA: <strong>${selectedVehicle.cca} A</strong></p>
    </div>
    <div class="battery-selection">
      <div class="selection-row">
        <span>${selectedCity}</span>
        <button type="button" class="edit-btn edit-city">Editar</button>
      </div>
      <div class="selection-row">
        <!-- Exibe marca, modelo, ano e motorização/versão para maior clareza -->
        <span>${selectedVehicle.marca} ${selectedVehicle.modelo} – ${selectedVehicle.ano} – ${selectedVehicle.versao}</span>
        <button type="button" class="edit-btn edit-vehicle">Editar</button>
      </div>
    </div>
    <ul class="battery-features">
      <li><img src="icon-delivery.svg" alt="Entrega" />GRÁTIS entrega, teste e instalação</li>
      <li><img src="icon-payment.svg" alt="Pagamento" />Pagamento na entrega: aceitamos cartão, PIX ou dinheiro</li>
      <li><img src="icon-warranty.svg" alt="Garantia" />${garantiaText}</li>
    </ul>
    <button type="button" class="btn-order-battery">Peça agora sua bateria!</button>
  `;
  batteryCard.innerHTML = cardHTML;
  batteryCard.style.display = 'block';
  // Preencher opções de parcelas
  populateInstallments(price);
  // Adiciona eventos de edição
  const editCityBtn = batteryCard.querySelector('.edit-city');
  const editVehicleBtn = batteryCard.querySelector('.edit-vehicle');
  if (editCityBtn) {
    editCityBtn.addEventListener('click', () => {
      // Permite editar somente a cidade
      cityInput.value = selectedCity;
      vehicleInput.value = '';
      openSelectionModal();
    });
  }
  if (editVehicleBtn) {
    editVehicleBtn.addEventListener('click', () => {
      // Permite editar o veículo (mantém cidade pré-selecionada)
      cityInput.value = selectedCity;
      vehicleInput.value = '';
      openSelectionModal();
    });
  }
  // Botão para avançar no formulário
  const orderBtn = batteryCard.querySelector('.btn-order-battery');
  if (orderBtn) {
    orderBtn.addEventListener('click', () => {
      showOrderSection();
      setActiveStep(1);
      // Rolagem suave para a seção do pedido
      orderSection.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

// Preenche opções de parcelas no select
function populateInstallments(price) {
  const select = document.getElementById('installments');
  select.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const total = price;
    const monthly = (price / i).toFixed(2);
    const option = document.createElement('option');
    option.value = `${i}x de R$ ${monthly.replace('.', ',')}`;
    option.textContent = `${i}x de R$ ${monthly.replace('.', ',')} sem juros`;
    select.appendChild(option);
  }
}

// Exibe a seção de pedido e ativa passo 1
function showOrderSection() {
  orderSection.classList.remove('hidden');
  setActiveStep(1);
}

// Atualiza passo ativo na UI
function setActiveStep(step) {
  progressSteps.forEach((el) => {
    if (parseInt(el.dataset.step) === step) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  formSteps.forEach((el) => {
    if (parseInt(el.dataset.step) === step) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

// Gera o resumo do pedido
function generateSummary() {
  const deliveryTime = document.querySelector('input[name="deliveryTime"]:checked').value;
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const address = document.getElementById('address').value.trim();
  const number = document.getElementById('number').value.trim();
  const neighborhood = document.getElementById('neighborhood').value.trim();
  const complement = document.getElementById('complement').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked').value;
  const cardFlag = document.getElementById('cardFlag').value;
  const installments = document.getElementById('installments').value;
  const documentID = document.getElementById('document').value.trim();
  const summaryLines = [];
  // Limpa linhas para reescrever a estrutura
  summaryLines.length = 0;
  // Gera um código de pedido baseado no timestamp (4 últimos dígitos) para identificação
  const orderCode = String(Date.now()).slice(-6);
  // Data e hora atuais
  const now = new Date();
  const dateOrder = now.toLocaleDateString('pt-BR');
  const timeOrder = now.toLocaleTimeString('pt-BR');
  // Extrai amperagem novamente
  let amp = '';
  const m = selectedVehicle.bateria.match(/(\d+)/);
  if (m) amp = m[1];
  // Cabeçalho e dados principais com formatação amigável para WhatsApp
  summaryLines.push(`*Pedido*: #${orderCode}`);
  // Linha em branco para separar seções
  summaryLines.push('');
  summaryLines.push(`*Dados do Pedido*`);
  summaryLines.push(`*Tipo de entrega:* ${deliveryTime === '45min' ? 'Entrega imediata' : 'Entrega agendada'}`);
  summaryLines.push(`*Data/Hora do pedido:* ${dateOrder} ${timeOrder}`);
  // Se agendado, incluir data e hora do agendamento
  if (deliveryTime !== '45min') {
    const date = document.getElementById('scheduleDate').value;
    const time = document.getElementById('scheduleTime').value;
    let dateStr = date;
    let timeStr = time;
    if (date) {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      dateStr = `${day}/${month}/${year}`;
    }
    if (time) {
      timeStr = time;
    }
    const locOpt = document.querySelector('input[name="scheduleLocation"]:checked').value;
    const locText = locOpt === 'same' ? 'Mesma do endereço informado' : 'A ser definida pelo cliente';
    summaryLines.push(`*Data/hora do agendamento:* ${dateStr} ${timeStr}`);
    summaryLines.push(`*Local da troca:* ${locText}`);
  }
  summaryLines.push(`*Modelo da bateria:* ${selectedVehicle.bateria} (${selectedVehicle.tecnologia})`);
  summaryLines.push(`*Amperagem:* ${amp ? amp + ' Ah' : 'N/A'}`);
  // Inclui a motorização/versão no resumo do veículo
  summaryLines.push(`*Veículo:* ${selectedVehicle.marca} ${selectedVehicle.modelo} ${selectedVehicle.ano} ${selectedVehicle.versao}`);
  summaryLines.push(`*Preço:* R$ ${selectedVehicle.preco.toFixed(2).replace('.', ',')}`);
  // Forma de pagamento e parcelas
  const paymentDesc = payment === 'credito' ? 'Cartão de crédito' : payment === 'debito' ? 'Cartão de débito' : payment === 'dinheiro' ? 'Dinheiro' : 'PIX';
  let parcelamentoLine = '';
  if (payment === 'credito') {
    parcelamentoLine = installments;
  }
  summaryLines.push(`*Parcelamento:* ${parcelamentoLine || 'À vista'}`);
  summaryLines.push(`*Forma de pagamento:* ${paymentDesc}`);
  if (payment === 'credito') {
    summaryLines.push(`*Bandeira:* ${cardFlag}`);
  }
  // Linha em branco antes de iniciar os dados do cliente
  summaryLines.push('');
  // Dados do cliente
  summaryLines.push(`*Dados do Cliente*`);
  summaryLines.push(`*Nome:* ${name}`);
  summaryLines.push(`*CPF/CNPJ:* ${documentID}`);
  summaryLines.push(`*Telefone:* ${phone}`);
  summaryLines.push(`*E-mail:* ${email}`);
  summaryLines.push(`*Endereço:* ${address}, Nº ${number}, Bairro ${neighborhood}${complement ? ', ' + complement : ''}`);
  summaryLines.push(`*Cidade:* ${selectedCity}`);
  // Localização (latitude/longitude) se capturada
  if (userLocation) {
    summaryLines.push(`*Localização:* ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`);
  }
  // Monta mensagem final usando quebras de linha
  const msg = summaryLines.join('\n');
  orderSummary.textContent = msg;
  orderSummary.classList.remove('hidden');
  return msg;
}

// Eventos
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  populateCityList();
  // Eventos dos botões de CTA
  document.getElementById('ctaStart').addEventListener('click', openSelectionModal);
  document.getElementById('heroOrder').addEventListener('click', openSelectionModal);
  document.getElementById('heroPrices').addEventListener('click', openSelectionModal);
  document.getElementById('stepsOrder').addEventListener('click', openSelectionModal);
  document.getElementById('closeSelection').addEventListener('click', closeSelectionModal);
  useLocationBtn.addEventListener('click', useLocation);
  selectVehicleBtn.addEventListener('click', selectVehicle);
  // Navegação entre passos
  document.getElementById('toStep2').addEventListener('click', () => {
    // Quando avançar para o passo 2, ajusta o título de acordo com o tipo de entrega selecionado
    const deliveryRadio = document.querySelector('input[name="deliveryTime"]:checked');
    const step2HeadingDynamic = document.querySelector('div.form-step[data-step="2"] h3');
    if (deliveryRadio && deliveryRadio.value === 'agendar') {
      if (step2HeadingDynamic) step2HeadingDynamic.textContent = 'Agendar entrega';
    } else {
      if (step2HeadingDynamic) step2HeadingDynamic.innerHTML = 'Receba em até 45\u00a0minutos.';
    }
    setActiveStep(2);
  });
  document.getElementById('toStep3').addEventListener('click', () => {
    setActiveStep(3);
  });
  // Mudar exibição de parcelas conforme forma de pagamento
  const paymentInputs = document.querySelectorAll('input[name="payment"]');
  paymentInputs.forEach((inp) => {
    inp.addEventListener('change', () => {
      const cardFields = document.getElementById('cardFlag').parentElement;
      const instFields = document.getElementById('installments').parentElement;
      if (inp.value === 'credito' && inp.checked) {
        cardFields.style.display = 'block';
        instFields.style.display = 'block';
      } else {
        cardFields.style.display = 'none';
        instFields.style.display = 'none';
      }
    });
  });
  // Ajusta a visibilidade inicial dos campos de cartão e parcelas com base na opção
  // de pagamento selecionada. Se não for cartão de crédito, esconda os selects.
  (function initializePaymentFields() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    const cardFields = document.getElementById('cardFlag').parentElement;
    const instFields = document.getElementById('installments').parentElement;
    if (selectedPayment && selectedPayment.value === 'credito') {
      cardFields.style.display = 'block';
      instFields.style.display = 'block';
    } else {
      cardFields.style.display = 'none';
      instFields.style.display = 'none';
    }
  })();

  // Mostrar/ocultar campos de agendamento
  const deliveryRadios = document.querySelectorAll('input[name="deliveryTime"]');
  const scheduleFields = document.getElementById('scheduleFields');
  const step2Heading = document.querySelector('div.form-step[data-step="2"] h3');
  deliveryRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.value === 'agendar' && radio.checked) {
        // Exibe campos de agendamento e define como obrigatórios
        scheduleFields.classList.remove('hidden');
        document.getElementById('scheduleDate').setAttribute('required', '');
        document.getElementById('scheduleTime').setAttribute('required', '');
        // Atualiza o título do passo 2 para refletir agendamento
        if (step2Heading) {
          step2Heading.textContent = 'Agendar entrega';
        }
      } else if (radio.value === '45min' && radio.checked) {
        // Oculta campos de agendamento e remove obrigatoriedade
        scheduleFields.classList.add('hidden');
        document.getElementById('scheduleDate').removeAttribute('required');
        document.getElementById('scheduleTime').removeAttribute('required');
        if (step2Heading) {
          step2Heading.innerHTML = 'Receba em até 45\u00a0minutos.';
        }
      }
    });
  });
  // Form submission
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Gera a mensagem de pedido
    const message = generateSummary();
    // Copia o texto para a área de transferência para que o cliente possa
    // compartilhar ou salvar o resumo
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(message);
      } catch (err) {
        console.warn('Não foi possível copiar para a área de transferência', err);
      }
    }
    // Armazena o pedido no localStorage para uso no painel administrativo
    try {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      // Monta objeto de pedido com todas as informações
      const deliveryTime = document.querySelector('input[name="deliveryTime"]:checked').value;
      const nameVal = document.getElementById('name').value.trim();
      const phoneVal = document.getElementById('phone').value.trim();
      const emailVal = document.getElementById('email').value.trim();
      const addressVal = document.getElementById('address').value.trim();
      const numberVal = document.getElementById('number').value.trim();
      const neighborhoodVal = document.getElementById('neighborhood').value.trim();
      const complementVal = document.getElementById('complement').value.trim();
      const paymentVal = document.querySelector('input[name="payment"]:checked').value;
      const cardFlagVal = document.getElementById('cardFlag').value;
      const installmentsVal = document.getElementById('installments').value;
      const documentVal = document.getElementById('document').value.trim();
      // Calcular amperagem novamente
      let ampValue = '';
      const mVal = selectedVehicle.bateria.match(/(\d+)/);
      if (mVal) ampValue = mVal[1];
      // Dados de agendamento se aplicável
      let sched = null;
      if (deliveryTime !== '45min') {
        const date = document.getElementById('scheduleDate').value;
        const time = document.getElementById('scheduleTime').value;
        const locOpt = document.querySelector('input[name="scheduleLocation"]:checked').value;
        let locText = locOpt === 'same' ? 'Mesma do endereço informado' : 'A ser definida pelo cliente';
        // Formatar data e hora
        let dateStr = date;
        let timeStr = time;
        if (date) {
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          dateStr = `${day}/${month}/${year}`;
        }
        if (time) {
          timeStr = time;
        }
        sched = {
          date: dateStr,
          time: timeStr,
          location: locText,
        };
      }
      const orderObj = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        city: selectedCity,
        vehicle: {
          marca: selectedVehicle.marca,
          modelo: selectedVehicle.modelo,
          ano: selectedVehicle.ano,
          versao: selectedVehicle.versao,
        },
        battery: {
          code: selectedVehicle.bateria,
          technology: selectedVehicle.tecnologia,
          price: selectedVehicle.preco,
          amperagem: ampValue,
          cca: selectedVehicle.cca,
        },
        customer: {
          name: nameVal,
          phone: phoneVal,
          email: emailVal,
        },
        address: {
          street: addressVal,
          number: numberVal,
          neighborhood: neighborhoodVal,
          complement: complementVal,
        },
        delivery: {
          type: deliveryTime,
          schedule: sched,
        },
        payment: {
          type: paymentVal,
          cardFlag: paymentVal === 'credito' ? cardFlagVal : null,
          installments: paymentVal === 'credito' ? installmentsVal : null,
          document: documentVal,
        },
        status: 'Pendente',
      };
      orders.push(orderObj);
      localStorage.setItem('orders', JSON.stringify(orders));
    } catch (err) {
      console.warn('Erro ao armazenar pedido', err);
    }
    // Abre o WhatsApp do lojista com a mensagem pronta
    const waNumber = '5511970901461';
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  });

  // Inicializa a funcionalidade de FAQ (accordion)
  const faqButtons = document.querySelectorAll('.faq-question');
  faqButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (item) {
        item.classList.toggle('open');
      }
    });
  });
});