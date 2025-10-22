const TelegramBot = require('node-telegram-bot-api');

const token = '8324358831:AAGNLTEteXzAmdyv58U0e4OmTEo2tFZfYQA';
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ 
          text: 'Открыть MiniApp', 
          web_app: { url: 'https://cromaky96.github.io/miniapp/' } 
        }]
      ]
    }
  };
  bot.sendMessage(chatId, 'Нажмите кнопку ниже, чтобы открыть MiniApp внутри Telegram:', options);
});
