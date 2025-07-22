import { useEffect, useState } from "react";
import { db } from "../src/_utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AdminPage({ goHome, startWithDeck }) {
  const [stats, setStats] = useState([]);
  const [decks, setDecks] = useState([]);

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
        ← 返回主頁
      </button>
      {/* 排行榜 */}
      <h2 style={{ marginTop: 38 }}>Deck 使用排行榜</h2>
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
              {cat.count} 次
            </span>
          </li>
        ))}
      </ul>
      {stats.length === 0 && (
        <div style={{ marginTop: 48, color: "#aaa" }}>無紀錄</div>
      )}

      {/* 所有自定義題庫 */}
      <h2 style={{ marginTop: 54, marginBottom: 12 }}>
        所有自訂題庫（Custom Decks）
      </h2>
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
              • Deck #{idx + 1}（{deck.words?.length || 0} 題）
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
                      {w}
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
                onClick={() => startWithDeck(deck.words)}
                disabled={!deck.words || !deck.words.length}
              >
                開始遊戲
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
        <div style={{ marginTop: 18, color: "#aaa" }}>暫時無自訂題庫</div>
      )}
    </div>
  );
}
