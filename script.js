const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${wsProtocol}//${location.host}/ws`);

let currentRoomId = null;
let currentQIndex = 0;
let isGameOver = false;

function findMatch() {
  const usernameInput = document.getElementById('username');
  const btnFind = document.getElementById('btn-find');
  const username = usernameInput.value.trim();

  if (!username) return alert('Isi nama kamu dulu!');

  btnFind.disabled = true;
  btnFind.innerText = 'Mencari Lawan...';
  usernameInput.disabled = true;

  ws.send(JSON.stringify({
    action: 'find_match', 
    username: username
  }));
}
// EVENT HANDLER WEBSOCKET
// if: pemain keluar/terputus saat game berjalan
window.addEventListener('beforeunload', () => {
  if (currentRoomId && !isGameOver) {
    ws.close();
  }
});

//does: mengirim notifikasi ke pemain yang keluar
ws.onclose = () => {
  // does: menampilkan notifikasi room sudah terbentuk dan game belum selesai normal
  if (currentRoomId && !isGameOver) {
    showDisconnectScreen("Koneksi Terputus", "Anda telah meninggalkan match.");
  }
};

// event: masuk dari server
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.event === 'waiting') {
    document.getElementById('status').innerText = data.message;
  }

  else if (data.event === 'match_found') {
    currentRoomId = data.room_id;
    isGameOver = false;
    document.getElementById('status').innerText = `Lawan ditemukan: ${data.opponent}! Memulai game...`;
  }

  else if (data.event === 'new_question') {
    currentQIndex = data.question_index;

    const gameCard = document.querySelector('.card');
      gameCard.classList.remove('border-correct', 'border-wrong');

    document.getElementById('screen-lobby').classList.add('hidden');
    document.getElementById('screen-game').classList.remove('hidden');
    document.getElementById('q-text').innerText = `Soal ${data.question_index + 1}/${data.total_questions}: ${data.question}`;

    const optionsContainer = document.getElementById('opts');
    optionsContainer.innerHTML = '';

    data.options.forEach((optText, index) => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.innerText = optText;
      btn.onclick = () => submitAnswer(index);
      optionsContainer.appendChild(btn);
    });
}

  else if (data.event === 'answer_result') {
    const gameCard = document.querySelector('.card');
    if (data.is_correct) {
     gameCard.classList.add('border-correct');
    } else {
      gameCard.classList.add('border-wrong');
    const gameCard = document.querySelector('.card')
      gameCard.classList.remove('border-correct', 'border-wrong')
    }
  }

  else if (data.event === 'score_update') {
    console.log("Update skor:", data.scores);
  }

  else if (data.event === 'game_over') {
    isGameOver = true;
    document.getElementById('screen-game').classList.add('hidden');
    document.getElementById('screen-result').classList.remove('hidden');

    document.getElementById('res-title').innerText = data.winner_text;

    let scoreHTML = "<b>Skor Akhir:</b><br>";
    for (const [pId, pName] of Object.entries(data.players)) {
      const score = data.scores[pId] || 0;
      scoreHTML += `${pName}: ${score} Poin<br>`;
    }
    document.getElementById('res-text').innerHTML = scoreHTML;
  }

  // does: notifikasi untuk pemain yang ditinggalkan lawan
  else if (data.event === 'opponent_left') {
    isGameOver = true;
    showDisconnectScreen("Game Berakhir", data.message);
  }
};

// function: menampilkan layar disconnect
function showDisconnectScreen(title, message) {
  document.getElementById('screen-lobby').classList.add('hidden');
  document.getElementById('screen-game').classList.add('hidden');
  document.getElementById('screen-result').classList.remove('hidden');

  document.getElementById('res-title').innerText = title;
  document.getElementById('res-text').innerHTML = `<b style="color:#ef4444;">${message}</b>`;
}

function submitAnswer(answerIndex) {
  document.querySelectorAll('#opts .btn').forEach(b => b.disabled = true);

  ws.send(JSON.stringify({
    action: 'submit_answer',
    room_id: currentRoomId,
    question_index: currentQIndex,
    answer_index: answerIndex
  }));
}

