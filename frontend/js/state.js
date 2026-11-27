import { loadStoredHistory } from "./history-storage.js";

export function initialQuiz() {
  return {
    stage: "lobby",
    roomId: null,
    opponent: null,
    questionIndex: 0,
    totalQuestions: 5,
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
    playerResults: {},
    opponentResults: {},
    answerSubmitted: false,
    waitingForOpponent: false,
    questionLog: [],
    historySaved: false,
  };
}

export const ui = {
  activeTab: "hero",
  navNotice: "",
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
  history: loadStoredHistory(),
  expandedHistoryIds: [],
};

export const refs = {
  sockets: { 1: null },
  activeSocket: null,
  activePlayerId: null,
};
