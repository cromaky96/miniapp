// 1. Создаем или получаем уникальный userId
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = 'user_' + Date.now();
  localStorage.setItem('userId', userId);
}

// 2. Инициализация методов
document.querySelectorAll('.method-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Баланс
let userBalance = 100;
function updateBalanceDisplay() {
  document.getElementById('balance').innerText = 'Ваш баланс: ' + userBalance;
}
updateBalanceDisplay();

const btnWithdraw = document.querySelector('.withdraw-btn');
const inputAmount = document.getElementById('amount');
const inputRequisites = document.getElementById('requisites');

const telegramToken = '8324358831:AAGNLTEteXzAmdyv58U0e4OmTEo2tFZfYQA'; // вставьте сюда свой токен
const adminChatId = '-4704370493'; // вставьте сюда ID чата администратора

// Глобальная переменная для таблицы
let requestsTable;

// Загрузка и сохранение таблицы заявок выводимых средств
function loadUserRequests() {
  const container = document.getElementById('requests-table-container');

  // Если контейнер пустой, создаем таблицу один раз
  if (!container.firstChild) {
    requestsTable = document.createElement('table');
    requestsTable.id = 'history-table';

    requestsTable.innerHTML = `
      <thead>
        <tr style="background-color: #222;">
          <th style="padding: 10px; border: 1px solid #444;">ID</th>
          <th style="padding: 10px; border: 1px solid #444;">Сумма</th>
          <th style="padding: 10px; border: 1px solid #444;">Реквизиты</th>
          <th style="padding: 10px; border: 1px solid #444;">Статус</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    container.appendChild(requestsTable);
  }

  // Получаем список заявок
  const requests = getUserRequests();

  // Очищаем старое содержимое таблицы
  const tbody = requestsTable.querySelector('tbody');
  tbody.innerHTML = '';

  // Добавляем новые строки
  requests.forEach(req => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', req.id);
    let statusColor = '';
    if (req.status === 'pending') statusColor = 'orange';
    else if (req.status === 'approved') statusColor = 'green';
    else if (req.status === 'cancelled') statusColor = 'red';

    tr.innerHTML = `
      <td style="padding: 10px; border: 1px solid #444;">${req.id}</td>
      <td style="padding: 10px; border: 1px solid #444;">${req.amount}</td>
      <td style="padding: 10px; border: 1px solid #444;">${req.requisites}</td>
      <td style="padding: 10px; border: 1px solid #444; font-weight: bold; color: ${statusColor}; text-align: center;">${req.status}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Запуск загрузки таблицы сразу при открытии страницы
loadUserRequests();

// Обработка кнопки "Вывести"
btnWithdraw.onclick = () => {
  const amount = parseFloat(inputAmount.value);
  const requisites = inputRequisites.value.trim();

  if (isNaN(amount) || amount <= 0 || amount > userBalance) {
    alert('Проверьте сумму и баланс');
    return;
  }
  if (!requisites) {
    alert('Укажите реквизиты');
    return;
  }

  const id = Date.now();
  const request = { id, amount, requisites, status: 'pending' };
  saveRequest(request);
  loadUserRequests();
  sendRequestToAdmin(request);
  inputAmount.value = '';
  inputRequisites.value = '';
};

// Получение списка заявок пользователя
function getUserRequests() {
  const data = localStorage.getItem('withdrawalRequests');
  if (data) {
    const all = JSON.parse(data);
    return all[userId] || [];
  }
  return [];
}

// Сохранение новой заявки
function saveRequest(request) {
  const data = localStorage.getItem('withdrawalRequests');
  let all = {};
  if (data) all = JSON.parse(data);
  if (!all[userId]) all[userId] = [];
  // Убираем старые запросы с таким же id
  all[userId] = all[userId].filter(r => r.id !== request.id);
  all[userId].push(request);
  localStorage.setItem('withdrawalRequests', JSON.stringify(all));
}

// Отправка заявки администратору через Телеграм
function sendRequestToAdmin(request) {
  const msg = `Заявка:\nID: ${request.id}\nСумма: ${request.amount}\nРеквизиты: ${request.requisites}`;
  fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: adminChatId,
      text: msg,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Одобрить', callback_data: `approve_${request.id}` }],
          [{ text: 'Отменить', callback_data: `cancel_${request.id}` }]
        ]
      }
    })
  });
}

// Обновление статуса заявки
function updateRequestStatus(requestId, newStatus) {
  const data = localStorage.getItem('withdrawalRequests');
  if (!data) return;
  const all = JSON.parse(data);
  if (!all[userId]) return;
  const reqs = all[userId];
  const req = reqs.find(r => r.id == requestId);
  if (req) {
    req.status = newStatus;
    localStorage.setItem('withdrawalRequests', JSON.stringify(all));
    loadUserRequests(); // обновление таблицы
  }
}
