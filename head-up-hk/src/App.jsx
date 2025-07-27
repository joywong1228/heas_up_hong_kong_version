import { useState, useRef, useEffect } from "react";
import categories from "./data/categories.json";
import Game from "./Game";
import AdminPage from "./AdminPage";
import CustomDeckPage from "./CustomDeckPage";
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

// Bilingual UI Text Dictionary
const TEXT = {
  title: { ch: "大電視", en: "Head Up" },
  demo: { ch: "Demo版", en: "Demo" },
  rules: { ch: "規則", en: "Rules" },
  customDeck: { ch: "➕ 自定義題庫", en: "➕ Custom Deck" },
  admin: { ch: "Admin Only", en: "Admin Only" },
  selectTime: { ch: "選擇回合時間：", en: "Select Round Time:" },
  selectCat: {
    ch: "選擇類別（[EN＆中] 表示有中英對照）：",
    en: "Select Category ([EN] = bilingual):",
  },
  confirmStart: { ch: "確認開始", en: "Start" },
  gameOver: { ch: "遊戲結束", en: "Game Over" },
  score: { ch: "分數", en: "Score" },
  review: { ch: "回顧：", en: "Review:" },
  again: { ch: "再嚟一次", en: "Play Again" },
  rulesTitle: { ch: "遊戲規則", en: "Game Rules" },
  rulesContent: [
    {
      ch: "選擇類別和時間開始遊戲。",
      en: "Select a category and time to start the game.",
    },
    {
      ch: "每次顯示一個詞語，由隊友用粵語提示你猜。",
      en: "Each time a word is shown, your teammate gives you Cantonese hints to guess.",
    },
    {
      ch: "單擊畫面/按「估啱」＝記作對\n雙擊畫面/按「跳過」＝記作錯",
      en: "Single tap/Press 'Correct' = right\nDouble tap/Press 'Skip' = wrong",
    },
    {
      ch: "時間內盡量答中最多！",
      en: "Guess as many as you can before time runs out!",
    },
  ],
  rulesBtn: { ch: "明白了", en: "Got it" },
};

const timeOptions = [
  { label: { ch: "30秒", en: "30 sec" }, value: 30 },
  { label: { ch: "1分鐘", en: "1 min" }, value: 60 },
  { label: { ch: "2分鐘", en: "2 min" }, value: 120 },
  { label: { ch: "3分鐘", en: "3 min" }, value: 180 },
  { label: { ch: "5分鐘", en: "5 min" }, value: 300 },
];
const categoryNames = Object.keys(categories);

// Firestore: Deck usage tracker
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
    console.error("Failed to record deck usage:", err);
  }
}

export default function App() {
  const [lang, setLang] = useState("ch");
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

  // Refs for intervals and for always-fresh state
  const intervalId = useRef(null);
  const countdownTimer = useRef(null);
  const wordsRef = useRef(words);
  const currentRef = useRef(current);

  // Keep refs synced with state
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    // Only for custom decks: start timer if entering "game" and interval is not set
    if (stage === "game" && intervalId.current == null) {
      intervalId.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(intervalId.current);
            intervalId.current = null;
            const lastWord = wordsRef.current[currentRef.current];
            if (lastWord !== undefined) {
              setResults((prev) => [
                ...prev,
                { word: lastWord, correct: false },
              ]);
            }
            setStage("end");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    // Cleanup when leaving the game
    return () => {
      if (stage !== "game" && intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
    };
  }, [stage]);

  // Custom Deck flow
  function startCustomDeckGame(wordsArr, customTimer) {
    setWords([...wordsArr]);
    setCurrent(0);
    setScore(0);
    setWrong(0);
    setResults([]);
    setTimer(customTimer ?? roundSeconds); // prefer customTimer if given
    setStage("game");
  }

  // Main flow
  async function startGame() {
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
          const lastWord = wordsRef.current[currentRef.current];
          if (lastWord !== undefined) {
            setResults((prev) => [...prev, { word: lastWord, correct: false }]);
          }
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

  // Rules Modal
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
          <h2 style={{ fontWeight: 700, marginBottom: 12 }}>
            {TEXT.rulesTitle[lang]}
          </h2>
          <ol style={{ textAlign: "left", fontSize: 17, margin: "0 0 14px 0" }}>
            {TEXT.rulesContent.map((item, i) => (
              <li key={i}>
                {item[lang].split("\n").map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </li>
            ))}
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
            {TEXT.rulesBtn[lang]}
          </button>
        </div>
      </div>
    );
  }

  function isBilingualCategory(words) {
    return (
      Array.isArray(words) &&
      words.length > 0 &&
      typeof words[0] === "object" &&
      words[0].english
    );
  }

  // ------------------------- UI Render --------------------------
  return (
    <div className="container">
      {stage === "home" && (
        <>
          <div className="title">
            {TEXT.title[lang]}{" "}
            <span className="subtitle">{TEXT.demo[lang]}</span>
          </div>
          <div>
            <button
              style={{
                marginLeft: 14,
                borderRadius: 7,
                border: "1px solid #999",
                background: lang === "ch" ? "#f59e42" : "#fff",
                color: lang === "ch" ? "#fff" : "#333",
                fontWeight: 600,
                fontSize: 15,
                padding: "4px 12px",
                cursor: "pointer",
              }}
              onClick={() => setLang("ch")}
              disabled={lang === "ch"}
            >
              中文
            </button>
            <button
              style={{
                marginLeft: 6,
                borderRadius: 7,
                border: "1px solid #999",
                background: lang === "en" ? "#f59e42" : "#fff",
                color: lang === "en" ? "#fff" : "#333",
                fontWeight: 600,
                fontSize: 15,
                padding: "4px 12px",
                cursor: "pointer",
              }}
              onClick={() => setLang("en")}
              disabled={lang === "en"}
            >
              English
            </button>
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
              {TEXT.rules[lang]}
            </button>
            <button
              className="btn"
              style={{
                background: "#34d399",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                marginLeft: 6,
              }}
              onClick={() => setStage("customDeck")}
            >
              {TEXT.customDeck[lang]}
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
              {TEXT.admin[lang]}
            </button>
          </div>
          <div style={{ fontWeight: 600, marginTop: 8, marginBottom: 8 }}>
            {TEXT.selectTime[lang]}
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
                {opt.label[lang]}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            {TEXT.selectCat[lang]}
          </div>
          <div className="categories">
            {categoryNames
              .filter((c) => !c.includes("Joy")) // <-- FILTER OUT "Joy" decks
              .map((c) => (
                <button
                  key={c}
                  className={`btn${category === c ? " selected" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                  {isBilingualCategory(categories[c]) && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: "#222",
                        color: "#fff",
                        fontSize: "0.8em",
                        padding: "1px 6px",
                        borderRadius: "5px",
                        fontWeight: 700,
                        letterSpacing: 1,
                      }}
                    >
                      EN&中
                    </span>
                  )}
                </button>
              ))}
          </div>
          <button
            className="confirm-btn"
            disabled={!category}
            onClick={startGame}
            style={{ marginTop: 22 }}
          >
            {TEXT.confirmStart[lang]}
          </button>
          {showRules && <RulesModal />}
        </>
      )}
      {stage === "customDeck" && (
        <CustomDeckPage
          goHome={() => setStage("home")}
          startWithDeck={startCustomDeckGame}
          lang={lang}
        />
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
          lang={lang}
        />
      )}
      {stage === "end" && (
        <>
          <div className="timer-bar">
            <span className="timer">{TEXT.gameOver[lang]}</span>
          </div>
          <div className="end-score">
            {TEXT.score[lang]}:{" "}
            <span style={{ color: "#22c55e" }}>{score}</span> /{" "}
            <span style={{ color: "#ef4444" }}>{wrong}</span>
          </div>
          <div style={{ margin: "20px 0", fontWeight: 600 }}>
            {TEXT.review[lang]}
          </div>
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
                  <span>
                    {lang === "ch"
                      ? res.word.chinese
                      : res.word.english || res.word.chinese}
                    {res.word.english && lang === "ch" && (
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
                  </span>
                )}
              </li>
            ))}
          </ul>
          <button className="confirm-btn" onClick={restart}>
            {TEXT.again[lang]}
          </button>
        </>
      )}
      {stage === "admin" && (
        <AdminPage
          goHome={() => setStage("home")}
          startWithDeck={(words, customTimer) =>
            startCustomDeckGame(words, customTimer)
          }
          roundSeconds={roundSeconds} // <--- add this line!
          lang={lang}
        />
      )}
    </div>
  );
}
