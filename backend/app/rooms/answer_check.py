import time


def parse_answer(data):
    room_id = data.get("room_id")
    question_index = data.get("question_index")
    answer_index = data.get("answer_index")
    indexes_ok = _is_int(question_index) and _is_int(answer_index)
    if not isinstance(room_id, str) or not indexes_ok:
        return None
    return room_id, question_index, answer_index


def judge_answer(manager, player_id, room_id, question_index, answer_index):
    room = manager.rooms.get(room_id)
    if room is None or player_id not in room.player_ids:
        return _fail("Ruang permainan tidak ditemukan.")
    expected_q = room.player_current_question.get(player_id, 0)
    if question_index != expected_q:
        return _fail("Indeks soal sudah tidak berlaku.")
    if question_index in room.player_results.get(player_id, {}):
        return _fail("Jawaban untuk soal ini sudah dikirim.")
    options = room.questions[question_index]["options"]
    if not 0 <= answer_index < len(options):
        return _fail("Pilihan jawaban tidak valid.")
    is_correct = answer_index == room.questions[question_index]["answer"]
    if is_correct:
        room.scores[player_id] += 100
    if not hasattr(room, "player_results") or room.player_results is None:
        room.player_results = {}
    if player_id not in room.player_results:
        room.player_results[player_id] = {}
    room.player_results[player_id][question_index] = is_correct

    room.player_current_question[player_id] = question_index + 1
    finished = room.player_current_question[player_id] >= len(room.questions)
    room.player_finished[player_id] = finished
    if finished and player_id not in room.player_durations:
        start_t = room.player_start_times.get(player_id, time.time())
        room.player_durations[player_id] = round(time.time() - start_t, 2)

    names = {
        pid: manager.players[pid].player_name for pid in room.player_ids
    }
    return {
        "error": None,
        "is_correct": is_correct,
        "finished": finished,
        "scores": dict(room.scores),
        "players": names,
        "correct_answer": room.questions[question_index]["answer"],
        "player_results": {pid: dict(res) for pid, res in room.player_results.items()},
        "player_durations": dict(room.player_durations),
    }


def _is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def _fail(error):
    return {
        "error": error,
        "is_correct": False,
        "should_advance": False,
        "scores": None,
        "players": None,
    }
