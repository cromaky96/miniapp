window.selectedPayment = null;
window.historyItems = [];

// Telegram-токен и чат ID
const telegramToken = '8324358831:AAGNLTEteXzAmdyv58U0e4OmTEo2tFZfYQA'; // вставьте сюда
const telegramChatId = '-4704370493'; // вставьте сюда
const adminChatId = '-4704370493'; // или свой чат ID для админа

// Для хранения ID callback-запросов
const callbackQueryIds = {};

// Последняя прочитанная версия сообщений
let lastUpdateId = 0;

// Отправляет сообщение администратору с Inline-кнопками
async function sendAdminNotification(text, index) {
  const replyMarkup = {
    inline_keyboard: [
      [{ text: "✅ Выплатить", callback_data: `paid_${index}` }],
      [{ text: "❌ Отклонить", callback_data: `rejected_${index}` }]
    ]
  };

  await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: adminChatId, text: text, reply_markup: replyMarkup })
  });
}

// Обрабатываем Callback-запросы от Telegram
async function handleCallback(data) {
  const parts = data.split('_');
  if (parts.length !== 2) return;
  const action = parts[0]; // paid или rejected
  const index = parseInt(parts[1], 10);
  if (isNaN(index) || index < 0 || index >= window.historyItems.length) return;

  if (action === 'paid') {
    window.historyItems[index].status = 'Выплачено';
  } else if (action === 'rejected') {
    window.historyItems[index].status = 'Отклонено';
  }
  updateHistory();

  // Ответ на callback-запрос
  const callbackId = callbackQueryIds[data];
  if (callbackId) {
    await fetch(`https://api.telegram.org/bot${telegramToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackId, text: 'Статус обновлён.', show_alert: false })
    });
  }
}

// Периодически проверяем новые запросы от Telegram
async function pollTelegram() {
  const url = `https://api.telegram.org/bot${telegramToken}/getUpdates?offset=${lastUpdateId + 1}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.ok && data.result.length > 0) {
    data.result.forEach(update => {
      lastUpdateId = update.update_id;

      if (update.callback_query) {
        callbackQueryIds[update.callback_query.data] = update.callback_query.id;
        handleCallback(update.callback_query.data);
      }
    });
  }
}

// Регулярно опрашивать Telegram на предмет новых запросов
setInterval(pollTelegram, 3000);

// ---

// Функция отправки заявки на вывод средств
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

  // Отправляем заявку администратору
  const message = `Заявка:\nДата: ${now}\nСумма: ${amount}\nСпособ платежа: ${window.selectedPayment}\nРеквизиты: ${requisites}`;
  await sendAdminNotification(message, index);

  showTopNotification('Заявка на вывод создана', true);

  document.getElementById('amount').value = '';
  document.getElementById('requisitesInput').value = '';
  document.querySelectorAll('.payment-card').forEach(c => c.style.borderColor = '');
  window.selectedPayment = null;
}