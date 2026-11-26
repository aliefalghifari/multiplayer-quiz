from typing import TypedDict


class QuizQuestion(TypedDict):
    question: str
    options: list[str]
    answer: int


QUIZ_QUESTIONS: list[QuizQuestion] = [
    {
        "question": "Jika sedang demam harus berobat, Jika berobat harus berdoa",
        "options": [
            "Jika sedang demam harus berdoa",
            "Jika tidak sedang demam, berdoa",
            "Jika tidak sedang berobat, berdoa",
            "Jika tidak sedang demam, berobat",
        ],
        "answer": 0,
    },
    {
        "question": "Imbuhan 'me-' pada kata 'Menyabit' bermakna?",
        "options": ["Melakukan", "Memakai", "Membuat", "Menyerupai"],
        "answer": 1,
    },
    {
        "question": "Imbuhan 'ber-' pada kata 'Bergembira' bermakna?",
        "options": [
            "Sedang Mengerjakan",
            "Memanggil",
            "Dalam Keadaan",
            "Menjadi",
        ],
        "answer": 2,
    },
    {
        "question": "Konjungsi di bawah ini yang menyatakan pertentangan adalah?",
        "options": [
            "Biarpun Demikian...",
            "Sesudah Itu...",
            "Sebaliknya...",
            "Sementara Itu...",
        ],
        "answer": 0,
    },
    {
        "question": "Penulisan kata di bawah ini yang benar adalah?",
        "options": [
            "Esktra Kurikuler",
            "Antar Siswa",
            "Kerjasama",
            "Ekstrakurikuler",
        ],
        "answer": 3,
    },
    {
        "question": "Penulisan kata di bawah ini yang salah adalah?",
        "options": ["Opsi", "Fundamental", "Inklusivitas", "Resiko"],
        "answer": 3,
    },
    {
        "question": "Penulisan kata di bawah ini yang benar adalah?",
        "options": ["Aerodinamika", "Dwi Warna", "Semi Profesional", "Dirumah"],
        "answer": 0,
    },
    {
        "question": "Di bawah ini yang termasuk kata baku adalah?",
        "options": [
            "Cindera Mata",
            "Dipersilahkan",
            "Cendera Mata",
            "Aktifitas",
        ],
        "answer": 2,
    },
    {
        "question": "Di bawah ini yang termasuk kata baku adalah?",
        "options": ["Jenderal", "Jendral", "Rubuh", "Teoritis"],
        "answer": 0,
    },
    {
        "question": "Di bawah ini yang termasuk kata baku adalah?",
        "options": ["Menterjemahkan", "Konkret", "Kwitansi", "Atlit"],
        "answer": 1,
    },
    {
        "question": "Di bawah ini yang bukan termasuk kata baku adalah?",
        "options": ["Aerobik", "Apotek", "Lembab", "Kualitas"],
        "answer": 2,
    },
    {
        "question": "Di bawah ini yang bukan termasuk kata baku adalah?",
        "options": ["Ons", "Metode", "Seksama", "Spesies"],
        "answer": 2,
    },
    {
        "question": "Di bawah ini yang bukan termasuk kata baku adalah?",
        "options": ["Hakekat", "Hierarki", "Konkret", "Penasihat"],
        "answer": 0,
    },
    {
        "question": "Di bawah ini yang bukan termasuk kata baku adalah?",
        "options": ["Dipersilakan", "Ekstrim", "Sistem", "Varietas"],
        "answer": 1,
    },
    {
        "question": "Di bawah ini yang bukan termasuk kata baku adalah?",
        "options": ["Nasehat", "Selagi", "Lubang", "Rezeki"],
        "answer": 0,
    },
]
