import React, { useRef, useEffect } from "react";

export default function Game({
  words,
  current,
  category,
  score,
  timer,
  nextWord,
  goHome,
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
    if (!word) return <span style={{ color: "#e11d48" }}>冇晒啦!</span>;
    if (typeof word === "string") {
      return <span style={{ fontSize: 28, fontWeight: 600 }}>{word}</span>;
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

  // ...上略
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
      {/* 返回主頁（左上） */}
      <button
        onClick={goHome}
        style={{
          position: "fixed", // 用 fixed
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
        ← 返回主頁
      </button>

      {/* Timer Bar（頂部中間，唔會被蓋住） */}
      <div
        className="timer-bar"
        style={{
          width: "100vw",
          textAlign: "center",
          marginTop: 12,
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        <span className="timer">⏰ {timer} 秒</span>
      </div>
      <div className="score-bar">
        類別: {category}　|　分數: {score}
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
          估啱
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
          跳過
        </button>
      </div>
      <div className="hint" style={{ zIndex: 2 }}>
        <b>單擊</b>：估啱 | <b>雙擊</b>：跳過
      </div>
    </div>
  );
}
