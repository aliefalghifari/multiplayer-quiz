
import { useRef, useState } from "react";
import type { MutableRefObject } from "react";
import StatusMessage from "./component/StatusMessage";
import "./App.css";

type MessageStatus = "waiting" | "success" | "error" | "info";

interface ServerMessage {
  type: string;
  status: MessageStatus;
  message: string;
}

type QuizStage = "lobby" | "starting" | "question" | "result";

interface QuizState {
  stage: QuizStage;
  roomId: string | null;
  opponent: string | null;
  questionIndex: number;
  totalQuestions: number;
  question: string;
  options: string[];
  selectedAnswer: number | null;
  answerCorrect: boolean | null;
  winnerText: string;
  scores: Record<string, number>;
  players: Record<string, string>;
}

interface LogEntry {
  id: number;
  player: string;
  message: string;
  status: MessageStatus;
}

interface PlayerPanelProps {
  title: string;
  playerName: string;
  onNameChange: (name: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  connected: boolean;
  canConnect: boolean;
}

function PlayerPanel({
  title,
  playerName,
  onNameChange,
  onConnect,
  onDisconnect,
  connected,
  canConnect,
}: PlayerPanelProps) {
  return (
    <article className="player-panel">
      <div className="player-panel-header">
        <div>
          <span className="player-label">{title}</span>
          <h2>Connection</h2>
        </div>

        <span
          className={`connection-indicator ${
            connected ? "is-connected" : "is-disconnected"
          }`}
        >
          <span className="indicator-dot" />
          {connected ? "Connected" : "Offline"}
        </span>
      </div>

      <label className="input-label" htmlFor={`${title}-name`}>
        Player name
      </label>

      <input
        id={`${title}-name`}
        type="text"
        placeholder="Enter player name"
        value={playerName}
        onChange={(event) => onNameChange(event.target.value)}
        disabled={connected}
      />

      <div className="button-group">
        <button
          className="connect-button"
          type="button"
          onClick={onConnect}
          disabled={connected || !canConnect || !playerName.trim()}
        >
          Connect
        </button>

        <button
          className="disconnect-button"
          type="button"
          onClick={onDisconnect}
          disabled={!connected}
        >
          Disconnect
        </button>
      </div>
    </article>
  );
}

function createInitialQuizState(): QuizState {
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
    scores: {},
    players: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === "number" && Number.isFinite(entry[1]),
    ),
  );
}

function getStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function App() {
  const player1 = useRef<WebSocket | null>(null);
  const player2 = useRef<WebSocket | null>(null);
  const activeSocket = useRef<WebSocket | null>(null);

  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");

  const [player1Connected, setPlayer1Connected] = useState(false);
  const [player2Connected, setPlayer2Connected] = useState(false);
  const [activePlayerId, setActivePlayerId] = useState<1 | 2 | null>(null);
  const [canFindAgain, setCanFindAgain] = useState(false);
  const [quiz, setQuiz] = useState<QuizState>(createInitialQuizState);

  const [serverMessage, setServerMessage] = useState<ServerMessage>({
    type: "info",
    status: "info",
    message: "Connect a player to start.",
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);

  function addLog(
    player: string,
    message: string,
    status: MessageStatus = "info",
  ) {
    setLogs((previous) => [
      {
        id: Date.now() + Math.random(),
        player,
        message,
        status,
      },
      ...previous,
    ]);
  }

  function connectPlayer(
    playerId: 1 | 2,
    playerName: string,
    socketRef: MutableRefObject<WebSocket | null>,
    setConnected: (connected: boolean) => void,
  ) {
    const name = playerName.trim();

    if (!name) {
      setServerMessage({
        type: "error",
        status: "error",
        message: "Player name cannot be empty.",
      });
      return;
    }

    if (activePlayerId !== null && activePlayerId !== playerId) {
      return;
    }

    const existingSocket = socketRef.current;

    if (
      existingSocket &&
      (existingSocket.readyState === WebSocket.OPEN ||
        existingSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname || "127.0.0.1";
    const socket = new WebSocket(
      `${protocol}//${hostname}:8000/ws?player_name=${encodeURIComponent(name)}`,
    );
    socketRef.current = socket;
    activeSocket.current = socket;
    setActivePlayerId(playerId);

    setServerMessage({
      type: "info",
      status: "waiting",
      message: `${name} is connecting to the server...`,
    });

    addLog(name, "Connecting to server.", "waiting");

    socket.onopen = () => {
      setConnected(true);
      setCanFindAgain(true);

      setServerMessage({
        type: "success",
        status: "success",
        message: `${name} connected to the server.`,
      });

      addLog(name, "WebSocket connection established.", "success");
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      let parsed: unknown;

      try {
        parsed = JSON.parse(event.data);
      } catch {
        const message: ServerMessage = {
          type: "error",
          status: "error",
          message: "Invalid message received from the server.",
        };
        setServerMessage(message);
        addLog(name, message.message, message.status);
        return;
      }

      if (!isRecord(parsed)) {
        return;
      }

      const eventType =
        typeof parsed.type === "string"
          ? parsed.type
          : typeof parsed.event === "string"
            ? parsed.event
            : "message";
      const status: MessageStatus =
        parsed.status === "waiting" ||
        parsed.status === "success" ||
        parsed.status === "error" ||
        parsed.status === "info"
          ? parsed.status
          : "info";
      const message: ServerMessage = {
        type: eventType,
        status,
        message:
          typeof parsed.message === "string" ? parsed.message : event.data,
      };

      setServerMessage(message);
      addLog(name, message.message, message.status);

      if (eventType === "matched" || eventType === "match_found") {
        setQuiz((current) => ({
          ...current,
          stage: "starting",
          roomId:
            typeof parsed.room_id === "string"
              ? parsed.room_id
              : current.roomId,
          opponent:
            typeof parsed.opponent === "string"
              ? parsed.opponent
              : current.opponent,
        }));
      } else if (eventType === "new_question") {
        const options = Array.isArray(parsed.options)
          ? parsed.options.filter(
              (option): option is string => typeof option === "string",
            )
          : [];
        const question = parsed.question;
        const questionIndex = parsed.question_index;
        const totalQuestions = parsed.total_questions;

        if (
          typeof question !== "string" ||
          options.length === 0 ||
          typeof questionIndex !== "number" ||
          !Number.isInteger(questionIndex) ||
          questionIndex < 0
        ) {
          setServerMessage({
            type: "error",
            status: "error",
            message: "The server sent an invalid quiz question.",
          });
          return;
        }

        setQuiz((current) => ({
          ...current,
          stage: "question",
          roomId:
            typeof parsed.room_id === "string"
              ? parsed.room_id
              : current.roomId,
          questionIndex,
          totalQuestions:
            typeof totalQuestions === "number" &&
            Number.isInteger(totalQuestions) &&
            totalQuestions > 0
              ? totalQuestions
              : current.totalQuestions,
          question,
          options,
          selectedAnswer: null,
          answerCorrect: null,
        }));
      } else if (
        eventType === "answer_result" &&
        typeof parsed.is_correct === "boolean"
      ) {
        const answerCorrect = parsed.is_correct;
        setQuiz((current) => ({
          ...current,
          answerCorrect,
        }));
      } else if (eventType === "score_update") {
        setQuiz((current) => ({
          ...current,
          scores: getNumberRecord(parsed.scores),
          players: getStringRecord(parsed.players),
        }));
      } else if (eventType === "game_over") {
        setQuiz((current) => ({
          ...current,
          stage: "result",
          winnerText:
            typeof parsed.winner_text === "string"
              ? parsed.winner_text
              : message.message,
          scores: getNumberRecord(parsed.scores),
          players: getStringRecord(parsed.players),
        }));
      } else if (
        eventType === "player_disconnected" ||
        eventType === "opponent_left"
      ) {
        setQuiz((current) => ({
          ...current,
          stage: "result",
          winnerText: message.message,
        }));
      } else if (eventType === "error") {
        setQuiz((current) =>
          current.stage === "question"
            ? { ...current, selectedAnswer: null }
            : current,
        );
      }
    };

    socket.onerror = () => {
      setServerMessage({
        type: "error",
        status: "error",
        message: `WebSocket error for ${name}. Check the backend server.`,
      });

      addLog(name, "WebSocket error.", "error");
    };

    socket.onclose = (event: CloseEvent) => {
      if (socketRef.current === socket) {
        socketRef.current = null;
        setConnected(false);

        setServerMessage({
          type: event.code === 1000 ? "info" : "error",
          status: event.code === 1000 ? "info" : "error",
          message:
            event.code === 1000
              ? `${name} disconnected.`
              : `${name}'s connection closed (code ${event.code}).`,
        });
      }

      if (activeSocket.current === socket) {
        activeSocket.current = null;
        setActivePlayerId(null);
        setCanFindAgain(false);
        setQuiz((current) =>
          current.stage === "question" || current.stage === "starting"
            ? {
                ...current,
                stage: "result",
                winnerText: "Koneksi ke server terputus.",
              }
            : current,
        );
      }

      addLog(
        name,
        `Connection closed (code ${event.code}).`,
        event.code === 1000 ? "info" : "error",
      );
    };
  }

  function disconnectPlayer(
    playerId: 1 | 2,
    playerName: string,
    socketRef: MutableRefObject<WebSocket | null>,
  ) {
    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close(1000, "Disconnected by user");
    }

    socketRef.current = null;
    if (activeSocket.current === socket) {
      activeSocket.current = null;
      setActivePlayerId(null);
    }
    setCanFindAgain(false);
    if (playerId === 1) {
      setPlayer1Connected(false);
    } else {
      setPlayer2Connected(false);
    }
    setQuiz(createInitialQuizState());
    addLog(playerName, "Disconnect requested.", "info");
  }

  function submitAnswer(answerIndex: number) {
    const socket = activeSocket.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      !quiz.roomId ||
      quiz.selectedAnswer !== null
    ) {
      return;
    }

    try {
      socket.send(
        JSON.stringify({
          action: "submit_answer",
          room_id: quiz.roomId,
          question_index: quiz.questionIndex,
          answer_index: answerIndex,
        }),
      );
    } catch {
      setServerMessage({
        type: "error",
        status: "error",
        message: "Jawaban gagal dikirim karena koneksi terputus.",
      });
      return;
    }

    setQuiz((current) => ({
      ...current,
      selectedAnswer: answerIndex,
    }));
  }

  function findMatchAgain() {
    const socket = activeSocket.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setServerMessage({
        type: "error",
        status: "error",
        message: "Koneksi ke server terputus. Sambungkan kembali dari halaman utama.",
      });
      return;
    }

    try {
      socket.send(JSON.stringify({ action: "find_match" }));
    } catch {
      setServerMessage({
        type: "error",
        status: "error",
        message: "Gagal mencari lawan karena koneksi terputus.",
      });
      return;
    }

    setQuiz({
      ...createInitialQuizState(),
      stage: "starting",
    });
  }

  if (quiz.stage !== "lobby") {
    return (
      <main className="quiz-screen">
        {quiz.stage === "starting" && (
          <section className="quiz-panel quiz-starting" aria-live="polite">
            <span className="quiz-kicker">MULTIPLAYER QUIZ</span>
            <h1>{quiz.opponent ? `Bertemu ${quiz.opponent}` : "Room dibuat"}</h1>
            <p>Menyiapkan soal...</p>
            <span className="quiz-loading-dot" aria-hidden="true" />
          </section>
        )}

        {quiz.stage === "question" && (
          <section className="quiz-panel" aria-live="polite">
            <p className="quiz-progress">
              SOAL {quiz.questionIndex + 1} / {quiz.totalQuestions}
            </p>
            <h1 className="quiz-question">{quiz.question}</h1>
            <div className="quiz-options" role="group" aria-label="Pilihan jawaban">
              {quiz.options.map((option, index) => {
                const selected = quiz.selectedAnswer === index;
                const resultClass =
                  selected && quiz.answerCorrect === true
                    ? " is-correct"
                    : selected && quiz.answerCorrect === false
                      ? " is-wrong"
                      : "";

                return (
                  <button
                    className={`quiz-option${resultClass}`}
                    type="button"
                    key={`${quiz.questionIndex}-${index}`}
                    onClick={() => submitAnswer(index)}
                    disabled={quiz.selectedAnswer !== null}
                    aria-pressed={selected}
                  >
                    <span className="quiz-option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {quiz.stage === "result" && (
          <section className="quiz-panel quiz-result" aria-live="polite">
            <span className="quiz-kicker">HASIL PERMAINAN</span>
            <h1>{quiz.winnerText || "Game selesai"}</h1>
            <div className="quiz-final-scores">
              {Object.entries(quiz.scores).map(([playerId, score]) => (
                <p key={playerId}>
                  <span>{quiz.players[playerId] || "Pemain"}</span>
                  <strong>{score} poin</strong>
                </p>
              ))}
            </div>
            <button
              className="quiz-replay-button"
              type="button"
              onClick={findMatchAgain}
              disabled={!canFindAgain}
            >
              Cari lawan lagi
            </button>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="app-container">
      <header className="page-header">
        <div>
          <span className="eyebrow">MULTIPLAYER QUIZ</span>
          <h1>Kuwizz</h1>
          <p>
            Beat your friends in your field.
          </p>
        </div>
      </header>

      
<section className="quiz-hero">
  <div className="quiz-hero-content">
    <span className="eyebrow">READY TO PLAY?</span>
    <h2></h2>
    <p>
      Connect with another player and get ready to challenge
      each other in a multiplayer quiz.
    </p>

    <div className="quiz-hero-tags">
      <span>✦ Multiplayer</span>
      <span>◷ Real-time</span>
    </div>
  </div>

  <div className="quiz-visual" aria-hidden="true">
    <div className="quiz-decor decor-one">✦</div>
    <div className="quiz-decor decor-two">?</div>

    <div className="quiz-card quiz-card-back">
      <div className="quiz-card-top">
        <span>QUIZ TIME</span>
        <span>✦</span>
      </div>
      <div className="quiz-card-lines">
        <span />
        <span />
      </div>
      <div className="quiz-card-skeleton">
        <span />
        <span />
        <span />
      </div>
    </div>

    <div className="quiz-card quiz-card-front">
      <div className="quiz-card-top">
        <span className="quiz-icon">?</span>
        <span className="quiz-category">QUICK QUIZ</span>
      </div>

      <h3>Ready for a challenge?</h3>
      <p>Choose your answer</p>

      <div className="quiz-answer answer-selected">
        <span>A</span>
        <span>Knowledge</span>
        <span>✓</span>
      </div>

      <div className="quiz-answer">
        <span>B</span>
        <span>Strategy</span>
      </div>
    </div>

    <div className="quiz-score-card">
      <span className="score-star">★</span>
      <div>
        <strong>+100 XP</strong>
        <span>Great answer!</span>
      </div>
    </div>
  </div>
</section>


      <section className="section-block">
        <div className="section-heading">
          <div>
            <h2>Players</h2>
            <p>Connect one player from this device to find an opponent.</p>
          </div>

          <span className="section-count">2 PLAYERS</span>
        </div>

        <div className="players-grid">
          <PlayerPanel
            title="Player 01"
            playerName={player1Name}
            onNameChange={setPlayer1Name}
            onConnect={() =>
              connectPlayer(
                1,
                player1Name,
                player1,
                setPlayer1Connected,
              )
            }
            onDisconnect={() =>
              disconnectPlayer(1, player1Name, player1)
            }
            connected={player1Connected}
            canConnect={activePlayerId === null || activePlayerId === 1}
          />

          <PlayerPanel
            title="Player 02"
            playerName={player2Name}
            onNameChange={setPlayer2Name}
            onConnect={() =>
              connectPlayer(
                2,
                player2Name,
                player2,
                setPlayer2Connected,
              )
            }
            onDisconnect={() =>
              disconnectPlayer(2, player2Name, player2)
            }
            connected={player2Connected}
            canConnect={activePlayerId === null || activePlayerId === 2}
          />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <h2>Server Status</h2>
            <p>Latest connection status or backend message.</p>
          </div>
        </div>

        <div className="status-container">
          <StatusMessage
            status={serverMessage.status}
            message={serverMessage.message}
          />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <h2>Activity Log</h2>
            <p>Recent connection events and received messages.</p>
          </div>

          <button
            className="clear-log-button"
            type="button"
            onClick={() => setLogs([])}
          >
            Clear logs
          </button>
        </div>

        <div className="activity-card">
          {logs.length === 0 ? (
            <div className="empty-state">
              <strong>No activity yet</strong>
              <p>Connection events will appear here.</p>
            </div>
          ) : (
            <div className="activity-list">
              {logs.map((log) => (
                <div className="activity-row" key={log.id}>
                  <span
                    className={`activity-indicator status-${log.status}`}
                  />

                  <div className="activity-details">
                    <strong>{log.player}</strong>
                    <span>{log.message}</span>
                  </div>

                  <span
                    className={`activity-tag status-${log.status}`}
                  >
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
