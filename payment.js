// payment.js

// Объявление глобальных переменных
window.selectedPayment = null;
window.historyItems = [];

// Telegram токен и чат ID
const telegramToken = '8324358831:AAGNLTEteXzAmdyv58U0e4OmTEo2tFZfYQA'; // вставьте сюда
const telegramChatId = '-4704370493'; // вставьте сюда

// ID чата администратора (куда отправлять заявки)
const adminChatId = '-4704370493'; // или свой чат ID для админа

// Для хранения ID callback-запросов
const callbackQueryIds = {}; // ключ - data, значение - id callback-запроса

// Для обработки входящих обновлений
let lastUpdateId = 0;

// --- ВАШИ ФУНКЦИИ --- 

// Отправка уведомления с inline-кнопками админу
async function sendAdminNotification(text, index) {
  const reply_markup = {
    inline_keyboard: [
      [
        { text: "✅ Оплачено", callback_data: `paid_${index}` },
        { text: "❌ Отклонить", callback_data: `canceled_${index}` }
      ]
    ]
  };
  await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: adminChatId, text: text, reply_markup: reply_markup })
  });
}

// Обработка callback-запросов
async function handleCallback(data) {
  const parts = data.split('_');
  if (parts.length !== 2) return;
  const action = parts[0]; // paid или canceled
  const index = parseInt(parts[1], 10);
  if (isNaN(index) || index < 0 || index >= window.historyItems.length) return;

  if (action === 'paid') {
    window.historyItems[index].status = 'Выплачено';
  } else if (action === 'canceled') {
    window.historyItems[index].status = 'Отклонено';
  }
  updateHistory();

  // Отвечаем на callback-запрос, чтобы убрать уведомление в Telegram
  const callbackId = callbackQueryIds[data];
  if (callbackId) {
    await fetch(`https://api.telegram.org/bot${telegramToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackId, text: 'Статус обновлен', show_alert: false })
    });
  }
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
        // сохраняем id callback-запроса для ответа
        callbackQueryIds[update.callback_query.data] = update.callback_query.id;
        handleCallback(update.callback_query.data);
      }
    });
  }
}

// Запускайте опрос каждые 3 секунды
setInterval(pollTelegram, 3000);

// --- ВАШИ ФУНКЦИИ --- 

// Страницы
window.pages = {
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
      <div class="requisites-container" id="requisitesContainer" style="display:none;">
        <label for="requisitesInput">Реквизиты:</label>
        <input type="text" id="requisitesInput" class="requisites-input" placeholder="Введите реквизиты" />
      </div>
      <button class="withdraw-submit" onclick="submitWithdrawal()">Вывести</button>
    </div>
  `,
  history: `<h1>История операций</h1><div id="historyList"></div>`,
  help: `<h1>Помощь</h1><p>Здесь FAQ и поддержка.</p>`
};

// Переменные
window.historyItems = [];
window.selectedPayment = null;

// Изначальная загрузка
window.onload = () => {
  loadPage('main');
  updateHistory();
};

// Функция загрузки страниц
function loadPage(page) {
  const mainTitle = document.getElementById('mainTitle');
  const mainParagraph = document.getElementById('mainParagraph');
  const contentDiv = document.getElementById('content');

  if (page === 'main') {
    mainTitle.style.display = 'block';
    mainParagraph.style.display = 'block';
  } else {
    mainTitle.style.display = 'none';
    mainParagraph.style.display = 'none';
  }

  contentDiv.innerHTML = window.pages[page] || `<h1>Страница не найдена</h1>`;
  if (page === 'main') {
    document.getElementById('profileContainer').style.display = 'block';
  } else {
    document.getElementById('profileContainer').style.display = 'none';
  }

  if (page === 'withdraw') {
    document.querySelectorAll('.payment-card').forEach(card => {
      card.onclick = () => {
        document.querySelectorAll('.payment-card').forEach(c => c.style.borderColor = '');
        card.style.borderColor = '#4CAF50';
        window.selectedPayment = card.dataset.payment;
        if (window.selectedPayment === 'Карта') {
          document.getElementById('requisitesContainer').style.display = 'block';
          document.getElementById('requisitesInput').placeholder = 'Введите номер карты';
        } else if (window.selectedPayment === 'QIWI') {
          document.getElementById('requisitesContainer').style.display = 'block';
          document.getElementById('requisitesInput').placeholder = 'Введите номер QIWI кошелька';
        } else if (window.selectedPayment === 'WebMoney') {
          document.getElementById('requisitesContainer').style.display = 'block';
          document.getElementById('requisitesInput').placeholder = 'Введите WebMoney ID';
        } else {
          document.getElementById('requisitesContainer').style.display = 'none';
        }
      };
    });
  }
  if (page === 'history') {
    updateHistory();
  }
}

// Функция уведомления
function showTopNotification(message, isSuccess = false) {
  const notif = document.getElementById('topNotification');
  notif.textContent = message;
  notif.className = 'show' + (isSuccess ? ' success' : '');
  setTimeout(() => {
    notif.className = '';
  }, 3000);
}

// Функция отправки заявки
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

  // Отправляем заявку админу
  const message = `Заявка:\nДата: ${now}\nСумма: ${amount}\nПлатежная система: ${window.selectedPayment}\nРеквизиты: ${requisites}`;
  await sendAdminNotification(message, index);

  showTopNotification('Заявка на вывод создана', true);

  document.getElementById('amount').value = '';
  document.getElementById('requisitesInput').value = '';
  document.querySelectorAll('.payment-card').forEach(c => c.style.borderColor = '');
  window.selectedPayment = null;
}

// Обновление истории
function updateHistory() {
  const historyDiv = document.getElementById('historyList');
  if (!historyDiv) return;
  historyDiv.innerHTML = '';
  if (window.historyItems.length === 0) {
    historyDiv.innerHTML = '<p style="color:#aaa;font-size:2vh;">Нет заявок</p>';
    return;
  }
  window.historyItems.forEach((item, index) => {
    const div = document.createElement('div');
    div.style.borderBottom = '1px solid #555';
    div.style.padding = '0.5vh 0';
    div.style.fontSize = '2vh';
    div.style.color = '#ddd';
    div.innerHTML = `<strong>${item.date}</strong>: ${item.amount} — ${item.payment} (${item.requisites})` +
      `<span class="status ${item.status === 'В обработке' ? 'processing' : 'paid'}">${item.status}</span>`;
    div.style.background = 'rgba(255,255,255,0.05)';
    div.style.borderRadius = '4px';
    div.style.margin = '0.5vh 0';
    historyDiv.appendChild(div);
  });
}
}
