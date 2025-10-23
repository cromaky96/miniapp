// payment.js

// Объявление глобальных переменных
window.selectedPayment = null;
window.historyItems = [];

// Telegram токен и чат ID
const telegramToken = '8324358831:AAGNLTEteXzAmdyv58U0e4OmTEo2tFZfYQA'; // вставьте сюда
const telegramChatId = '-4704370493'; // вставьте сюда

// ID чата администратора (куда отправлять заявки)
const adminChatId = '-4704370493'; // или свой чат ID для админа

// Для обработки входящих обновлений
let lastUpdateId = 0;

// Отправка уведомления с inline-кнопками админу
async function sendAdminNotification(text, index) {
  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
  const reply_markup = {
    inline_keyboard: [
      [
        { text: "✅ Оплачено", callback_data: `paid_${index}` },
        { text: "❌ Отклонить", callback_data: `canceled_${index}` }
      ]
    ]
  };
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: adminChatId, text: text, reply_markup: reply_markup })
  });
}

// Функция опроса новых сообщений и callback-запросов
async function pollTelegram() {
  const url = `https://api.telegram.org/bot${telegramToken}/getUpdates?offset=${lastUpdateId + 1}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.ok && data.result.length > 0) {
    data.result.forEach(update => {
      lastUpdateId = update.update_id;
      if (update.callback_query) {
        handleCallback(update.callback_query.data);
      }
    });
  }
}

// Обработка callback-запросов от админа для изменения статуса
function handleCallback(data) {
  const parts = data.split('_');
  if (parts.length !== 2) return;
  const action = parts[0];
  const index = parseInt(parts[1], 10);
  if (isNaN(index) || index < 0 || index >= window.historyItems.length) return;

  if (action === 'paid') {
    window.historyItems[index].status = 'Выплачено';
  } else if (action === 'canceled') {
    window.historyItems[index].status = 'Отклонено';
  }
  updateHistory();

  // Можно отправлять уведомление пользователю о смене статуса, если нужно
}

// Обработка отправки заявки пользователем
async function submitWithdrawal() {
  const amount = document.getElementById('amount').value.trim();
  const requisites = document.getElementById('requisitesInput').value.trim();

  if (!amount || !window.selectedPayment || (['Карта','QIWI','WebMoney'].includes(window.selectedPayment) && !requisites)) {
    if (!amount && !requisites) {
      showTopNotification('Пожалуйста, укажите сумму и реквизиты');
    } else if (!amount) {
      showTopNotification('Пожалуйста, укажите сумму');
    } else if (['Карта','QIWI','WebMoney'].includes(window.selectedPayment) && !requisites) {
      showTopNotification('Пожалуйста, укажите реквизиты');
    }
    return;
  }

  const now = new Date().toLocaleString();
  const newItem = {
    date: now,
    amount: amount,
    payment: window.selectedPayment,
    requisites: requisites,
    status: 'В обработке'
  };
  const index = window.historyItems.length;
  window.historyItems.push(newItem);
  updateHistory();

  // Отправляем заявку админу с кнопками
  const message = `Заявка:\nДата: ${now}\nСумма: ${amount}\nПлатежная система: ${window.selectedPayment}\nРеквизиты: ${requisites}`;
  await sendAdminNotification(message, index);

  showTopNotification('Заявка на вывод создана', true);

  document.getElementById('amount').value = '';
  document.getElementById('requisitesInput').value = '';
  document.querySelectorAll('.payment-card').forEach(c => c.style.borderColor = '');
  window.selectedPayment = null;
}

// Инициализация опроса Telegram
setInterval(pollTelegram, 3000);

// Основные ваши функции, страницы и т.д.
const pages = {
  main: `<h1>Выходи за меня ))))</h1><p></p>`,
  withdraw: `
    <div class="withdraw-section">
      <div class="withdraw-title">Вывод средств</div>
      <div class="amount-row">
        <label class="amount-label" for="amount">Сумма:</label>
        <input type="number" id="amount" class="amount-input" placeholder="Введите сумму" />
      </div>
      <div class="payment-options" id="paymentOptions">
        <div class="payment-card" data-payment="QIWI">QIWI</div>
        <div class="payment-card" data-payment="WebMoney">WebMoney</div>
        <div class="payment-card" data-payment="Карта">Карта</div>
      </div>
      <div class="requisites-container" id="requisitesContainer">
        <label for="requisitesInput">Реквизиты:</label>
        <input type="text" id="requisitesInput" class="requisites-input" placeholder="Введите реквизиты" />
      </div>
      <button class="withdraw-submit" onclick="submitWithdrawal()">Вывести</button>
    </div>
  `,
  history: `<h1>История операций</h1><div id="historyList"></div>`,
  help: `<h1>Помощь</h1><p>Здесь FAQ и поддержка.</p>`
};

// Инициализация страницы
window.onload = () => {
  loadPage('main');
  updateHistory();
};