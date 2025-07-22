import { useState, useEffect, useRef } from "react";
import { db } from "../src/_utils/firebase";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import "./css/custom_page.css";

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
    <div className="customdeck-container">
      <div className="customdeck-title">📝 自定義多人題庫</div>
      {/* 規則按鈕 */}
      <button className="customdeck-btn-rule" onClick={() => setShowRule(true)}>
        📖 規則
      </button>
      {/* 控制欄 */}
      <div className="customdeck-controls">
        <div>
          <label className="customdeck-label">每人可輸入題目：</label>
          <select
            value={maxItemsPerPerson}
            onChange={(e) => setMaxItemsPerPerson(Number(e.target.value))}
            className="customdeck-select"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} 條
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="customdeck-label">人數：</label>
          <select
            value={totalPeople}
            onChange={(e) => setTotalPeople(Number(e.target.value))}
            className="customdeck-select"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n} 人
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="customdeck-limit">
        題庫上限：
        <span className="customdeck-limit-number">{maxItems}</span> 條
      </div>
      {/* 題目輸入 */}
      <div className="customdeck-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`輸入題目（無字數限制）`}
          className="customdeck-input"
          onKeyDown={(e) => e.key === "Enter" && addWord()}
          disabled={words.length >= maxItems}
        />
        <button
          className="customdeck-add-btn"
          onClick={addWord}
          disabled={words.length >= maxItems}
          style={{
            cursor: words.length >= maxItems ? "not-allowed" : "pointer",
          }}
        >
          加入
        </button>
      </div>
      <div className="customdeck-word-count">
        已加入題目：<b>{words.length}</b> / <b>{maxItems}</b>
      </div>
      <ul className="customdeck-list">
        {words.map((w, idx) => (
          <li className="customdeck-list-item" key={idx}>
            {w}
            <span
              className="customdeck-delete"
              onClick={() => removeWord(idx)}
              title="刪除"
            >
              ×
            </span>
          </li>
        ))}
      </ul>
      <div className="customdeck-btn-row">
        <button
          className="customdeck-main-btn"
          disabled={words.length < 2}
          onClick={() => startWithDeck(words)}
        >
          開始遊戲
        </button>
        <button className="customdeck-secondary-btn" onClick={goHome}>
          返回主頁
        </button>
      </div>
      <div className="customdeck-savemsg">{saveMsg}</div>
      {/* 規則 Modal */}
      {showRule && (
        <div
          className="customdeck-modal-overlay"
          onClick={() => setShowRule(false)}
        >
          <div
            className="customdeck-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="customdeck-modal-title">自定義題庫規則</h2>
            <ul className="customdeck-modal-list">
              <li>主持人設定「每人可輸入題數」及「總人數」</li>
              <li>總題庫上限 = 每人題數 x 人數（如 5 x 10 = 50 題）</li>
              <li>題目內容無字數限制，逐條加入</li>
              <li>每加一題自動儲存一次（Admin 可見）</li>
              <li>如需公開會再審批通知！</li>
            </ul>
            <button
              className="customdeck-modal-btn"
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
