const TelegramBot = require('node-telegram-bot-api');

// Вставьте сюда ваш токен
const token = '8324358831:AAGNLTEteXzAmdyv58U0e4OmTEo2tFZfYQA';

// Создаем бота
const bot = new TelegramBot(token, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Открыть сайт', url: 'https://cromaky96.github.io/miniapp/' }]
      ]
    }
  };
  bot.sendMessage(chatId, 'Нажмите кнопку ниже, чтобы открыть сайт:', options);
});