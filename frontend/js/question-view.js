import { escapeHtml } from "./escape.js";
import { gameHudMarkup } from "./game-hud.js";

export function questionMarkup(quiz) {
  const options = quiz.options
    .map((option, index) => {
      const selected = quiz.selectedAnswer === index;
      const resultClass =
        selected && quiz.answerCorrect === true
          ? " is-correct"
          : selected && quiz.answerCorrect === false
            ? " is-wrong"
            : "";
      const letter = String.fromCharCode(65 + index);
      return `<button class="quiz-option${resultClass}" type="button" data-option="${index}" ${quiz.selectedAnswer !== null ? "disabled" : ""} aria-pressed="${selected}">
        <span class="quiz-option-letter">${letter}</span>
        <span>${escapeHtml(option)}</span>
      </button>`;
    })
    .join("");
  return `<div class="quiz-layout">
    ${gameHudMarkup(quiz)}
    <section class="quiz-panel" aria-live="polite">
      <div class="quiz-progress-row">
        <p class="quiz-progress">SOAL ${quiz.questionIndex + 1} / ${quiz.totalQuestions}</p>
      </div>
      <div class="quiz-progress-track" role="progressbar" aria-label="Kemajuan kuis" aria-valuemin="0" aria-valuemax="${quiz.totalQuestions}" aria-valuenow="${quiz.questionIndex + 1}">
        <span style="width: ${((quiz.questionIndex + 1) / quiz.totalQuestions) * 100}%"></span>
      </div>
      <h1 class="quiz-question">${escapeHtml(quiz.question)}</h1>
      <div class="quiz-options" role="group" aria-label="Pilihan jawaban">${options}</div>
      ${quiz.answerCorrect === null ? "" : `<p class="quiz-answer-feedback ${quiz.answerCorrect ? "is-correct" : "is-wrong"}" aria-live="polite">${quiz.answerCorrect ? "Jawaban benar." : "Jawaban kurang tepat."}</p>`}
      ${
        quiz.selectedAnswer !== null
          ? `<div class="quiz-next-loading" aria-live="polite">
              <span>${
                quiz.totalQuestions > 0 && quiz.questionIndex + 1 >= quiz.totalQuestions
                  ? "Menunggu hasil akhir..."
                  : "Menunggu soal berikutnya..."
              }</span>
              <div class="skeleton-shimmer quiz-next-shimmer-bar" aria-hidden="true"></div>
            </div>`
          : ""
      }
    </section>
  </div>`;
}
