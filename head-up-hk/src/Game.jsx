import React, { useRef, useEffect, useState } from "react";
import { fetchActorImage } from "./components/fecthStarImage";

const TEXT = {
  home: { ch: "← 返回主頁", en: "← Back to Home" },
  timer: { ch: "⏰ {t} 秒", en: "⏰ {t} sec" },
  category: { ch: "類別", en: "Category" },
  score: { ch: "分數", en: "Score" },
  correct: { ch: "估啱", en: "Correct" },
  skip: { ch: "跳過", en: "Skip" },
  hint: {
    ch: "單擊：估啱 | 雙擊：跳過",
    en: "Click: Correct | Double Click: Skip",
  },
  empty: { ch: "冇晒啦!", en: "No more!" },
};

function ActorImage({ name }) {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    let ignore = false;
    if (name) {
      fetchActorImage(name).then((url) => {
        if (!ignore) setImgUrl(url);
      });
    }
    return () => {
      ignore = true;
    };
  }, [name]);

  if (!imgUrl) return null;
  return (
    <img
      src={imgUrl}
      alt={name}
      style={{
        width: 110,
        height: 140,
        objectFit: "cover",
        borderRadius: 12,
        marginBottom: 8,
        boxShadow: "0 2px 12px #0001",
      }}
    />
  );
}

export default function Game({
  words,
  current,
  category,
  score,
  timer,
  nextWord,
  goHome,
  lang = "ch", // default to Chinese if not specified
}) {
  let clickTimeout = useRef(null);

  function handleClick(e) {
    if (e.target.closest("button")) return;
    if (clickTimeout.current !== null) {
      return;
    }
    clickTimeout.current = setTimeout(() => {
      nextWord(true); // single click: correct
      clickTimeout.current = null;
    }, 230);
  }

  function handleDoubleClick(e) {
    if (e.target.closest("button")) return;
    if (clickTimeout.current !== null) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    nextWord(false); // double click: skip
  }

  useEffect(() => {
    return () => clearTimeout(clickTimeout.current);
  }, []);

  function renderWord(word) {
    // Change this category check to your actor deck category name
    const isActorDeck = category === "演員 Movie Star" || category === "演員";

    if (!word)
      return <span style={{ color: "#e11d48" }}>{TEXT.empty[lang]}</span>;

    if (typeof word === "string") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {isActorDeck && <ActorImage name={word} />}
          <span style={{ fontSize: 28, fontWeight: 600 }}>{word}</span>
        </div>
      );
    }

    if (typeof word === "object") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {isActorDeck && <ActorImage name={word.english || word.chinese} />}
          <span style={{ fontSize: 28, fontWeight: 600 }}>{word.chinese}</span>
          {word.english && (
            <span style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
              {word.english}
            </span>
          )}
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className="game-fullscreen"
      style={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        background: "#f8fafc",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Go Home (top left) */}
      <button
        onClick={goHome}
        style={{
          position: "fixed",
          top: 24,
          left: 24,
          background: "#ececec",
          border: "none",
          borderRadius: 8,
          padding: "8px 20px",
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
          zIndex: 99,
        }}
      >
        {TEXT.home[lang]}
      </button>

      {/* Timer Bar */}
      <div
        className="timer-bar"
        style={{
          width: "100vw",
          textAlign: "center",
          marginTop: 12,
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        <span className="timer">{TEXT.timer[lang].replace("{t}", timer)}</span>
      </div>
      <div className="score-bar">
        {TEXT.category[lang]}: {category}　|　{TEXT.score[lang]}: {score}
      </div>
      <div
        className="word-card"
        tabIndex={0}
        style={{
          zIndex: 2,
          pointerEvents: "auto",
          minHeight: 80,
          minWidth: 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {renderWord(words[current])}
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          marginTop: 22,
          zIndex: 2,
          position: "relative",
        }}
      >
        <button
          className="btn"
          style={{
            background: "#10b981",
            fontSize: 22,
            fontWeight: 700,
            minWidth: 120,
          }}
          onClick={(e) => {
            e.stopPropagation();
            nextWord(true);
          }}
        >
          {TEXT.correct[lang]}
        </button>
        <button
          className="btn"
          style={{
            background: "#f59e42",
            fontSize: 22,
            fontWeight: 700,
            minWidth: 120,
          }}
          onClick={(e) => {
            e.stopPropagation();
            nextWord(false);
          }}
        >
          {TEXT.skip[lang]}
        </button>
      </div>
      <div className="hint" style={{ zIndex: 2 }}>
        <b>{TEXT.hint[lang]}</b>
      </div>
    </div>
  );
}
