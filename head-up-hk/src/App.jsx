import { useState, useRef } from "react";
import categories from "./data/categories.json";
import Game from "./Game";
import AdminPage from "./AdminPage";
import "./App.css";
import { db } from "../src/_utils/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  increment,
} from "firebase/firestore";

const timeOptions = [
  { label: "30秒", value: 30 },
  { label: "1分鐘", value: 60 },
  { label: "2分鐘", value: 120 },
  { label: "3分鐘", value: 180 },
  { label: "5分鐘", value: 300 },
];
const categoryNames = Object.keys(categories);

// 🔵 Firestore: Deck usage tracker
async function recordDeckUsage(category) {
  try {
    const colRef = collection(db, "categoryStats");
    const q = query(colRef, where("category", "==", category));
    const snap = await getDocs(q);

    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { count: increment(1) });
    } else {
      await addDoc(colRef, { category, count: 1 });
    }
  } catch (err) {
    // 失敗都唔阻遊戲，只係唔計到數
    console.error("Failed to record deck usage:", err);
  }
}

export default function App() {
  const [stage, setStage] = useState("home");
  const [category, setCategory] = useState("");
  const [words, setWords] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timer, setTimer] = useState(60);
  const [roundSeconds, setRoundSeconds] = useState(60);
  const [results, setResults] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const intervalId = useRef(null);
  const countdownTimer = useRef(null);

  // ------------------------- 主流程 --------------------------

  async function startGame() {
    // 🔵 記錄 deck usage（async，不會影響遊戲流程）
    recordDeckUsage(category);

    setCountdown(3);
    setStage("countdown");
    let cd = 3;
    countdownTimer.current = setInterval(() => {
      cd--;
      setCountdown(cd);
      if (cd <= 0) {
        clearInterval(countdownTimer.current);
        actuallyStartGame();
      }
    }, 1000);
  }

  function actuallyStartGame() {
    const arr = [...categories[category]].sort(() => 0.5 - Math.random());
    setWords(arr);
    setCurrent(0);
    setScore(0);
    setWrong(0);
    setResults([]);
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
    setResults((prev) => [...prev, { word: words[current], correct }]);
    if (correct) setScore((s) => s + 1);
    else setWrong((w) => w + 1);
    setCurrent((i) => i + 1);
    if (current + 1 >= words.length) {
      if (intervalId.current) clearInterval(intervalId.current);
      setStage("end");
    }
  }

  function restart() {
    setStage("home");
    setCategory("");
    setWords([]);
    setCurrent(0);
    setScore(0);
    setWrong(0);
    setResults([]);
    setTimer(roundSeconds);
    if (intervalId.current) clearInterval(intervalId.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }

  function goHome() {
    restart();
  }

  // ------------------------- 規則 Modal --------------------------
  function RulesModal() {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.15)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => setShowRules(false)}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 32px #9994",
            padding: 28,
            maxWidth: 340,
            textAlign: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ fontWeight: 700, marginBottom: 12 }}>遊戲規則</h2>
          <ol style={{ textAlign: "left", fontSize: 17, margin: "0 0 14px 0" }}>
            <li>選擇類別和時間開始遊戲。</li>
            <li>每次顯示一個詞語，由隊友用粵語提示你猜。</li>
            <li>
              <b>單擊</b>畫面/按「估啱」＝記作對
              <br />
              <b>雙擊</b>畫面/按「跳過」＝記作錯
            </li>
            <li>時間內盡量答中最多！</li>
          </ol>
          <button
            style={{
              marginTop: 12,
              borderRadius: 8,
              border: "none",
              background: "#22c55e",
              color: "#fff",
              padding: "9px 34px",
              fontWeight: 600,
              fontSize: 18,
              cursor: "pointer",
            }}
            onClick={() => setShowRules(false)}
          >
            明白了
          </button>
        </div>
      </div>
    );
  }

  // ------------------------- UI Render --------------------------
  return (
    <div className="container">
      {stage === "home" && (
        <>
          <div className="title">
            大電視 <span className="subtitle">Demo版</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              margin: "18px 0 4px 0",
            }}
          >
            <button
              className="btn"
              style={{
                background: "#f59e42",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
              }}
              onClick={() => setShowRules(true)}
            >
              規則
            </button>
            {/* Admin Only 按鈕 */}
            <button
              className="btn"
              style={{
                background: "#333",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
              }}
              onClick={() => setStage("admin")}
            >
              Admin Only
            </button>
          </div>
          <div style={{ fontWeight: 600, marginTop: 8, marginBottom: 8 }}>
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
            disabled={!category}
            onClick={startGame}
            style={{ marginTop: 22 }}
          >
            確認開始
          </button>
          {showRules && <RulesModal />}
        </>
      )}

      {stage === "countdown" && (
        <div
          style={{
            width: "100vw",
            height: "90vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 90,
            color: "#f59e42",
            fontWeight: 800,
            letterSpacing: 8,
            transition: "all 0.4s",
            userSelect: "none",
          }}
        >
          {countdown > 0 ? countdown : "GO!"}
        </div>
      )}

      {stage === "game" && (
        <Game
          words={words}
          current={current}
          category={category}
          score={score}
          wrong={wrong}
          timer={timer}
          nextWord={nextWord}
          goHome={goHome}
        />
      )}

      {stage === "end" && (
        <>
          <div className="timer-bar">
            <span className="timer">遊戲結束</span>
          </div>
          <div className="end-score">
            分數: <span style={{ color: "#22c55e" }}>{score}</span> /{" "}
            <span style={{ color: "#ef4444" }}>{wrong}</span>
          </div>
          <div style={{ margin: "20px 0", fontWeight: 600 }}>回顧：</div>
          <ul
            style={{
              width: 320,
              padding: 0,
              margin: "0 auto",
              listStyle: "none",
            }}
          >
            {results.map((res, idx) => (
              <li
                key={idx}
                style={{
                  padding: "6px 0",
                  borderBottom: "1px solid #eee",
                  color: res.correct ? "#22c55e" : "#ef4444",
                  fontWeight: 600,
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ marginRight: 10 }}>
                  {res.correct ? "✔️" : "❌"}
                </span>
                {typeof res.word === "string" ? (
                  res.word
                ) : (
                  <>
                    <span>{res.word.chinese}</span>
                    {res.word.english && (
                      <span
                        style={{
                          fontSize: 15,
                          color: "#555",
                          marginLeft: 10,
                        }}
                      >
                        {res.word.english}
                      </span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          <button className="confirm-btn" onClick={restart}>
            再嚟一次
          </button>
        </>
      )}
      {stage === "admin" && <AdminPage goHome={() => setStage("home")} />}
    </div>
  );
}
