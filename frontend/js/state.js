export function initialQuiz() {
  return {
    stage: "lobby",
    roomId: null,
    opponent: null,
    questionIndex: 0,
    totalQuestions: 0,
    question: "",
    options: [],
    selectedAnswer: null,
    answerCorrect: null,
    winnerText: "",
    completed: false,
    playerId: null,
    startedAt: null,
    endedAt: null,
    scores: {},
    players: {},
  };
}

export const ui = {
  names: { 1: "" },
  connected: { 1: false },
  canFindAgain: false,
  quiz: initialQuiz(),
  serverMessage: {
    type: "info",
    status: "info",
    message: "Connect a player to start.",
  },
  logs: [],
};

export const refs = {
  sockets: { 1: null },
  activeSocket: null,
  activePlayerId: null,
};
