import { useState, useRef, useEffect } from "react";
import categories from "./data/categories.json";
import Game from "./Game"; // <-- NEW IMPORT
import "./App.css";

const timeOptions = [
  { label: "30秒", value: 30 },
  { label: "1分鐘", value: 60 },
  { label: "2分鐘", value: 120 },
  { label: "3分鐘", value: 180 },
  { label: "5分鐘", value: 300 },
];
const categoryNames = Object.keys(categories);

export default function App() {
  const [stage, setStage] = useState("home");
  const [category, setCategory] = useState("");
  const [words, setWords] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [roundSeconds, setRoundSeconds] = useState(60);
  const [showRules, setShowRules] = useState(false);
  const [readyToStart, setReadyToStart] = useState(false);

  const intervalId = useRef(null);

  useEffect(() => {
    setReadyToStart(!!category && !!roundSeconds);
  }, [category, roundSeconds]);

  function startGame() {
    setWords([...categories[category]].sort(() => 0.5 - Math.random()));
    setCurrent(0);
    setScore(0);
    setTimer(roundSeconds);
    setStage("game");

    if (intervalId.current) clearInterval(intervalId.current);
    intervalId.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(intervalId.current);
          setStage("end");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function nextWord(correct) {
    if (correct) setScore((s) => s + 1);
    setCurrent((i) => i + 1);
    if (current + 1 >= words.length) setStage("end");
  }

  function restart() {
    setStage("home");
    setCategory("");
    setWords([]);
    setCurrent(0);
    setScore(0);
    setTimer(roundSeconds);
    if (intervalId.current) clearInterval(intervalId.current);
  }

  function RulesModal() {
    return (
      <div className="rules-modal-bg">
        <div className="rules-modal">
          <h2>遊戲規則</h2>
          <ol>
            <li>選擇一個類別和回合時間開始遊戲。</li>
            <li>每次顯示一個詞語，讓其他人用粵語提示你猜。</li>
            <li>
              <b>單擊</b>詞語＝答對，<b>雙擊</b>詞語＝跳過。
            </li>
            <li>時間內盡量答中最多！</li>
          </ol>
          <button onClick={() => setShowRules(false)}>明白了</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {stage === "home" && (
        <>
          <div className="title">
            Head Up <span className="subtitle">香港版</span>
          </div>
          <button className="btn rules-btn" onClick={() => setShowRules(true)}>
            遊戲規則
          </button>
          <div style={{ fontWeight: 600, marginTop: 18, marginBottom: 8 }}>
            選擇回合時間：
          </div>
          <div className="times">
            {timeOptions.map((opt) => (
              <button
                key={opt.value}
                className={`btn-secondary${
                  roundSeconds === opt.value ? " selected" : ""
                }`}
                onClick={() => setRoundSeconds(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>選擇類別：</div>
          <div className="categories">
            {categoryNames.map((c) => (
              <button
                key={c}
                className={`btn${category === c ? " selected" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            className="confirm-btn"
            disabled={!readyToStart}
            onClick={startGame}
          >
            確認開始
          </button>
          {showRules && <RulesModal />}
        </>
      )}

      {stage === "game" && (
        <Game
          words={words}
          current={current}
          category={category}
          score={score}
          timer={timer}
          nextWord={nextWord}
          goHome={() => setStage("home")}
        />
      )}

      {stage === "end" && (
        <>
          <div className="timer-bar">
            <span className="timer">遊戲結束</span>
          </div>
          <div className="end-score">分數: {score}</div>
          <button className="confirm-btn" onClick={restart}>
            再嚟一次
          </button>
        </>
      )}
    </div>
  );
}
