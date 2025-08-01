import { useEffect, useState } from "react";
import { db } from "../src/_utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import categories from "./data/categories.json"; // NEW: Import categories.json

const TEXT = {
  home: { ch: "← 返回主頁", en: "← Back to Home" },
  leaderboard: { ch: "Deck 使用排行榜", en: "Deck Usage Leaderboard" },
  record: { ch: "次", en: "plays" },
  noRecord: { ch: "無紀錄", en: "No Record" },
  allDecks: { ch: "所有自訂題庫（Custom Decks）", en: "All Custom Decks" },
  deck: { ch: "Deck", en: "Deck" },
  items: { ch: "題", en: "items" },
  play: { ch: "開始遊戲", en: "Start Game" },
  noDeck: { ch: "暫時無自訂題庫", en: "No Custom Decks Yet" },
};

export default function AdminPage({
  goHome,
  startWithDeck,
  lang = "ch",
  roundSeconds = 60,
}) {
  const [stats, setStats] = useState([]);
  const [decks, setDecks] = useState([]);

  // Find every "Joy" deck
  const joyDecks = Object.entries(categories)
    .filter(([key]) => key.includes("Joy"))
    .map(([key, items]) => ({
      key,
      items: Array.isArray(items) ? items : [],
    }))
    .filter((deck) => deck.items.length > 0);

  // 讀排行榜
  useEffect(() => {
    async function fetchData() {
      const snap = await getDocs(collection(db, "categoryStats"));
      const arr = [];
      snap.forEach((doc) => {
        arr.push(doc.data());
      });
      arr.sort((a, b) => b.count - a.count); // 多至少
      setStats(arr);
    }
    fetchData();
  }, []);

  // 讀所有自定義題庫
  useEffect(() => {
    async function fetchDecks() {
      const snap = await getDocs(collection(db, "customDecks"));
      setDecks(
        snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      );
    }
    fetchDecks();
  }, []);

  return (
    <div className="container" style={{ maxWidth: 520, margin: "0 auto" }}>
      {/* 返回主頁 */}
      <button
        onClick={goHome}
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          background: "#ececec",
          border: "none",
          borderRadius: 8,
          padding: "8px 20px",
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        {TEXT.home[lang]}
      </button>

      {/* 排行榜 */}
      <h2 style={{ marginTop: 38 }}>{TEXT.leaderboard[lang]}</h2>
      <ul
        style={{ marginTop: 28, fontSize: 20, padding: 0, listStyle: "none" }}
      >
        {stats.map((cat, i) => (
          <li
            key={cat.category}
            style={{ padding: 8, borderBottom: "1px solid #eee" }}
          >
            <span style={{ fontWeight: 700 }}>{i + 1}.</span>　{cat.category}
            <span style={{ float: "right", color: "#10b981", fontWeight: 700 }}>
              {cat.count} {TEXT.record[lang]}
            </span>
          </li>
        ))}
      </ul>
      {stats.length === 0 && (
        <div style={{ marginTop: 48, color: "#aaa" }}>
          {TEXT.noRecord[lang]}
        </div>
      )}

      {/* 所有自定義題庫 */}
      <h2 style={{ marginTop: 54, marginBottom: 12 }}>{TEXT.allDecks[lang]}</h2>
      <ul style={{ marginTop: 12, padding: 0 }}>
        {decks.map((deck, idx) => (
          <li
            key={deck.id}
            style={{
              marginBottom: 32,
              borderBottom: "1px solid #eee",
              paddingBottom: 18,
              position: "relative",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 22 }}>
              • {TEXT.deck[lang]} #{idx + 1}（{deck.words?.length || 0}{" "}
              {TEXT.items[lang]}）
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
                margin: "4px 0 0",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {Array.isArray(deck.words) &&
                  deck.words.map((w, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#f2f2f2",
                        borderRadius: 6,
                        padding: "2px 14px",
                        marginRight: 8,
                        display: "inline-block",
                        marginBottom: 4,
                        fontSize: 18,
                      }}
                    >
                      {typeof w === "string"
                        ? w
                        : w.chinese || w.zh
                        ? lang === "ch"
                          ? w.chinese || w.zh
                          : w.english || w.en || w.chinese || w.zh
                        : ""}
                    </span>
                  ))}
              </div>
              <button
                style={{
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 22px",
                  fontWeight: 700,
                  fontSize: 17,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                onClick={() => startWithDeck(deck.words, roundSeconds)}
                disabled={!deck.words || !deck.words.length}
              >
                {TEXT.play[lang]}
              </button>
            </div>
            {deck.createdAt && (
              <div style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>
                {new Date(deck.createdAt).toLocaleString()}
              </div>
            )}
          </li>
        ))}
      </ul>
      {decks.length === 0 && (
        <div style={{ marginTop: 18, color: "#aaa" }}>{TEXT.noDeck[lang]}</div>
      )}

      {/* Joy Decks Section */}
      {joyDecks.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ marginBottom: 12 }}>
            {lang === "ch" ? "個人收藏題庫（Joy）" : "Joy Custom Decks"}
          </h2>
          {joyDecks.map((deck, idx) => (
            <div
              key={deck.key}
              style={{
                marginBottom: 28,
                borderBottom: "1px solid #eee",
                paddingBottom: 12,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 22, marginBottom: 6 }}>
                • {deck.key} ({deck.items.length} {TEXT.items[lang]})
                <button
                  style={{
                    background: "#f59e42",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 24px",
                    fontWeight: 700,
                    fontSize: 17,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    // Shuffle this deck before starting
                    const arr = deck.items.map((m) =>
                      typeof m === "string"
                        ? { chinese: m, english: m }
                        : {
                            chinese: m.zh || m.chinese || "",
                            english:
                              m.en || m.english || m.zh || m.chinese || "",
                          }
                    );
                    for (let i = arr.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [arr[i], arr[j]] = [arr[j], arr[i]];
                    }
                    startWithDeck(arr, roundSeconds); // <---- pass roundSeconds here
                  }}
                >
                  ▶️ {lang === "ch" ? "玩此題庫" : "Play This Deck"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
