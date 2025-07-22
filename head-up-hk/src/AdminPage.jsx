// src/AdminPage.jsx
import { useEffect, useState } from "react";
import { db } from "../src/_utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AdminPage({ goHome }) {
  const [stats, setStats] = useState([]);

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

  return (
    <div className="container" style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ marginTop: 24 }}>Deck 使用排行榜</h2>
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
    </div>
  );
}
