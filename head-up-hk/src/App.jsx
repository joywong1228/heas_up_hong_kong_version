import { useState, useRef } from "react";
import categories from "./data/categories.json";
import "./App.css";

const categoryNames = Object.keys(categories);

export default function App() {
  const [stage, setStage] = useState("home");
  const [category, setCategory] = useState("");
  const [words, setWords] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const intervalId = useRef(null);
  const [showRules, setShowRules] = useState(false);

  function startGame(selectedCategory) {
    setCategory(selectedCategory);
    setWords([...categories[selectedCategory]].sort(() => 0.5 - Math.random()));
    setCurrent(0);
    setScore(0);
    setTimer(60);
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
    setTimer(60);
    if (intervalId.current) clearInterval(intervalId.current);
  }

  // Single click: correct, double click: pass
  let clickTimeout = useRef(null);
  function handleWordClick() {
    if (clickTimeout.current !== null) {
      // Double click: skip
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      nextWord(false);
    } else {
      clickTimeout.current = setTimeout(() => {
        nextWord(true); // Single click: correct
        clickTimeout.current = null;
      }, 250);
    }
  }

  // RULES MODAL
  function RulesModal() {
    return (
      <div className="rules-modal-bg">
        <div className="rules-modal">
          <h2>遊戲規則</h2>
          <ol>
            <li>選擇一個類別開始遊戲。</li>
            <li>每次顯示一個詞語，讓其他人用粵語提示你猜。</li>
            <li>
              <b>單擊</b>詞語＝答對，<b>雙擊</b>詞語＝跳過。
            </li>
            <li>60 秒內盡量答中最多！</li>
          </ol>
          <button onClick={() => setShowRules(false)}>明白了</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {stage === "home" && (
        <>
          <div className="header-title">
            Head Up{" "}
            <span style={{ fontSize: 22, color: "#34d399" }}>香港版</span>
          </div>
          <button className="rules-btn" onClick={() => setShowRules(true)}>
            遊戲規則
          </button>
          <div style={{ fontWeight: 600, marginTop: 18 }}>選擇類別：</div>
          <div className="category-list">
            {categoryNames.map((c) => (
              <button
                key={c}
                className="category-btn"
                onClick={() => startGame(c)}
              >
                {c}
              </button>
            ))}
          </div>
          {showRules && <RulesModal />}
        </>
      )}

      {stage === "game" && (
        <>
          <div className="timer-bar">
            <div className="timer-inner">⏰ {timer} 秒</div>
          </div>
          <div className="game-content">
            <div className="score">
              類別: {category}　|　分數: {score}
            </div>
            <div
              className="word-card"
              tabIndex={0}
              onClick={handleWordClick}
              onDoubleClick={handleWordClick}
            >
              {words[current] || (
                <span style={{ color: "#e11d48" }}>冇晒啦!</span>
              )}
            </div>
            <div className="game-hint">
              <b>單擊</b>：估啱　|　<b>雙擊</b>：跳過
            </div>
          </div>
        </>
      )}

      {stage === "end" && (
        <>
          <div className="timer-bar">
            <div className="timer-inner">遊戲結束</div>
          </div>
          <div className="game-content">
            <div className="end-score">分數: {score}</div>
            <button className="retry-btn" onClick={restart}>
              再嚟一次
            </button>
          </div>
        </>
      )}
    </div>
  );
}
