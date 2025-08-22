// Script para o painel de pedidos
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se há um usuário logado; caso contrário redireciona para a página de login
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }
  // Referência ao botão de logout (se existir)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  }
  const container = document.getElementById('ordersContainer');
  // Busca pedidos do localStorage
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('orders') || '[]');
  } catch (err) {
    console.warn('Erro ao recuperar pedidos', err);
  }
  // Copia os pedidos originais para permitir filtrar sem perder dados
  const allOrders = Array.isArray(orders) ? orders.slice() : [];
  // Referências aos elementos de filtro e resumo
  const summaryEl = document.getElementById('dashboardSummary');
  const dateStartInput = document.getElementById('dateStart');
  const dateEndInput = document.getElementById('dateEnd');
  const filterBtn = document.getElementById('filterOrders');
  const clearBtn = document.getElementById('clearFilter');
  // Função para atualizar localStorage após mudança de status
  function updateOrderStatus(id, newStatus) {
    // Atualiza em allOrders e orders
    const idxAll = allOrders.findIndex((o) => o.id === id);
    if (idxAll >= 0) {
      allOrders[idxAll].status = newStatus;
    }
    const idxCurrent = orders.findIndex((o) => o.id === id);
    if (idxCurrent >= 0) {
      orders[idxCurrent].status = newStatus;
    }
    localStorage.setItem('orders', JSON.stringify(allOrders));
    // Re-renderiza resumo para refletir nova contagem
    renderSummary(orders);
  }
  // Função para calcular e exibir resumo para uma lista de pedidos
  function renderSummary(list) {
    if (!summaryEl) return;
    if (!list || list.length === 0) {
      summaryEl.innerHTML = '<p>Total de pedidos: 0</p>';
      return;
    }
    const total = list.length;
    let pend = 0;
    let route = 0;
    let delivered = 0;
    let revenue = 0;
    list.forEach((o) => {
      if (o.status === 'Pendente') pend++;
      else if (o.status === 'Em rota') route++;
      else if (o.status === 'Entregue') delivered++;
      revenue += Number(o.battery.price || 0);
    });
    const revenueStr = revenue.toFixed(2).replace('.', ',');
    summaryEl.innerHTML = `
      <div class="summary-grid">
        <div class="summary-item"><strong>Total de pedidos:</strong> ${total}</div>
        <div class="summary-item"><strong>Pendentes:</strong> ${pend}</div>
        <div class="summary-item"><strong>Em rota:</strong> ${route}</div>
        <div class="summary-item"><strong>Entregues:</strong> ${delivered}</div>
        <div class="summary-item"><strong>Faturamento estimado:</strong> R$ ${revenueStr}</div>
      </div>
    `;
  }
  // Função para renderizar tabela de pedidos
  function renderOrders(list) {
    // Remove tabela atual
    container.innerHTML = '';
    if (!list || list.length === 0) {
      container.innerHTML = '<p>Nenhum pedido registrado no período selecionado.</p>';
      renderSummary(list);
      return;
    }
    // Atualiza resumo
    renderSummary(list);
    const table = document.createElement('table');
    table.className = 'orders-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Pedido</th>
        <th>Data/Hora</th>
        <th>Cidade</th>
        <th>Veículo</th>
        <th>Cliente</th>
        <th>Bateria</th>
        <th>Preço</th>
        <th>Pagamento</th>
        <th>Status</th>
      </tr>
    `;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    list.forEach((order, index) => {
      const tr = document.createElement('tr');
      const date = new Date(order.created_at);
      const dateStr = date.toLocaleDateString('pt-BR');
      const timeStr = date.toLocaleTimeString('pt-BR');
      const priceStr = order.battery.price.toFixed(2).replace('.', ',');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${dateStr} ${timeStr}</td>
        <td>${order.city}</td>
        <td>${order.vehicle.marca} ${order.vehicle.modelo} ${order.vehicle.ano} ${order.vehicle.versao || ''}</td>
        <td>${order.customer.name} / ${order.customer.phone}</td>
        <td>${order.battery.code}</td>
        <td>R$ ${priceStr}</td>
        <td>${order.payment.type}</td>
        <td></td>
      `;
      // Status select
      const statusTd = tr.querySelector('td:last-child');
      const select = document.createElement('select');
      select.className = 'status-select';
      ['Pendente', 'Em rota', 'Entregue'].forEach((status) => {
        const opt = document.createElement('option');
        opt.value = status;
        opt.textContent = status;
        if (order.status === status) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', (e) => {
        updateOrderStatus(order.id, e.target.value);
      });
      statusTd.appendChild(select);
      tbody.appendChild(tr);
      // Linha de detalhes oculta
      const detailTr = document.createElement('tr');
      const detailTd = document.createElement('td');
      detailTd.colSpan = 9;
      detailTd.className = 'order-details hidden';
      let detailLines = [];
      detailLines.push(`Pedido #${index + 1}`);
      detailLines.push(`Data: ${dateStr} ${timeStr}`);
      detailLines.push(`Cidade: ${order.city}`);
      detailLines.push(`Veículo: ${order.vehicle.marca} ${order.vehicle.modelo} ${order.vehicle.ano} ${order.vehicle.versao || ''}`);
      detailLines.push(`Bateria: ${order.battery.code} (${order.battery.technology})`);
      detailLines.push(`Amperagem: ${order.battery.amperagem} Ah`);
      detailLines.push(`CCA: ${order.battery.cca}`);
      detailLines.push(`Preço: R$ ${priceStr}`);
      detailLines.push(`Cliente: ${order.customer.name} / ${order.customer.phone} / ${order.customer.email}`);
      detailLines.push(`Endereço: ${order.address.street}, Nº ${order.address.number}, Bairro ${order.address.neighborhood}${order.address.complement ? ', ' + order.address.complement : ''}`);
      if (order.delivery.type === '45min') {
        detailLines.push('Entrega em até 45 minutos');
      } else if (order.delivery.schedule) {
        detailLines.push(`Entrega agendada: ${order.delivery.schedule.date} às ${order.delivery.schedule.time}`);
        detailLines.push(`Local: ${order.delivery.schedule.location}`);
      }
      detailLines.push(`Forma de pagamento: ${order.payment.type}`);
      if (order.payment.type === 'credito') {
        detailLines.push(`Bandeira: ${order.payment.cardFlag}`);
        detailLines.push(`Parcelas: ${order.payment.installments}`);
      }
      detailLines.push(`CPF/CNPJ: ${order.payment.document}`);
      detailLines.push(`Status: ${order.status}`);
      detailTd.textContent = detailLines.join('\n');
      detailTr.appendChild(detailTd);
      tbody.appendChild(detailTr);
      tr.addEventListener('click', () => {
        detailTd.classList.toggle('hidden');
      });
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }
  // Se não houver registros, exibe mensagem e resumo zerado
  if (!allOrders || allOrders.length === 0) {
    renderSummary([]);
    container.innerHTML = '<p>Nenhum pedido registrado ainda.</p>';
  } else {
    // Renderiza pedidos iniciais
    renderOrders(allOrders);
  }
  // Filtro por data
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      let filtered = allOrders;
      const startValue = dateStartInput.value;
      const endValue = dateEndInput.value;
      if (startValue) {
        const startDate = new Date(startValue);
        // Zera hora para comparar somente a data
        startDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter((o) => {
          const d = new Date(o.created_at);
          return d >= startDate;
        });
      }
      if (endValue) {
        const endDate = new Date(endValue);
        // Inclui todo o dia final
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((o) => {
          const d = new Date(o.created_at);
          return d <= endDate;
        });
      }
      // Atualiza orders variável para manter referência do filtro para atualização de status
      orders = filtered.slice();
      renderOrders(filtered);
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // Limpa campos de data
      if (dateStartInput) dateStartInput.value = '';
      if (dateEndInput) dateEndInput.value = '';
      orders = allOrders.slice();
      renderOrders(allOrders);
    });
  }
});