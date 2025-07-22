import { useState, useEffect, useRef } from "react";
import { db } from "../src/_utils/firebase";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";

export default function CustomDeckPage({ goHome, startWithDeck }) {
  // 基本 state
  const [words, setWords] = useState([]);
  const [input, setInput] = useState("");
  const [maxItemsPerPerson, setMaxItemsPerPerson] = useState(5);
  const [totalPeople, setTotalPeople] = useState(5);
  const [showRule, setShowRule] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [deckId, setDeckId] = useState(null); // 用來識別同一個 deck

  const savingRef = useRef(false);

  // 題目上限
  const maxItems = maxItemsPerPerson * totalPeople;

  // 自動儲存（只會 update / overwrite，不會每次開新 deck）
  useEffect(() => {
    if (words.length >= 2 && !savingRef.current) {
      savingRef.current = true;
      (async () => {
        try {
          // 如果已經有 deckId，update 現有 document
          if (deckId) {
            await setDoc(doc(db, "customDecks", deckId), {
              words,
              maxItemsPerPerson,
              totalPeople,
              maxItems,
              createdAt: Date.now(),
            });
            setSaveMsg("已自動儲存至 Admin!");
          } else {
            // 否則新建一個，儲存 deckId
            const deckRef = await addDoc(collection(db, "customDecks"), {
              words,
              maxItemsPerPerson,
              totalPeople,
              maxItems,
              createdAt: Date.now(),
            });
            setDeckId(deckRef.id);
            setSaveMsg("已自動儲存至 Admin!");
          }
        } catch {
          setSaveMsg("自動儲存失敗！");
        } finally {
          savingRef.current = false;
        }
      })();
    }
    // eslint-disable-next-line
  }, [words, maxItemsPerPerson, totalPeople, maxItems]);

  function addWord() {
    if (!input.trim()) return;
    if (words.length >= maxItems) {
      alert(`題庫已到上限：${maxItems} 條題目！`);
      return;
    }
    setWords([...words, input.trim()]);
    setInput("");
  }

  function removeWord(idx) {
    setWords(words.filter((_, i) => i !== idx));
  }

  return (
    <div className="container" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ margin: "26px 0 16px", fontWeight: 900, fontSize: 32 }}>
        📝 自定義多人題庫
      </div>

      {/* 規則按鈕 */}
      <button
        style={{
          background: "#f59e42",
          color: "#fff",
          fontWeight: 800,
          fontSize: 22,
          padding: "12px 40px",
          margin: "0 0 24px 0",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          display: "block",
        }}
        onClick={() => setShowRule(true)}
      >
        📖 規則
      </button>

      {/* 控制欄 */}
      <div style={{ marginBottom: 16, display: "flex", gap: 20 }}>
        <div>
          <label style={{ fontWeight: 700, fontSize: 18 }}>
            每人可輸入題目：
          </label>
          <select
            value={maxItemsPerPerson}
            onChange={(e) => setMaxItemsPerPerson(Number(e.target.value))}
            style={{
              fontSize: 18,
              borderRadius: 8,
              padding: "4px 16px",
              marginLeft: 6,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} 條
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 700, fontSize: 18 }}>人數：</label>
          <select
            value={totalPeople}
            onChange={(e) => setTotalPeople(Number(e.target.value))}
            style={{
              fontSize: 18,
              borderRadius: 8,
              padding: "4px 16px",
              marginLeft: 6,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n} 人
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ margin: "10px 0 16px 0", fontWeight: 600, color: "#555" }}>
        題庫上限：
        <span style={{ color: "#e11d48", fontWeight: 800 }}>{maxItems}</span> 條
      </div>

      {/* 題目輸入 */}
      <div
        style={{
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 16, // Adjust gap as needed
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`輸入題目（無字數限制）`}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 19,
            width: 290,
            flexShrink: 0,
          }}
          onKeyDown={(e) => e.key === "Enter" && addWord()}
          disabled={words.length >= maxItems}
        />
        <button
          style={{
            borderRadius: 8,
            border: "none",
            background: "#10b981",
            color: "#fff",
            padding: "11px 32px",
            fontWeight: 700,
            fontSize: 19,
            cursor: words.length >= maxItems ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
          onClick={addWord}
          disabled={words.length >= maxItems}
        >
          加入
        </button>
      </div>
      <div style={{ marginBottom: 22, color: "#333", fontSize: 18 }}>
        已加入題目：<b>{words.length}</b> / <b>{maxItems}</b>
      </div>
      <ul style={{ width: 320, margin: "0 auto 28px", padding: 0 }}>
        {words.map((w, idx) => (
          <li
            key={idx}
            style={{
              borderBottom: "1px solid #eee",
              padding: 10,
              fontSize: 18,
              fontWeight: 500,
              background: idx % 2 === 0 ? "#fafafa" : "#f3f3f3",
              letterSpacing: 1,
              borderRadius: 6,
            }}
          >
            {w}
            <span
              style={{
                float: "right",
                color: "#e11d48",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 18,
              }}
              onClick={() => removeWord(idx)}
              title="刪除"
            >
              ×
            </span>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: 18, marginBottom: 34 }}>
        <button
          className="btn"
          disabled={words.length < 2}
          style={{ background: "#3b82f6", fontSize: 20, fontWeight: 800 }}
          onClick={() => startWithDeck(words)}
        >
          開始遊戲
        </button>
        <button
          className="btn"
          onClick={goHome}
          style={{
            background: "#ddd",
            color: "#222",
            fontWeight: 800,
            fontSize: 19,
          }}
        >
          返回主頁
        </button>
      </div>
      <div style={{ color: "#10b981", fontWeight: 800, fontSize: 18 }}>
        {saveMsg}
      </div>

      {/* 規則 Modal */}
      {showRule && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.14)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowRule(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 4px 32px #9994",
              padding: 36,
              maxWidth: 430,
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontWeight: 900, marginBottom: 18, fontSize: 26 }}>
              自定義題庫規則
            </h2>
            <ul
              style={{
                textAlign: "left",
                fontSize: 18,
                margin: 0,
                paddingLeft: 20,
                fontWeight: 600,
              }}
            >
              <li>主持人設定「每人可輸入題數」及「總人數」</li>
              <li>總題庫上限 = 每人題數 x 人數（如 5 x 10 = 50 題）</li>
              <li>題目內容無字數限制，逐條加入</li>
              <li>每加一題自動儲存一次（Admin 可見）</li>
              <li>如需公開會再審批通知！</li>
            </ul>
            <button
              style={{
                marginTop: 22,
                borderRadius: 8,
                border: "none",
                background: "#22c55e",
                color: "#fff",
                padding: "13px 48px",
                fontWeight: 800,
                fontSize: 20,
                cursor: "pointer",
              }}
              onClick={() => setShowRule(false)}
            >
              明白了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
