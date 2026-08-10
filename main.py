import asyncio
import json
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse

app = FastAPI()

# bank soal
QUIZ_QUESTIONS = [
  {
    "question": "Jika sedang demam harus berobat,Jika berobat harus berdoa",
    "options": ["Jika sedang demam harus berdoa", "Jika tidak sedang demam, berdoa", "Jika tidak sedang berobat,berdoa", "Jika tidak sedang demam,berobat"],
    "answer": 0
  },
   {
    "question": "Imbuhan 'me-' pada kata 'Menyabit' bermakna?",
    "options": ["Melakukan", "Memakai", "Membuat", "Menyerupai"],
    "answer": 1
  },
     {
    "question": "Imbuhan 'ber-' pada kata 'Bergembira' bermakna?",
    "options": ["Sedang Mengerjakan", "Memanggil", "Dalam Keadaan", "Menjadi"],
    "answer": 2
  },
     {
    "question": "Konjungsi dibawah ini yang menyatakan pertentangan adalah?",
    "options": ["Biarpun Demikian...", "Sesudah Itu...", "Sebaliknya...", "Sementara Itu..."],
    "answer": 0
  },
     {
    "question": "Penulisan kata dibawah ini yang benar adalah?",
    "options": ["Esktra Kurikuler", "Antar Siswa", "Kerjasama", "Ekstrakurikuler"],
    "answer": 3
  },
     {
    "question": "Penulisan kata dibawah ini yang salah adalah?",
    "options": ["Opsi", "Fundamental", "Inklusivitas", "Resiko"],
    "answer": 3
  },
     {
    "question": "Penulisan kata dibawah ini yang benar adalah?",
    "options": ["Aerodinamika", "Dwi Warna", "Semi Profesional", "Dirumah"],
    "answer": 0
  },
     {
    "question": "Dibawah ini yang termasuk kata baku adalah?",
    "options": ["Cindera Mata", "Dipersilahkan", "Cendera Mata", "Aktifitas"],
    "answer": 2
  },
     {
    "question": "Dibawah ini yang termasuk kata baku adalah?",
    "options": ["Jenderal", "Jendral", "Rubuh", "Teoritis"],
    "answer": 0
  },
     {
    "question": "Dibawah ini yang termasuk kata baku adalah?",
    "options": ["Menterjemahkan", "Konkret", "Kwitansi", "Atlit"],
    "answer": 1
  },
  {
    "question": "Dibawah ini yang bukan termasuk kata baku adalah?",
    "options": ["Aerobik", "Apotek", "Lembab", "Kualitas"],
    "answer": 2
  },
    {
    "question": "Dibawah ini yang bukan termasuk kata baku adalah?",
    "options": ["Ons", "Metode", "Seksama", "Spesies"],
    "answer": 2
  },
    {
    "question": "Dibawah ini yang bukan termasuk kata baku adalah?",
    "options": ["Hakekat", "Hierarki", "Konkret", "Penasihat"],
    "answer": 0
  },
    {
    "question": "Dibawah ini yang bukan termasuk kata baku adalah?",
    "options": ["Dipersilakan", "Ekstrim", "Sistem", "Varietas"],
    "answer": 1
  },
    {
    "question": "Dibawah ini yang bukan termasuk kata baku adalah?",
    "options": ["Nasehat", "Selagi", "Lubang", "Rezeki"],
    "answer": 0
  },
]

# game static & matchmaking
matchmaking_queue = []
active_rooms = {}

class Player:
    def __init__(self, websocket: WebSocket, username: str):
        self.websocket = websocket
        self.username = username
        self.id = str(id(websocket))

# does: memanggil file di folder yang sama
@app.get("/")
async def get():
    return FileResponse("index.html")

@app.get("/style.css")
async def get_css():
    return FileResponse("style.css")

@app.get("/script.js")
async def get_js():
    return FileResponse("script.js")

# websocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    player = None

    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)

            # 1. event: find match
            if data["action"] == "find_match":
                player = Player(websocket, data.get("username", "Anonim"))
                matchmaking_queue.append(player)

                await websocket.send_json({"event": "waiting", "message": "Mencari lawan..."})
                await check_and_match()

            # 2. event: submit answer
            elif data["action"] == "submit_answer":
                room_id = data["room_id"]
                q_index = data["question_index"]
                ans_index = data["answer_index"]

                if room_id in active_rooms:
                    room = active_rooms[room_id]
                    if room["current_question"] == q_index and player.id not in room["answers"]:
                        room["answers"][player.id] = ans_index

                        # does: cek jawaban
                        correct_ans = room["questions"][q_index]["answer"]
                        is_correct = (ans_index == correct_ans)
                        if is_correct:(ans_index == correct_ans)
                        room["scores"][player.id] += 100


                         # does: kirim hasil jawaban ke pemain
                        await websocket.send_json({
                            "event": "answer_result", 
                            "is_correct": is_correct
                        })

                        # does: update skor
                        await broadcast_room(room_id, {
                            "event": "score_update", 
                            "scores": room["scores"], 
                            "players": room["player_names"]
                        })

                        # lanjut jika semua pemain sudah menjawab
                        if len(room["answers"]) >= 2:
                            asyncio.create_task(next_question_delay(room_id))

    except WebSocketDisconnect:
        # does: keluarkan pemain dari antrean jika masih matchmaking
         if player in matchmaking_queue:
            matchmaking_queue.remove(player)

        # if: pemain sedang ada di room aktif saat terputus
            for r_id, room in list(active_rooms.items()):
                if player in room["players"]:
                # Hapus room dari daftar aktif
                    active_rooms.pop(r_id, None)

                # does: kirim notifikasi ke pemain lain yang masih terhubung
                for remaining_player in room["players"]:
                    if remaining_player != player:
                        try:
                            await remaining_player.websocket.send_json({
                                "event": "opponent_left", 
                                "message": f"Lawan ({player.username}) telah meninggalkan permainan!" 
                            })
                        except Exception:
                            pass
                break

# matchmaking logic & game
async def check_and_match():
    while len(matchmaking_queue) >= 2:
        p1 = matchmaking_queue.pop(0)
        p2 = matchmaking_queue.pop(0)

        # does: acak 5 soal per sesi
        selected_questions = random.sample(QUIZ_QUESTIONS, min(5, len(QUIZ_QUESTIONS)))

        room_id = f"room_{p1.id}_{p2.id}" 
        active_rooms[room_id] = {
            "players": [p1, p2], 
            "player_names": {p1.id: p1.username, p2.id: p2.username}, 
            "scores": {p1.id: 0, p2.id: 0}, 
            "current_question": 0, 
            "answers": {}, 
            "questions": selected_questions
        }

        await p1.websocket.send_json({"event": "match_found", "room_id": room_id, "opponent":p2.username})
        await p2.websocket.send_json({"event": "match_found", "room_id": room_id, "opponent":p1.username})

        asyncio.create_task(start_game(room_id))

async def start_game(room_id: str):
    await asyncio.sleep(2)
    await send_question(room_id, 0)

async def send_question(room_id: str, q_index: int):
    if room_id not in active_rooms:
        return

    room = active_rooms[room_id]
    room["current_question"] = q_index
    room["answers"] = {}

    q_data = QUIZ_QUESTIONS[q_index]

    await broadcast_room(room_id, {
        "event": "new_question",
        "question_index": q_index,
        "total_questions": len(QUIZ_QUESTIONS),
        "question": q_data["question"],
        "options": q_data["options"]
    })

async def next_question_delay(room_id: str):
    await asyncio.sleep(1.5)
    if room_id not in active_rooms:
        return

    room = active_rooms[room_id]
    next_q = room["current_question"] + 1

    if next_q < len(QUIZ_QUESTIONS):
        await send_question(room_id, next_q)
    else:
        scores = room["scores"]
        names = room["player_names"]
        p_ids = list(scores.keys())

        winner_text = "Hasil Seri / Draw!"
        if scores[p_ids[0]] > scores[p_ids[1]]:
            winner_text = f"🏆 {names[p_ids[0]]} MENANG!"
        elif scores[p_ids[1]] > scores[p_ids[0]]:
            winner_text = f"🏆 {names[p_ids[1]]} MENANG!"

        await broadcast_room(room_id, {
            "event": "game_over",
            "winner_text": winner_text,
            "scores": scores,
            "players": names
        })
        active_rooms.pop(room_id, None)

async def broadcast_room(room_id: str, message: dict):
    if room_id in active_rooms:
        for p in active_rooms[room_id]["players"]:
            try:
                await p.websocket.send_json(message)
            except Exception:
                pass 