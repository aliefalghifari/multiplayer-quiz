<div align="center">

# ⚡ VeriClash — Multiplayer Quiz

**Beat your friends in your field.**

Aplikasi kuis **multiplayer 1v1 real-time** berbasis web yang mempertemukan dua pemain secara otomatis melalui WebSocket, dilengkapi dengan papan skor langsung, timer hitung mundur 5 menit, progres mandiri (*per-player progression*), tombol konfirmasi "Selanjutnya", indikator 5 bulatan status jawaban (*5-dot tracker*), tampilan layar tunggu (*waiting screen*), serta sistem *tie-breaker* berbasis durasi penyelesaian tercepat tanpa hasil seri.

<p>
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.143.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/WebSocket-Real--Time-6366F1?style=for-the-badge&logo=socketdotio&logoColor=white" alt="WebSocket" />
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Frontend" />
</p>

<p>
  <a href="#-tentang-aplikasi">Tentang</a> •
  <a href="#-fitur-utama">Fitur</a> •
  <a href="#%EF%B8%8F-alur-permainan">Alur Permainan</a> •
  <a href="#-struktur-proyek">Struktur Proyek</a> •
  <a href="#-cara-menjalankan">Cara Menjalankan</a> •
  <a href="#-protokol-websocket">Protokol WebSocket</a>
</p>

</div>

---

## 📖 Tentang Aplikasi

**VeriClash** adalah platform duel kuis interaktif dua pemain yang berjalan secara *real-time* di browser. Pemain memasukkan nama panggilan, menekan tombol **Connect**, dan sistem *matchmaking* otomatis memasangkan pemain ke dalam room 1v1.

Setiap pertandingan memuat **5 soal pilihan ganda** acak. Pemain dapat menjawab secara independen tanpa harus menunggu lawan menjawab terlebih dahulu, menggunakan tombol **"Selanjutnya"** untuk konfirmasi jawaban. Jika waktu habis atau pemain selesai lebih dulu, tersedia layar tunggu (*waiting screen*) interaktif dengan timer yang tetap berjalan mundur.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
| :--- | :--- |
| 🎯 **Auto Matchmaking 1v1** | Antrean otomatis berbasis `asyncio.Lock` yang langsung memasangkan dua pemain ke dalam satu *game room*. |
| ⚡ **Komunikasi Real-Time (WebSocket)** | Pertukaran event antara klien dan server melalui endpoint `/ws`. |
| ⏱️ **Timer Hitung Mundur 5 Menit** | Timer *countdown* 05:00 yang terintegrasi di layar soal maupun layar tunggu (*waiting screen*). |
| 🚶 **Progres Mandiri (*Per-Player Progression*)** | Pemain dapat mengerjakan soal sesuai kecepatan masing-masing dan menekan tombol **"Selanjutnya"** untuk verifikasi dan lanjut ke soal berikutnya tanpa terikat gerakan lawan. |
| 🟢🔴 **Indikator 5 Bulatan Status Jawaban** | Menampilkan 5 bulatan untuk kedua pemain (kosong, ceklis hijau `✓` jika benar, silang merah `✕` jika salah) yang diperbarui secara langsung. |
| ⏳ **Layar Tunggu Interaktif** | Jika selesai lebih dulu, pemain dibawa ke layar *"Menunggu hasil lawan..."* lengkap dengan timer dan status bulatan jawaban kedua pemain. |
| 🏁 **Sistem Tie-Breaker Durasi Penyelesaian** | Jika skor kedua pemain sama, pemenang ditentukan secara otomatis melalui **durasi waktu penyelesaian tercepat** (tidak ada hasil seri). |
| 📚 **Riwayat Pertandingan & Pembahasan** | Rekaman riwayat 50 pertandingan terakhir di lokal browser lengkap dengan soal, jawaban Anda, dan kunci **Jawaban Benar**. |

---

## 🛠️ Teknologi yang Digunakan

- **Backend:** Python, FastAPI, Uvicorn, WebSockets, `asyncio`, durasi presisi `time.time()`
- **Frontend:** Semantic HTML5, Modular CSS3, Vanilla ES Modules (`frontend/js/`)
- **Layanan Statis:** FastAPI `StaticFiles` di root `/`

---

## 🚀 Cara Menjalankan

### Prasyarat
- **Python 3.10+** (disarankan Python 3.11+)
- `pip`

### 1. Clone Repositori
```bash
git clone https://github.com/Setyakenn/VeriQ-.Fun.git
cd multiplayer-quiz
```

### 2. Buat Virtual Environment & Install Dependensi
```bash
cd backend
python -m venv .venv
```

Aktifkan virtual environment (Windows PowerShell):
```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependensi:
```bash
pip install -r requirements.txt
```

### 3. Jalankan Server
```bash
uvicorn main:app --reload
```

Server berjalan di **`http://127.0.0.1:8000`**.

---

<div align="center">

Dibuat oleh **[Maheswara Kenzie](https://github.com/Maheswara-Kenzie)**

</div>
