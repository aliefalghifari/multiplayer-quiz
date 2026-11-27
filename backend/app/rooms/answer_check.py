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
    if room.current_question < 0 or question_index != room.current_question:
        return _fail("Indeks soal sudah tidak berlaku.")
    if player_id in room.answers:
        return _fail("Jawaban untuk soal ini sudah dikirim.")
    options = room.questions[question_index]["options"]
    if not 0 <= answer_index < len(options):
        return _fail("Pilihan jawaban tidak valid.")
    is_correct = answer_index == room.questions[question_index]["answer"]
    room.answers[player_id] = answer_index
    if is_correct:
        room.scores[player_id] += 100
    should_advance = len(room.answers) == len(room.player_ids) and not room.advancing
    if should_advance:
        room.advancing = True
    names = {
        pid: manager.players[pid].player_name for pid in room.player_ids
    }
    return {
        "error": None,
        "is_correct": is_correct,
        "should_advance": should_advance,
        "scores": dict(room.scores),
        "players": names,
        "correct_answer": room.questions[question_index]["answer"],
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
