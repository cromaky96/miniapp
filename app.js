document.addEventListener('DOMContentLoaded', () => {
  // Получаем элементы для отображения имени пользователя и количества онлайн-игроков
  const usernameDisplay = document.getElementById('usernameDisplay');
  const playerCountDisplay = document.getElementById('playerCount');

  // Получаем элементы профиля и звезды
  const profileCircle = document.getElementById('profileCircle');
  const starEmoji = document.querySelector('.star-emoji');

  // Отправляем AJAX-запрос на сервер для получения имени пользователя
  fetch('/get-user-info')
    .then(response => response.json())
    .then(data => {
      if (data.username) {
        usernameDisplay.textContent = `Игрок: ${data.username}`;
      }
    })
    .catch(error => console.error('Ошибка:', error));

  // Функция для обновления количества онлайн-игроков
  async function updateOnlinePlayers() {
    try {
      const response = await fetch('/get-online-players');
      const data = await response.json();
      if (response.ok && data.count !== undefined) {
        playerCountDisplay.textContent = `Онлайн игроков: ${data.count}`;
      } else {
        throw new Error('Ошибка при получении данных.');
      }
    } catch (err) {
      console.error(err.message);
      playerCountDisplay.textContent = 'Ошибка!';
    }
  }

  // Первая загрузка данных при старте страницы
  updateOnlinePlayers();

  // Автоматическое обновление данных каждые 10 секунд
  setInterval(updateOnlinePlayers, 10000);

  // Основная логика загрузки страниц
  const contentDiv = document.getElementById('content');
  const mainTitle = document.getElementById('mainTitle');
  const mainParagraph = document.getElementById('mainParagraph');

  const pages = {
    main: `
      <h1></h1>
      <p></p>
      <div id="playerCount"></div> <!-- Сюда выведем количество онлайн-игроков -->
    `,
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
    help: `<h1>Помощь</h1><p>Здесь FAQ и поддержка.</p>`,
    advertising: `<h1>Рекламный блок</h1>` // Новый раздел для рекламной страницы
  };

  let selectedPayment = null;

  // Функционал кнопок меню
  const menuLinks = document.querySelectorAll('.menu-item');
  menuLinks.forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      loadPage(link.dataset.page);
    };
  });

  // Функция загрузки страницы
  function loadPage(page) {
    // Показываем или скрываем белый круг и звезду только на главной странице
    if (page === 'main') {
      profileCircle.style.display = 'block';
      starEmoji.style.display = 'block';

      // Показываем желтую кнопку только на главной странице
      const adBtn = document.querySelector('.ad-button');
      if (adBtn) {
        adBtn.style.display = 'block';
      }
    } else {
      profileCircle.style.display = 'none';
      starEmoji.style.display = 'none';

      // Скроем желтую кнопку на всех остальных страницах
      const adBtn = document.querySelector('.ad-button');
      if (adBtn) {
        adBtn.style.display = 'none';
      }
    }

    mainTitle.style.display = 'block';
    mainParagraph.style.display = 'block';

    contentDiv.innerHTML = pages[page] || `<h1>Страница не найдена</h1>`;

    if (page === 'withdraw') {
      document.querySelectorAll('.payment-card').forEach(card => {
        card.onclick = () => {
          document.querySelectorAll('.payment-card').forEach(c => c.style.borderColor = '');
          card.style.borderColor = '#4CAF50';
          selectedPayment = card.dataset.payment;
          if (selectedPayment === 'Карта') {
            document.getElementById('requisitesContainer').style.display = 'block';
            document.getElementById('requisitesInput').placeholder = 'Введите номер карты';
          } else if (selectedPayment === 'QIWI') {
            document.getElementById('requisitesContainer').style.display = 'block';
            document.getElementById('requisitesInput').placeholder = 'Введите номер QIWI кошелька';
          } else if (selectedPayment === 'WebMoney') {
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

  // Остальные функции (например, обновление истории)
  function updateHistory() {}

  // Запуск начальной страницы
  loadPage('main');

  // Инициализация сердечек
  function createHeart() {
    const heart = document.createElement('div');
    heart.className = 'heart-emoji';
    heart.style.left = Math.random() * 100 + '%';
    heart.textContent = '❤️';
    document.getElementById('heartsBackground').appendChild(heart);
    heart.addEventListener('animationend', () => { heart.remove(); });
  }
  setInterval(createHeart, 300);

  // Обработчик нажатия на кнопку рекламы
  const adButton = document.querySelector('.ad-button');
  if (adButton) {
    adButton.onclick = (e) => {
      e.preventDefault();
      loadPage(adButton.dataset.page); // Переход на рекламную страницу
    };
  }

  // Остальные функции и логика
});

