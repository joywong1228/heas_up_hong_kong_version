import { useState, useEffect, useRef } from "react";
import { db } from "../src/_utils/firebase";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import "./css/custom_page.css";

const TEXT = {
  title: { ch: "📝 自定義多人題庫", en: "📝 Custom Multi-player Deck" },
  rule: { ch: "📖 規則", en: "📖 Rules" },
  perPerson: { ch: "每人可輸入題目：", en: "Items per person:" },
  person: { ch: "人數：", en: "People:" },
  limit: { ch: "題庫上限：", en: "Deck limit:" },
  enter: {
    ch: "輸入題目（無字數限制）",
    en: "Enter item (no character limit)",
  },
  add: { ch: "加入", en: "Add" },
  count: { ch: "已加入題目", en: "Items added" },
  start: { ch: "開始遊戲", en: "Start Game" },
  home: { ch: "返回主頁", en: "Back to Home" },
  autosaved: { ch: "已自動儲存至 Admin!", en: "Auto-saved to Admin!" },
  autosavefail: { ch: "自動儲存失敗！", en: "Auto-save failed!" },
  ruleTitle: { ch: "自定義題庫規則", en: "Custom Deck Rules" },
  ruleList: [
    {
      ch: "主持人設定「每人可輸入題數」及「總人數」",
      en: "Host sets 'items per person' and 'total number of people'.",
    },
    {
      ch: "總題庫上限 = 每人題數 x 人數（如 5 x 10 = 50 題）",
      en: "Deck limit = items per person × number of people (e.g. 5 × 10 = 50 items)",
    },
    {
      ch: "題目內容無字數限制，逐條加入",
      en: "No character limit per item; add each one separately.",
    },
    {
      ch: "每加一題自動儲存一次（去admin only度再玩過！）",
      en: "Each item is auto-saved (can replay from the admin only page).",
    },
    // {
    //   ch: "如需公開會再審批通知！",
    //   en: "Will notify if public approval is needed!",
    // },
  ],
  gotIt: { ch: "明白了", en: "Got it" },
  maxed: { ch: "題庫已到上限：", en: "Deck limit reached:" },
};

export default function CustomDeckPage({ goHome, startWithDeck, lang = "ch" }) {
  const [words, setWords] = useState([]);
  const [input, setInput] = useState("");
  const [maxItemsPerPerson, setMaxItemsPerPerson] = useState(5);
  const [totalPeople, setTotalPeople] = useState(5);
  const [showRule, setShowRule] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [deckId, setDeckId] = useState(null);

  const savingRef = useRef(false);

  const maxItems = maxItemsPerPerson * totalPeople;

  useEffect(() => {
    if (words.length >= 2 && !savingRef.current) {
      savingRef.current = true;
      (async () => {
        try {
          if (deckId) {
            await setDoc(doc(db, "customDecks", deckId), {
              words,
              maxItemsPerPerson,
              totalPeople,
              maxItems,
              createdAt: Date.now(),
            });
            setSaveMsg(TEXT.autosaved[lang]);
          } else {
            const deckRef = await addDoc(collection(db, "customDecks"), {
              words,
              maxItemsPerPerson,
              totalPeople,
              maxItems,
              createdAt: Date.now(),
            });
            setDeckId(deckRef.id);
            setSaveMsg(TEXT.autosaved[lang]);
          }
        } catch {
          setSaveMsg(TEXT.autosavefail[lang]);
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
      alert(`${TEXT.maxed[lang]}${maxItems}`);
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
      <div className="customdeck-title">{TEXT.title[lang]}</div>
      <button className="customdeck-btn-rule" onClick={() => setShowRule(true)}>
        {TEXT.rule[lang]}
      </button>
      {/* Controls */}
      <div className="customdeck-controls">
        <div>
          <label className="customdeck-label">{TEXT.perPerson[lang]}</label>
          <select
            value={maxItemsPerPerson}
            onChange={(e) => setMaxItemsPerPerson(Number(e.target.value))}
            className="customdeck-select"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} {lang === "ch" ? "條" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="customdeck-label">{TEXT.person[lang]}</label>
          <select
            value={totalPeople}
            onChange={(e) => setTotalPeople(Number(e.target.value))}
            className="customdeck-select"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n} {lang === "ch" ? "人" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="customdeck-limit">
        {TEXT.limit[lang]}{" "}
        <span className="customdeck-limit-number">{maxItems}</span>{" "}
        {lang === "ch" ? "條" : ""}
      </div>
      {/* Input */}
      <div className="customdeck-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={TEXT.enter[lang]}
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
          {TEXT.add[lang]}
        </button>
      </div>
      <div className="customdeck-word-count">
        {TEXT.count[lang]}：<b>{words.length}</b> / <b>{maxItems}</b>
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
          {TEXT.start[lang]}
        </button>
        <button className="customdeck-secondary-btn" onClick={goHome}>
          {TEXT.home[lang]}
        </button>
      </div>
      <div className="customdeck-savemsg">{saveMsg}</div>
      {/* Rule Modal */}
      {showRule && (
        <div
          className="customdeck-modal-overlay"
          onClick={() => setShowRule(false)}
        >
          <div
            className="customdeck-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="customdeck-modal-title">{TEXT.ruleTitle[lang]}</h2>
            <ul className="customdeck-modal-list">
              {TEXT.ruleList.map((r, i) => (
                <li key={i}>{r[lang]}</li>
              ))}
            </ul>
            <button
              className="customdeck-modal-btn"
              onClick={() => setShowRule(false)}
            >
              {TEXT.gotIt[lang]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
