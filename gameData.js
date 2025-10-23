// gameData.js

// Получить всех игроков
function getAllPlayers() {
  const data = localStorage.getItem('gamePlayers');
  return data ? JSON.parse(data) : [];
}

// Сохранить всех игроков
function saveAllPlayers(players) {
  localStorage.setItem('gamePlayers', JSON.stringify(players));
}

// Получить данные конкретного игрока по id
function getPlayer(id) {
  const players = getAllPlayers();
  return players.find(p => p.id === id);
}

// Добавить нового игрока
function addPlayer(player) {
  const players = getAllPlayers();
  // Проверка, чтобы не было дублей по id
  if (!players.some(p => p.id === player.id)) {
    players.push(player);
    saveAllPlayers(players);
  }
}

// Обновить данные игрока
function updatePlayer(id, data) {
  const players = getAllPlayers();
  const index = players.findIndex(p => p.id === id);
  if (index !== -1) {
    players[index] = { ...players[index], ...data };
    saveAllPlayers(players);
  }
}