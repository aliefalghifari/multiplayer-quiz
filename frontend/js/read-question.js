export function readQuestion(parsed, quiz) {
  const options = Array.isArray(parsed.options)
    ? parsed.options.filter((option) => typeof option === "string")
    : [];
  const questionIndex = parsed.question_index;
  const totalQuestions = parsed.total_questions;
  if (
    typeof parsed.question !== "string" ||
    options.length === 0 ||
    typeof questionIndex !== "number" ||
    !Number.isInteger(questionIndex) ||
    questionIndex < 0
  ) {
    return null;
  }
  const total =
    typeof totalQuestions === "number" &&
    Number.isInteger(totalQuestions) &&
    totalQuestions > 0
      ? totalQuestions
      : quiz.totalQuestions;
  return {
    stage: "question",
    roomId: typeof parsed.room_id === "string" ? parsed.room_id : quiz.roomId,
    questionIndex,
    totalQuestions: total,
    question: parsed.question,
    options,
    selectedAnswer: null,
    answerCorrect: null,
    correctAnswer: typeof parsed.correct_answer === "number" ? parsed.correct_answer : null,
  };
}
