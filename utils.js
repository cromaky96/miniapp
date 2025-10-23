// Отображает верхнее уведомление
function showTopNotification(message, isSuccess = false) {
  const notification = document.getElementById('topNotification');
  notification.textContent = message;
  notification.className = 'show' + (isSuccess ? ' success' : '');
  setTimeout(() => {
    notification.className = '';
  }, 3000);
}

// Пример дополнительной функции
function someUtilityFunction() {
  console.log("Утилитарная функция выполнена");
}
