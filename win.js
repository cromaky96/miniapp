let selectedOption = null;

// Обработка выбора карточки
document.querySelectorAll('.cards-container .card').forEach(card => {
  card.querySelector('.select-button').addEventListener('click', () => {
    // Удалить выделение со всех
    document.querySelectorAll('.cards-container .card').forEach(c => c.classList.remove('active'));
    // Выделить выбранную
    card.classList.add('active');
    // Запомнить выбранный способ
    selectedOption = card.getAttribute('data-option');
    // Обновить отображение выбранного способа
    document.getElementById('selectedMethod').textContent = selectedOption;
    // Разблокировать кнопку, если есть заполненные реквизиты и сумма
    checkInputs();
  });
});

// Проверка заполнения реквизитов и суммы
const requisitesInput = document.getElementById('requisites');
const amountInput = document.getElementById('amount');
const submitBtn = document.getElementById('submitBtn');

function checkInputs() {
  if (
    requisitesInput.value.trim() !== '' &&
    amountInput.value.trim() !== '' &&
    parseFloat(amountInput.value) > 0 &&
    selectedOption !== null
  ) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

requisitesInput.addEventListener('input', checkInputs);
amountInput.addEventListener('input', checkInputs);

// Обработка кнопки "Вывести"
document.getElementById('submitBtn').addEventListener('click', () => {
  alert(`Способ: ${selectedOption}\nРеквизиты: ${requisitesInput.value}\nСумма: ${amountInput.value}`);
});