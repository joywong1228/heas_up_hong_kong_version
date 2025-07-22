import React, { useRef, useEffect } from "react";

export default function Game({
  words,
  current,
  category,
  score,
  timer,
  nextWord,
}) {
  let clickTimeout = useRef(null);

  // Catch clicks anywhere except on buttons
  function handleOverlayClick(e) {
    // If the click is on a button, ignore
    if (e.target.closest("button")) return;
    if (clickTimeout.current !== null) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      nextWord(false); // double click: skip
    } else {
      clickTimeout.current = setTimeout(() => {
        nextWord(true); // single click: correct
        clickTimeout.current = null;
      }, 230);
    }
  }

  useEffect(() => {
    return () => clearTimeout(clickTimeout.current);
  }, []);

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
    >
      <div className="timer-bar">
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
        }}
      >
        {words[current] || <span style={{ color: "#e11d48" }}>冇晒啦!</span>}
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
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          // cursor: "pointer", // uncomment if you want
        }}
        onClick={handleOverlayClick}
        onDoubleClick={handleOverlayClick}
      />
    </div>
  );
}
