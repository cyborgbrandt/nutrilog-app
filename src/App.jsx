import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TRAINER_CODE = "TRAINER2024";
const SG_FOODS = [
  { name: "Chicken Rice", emoji: "🍚", protein: 28, carbs: 52, fat: 12 },
  { name: "Laksa", emoji: "🍜", protein: 22, carbs: 48, fat: 18 },
  { name: "Char Kway Teow", emoji: "🍝", protein: 16, carbs: 55, fat: 14 },
  { name: "Nasi Lemak", emoji: "🍛", protein: 18, carbs: 50, fat: 20 },
  { name: "Roti Prata (plain)", emoji: "🫓", protein: 7, carbs: 38, fat: 10 },
  { name: "Bak Kut Teh", emoji: "🥣", protein: 35, carbs: 8, fat: 22 },
  { name: "Satay (5 sticks)", emoji: "🍢", protein: 30, carbs: 12, fat: 14 },
  { name: "Hokkien Mee", emoji: "🍜", protein: 20, carbs: 58, fat: 12 },
  { name: "Mee Rebus", emoji: "🍜", protein: 18, carbs: 60, fat: 8 },
  { name: "Rojak", emoji: "🥗", protein: 6, carbs: 28, fat: 10 },
  { name: "Cai Png (economy rice)", emoji: "🍱", protein: 22, carbs: 62, fat: 14 },
  { name: "Teh Tarik", emoji: "☕", protein: 5, carbs: 22, fat: 6 },
  { name: "Kaya Toast Set", emoji: "🍞", protein: 12, carbs: 45, fat: 14 },
  { name: "Wonton Noodles", emoji: "🍜", protein: 20, carbs: 50, fat: 8 },
  { name: "Milo Dinosaur", emoji: "🥤", protein: 6, carbs: 42, fat: 8 },
  { name: "Chicken Breast 100g", emoji: "🍗", protein: 31, carbs: 0, fat: 4 },
  { name: "White Rice (1 cup)", emoji: "🍚", protein: 4, carbs: 45, fat: 0 },
  { name: "Egg (1 large)", emoji: "🥚", protein: 6, carbs: 0, fat: 5 },
  { name: "Banana", emoji: "🍌", protein: 1, carbs: 27, fat: 0 },
  { name: "Oats (50g)", emoji: "🥣", protein: 6, carbs: 34, fat: 3 },
  { name: "Protein Shake", emoji: "🥛", protein: 25, carbs: 6, fat: 3 },
  { name: "Greek Yogurt (100g)", emoji: "🥛", protein: 10, carbs: 4, fat: 0 },
  { name: "Almonds (30g)", emoji: "🌰", protein: 6, carbs: 6, fat: 14 },
  { name: "Sweet Potato (1 med)", emoji: "🍠", protein: 2, carbs: 24, fat: 0 },
  { name: "Salmon 100g", emoji: "🐟", protein: 25, carbs: 0, fat: 13 },
];

const EMOJIS = ["🍗","🥩","🐟","🥚","🥛","🧀","🌾","🍚","🍞","🥜","🫐","🍌","🥦","🥕","🍎","🍜","🍛","🥗","🍱","🥙","🍔","🥞","☕","🧃","🍰"];

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const ls = {
  get: (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const getLog = (name) => ls.get(`nutrilog_food_${name}_${todayKey()}`, []);
const setLog = (name, log) => ls.set(`nutrilog_food_${name}_${todayKey()}`, log);
const getWeights = (name) => ls.get(`nutrilog_weights_${name}`, []);
const setWeights = (name, w) => ls.set(`nutrilog_weights_${name}`, w);

function calcMacros(log) {
  return log.reduce((a, e) => ({
    calories: a.calories + (e.protein * 4 + e.carbs * 4 + e.fat * 9),
    protein: a.protein + e.protein,
    carbs: a.carbs + e.carbs,
    fat: a.fat + e.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0f14;
    --surface: #161923;
    --surface2: #1e2330;
    --border: #2a3040;
    --text: #e8ecf4;
    --muted: #6b7894;
    --accent: #4fffb0;
    --accent2: #ff6b6b;
    --accent3: #7eb8ff;
    --accent4: #ffd166;
    --protein-c: #4fffb0;
    --carbs-c: #7eb8ff;
    --fat-c: #ffd166;
    --radius: 16px;
    --radius-sm: 10px;
  }

  html, body, #root { height: 100%; background: var(--bg); }

  body {
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    overscroll-behavior: none;
  }

  .app-shell {
    max-width: 430px;
    margin: 0 auto;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  /* ── LOGIN ── */
  .login-page {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, #1a2a1a 0%, var(--bg) 70%);
  }
  .login-logo { font-family: 'Syne', sans-serif; font-size: 2.4rem; font-weight: 800; color: var(--accent); letter-spacing: -1px; margin-bottom: 4px; }
  .login-sub { color: var(--muted); font-size: 0.85rem; margin-bottom: 40px; letter-spacing: 0.05em; text-transform: uppercase; }
  .toggle-row { display: flex; background: var(--surface2); border-radius: 100px; padding: 4px; margin-bottom: 32px; width: 100%; }
  .toggle-btn { flex: 1; padding: 10px; border: none; background: none; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500; border-radius: 100px; cursor: pointer; transition: all 0.2s; }
  .toggle-btn.active { background: var(--accent); color: #0d0f14; font-weight: 700; }
  .login-form { width: 100%; display: flex; flex-direction: column; gap: 12px; }
  .nl-input { background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 14px 16px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 1rem; width: 100%; outline: none; transition: border-color 0.2s; }
  .nl-input:focus { border-color: var(--accent); }
  .nl-input::placeholder { color: var(--muted); }
  .btn-primary { background: var(--accent); color: #0d0f14; border: none; border-radius: var(--radius-sm); padding: 15px; font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s, transform 0.1s; width: 100%; }
  .btn-primary:hover { opacity: 0.9; }
  .btn-primary:active { transform: scale(0.98); }
  .btn-ghost { background: none; border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 13px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: var(--muted); cursor: pointer; transition: border-color 0.2s, color 0.2s; width: 100%; }
  .btn-ghost:hover { border-color: var(--text); color: var(--text); }

  /* ── ONBOARDING ── */
  .onboard-page {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: 48px 24px 32px;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, #1a2a1a 0%, var(--bg) 70%);
  }
  .onboard-step-indicator { display: flex; gap: 6px; margin-bottom: 40px; }
  .step-dot { height: 4px; flex: 1; border-radius: 2px; background: var(--border); transition: background 0.3s; }
  .step-dot.done { background: var(--accent); }
  .onboard-title { font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 800; line-height: 1.2; margin-bottom: 8px; }
  .onboard-hint { color: var(--muted); font-size: 0.9rem; margin-bottom: 32px; }
  .onboard-bignum { background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 20px 20px; font-size: 2rem; font-weight: 700; color: var(--accent); text-align: center; width: 100%; outline: none; font-family: 'Syne', sans-serif; transition: border-color 0.2s; }
  .onboard-bignum:focus { border-color: var(--accent); }
  .onboard-actions { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }

  /* ── BOTTOM NAV ── */
  .bottom-nav {
    display: flex;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 8px 0 max(8px, env(safe-area-inset-bottom));
    position: sticky;
    bottom: 0;
    z-index: 100;
  }
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; padding: 6px 0; color: var(--muted); transition: color 0.2s; border: none; background: none; font-family: 'DM Sans', sans-serif; }
  .nav-item.active { color: var(--accent); }
  .nav-icon { font-size: 1.3rem; }
  .nav-label { font-size: 0.65rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

  /* ── SCROLL CONTENT ── */
  .tab-content { flex: 1; overflow-y: auto; padding: 0 16px 24px; }
  .tab-content::-webkit-scrollbar { display: none; }

  /* ── TAB HEADER ── */
  .tab-header { padding: 20px 16px 8px; }
  .tab-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; }
  .tab-date { color: var(--muted); font-size: 0.82rem; margin-top: 2px; }

  /* ── CARDS ── */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; margin-bottom: 12px; }
  .card-dark { background: #0b1d14; border-color: #1d3a28; }

  /* ── CALORIE CARD ── */
  .cal-card { background: linear-gradient(135deg, #0d2216 0%, #0a1a0f 100%); border: 1px solid #1e3d28; border-radius: var(--radius); padding: 20px; margin-bottom: 12px; position: relative; overflow: hidden; }
  .cal-card::before { content: ''; position: absolute; top: -40px; right: -40px; width: 150px; height: 150px; border-radius: 50%; background: radial-gradient(circle, rgba(79,255,176,0.12) 0%, transparent 70%); }
  .cal-label { color: var(--accent); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
  .cal-big { font-family: 'Syne', sans-serif; font-size: 3rem; font-weight: 800; color: var(--accent); line-height: 1; }
  .cal-unit { font-size: 0.9rem; color: var(--muted); margin-left: 4px; }
  .cal-row { display: flex; justify-content: space-between; margin-top: 14px; }
  .cal-stat { text-align: center; }
  .cal-stat-val { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; color: var(--text); }
  .cal-stat-label { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .cal-divider { width: 1px; background: var(--border); }
  .cal-ring-wrap { display: flex; align-items: center; gap: 16px; }
  .cal-ring { flex-shrink: 0; }

  /* ── MACRO BARS ── */
  .macro-bar-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px; margin-bottom: 12px; }
  .macro-row { display: flex; flex-direction: column; gap: 12px; }
  .macro-item {}
  .macro-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .macro-name { font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .macro-val { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; }
  .bar-track { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }

  /* ── FOOD LOG ENTRIES ── */
  .food-entry { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .food-entry:last-child { border-bottom: none; }
  .food-emoji { font-size: 1.6rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--surface2); border-radius: 10px; flex-shrink: 0; }
  .food-info { flex: 1; min-width: 0; }
  .food-name { font-size: 0.92rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .food-macros { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }
  .food-cal { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; color: var(--accent); flex-shrink: 0; }
  .food-time { font-size: 0.7 roll; color: var(--muted); text-align: right; }
  .del-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 1rem; padding: 4px; transition: color 0.2s; }
  .del-btn:hover { color: var(--accent2); }

  /* ── ADD FOOD MODAL ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; display: flex; align-items: flex-end; }
  .modal-sheet { background: var(--surface); border-radius: 24px 24px 0 0; width: 100%; max-width: 430px; margin: 0 auto; max-height: 92dvh; display: flex; flex-direction: column; overflow: hidden; }
  .modal-handle { width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 12px auto 0; flex-shrink: 0; }
  .modal-header { padding: 16px 20px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; }
  .modal-close { background: var(--surface2); border: none; color: var(--muted); width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
  .modal-body { overflow-y: auto; flex: 1; padding: 16px 20px; }
  .modal-body::-webkit-scrollbar { display: none; }

  /* ── ADD METHOD GRID ── */
  .method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 4px; }
  .method-card { background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 18px 14px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: border-color 0.2s, background 0.2s; }
  .method-card:hover { border-color: var(--accent); background: #1a2a1e; }
  .method-icon { font-size: 1.8rem; }
  .method-label { font-size: 0.78rem; font-weight: 600; text-align: center; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }

  /* ── SEARCH FOOD ── */
  .search-input-wrap { position: relative; margin-bottom: 12px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 1rem; pointer-events: none; }
  .search-input { width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 12px 12px 12px 38px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
  .search-input:focus { border-color: var(--accent); }
  .food-list-item { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: var(--radius-sm); cursor: pointer; transition: background 0.15s; }
  .food-list-item:hover { background: var(--surface2); }
  .food-list-emoji { font-size: 1.4rem; }
  .food-list-info { flex: 1; }
  .food-list-name { font-size: 0.9rem; font-weight: 500; }
  .food-list-macros { font-size: 0.73rem; color: var(--muted); margin-top: 1px; }
  .food-list-cal { font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 700; color: var(--accent); }

  /* ── MANUAL ENTRY ── */
  .manual-form { display: flex; flex-direction: column; gap: 14px; }
  .form-label { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 6px; display: block; }
  .emoji-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .emoji-btn { width: 38px; height: 38px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface2); font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: border-color 0.15s; }
  .emoji-btn.selected { border-color: var(--accent); background: #0d2216; }
  .macro-input-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .macro-input-group { display: flex; flex-direction: column; }
  .macro-input { background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 10px 10px; color: var(--text); font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; text-align: center; outline: none; width: 100%; transition: border-color 0.2s; }
  .macro-input:focus { border-color: var(--accent); }
  .quick-btns { display: flex; gap: 4px; margin-top: 4px; }
  .quick-btn { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; padding: 4px 2px; font-size: 0.68rem; color: var(--muted); cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .quick-btn:hover { border-color: var(--accent); color: var(--accent); }
  .quick-btn:disabled { opacity: 0.3; }
  .cal-preview { background: #0d2216; border: 1px solid #1d3a28; border-radius: var(--radius-sm); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
  .cal-preview-label { font-size: 0.8rem; color: var(--muted); }
  .cal-preview-val { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: var(--accent); }

  /* ── MACRO SPLIT PREVIEW ── */
  .macro-split { display: flex; gap: 6px; margin-top: 8px; }
  .macro-split-pill { flex: 1; background: var(--surface2); border-radius: 8px; padding: 8px 6px; text-align: center; }
  .macro-split-val { font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700; }
  .macro-split-label { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }

  /* ── WEIGHT TAB ── */
  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; text-align: center; }
  .stat-card-val { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; color: var(--text); }
  .stat-card-label { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
  .stat-card.highlight .stat-card-val { color: var(--accent); }
  .weight-input-row { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
  .weight-input { flex: 1; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; color: var(--text); font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; outline: none; transition: border-color 0.2s; }
  .weight-input:focus { border-color: var(--accent); }
  .weight-entry { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .weight-entry:last-child { border-bottom: none; }
  .weight-entry-date { font-size: 0.8rem; color: var(--muted); }
  .weight-entry-val { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; }

  /* ── SVG CHART ── */
  .chart-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; overflow: hidden; }
  .chart-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 12px; }
  svg text { font-family: 'DM Sans', sans-serif; }

  /* ── PROFILE TAB ── */
  .profile-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border); }
  .profile-item:last-child { border-bottom: none; }
  .profile-item-label { font-size: 0.82rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .profile-item-val { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: var(--text); }
  .badge { display: inline-block; background: #0d2216; border: 1px solid #1d3a28; color: var(--accent); font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.06em; }

  /* ── TRAINER DASHBOARD ── */
  .trainer-page { flex: 1; overflow-y: auto; padding: 0 0 32px; }
  .trainer-page::-webkit-scrollbar { display: none; }
  .trainer-header { padding: 48px 20px 16px; background: linear-gradient(180deg, #0d1a12 0%, var(--bg) 100%); }
  .trainer-title { font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 800; }
  .trainer-sub { color: var(--muted); font-size: 0.82rem; margin-top: 4px; }
  .summary-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 0 20px; margin-bottom: 20px; }
  .summary-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px 10px; text-align: center; }
  .summary-card-val { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: var(--accent); }
  .summary-card-label { font-size: 0.63rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
  .client-cards { padding: 0 20px; display: flex; flex-direction: column; gap: 10px; }
  .client-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; cursor: pointer; transition: border-color 0.2s; }
  .client-card:hover { border-color: var(--accent); }
  .client-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .client-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--accent) 0%, #0d6640 100%); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.95rem; color: #0d0f14; flex-shrink: 0; }
  .client-name { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; }
  .client-detail { font-size: 0.75rem; color: var(--muted); margin-top: 1px; }
  .badge { display: inline-block; background: #0d2216; border: 1px solid #1d3a28; color: var(--accent); font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.06em; }
  .status-pill { font-size: 0.68rem; font-weight: 700; padding: 4px 10px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.05em; }
  .status-green { background: #0d2216; color: var(--accent); border: 1px solid #1d3a28; }
  .status-red { background: #2a1212; color: var(--accent2); border: 1px solid #4a1a1a; }
  .status-yellow { background: #2a2012; color: var(--accent4); border: 1px solid #4a3a1a; }
  .compliance-row { display: flex; flex-direction: column; gap: 7px; }
  .compliance-item-label { font-size: 0.72rem; color: var(--muted); margin-bottom: 3px; display: flex; justify-content: space-between; }

  /* ── CLIENT DETAIL VIEW ── */
  .client-detail-page { flex: 1; overflow-y: auto; padding: 0 0 32px; }
  .client-detail-page::-webkit-scrollbar { display: none; }
  .detail-header { padding: 48px 20px 16px; display: flex; align-items: center; gap: 14px; background: linear-gradient(180deg, #0d1a12 0%, var(--bg) 100%); }
  .back-btn { background: var(--surface2); border: none; color: var(--text); width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .detail-section { padding: 0 20px; margin-bottom: 14px; }
  .section-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 10px; }
  .trainer-note { background: #1a1a0d; border: 1px solid #3a3a1a; border-radius: var(--radius-sm); padding: 14px; color: var(--accent4); font-size: 0.85rem; line-height: 1.5; }

  /* ── AI MODAL ── */
  .ai-upload-area { border: 2px dashed var(--border); border-radius: var(--radius); padding: 32px 20px; text-align: center; cursor: pointer; transition: border-color 0.2s; margin-bottom: 14px; }
  .ai-upload-area:hover { border-color: var(--accent); }
  .ai-upload-icon { font-size: 2.5rem; margin-bottom: 8px; }
  .ai-upload-text { font-size: 0.9rem; color: var(--muted); }
  .ai-result { background: #0d2216; border: 1px solid #1d3a28; border-radius: var(--radius-sm); padding: 14px; margin-bottom: 14px; }
  .ai-result-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); margin-bottom: 8px; }
  .spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── BARCODE ── */
  .barcode-viewport { width: 100%; aspect-ratio: 4/3; background: #000; border-radius: var(--radius-sm); overflow: hidden; position: relative; margin-bottom: 12px; }
  .barcode-viewport video { width: 100%; height: 100%; object-fit: cover; }
  .barcode-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  .scan-line { position: absolute; left: 10%; right: 10%; height: 2px; background: var(--accent); animation: scan 2s ease-in-out infinite; opacity: 0.8; box-shadow: 0 0 8px var(--accent); }
  @keyframes scan { 0%,100% { top: 20%; } 50% { top: 80%; } }
  .scan-corner { position: absolute; width: 30px; height: 30px; border-color: var(--accent); border-style: solid; opacity: 0.8; }
  .scan-corner.tl { top: 15%; left: 5%; border-width: 2px 0 0 2px; }
  .scan-corner.tr { top: 15%; right: 5%; border-width: 2px 2px 0 0; }
  .scan-corner.bl { bottom: 15%; left: 5%; border-width: 0 0 2px 2px; }
  .scan-corner.br { bottom: 15%; right: 5%; border-width: 0 2px 2px 0; }

  /* ── FAB ── */
  .fab { position: fixed; bottom: calc(70px + env(safe-area-inset-bottom)); right: 20px; width: 56px; height: 56px; border-radius: 50%; background: var(--accent); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #0d0f14; box-shadow: 0 4px 20px rgba(79,255,176,0.3); z-index: 50; transition: transform 0.2s, box-shadow 0.2s; }
  .fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(79,255,176,0.4); }
  .fab:active { transform: scale(0.95); }

  /* ── MISC ── */
  .empty-state { text-align: center; padding: 40px 20px; color: var(--muted); }
  .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }
  .empty-text { font-size: 0.88rem; }
  .chip { display: inline-block; background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; padding: 4px 12px; font-size: 0.75rem; color: var(--muted); }
  .note-sm { font-size: 0.72rem; color: var(--muted); text-align: center; padding: 8px 0; }
  .section-title { font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 10px; margin-top: 4px; }

  @media (min-width: 430px) {
    .app-shell { box-shadow: 0 0 60px rgba(0,0,0,0.6); }
    .modal-overlay { justify-content: center; }
  }

  .slide-up { animation: slideUp 0.3s cubic-bezier(0.4,0,0.2,1); }
  @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .fade-in { animation: fadeIn 0.25s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function MacroBar({ label, value, max, color }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div className="macro-item">
      <div className="macro-top">
        <span className="macro-name" style={{ color }}>{label}</span>
        <span className="macro-val">{Math.round(value)}<span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.75rem" }}>g</span></span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function WeightChart({ entries, target }) {
  if (entries.length < 2) return (
    <div className="chart-wrap">
      <div className="chart-title">Weight Trend</div>
      <div style={{ color: "var(--muted)", fontSize: "0.82rem", textAlign: "center", padding: "20px 0" }}>Log at least 2 entries to see your trend</div>
    </div>
  );
  const W = 360, H = 140, PAD = { t: 10, r: 10, b: 28, l: 38 };
  const recent = entries.slice(-14);
  const vals = recent.map(e => e.weight);
  const minV = Math.min(...vals, target) - 1;
  const maxV = Math.max(...vals, target) + 1;
  const xScale = (i) => PAD.l + (i / (recent.length - 1)) * (W - PAD.l - PAD.r);
  const yScale = (v) => PAD.t + ((maxV - v) / (maxV - minV)) * (H - PAD.t - PAD.b);
  const path = recent.map((e, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(e.weight)}`).join(" ");
  const targetY = yScale(target);
  return (
    <div className="chart-wrap">
      <div className="chart-title">Weight Trend (last {recent.length} entries)</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", overflow: "visible" }}>
        <line x1={PAD.l} y1={targetY} x2={W - PAD.r} y2={targetY} stroke="rgba(79,255,176,0.25)" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={W - PAD.r + 2} y={targetY + 4} fill="var(--accent)" fontSize={9} opacity={0.7}>Goal</text>
        <path d={path} fill="none" stroke="var(--accent3)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {recent.map((e, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(e.weight)} r={3} fill="var(--accent3)" />
        ))}
        {[minV, Math.round((minV + maxV) / 2), maxV].map((v, i) => (
          <text key={i} x={PAD.l - 4} y={yScale(v) + 4} fill="var(--muted)" fontSize={9} textAnchor="end">{v}</text>
        ))}
        <text x={xScale(0)} y={H - 2} fill="var(--muted)" fontSize={8} textAnchor="middle">{recent[0]?.date?.slice(5)}</text>
        <text x={xScale(recent.length - 1)} y={H - 2} fill="var(--muted)" fontSize={8} textAnchor="middle">{recent[recent.length - 1]?.date?.slice(5)}</text>
      </svg>
    </div>
  );
}

function CalRing({ consumed, goal }) {
  const pct = Math.min(1, goal > 0 ? consumed / goal : 0);
  const R = 32, C = 2 * Math.PI * R;
  return (
    <svg className="cal-ring" width={80} height={80} viewBox="0 0 80 80">
      <circle cx={40} cy={40} r={R} fill="none" stroke="var(--border)" strokeWidth={6} />
      <circle cx={40} cy={40} r={R} fill="none" stroke="var(--accent)" strokeWidth={6}
        strokeDasharray={C} strokeDashoffset={C * (1 - pct)} strokeLinecap="round"
        transform="rotate(-90 40 40)" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x={40} y={37} textAnchor="middle" fill="var(--accent)" fontSize={13} fontWeight={800} fontFamily="Syne,sans-serif">{Math.round(pct * 100)}%</text>
      <text x={40} y={50} textAnchor="middle" fill="var(--muted)" fontSize={8}>of goal</text>
    </svg>
  );
}

// ─── BARCODE SCANNER ──────────────────────────────────────────────────────────
function BarcodeScanner({ onResult, onClose }) {
  const scannerRef = useRef(null);
  const [status, setStatus] = useState("Initializing camera…");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!window.Quagga) { setStatus("QuaggaJS not loaded. Enter barcode manually below."); return; }
    if (started.current) return;
    started.current = true;
    window.Quagga.init({
      inputStream: { type: "LiveStream", target: scannerRef.current, constraints: { facingMode: "environment", width: 640, height: 480 } },
      decoder: { readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader"] },
      locate: true,
    }, (err) => {
      if (err) { setStatus("Camera error. Enter barcode manually below."); return; }
      setStatus("Point camera at barcode…");
      window.Quagga.start();
    });
    window.Quagga.onDetected(async (result) => {
      const code = result.codeResult.code;
      window.Quagga.stop();
      setStatus(`Found: ${code}`);
      setLoading(true);
      await lookupBarcode(code);
      setLoading(false);
    });
    return () => { try { window.Quagga.stop(); } catch {} };
  }, []);

  async function lookupBarcode(code) {
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const d = await r.json();
      if (d.status === 1) {
        const n = d.product.nutriments;
        setProduct({
          name: d.product.product_name || "Unknown Product",
          emoji: "🏷️",
          protein: Math.round(n.proteins_100g || 0),
          carbs: Math.round(n.carbohydrates_100g || 0),
          fat: Math.round(n["fat_100g"] || 0),
        });
      } else { setStatus("Product not found. Enter details manually below."); }
    } catch { setStatus("Lookup failed. Enter barcode manually."); }
  }

  return (
    <div>
      <div className="barcode-viewport">
        <div ref={scannerRef} style={{ width: "100%", height: "100%" }} />
        <div className="barcode-overlay">
          <div className="scan-corner tl" /><div className="scan-corner tr" />
          <div className="scan-corner bl" /><div className="scan-corner br" />
          <div className="scan-line" />
        </div>
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "12px", textAlign: "center" }}>{status}</p>
      {loading && <div style={{ textAlign: "center", marginBottom: 12 }}><div className="spinner" /></div>}
      {product && (
        <div className="ai-result">
          <div className="ai-result-title">Product Found</div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>{product.name}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>P: {product.protein}g · C: {product.carbs}g · F: {product.fat}g</p>
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => onResult(product)}>Add to Log</button>
        </div>
      )}
      <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <p className="form-label">Or enter barcode manually</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="nl-input" placeholder="e.g. 5000112548167" value={manualBarcode} onChange={e => setManualBarcode(e.target.value)} style={{ flex: 1 }} />
          <button className="btn-primary" style={{ width: "auto", padding: "12px 16px" }} onClick={async () => { setLoading(true); await lookupBarcode(manualBarcode); setLoading(false); }}>Scan</button>
        </div>
      </div>
    </div>
  );
}

// ─── AI CAMERA ────────────────────────────────────────────────────────────────
function AiCamera({ onResult }) {
  const [apiKey, setApiKey] = useState(() => ls.get("nutrilog_gemini_key", ""));
  const [showKeyInput, setShowKeyInput] = useState(!ls.get("nutrilog_gemini_key", ""));
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  function saveKey() { ls.set("nutrilog_gemini_key", apiKey); setShowKeyInput(false); }

  async function analyzeImage(b64) {
    setLoading(true); setResult(null); setError("");
    try {
      const prompt = `You are a Singapore nutrition expert. Identify the food in this image and estimate macros per serving. Return ONLY a valid JSON object matching this schema, do not include markdown blocks: {"name":"Chicken Rice","emoji":"🍚","protein":28,"carbs":52,"fat":12}. Singapore hawker foods examples: chicken rice, laksa, char kway teow, nasi lemak, roti prata, bak kut teh, satay, hokkien mee, mee rebus, rojak, cai png, teh tarik, wonton noodles.`;
      
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ 
            parts: [
              { text: prompt }, 
              { inlineData: { mimeType: "image/jpeg", data: b64 } }
            ] 
          }] 
        }),
      });
      
      const d = await r.json();
      if (d.error) { setError(d.error.message); setLoading(false); return; }
      
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      
      setResult({
        name: parsed.name || "Unknown Food",
        emoji: parsed.emoji || "🍽️",
        protein: Number(parsed.protein) || 0,
        carbs: Number(parsed.carbs) || 0,
        fat: Number(parsed.fat) || 0
      });
    } catch (e) { 
      setError("Failed to analyze image. Ensure your key is valid and try again."); 
    }
    setLoading(false);
  }

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      setImage(url);
      const b64 = url.split(",")[1];
      analyzeImage(b64);
    };
    reader.readAsDataURL(file);
  }

  if (showKeyInput) return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>🤖</div>
        <p style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.5 }}>
          Enter your Google Gemini API key to enable AI food recognition. Get a free key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent3)", textDecoration: "none" }}>aistudio.google.com</a>
        </p>
      </div>
      <input className="nl-input" placeholder="AIza…" value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ marginBottom: 10 }} />
      <button className="btn-primary" onClick={saveKey} disabled={!apiKey.trim()}>Save & Continue</button>
    </div>
  );

  return (
    <div>
      {!image ? (
        <>
          <div className="ai-upload-area" onClick={() => fileRef.current.click()}>
            <div className="ai-upload-icon">📸</div>
            <p className="ai-upload-text">Tap to take photo or upload image</p>
            <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 6 }}>Powered by Gemini 1.5 Flash · Singapore-aware</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
        </>
      ) : (
        <img src={image} alt="food" style={{ width: "100%", borderRadius: "var(--radius-sm)", marginBottom: 12, maxHeight: 220, objectFit: "cover" }} />
      )}
      {loading && <div style={{ textAlign: "center", padding: "20px 0" }}><div className="spinner" style={{ width: 30, height: 30 }} /><p style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: 10 }}>Analysing with AI…</p></div>}
      {error && <p style={{ color: "var(--accent2)", fontSize: "0.85rem", marginBottom: 12 }}>{error}</p>}
      {result && (
        <div className="ai-result fade-in">
          <div className="ai-result-title">✨ AI Identified</div>
          <p style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>{result.emoji} {result.name}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 12 }}>
            P: {result.protein}g · C: {result.carbs}g · F: {result.fat}g · {Math.round((result.protein * 4) + (result.carbs * 4) + (result.fat * 9))} kcal
          </p>
          <button className="btn-primary" onClick={() => onResult(result)}>Add to Log</button>
          <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => { setImage(null); setResult(null); if(fileRef.current) fileRef.current.value = ""; }}>Try Another Photo</button>
        </div>
      )}
      <button style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.75rem", cursor: "pointer", marginTop: 8, display: "block", width: "100%", textAlign: "center" }} onClick={() => { ls.del("nutrilog_gemini_key"); setShowKeyInput(true); }}>Change API key</button>
    </div>
  );
}

// ─── MANUAL ENTRY ─────────────────────────────────────────────────────────────
function ManualEntry({ onAdd }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍽️");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const p = parseFloat(protein) || 0;
  const c = parseFloat(carbs) || 0;
  const f = parseFloat(fat) || 0;
  const cal = Math.round(p * 4 + c * 4 + f * 9);
  const total = p + c + f || 1;

  function addQuick(setter, val) { setter(v => String((parseFloat(v) || 0) + val)); }

  return (
    <div className="manual-form">
      <div>
        <label className="form-label">Food Name</label>
        <input className="nl-input" placeholder="e.g. Chicken Rice" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label className="form-label">Emoji</label>
        <div className="emoji-grid">
          {EMOJIS.map(e => (
            <button key={e} className={`emoji-btn${emoji === e ? " selected" : ""}`} onClick={() => setEmoji(e)}>{e}</button>
          ))}
        </div>
      </div>
      <div className="macro-input-row">
        {[["Protein", protein, setProtein, "var(--protein-c)"], ["Carbs", carbs, setCarbs, "var(--carbs-c)"], ["Fat", fat, setFat, "var(--fat-c)"]].map(([label, val, setter, color]) => (
          <div className="macro-input-group" key={label}>
            <label className="form-label" style={{ color }}>{label} (g)</label>
            <input className="macro-input" type="number" min="0" value={val} onChange={e => setter(e.target.value)} style={{ borderColor: val ? color : undefined }} />
            <div className="quick-btns">
              {[10, 20, 30, 50].map(n => (
                <button key={n} className="quick-btn" onClick={() => addQuick(setter, n)}>+{n}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {cal > 0 && (
        <>
          <div className="cal-preview">
            <span className="cal-preview-label">Est. Calories</span>
            <span className="cal-preview-val">{cal} <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 400 }}>kcal</span></span>
          </div>
          <div className="macro-split">
            {[["Protein", p, "var(--protein-c)"], ["Carbs", c, "var(--carbs-c)"], ["Fat", f, "var(--fat-c)"]].map(([l, v, color]) => (
              <div className="macro-split-pill" key={l}>
                <div className="macro-split-val" style={{ color }}>{Math.round((v / total) * 100)}%</div>
                <div className="macro-split-label">{l}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <button className="btn-primary" disabled={!name.trim() || cal === 0} onClick={() => { onAdd({ name, emoji, protein: p, carbs: c, fat: f }); setName(""); setProtein(""); setCarbs(""); setFat(""); }}>Add to Log</button>
    </div>
  );
}

// ─── ADD FOOD MODAL ───────────────────────────────────────────────────────────
function AddFoodModal({ onClose, onAdd }) {
  const [method, setMethod] = useState(null);
  const [search, setSearch] = useState("");

  function handleAdd(food) {
    onAdd({ ...food, time: new Date().toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" }) });
    onClose();
  }

  const filtered = SG_FOODS.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet slide-up">
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">{method ? { ai: "📸 AI Camera", search: "🔍 Search Food", barcode: "📊 Barcode", manual: "✏️ Manual Entry" }[method] : "Add Food"}</span>
          <button className="modal-close" onClick={method ? () => setMethod(null) : onClose}>{method ? "←" : "✕"}</button>
        </div>
        <div className="modal-body">
          {!method && (
            <div className="method-grid">
              {[["ai", "📸", "AI Camera"], ["search", "🔍", "Search Food"], ["barcode", "📊", "Barcode"], ["manual", "✏️", "Manual Entry"]].map(([id, icon, label]) => (
                <div key={id} className="method-card" onClick={() => setMethod(id)}>
                  <div className="method-icon">{icon}</div>
                  <div className="method-label">{label}</div>
                </div>
              ))}
            </div>
          )}
          {method === "ai" && <AiCamera onResult={handleAdd} />}
          {method === "barcode" && <BarcodeScanner onResult={handleAdd} onClose={onClose} />}
          {method === "manual" && <ManualEntry onAdd={handleAdd} />}
          {method === "search" && (
            <>
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input className="search-input" placeholder="Search Singapore & global foods…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
              </div>
              {filtered.map((f, i) => (
                <div key={i} className="food-list-item" onClick={() => handleAdd(f)}>
                  <span className="food-list-emoji">{f.emoji}</span>
                  <div className="food-list-info">
                    <div className="food-list-name">{f.name}</div>
                    <div className="food-list-macros">P {f.protein}g · C {f.carbs}g · F {f.fat}g</div>
                  </div>
                  <span className="food-list-cal">{f.protein*4+f.carbs*4+f.fat*9}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT FOOD LOG TAB ──────────────────────────────────────────────────────
function FoodLogTab({ profile }) {
  const [log, setLogState] = useState(() => getLog(profile.name));
  const [showAdd, setShowAdd] = useState(false);

  function addEntry(food) {
    const newLog = [...log, { ...food, id: Date.now() }];
    setLogState(newLog); setLog(profile.name, newLog);
  }
  function delEntry(id) {
    const newLog = log.filter(e => e.id !== id);
    setLogState(newLog); setLog(profile.name, newLog);
  }

  const macros = calcMacros(log);
  const goal = profile.calorieGoal || 2000;
  const proteinGoal = Math.round(profile.weight * 1.8);
  const carbsGoal = Math.round((goal * 0.45) / 4);
  const fatGoal = Math.round((goal * 0.25) / 9);

  return (
    <>
      <div className="tab-header">
        <div className="tab-title">Today's Log</div>
        <div className="tab-date">{new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })}</div>
      </div>
      <div className="tab-content">
        <div className="cal-card">
          <div className="cal-ring-wrap">
            <CalRing consumed={macros.calories} goal={goal} />
            <div style={{ flex: 1 }}>
              <div className="cal-label">Calories</div>
              <div><span className="cal-big">{Math.round(macros.calories)}</span><span className="cal-unit">kcal</span></div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 4 }}>of {goal} goal</div>
            </div>
          </div>
          <div className="cal-row">
            <div className="cal-stat"><div className="cal-stat-val">{Math.round(macros.calories)}</div><div className="cal-stat-label">Consumed</div></div>
            <div className="cal-divider" />
            <div className="cal-stat"><div className="cal-stat-val" style={{ color: goal - macros.calories > 0 ? "var(--accent)" : "var(--accent2)" }}>{Math.round(Math.abs(goal - macros.calories))}</div><div className="cal-stat-label">{goal - macros.calories > 0 ? "Remaining" : "Over"}</div></div>
            <div className="cal-divider" />
            <div className="cal-stat"><div className="cal-stat-val">{goal}</div><div className="cal-stat-label">Goal</div></div>
          </div>
        </div>

        <div className="macro-bar-card">
          <div className="macro-row">
            <MacroBar label="Protein" value={macros.protein} max={proteinGoal} color="var(--protein-c)" />
            <MacroBar label="Carbs" value={macros.carbs} max={carbsGoal} color="var(--carbs-c)" />
            <MacroBar label="Fat" value={macros.fat} max={fatGoal} color="var(--fat-c)" />
          </div>
        </div>

        <div className="card">
          <div className="section-title">{log.length > 0 ? `${log.length} entries` : "No food logged yet"}</div>
          {log.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <div className="empty-text">Tap + to log your first meal</div>
            </div>
          ) : (
            log.map(e => (
              <div className="food-entry" key={e.id}>
                <div className="food-emoji">{e.emoji}</div>
                <div className="food-info">
                  <div className="food-name">{e.name}</div>
                  <div className="food-macros">P {e.protein}g · C {e.carbs}g · F {e.fat}g</div>
                </div>
                <div>
                  <div className="food-cal">{Math.round(e.protein*4+e.carbs*4+e.fat*9)}</div>
                  <div className="food-time">{e.time}</div>
                </div>
                <button className="del-btn" onClick={() => delEntry(e.id)}>🗑</button>
              </div>
            ))
          )}
        </div>
        <div className="note-sm">🔒 Auto-shared with your trainer</div>
      </div>
      <button className="fab" onClick={() => setShowAdd(true)}>+</button>
      {showAdd && <AddFoodModal onClose={() => setShowAdd(false)} onAdd={addEntry} />}
    </>
  );
}

// ─── CLIENT WEIGHT TAB ────────────────────────────────────────────────────────
function WeightTab({ profile }) {
  const [weights, setWeightsState] = useState(() => getWeights(profile.name));
  const [inputVal, setInputVal] = useState("");

  function logWeight() {
    if (!inputVal) return;
    const entry = { date: todayKey(), weight: parseFloat(inputVal) };
    const newW = [...weights.filter(e => e.date !== todayKey()), entry].sort((a, b) => a.date.localeCompare(b.date));
    setWeightsState(newW); setWeights(profile.name, newW);
    setInputVal("");
  }

  const current = weights.length ? weights[weights.length - 1].weight : profile.weight;
  const toGo = Math.abs(current - profile.targetWeight).toFixed(1);

  return (
    <>
      <div className="tab-header">
        <div className="tab-title">Weight Tracker</div>
        <div className="tab-date">Track your progress</div>
      </div>
      <div className="tab-content">
        <div className="stats-row">
          <div className="stat-card highlight">
            <div className="stat-card-val">{current}</div>
            <div className="stat-card-label">Current (kg)</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-val">{profile.targetWeight}</div>
            <div className="stat-card-label">Target (kg)</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-val" style={{ color: toGo == 0 ? "var(--accent)" : "var(--accent4)" }}>{toGo}</div>
            <div className="stat-card-label">To Go (kg)</div>
          </div>
        </div>

        <WeightChart entries={weights} target={parseFloat(profile.targetWeight)} />

        <div className="card">
          <div className="section-title">Log Today's Weight</div>
          <div className="weight-input-row">
            <input className="weight-input" type="number" step="0.1" min="30" max="300" placeholder="e.g. 72.5" value={inputVal} onChange={e => setInputVal(e.target.value)} />
            <span style={{ color: "var(--muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>kg</span>
            <button className="btn-primary" style={{ width: "auto", padding: "12px 20px" }} onClick={logWeight} disabled={!inputVal}>Save</button>
          </div>
        </div>

        {weights.length > 0 && (
          <div className="card">
            <div className="section-title">Recent Entries</div>
            {[...weights].reverse().slice(0, 10).map((e, i) => (
              <div className="weight-entry" key={i}>
                <span className="weight-entry-date">{new Date(e.date).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" })}</span>
                <span className="weight-entry-val">{e.weight} kg</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── CLIENT PROFILE TAB ───────────────────────────────────────────────────────
function ProfileTab({ profile, onLogout }) {
  return (
    <>
      <div className="tab-header">
        <div className="tab-title">Profile</div>
        <div className="tab-date">{profile.name}'s stats</div>
      </div>
      <div className="tab-content">
        <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent) 0%, #0d6640 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: "1.8rem", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "#0d0f14" }}>
            {profile.name[0].toUpperCase()}
          </div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: "1.3rem", fontWeight: 800 }}>{profile.name}</div>
          <div className="badge" style={{ marginTop: 6 }}>NutriLog Client</div>
        </div>
        <div className="card">
          {[
            ["Age", `${profile.age} years`],
            ["Height", `${profile.height} cm`],
            ["Starting Weight", `${profile.weight} kg`],
            ["Target Weight", `${profile.targetWeight} kg`],
            ["Daily Calorie Goal", `${profile.calorieGoal} kcal`],
            ["Protein Goal", `${Math.round(profile.weight * 1.8)} g`],
          ].map(([label, val]) => (
            <div className="profile-item" key={label}>
              <span className="profile-item-label">{label}</span>
              <span className="profile-item-val">{val}</span>
            </div>
          ))}
        </div>
        <button className="btn-ghost" onClick={onLogout} style={{ marginTop: 8 }}>Log Out & Reset</button>
      </div>
    </>
  );
}

// ─── CLIENT APP ───────────────────────────────────────────────────────────────
function ClientApp({ profile, onLogout }) {
  const [tab, setTab] = useState("log");
  return (
    <div className="app-shell">
      {tab === "log" && <FoodLogTab profile={profile} />}
      {tab === "weight" && <WeightTab profile={profile} />}
      {tab === "profile" && <ProfileTab profile={profile} onLogout={onLogout} />}
      <nav className="bottom-nav">
        {[["log", "📋", "Log"], ["weight", "⚖️", "Weight"], ["profile", "👤", "Profile"]].map(([id, icon, label]) => (
          <button key={id} className={`nav-item${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
const ONBOARD_STEPS = [
  { title: "How old are you?", hint: "Your age helps calculate your needs", key: "age", type: "number", placeholder: "25", unit: "years" },
  { title: "Current weight?", hint: "We'll track your progress from here", key: "weight", type: "number", placeholder: "70", unit: "kg" },
  { title: "Your height?", hint: "Used for calorie estimation", key: "height", type: "number", placeholder: "170", unit: "cm" },
  { title: "Target weight?", hint: "What's your goal?", key: "targetWeight", type: "number", placeholder: "65", unit: "kg" },
  { title: "Daily calorie goal?", hint: "You can adjust this anytime", key: "calorieGoal", type: "number", placeholder: "2000", unit: "kcal" },
];

function Onboarding({ name, onComplete }) {
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState({});
  const [inputVal, setInputVal] = useState("");
  const s = ONBOARD_STEPS[step];

  function next() {
    const newVals = { ...vals, [s.key]: inputVal };
    setVals(newVals);
    if (step < ONBOARD_STEPS.length - 1) { setStep(step + 1); setInputVal(""); }
    else { onComplete({ name, ...newVals }); }
  }

  return (
    <div className="onboard-page">
      <div className="onboard-step-indicator">
        {ONBOARD_STEPS.map((_, i) => <div key={i} className={`step-dot${i <= step ? " done" : ""}`} />)}
      </div>
      <div className="fade-in" key={step}>
        <div className="onboard-title">Hey {name}! 👋<br />{s.title}</div>
        <div className="onboard-hint">{s.hint}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input className="onboard-bignum" type={s.type} placeholder={s.placeholder} value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === "Enter" && inputVal && next()} autoFocus />
          <div style={{ color: "var(--muted)", fontWeight: 600, fontSize: "1rem", minWidth: 40 }}>{s.unit}</div>
        </div>
      </div>
      <div className="onboard-actions">
        <button className="btn-primary" disabled={!inputVal} onClick={next}>{step < ONBOARD_STEPS.length - 1 ? "Continue →" : "Let's Go! 🚀"}</button>
        {step > 0 && <button className="btn-ghost" onClick={() => setStep(step - 1)}>← Back</button>}
      </div>
    </div>
  );
}

// ─── TRAINER DASHBOARD ────────────────────────────────────────────────────────
function getTrainerNote(name, macros, profile) {
  const notes = [];
  const proteinGoal = Math.round((profile?.weight || 70) * 1.8);
  if (macros.protein < proteinGoal * 0.6) notes.push(`⚠️ Low protein today — only ${Math.round(macros.protein)}g vs ${proteinGoal}g goal`);
  if (macros.calories < (profile?.calorieGoal || 2000) * 0.4) notes.push("⚠️ Very low calorie intake — may be under-eating");
  if (macros.calories > (profile?.calorieGoal || 2000) * 1.15) notes.push("⚠️ Over calorie goal today");
  if (macros.fat > 80) notes.push("ℹ️ High fat intake today");
  if (notes.length === 0) notes.push("✅ Macros looking on track today — great work!");
  return notes.join("\n");
}

function ClientDetailView({ name, onBack }) {
  const profile = ls.get(`nutrilog_profile_${name}`, null);
  const log = getLog(name);
  const weights = getWeights(name);
  const macros = calcMacros(log);
  const goal = profile?.calorieGoal || 2000;
  const proteinGoal = Math.round((profile?.weight || 70) * 1.8);
  const carbsGoal = Math.round((goal * 0.45) / 4);
  const fatGoal = Math.round((goal * 0.25) / 9);

  if (!profile) return (
    <div className="client-detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <div><div style={{ fontFamily: "Syne, sans-serif", fontSize: "1.2rem", fontWeight: 800 }}>{name}</div><div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No profile data yet</div></div>
      </div>
    </div>
  );

  return (
    <div className="client-detail-page fade-in">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <div className="client-avatar">{name[0].toUpperCase()}</div>
        <div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: "1.2rem", fontWeight: 800 }}>{name}</div>
          <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{profile.age}y · {profile.weight}kg · Target {profile.targetWeight}kg</div>
        </div>
      </div>
      <div className="detail-section">
        <div className="section-label">Today's Progress</div>
        <div className="cal-card" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifycontent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div className="cal-label">Calories</div>
              <div><span className="cal-big">{Math.round(macros.calories)}</span><span className="cal-unit"> / {goal} kcal</span></div>
            </div>
            <CalRing consumed={macros.calories} goal={goal} />
          </div>
        </div>
        <div className="macro-bar-card">
          <div className="macro-row">
            <MacroBar label="Protein" value={macros.protein} max={proteinGoal} color="var(--protein-c)" />
            <MacroBar label="Carbs" value={macros.carbs} max={carbsGoal} color="var(--carbs-c)" />
            <MacroBar label="Fat" value={macros.fat} max={fatGoal} color="var(--fat-c)" />
          </div>
        </div>
      </div>
      <div className="detail-section">
        <div className="section-label">Weight Trend</div>
        <WeightChart entries={weights} target={parseFloat(profile.targetWeight)} />
      </div>
      <div className="detail-section">
        <div className="section-label">Trainer Note</div>
        <div className="trainer-note" style={{ whiteSpace: "pre-line" }}>{getTrainerNote(name, macros, profile)}</div>
      </div>
      <div className="detail-section">
        <div className="section-label">Stats</div>
        <div className="card" style={{ margin: 0 }}>
          {[["Age", `${profile.age} years`], ["Height", `${profile.height} cm`], ["Starting Weight", `${profile.weight} kg`], ["Calorie Goal", `${profile.calorieGoal} kcal`]].map(([l, v]) => (
            <div className="profile-item" key={l}><span className="profile-item-label">{l}</span><span className="profile-item-val">{v}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrainerDashboard({ onLogout }) {
  const [selectedClient, setSelectedClient] = useState(null);

  const clients = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("nutrilog_profile_")) {
      const name = key.replace("nutrilog_profile_", "");
      const profile = ls.get(key);
      if (profile) {
        const log = getLog(name);
        const macros = calcMacros(log);
        const goal = profile.calorieGoal || 2000;
        const pGoal = Math.round((profile.weight || 70) * 1.8);
        const calPct = Math.min(100, Math.round((macros.calories / goal) * 100));
        const protPct = Math.min(100, Math.round((macros.protein / pGoal) * 100));
        const status = calPct >= 80 && protPct >= 70 ? "on-track" : calPct < 50 ? "needs-attention" : "partial";
        clients.push({ name, profile, macros, goal, pGoal, calPct, protPct, status });
      }
    }
  }

  const onTrack = clients.filter(c => c.status === "on-track").length;
  const needs = clients.filter(c => c.status === "needs-attention").length;

  if (selectedClient) return (
    <div className="app-shell">
      <ClientDetailView name={selectedClient} onBack={() => setSelectedClient(null)} />
    </div>
  );

  return (
    <div className="app-shell">
      <div className="trainer-page">
        <div className="trainer-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="trainer-title">Trainer View 🏋️</div>
              <div className="trainer-sub">Client overview for {new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })}</div>
            </div>
            <button className="btn-ghost" style={{ width: "auto", padding: "8px 14px", fontSize: "0.78rem" }} onClick={onLogout}>Log Out</button>
          </div>
        </div>
        <div className="summary-row">
          <div className="summary-card"><div className="summary-card-val">{clients.length}</div><div className="summary-card-label">Total Clients</div></div>
          <div className="summary-card"><div className="summary-card-val" style={{ color: "var(--accent)" }}>{onTrack}</div><div className="summary-card-label">On Track</div></div>
          <div className="summary-card"><div className="summary-card-val" style={{ color: "var(--accent2)" }}>{needs}</div><div className="summary-card-label">Needs Attention</div></div>
        </div>
        <div className="client-cards">
          {clients.length === 0 && (
            <div className="empty-state card" style={{ margin: 0 }}>
              <div className="empty-icon">👥</div>
              <div className="empty-text">No clients yet. Clients appear here once they log in and complete setup.</div>
            </div>
          )}
          {clients.map(({ name, profile, macros, goal, pGoal, calPct, protPct, status }) => (
            <div className="client-card" key={name} onClick={() => setSelectedClient(name)}>
              <div className="client-card-top">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="client-avatar">{name[0].toUpperCase()}</div>
                  <div>
                    <div className="client-name">{name}</div>
                    <div className="client-detail">{profile.age}y · {profile.weight}kg → {profile.targetWeight}kg</div>
                  </div>
                </div>
                <div className={`status-pill ${status === "on-track" ? "status-green" : status === "needs-attention" ? "status-red" : "status-yellow"}`}>
                  {status === "on-track" ? "On Track" : status === "needs-attention" ? "⚠️ Attention" : "Partial"}
                </div>
              </div>
              <div className="compliance-row">
                <div>
                  <div className="compliance-item-label"><span>Calories</span><span>{calPct}%</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${calPct}%`, background: calPct >= 80 ? "var(--accent)" : calPct >= 50 ? "var(--accent4)" : "var(--accent2)" }} /></div>
                </div>
                <div>
                  <div className="compliance-item-label"><span>Protein</span><span>{protPct}%</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${protPct}%`, background: "var(--protein-c)" }} /></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onClient, onTrainer }) {
  const [mode, setMode] = useState("client");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  function handleSubmit() {
    setErr("");
    if (mode === "client") { if (!name.trim()) return setErr("Please enter your name"); onClient(name.trim()); }
    else { if (code !== TRAINER_CODE) return setErr("Incorrect access code"); onTrainer(); }
  }

  return (
    <div className="login-page">
      <div className="login-logo">NutriLog</div>
      <div className="login-sub">Singapore Nutrition Tracker</div>
      <div className="toggle-row">
        <button className={`toggle-btn${mode === "client" ? " active" : ""}`} onClick={() => { setMode("client"); setErr(""); }}>I'm a Client</button>
        <button className={`toggle-btn${mode === "trainer" ? " active" : ""}`} onClick={() => { setMode("trainer"); setErr(""); }}>I'm a Trainer</button>
      </div>
      <div className="login-form">
        {mode === "client" ? (
          <input className="nl-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} autoFocus />
        ) : (
          <input className="nl-input" placeholder="Trainer access code" type="password" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} autoFocus />
        )}
        {err && <p style={{ color: "var(--accent2)", fontSize: "0.83rem", textAlign: "center" }}>{err}</p>}
        <button className="btn-primary" onClick={handleSubmit}>{mode === "client" ? "Continue →" : "Access Dashboard"}</button>
        {mode === "trainer" && <p style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center" }}>Demo code: TRAINER2024</p>}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(() => {
    if (ls.get("nutrilog_trainer_session")) return "trainer";
    const name = ls.get("nutrilog_client_name");
    if (name) {
      const profile = ls.get(`nutrilog_profile_${name}`);
      return profile ? "client" : "onboarding";
    }
    return "login";
  });
  const [clientName, setClientName] = useState(() => ls.get("nutrilog_client_name", ""));
  const [profile, setProfile] = useState(() => {
    const n = ls.get("nutrilog_client_name");
    return n ? ls.get(`nutrilog_profile_${n}`) : null;
  });

  useEffect(() => {
    if (!document.getElementById("quagga-script")) {
      const script = document.createElement("script");
      script.id = "quagga-script";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  function handleClient(name) {
    ls.set("nutrilog_client_name", name);
    setClientName(name);
    const existing = ls.get(`nutrilog_profile_${name}`);
    if (existing) { setProfile(existing); setScreen("client"); }
    else setScreen("onboarding");
  }

  function handleTrainer() { ls.set("nutrilog_trainer_session", true); setScreen("trainer"); }

  function handleOnboardingComplete(p) {
    ls.set(`nutrilog_profile_${p.name}`, p);
    setProfile(p); setScreen("client");
  }

  function handleClientLogout() {
    ls.del("nutrilog_client_name"); ls.del("nutrilog_trainer_session");
    setClientName(""); setProfile(null); setScreen("login");
  }
  function handleTrainerLogout() { ls.del("nutrilog_trainer_session"); setScreen("login"); }

  return (
    <>
      <style>{STYLES}</style>
      {screen === "login" && <Login onClient={handleClient} onTrainer={handleTrainer} />}
      {screen === "onboarding" && <Onboarding name={clientName} onComplete={handleOnboardingComplete} />}
      {screen === "client" && profile && <ClientApp profile={profile} onLogout={handleClientLogout} />}
      {screen === "trainer" && <TrainerDashboard onLogout={handleTrainerLogout} />}
    </>
  );
}