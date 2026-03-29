/**
 * GraceNotes — Responsive Build
 *
 * Layout:
 *  Mobile  (<768px): bottom nav, single column, full width
 *  Desktop (≥768px): left sidebar nav, two-column content, max-width 1100px
 *
 * All Firebase logic is identical to GraceNotes-Fixed.jsx.
 * Only the layout/shell and screen components changed for responsiveness.
 */

import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, collection,
  query, orderBy, getDocs, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase.js";

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg: "#FAF8F5", surface: "#FFFFFF", surfaceAlt: "#F3EFE9",
    primary: "#7C5C3E", primaryLight: "#A07850",
    accent: "#C9A87C", accentSoft: "#EDE0CC",
    text: "#2C1F0E", textMuted: "#7A6650", textLight: "#B09A80",
    border: "#E8DDD0", danger: "#C0392B", success: "#2E7D52",
    streakOrange: "#E8721A", gold: "#D4AF37",
    shadow: "0 2px 20px rgba(124,92,62,0.10)",
    navBg: "#FFFFFF", gradVerse: ["#7C5C3E", "#A07850"],
    sidebarBg: "#F3EFE9",
  },
  dark: {
    bg: "#1A1410", surface: "#251E17", surfaceAlt: "#2F2519",
    primary: "#C9A87C", primaryLight: "#E0C49A",
    accent: "#A07850", accentSoft: "#3A2E20",
    text: "#F0E6D6", textMuted: "#B09A80", textLight: "#7A6650",
    border: "#3A2E20", danger: "#E05444", success: "#4CAF80",
    streakOrange: "#FF8C3A", gold: "#F4C842",
    shadow: "0 2px 20px rgba(0,0,0,0.45)",
    navBg: "#1A1410", gradVerse: ["#3A2510", "#5A3A20"],
    sidebarBg: "#1F1710",
  },
};

const VERSES = [
  { ref: "Psalm 119:105",        text: "Your word is a lamp to my feet and a light to my path.", theme: "Guidance" },
  { ref: "Jeremiah 29:11",       text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.", theme: "Hope" },
  { ref: "Philippians 4:13",     text: "I can do all things through him who strengthens me.", theme: "Strength" },
  { ref: "Romans 8:28",          text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.", theme: "Faith" },
  { ref: "Isaiah 40:31",         text: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles.", theme: "Renewal" },
  { ref: "Proverbs 3:5-6",       text: "Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.", theme: "Trust" },
  { ref: "Matthew 11:28",        text: "Come to me, all who labor and are heavy laden, and I will give you rest.", theme: "Rest" },
  { ref: "Joshua 1:9",           text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.", theme: "Courage" },
  { ref: "Psalm 23:1",           text: "The Lord is my shepherd; I shall not want.", theme: "Provision" },
  { ref: "John 3:16",            text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.", theme: "Love" },
  { ref: "2 Timothy 1:7",        text: "For God gave us a spirit not of fear but of power and love and self-control.", theme: "Power" },
  { ref: "Lamentations 3:22-23", text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.", theme: "Mercy" },
  { ref: "Galatians 5:22-23",    text: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.", theme: "Spirit" },
  { ref: "Psalm 46:1",           text: "God is our refuge and strength, a very present help in trouble.", theme: "Refuge" },
  { ref: "Romans 12:2",          text: "Do not be conformed to this world, but be transformed by the renewal of your mind.", theme: "Transformation" },
  { ref: "1 Corinthians 13:4-5", text: "Love is patient and kind; love does not envy or boast; it is not arrogant or rude.", theme: "Love" },
  { ref: "Ephesians 2:8-9",      text: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God.", theme: "Grace" },
  { ref: "James 1:2-3",          text: "Count it all joy, my brothers, when you meet trials of various kinds, for you know that the testing of your faith produces steadfastness.", theme: "Perseverance" },
  { ref: "Psalm 34:18",          text: "The Lord is near to the brokenhearted and saves the crushed in spirit.", theme: "Comfort" },
  { ref: "Isaiah 41:10",         text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you.", theme: "Strength" },
  { ref: "John 16:33",           text: "I have said these things to you, that in me you may have peace. In the world you will have tribulation. But take heart; I have overcome the world.", theme: "Peace" },
  { ref: "Romans 5:8",           text: "But God shows his love for us in that while we were still sinners, Christ died for us.", theme: "Redemption" },
  { ref: "Hebrews 11:1",         text: "Now faith is the assurance of things hoped for, the conviction of things unseen.", theme: "Faith" },
  { ref: "Psalm 27:1",           text: "The Lord is my light and my salvation; whom shall I fear? The Lord is the stronghold of my life; of whom shall I be afraid?", theme: "Courage" },
  { ref: "Philippians 4:6-7",    text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.", theme: "Peace" },
  { ref: "Matthew 6:33",         text: "But seek first the kingdom of God and his righteousness, and all these things will be added to you.", theme: "Priority" },
  { ref: "2 Chronicles 7:14",    text: "If my people who are called by my name humble themselves, and pray and seek my face and turn from their wicked ways, then I will hear from heaven.", theme: "Renewal" },
  { ref: "Micah 6:8",            text: "He has told you, O man, what is good; and what does the Lord require of you but to do justice, and to love kindness, and to walk humbly with your God?", theme: "Wisdom" },
  { ref: "1 John 4:19",          text: "We love because he first loved us.", theme: "Love" },
  { ref: "Colossians 3:23",      text: "Whatever you do, work heartily, as for the Lord and not for men.", theme: "Purpose" },
  { ref: "Psalm 16:8",           text: "I have set the Lord always before me; because he is at my right hand, I shall not be shaken.", theme: "Steadfastness" },
];

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
const toDateKey = (d = new Date()) => d.toISOString().split("T")[0];
const todayKey     = toDateKey();
const yesterdayKey = toDateKey(new Date(Date.now() - 86_400_000));

function formatDate(dk) {
  return new Date(dk + "T12:00:00").toLocaleDateString("en-US",
    { weekday:"long", month:"long", day:"numeric", year:"numeric" });
}
function formatDateShort(dk) {
  return new Date(dk + "T12:00:00").toLocaleDateString("en-US",
    { month:"short", day:"numeric" });
}
function getDailyVerse(offset = null) {
  if (offset !== null) return VERSES[((offset % VERSES.length) + VERSES.length) % VERSES.length];
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86_400_000);
  return VERSES[doy % VERSES.length];
}
function computeStreak(dateKeys) {
  if (!dateKeys.length) return { current: 0, longest: 0 };
  const sorted = [...new Set(dateKeys)].sort();
  let running = 1, longest = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i] + "T12:00:00") - new Date(sorted[i-1] + "T12:00:00")) / 86_400_000
    );
    if (diff === 1) { running++; longest = Math.max(longest, running); }
    else running = 1;
  }
  const recent = sorted[sorted.length - 1];
  return { current: (recent === todayKey || recent === yesterdayKey) ? running : 0, longest };
}

// Responsive hook — returns true if window width >= 768px
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isDesktop;
}

const getDarkPref = () => { try { return localStorage.getItem("gn_dark") === "true"; } catch { return false; } };
const setDarkPref = (v) => { try { localStorage.setItem("gn_dark", String(v)); } catch {} };

// ─────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────
const Icons = {
  Home:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Book:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  User:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Heart:   ({f}) => <svg width="18" height="18" viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Refresh: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Moon:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Save:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Cross:   () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="5" y1="8" x2="19" y2="8"/></svg>,
  Trophy:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 22 12 17 16 22"/><path d="M5 3H19V13A7 7 0 0 1 5 13Z"/><line x1="12" y1="17" x2="12" y2="13"/><path d="M5 3a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2"/><path d="M19 3a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2"/></svg>,
  LogOut:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Quote:   () => <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" opacity="0.4"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>,
  Bible:   () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Search:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  ChevL:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

const MOODS = ["✨","🙏","😔","💪","😊","🕊️","❤️","🌿","😌","🔥"];

// ─────────────────────────────────────────────────────────────
// BIBLE DATA & API
// ─────────────────────────────────────────────────────────────

/**
 * API Strategy:
 *  PRIMARY  — API.Bible (api.bible) with NIV translation.
 *             Requires a free API key from scripture.api.bible
 *             Set VITE_BIBLE_API_KEY in your .env file to enable.
 *  FALLBACK — bible-api.com with KJV, no key required.
 *             Used automatically when no API key is present.
 *
 * To get your free NIV key (2 min):
 *  1. Go to https://scripture.api.bible/signup
 *  2. Create a free account and create an app
 *  3. Copy your API key
 *  4. Add to .env:  VITE_BIBLE_API_KEY=your-key-here
 *  5. NIV Bible ID: "06125adad2d5898a-01"  (set as VITE_BIBLE_ID)
 */
const BIBLE_API_KEY = import.meta.env.VITE_BIBLE_API_KEY || null;
const BIBLE_ID      = import.meta.env.VITE_BIBLE_ID      || "06125adad2d5898a-01"; // NIV

// All 66 books with their chapter counts
const BIBLE_BOOKS = [
  { id:"GEN",  name:"Genesis",        chapters:50,  testament:"OT" },
  { id:"EXO",  name:"Exodus",         chapters:40,  testament:"OT" },
  { id:"LEV",  name:"Leviticus",      chapters:27,  testament:"OT" },
  { id:"NUM",  name:"Numbers",        chapters:36,  testament:"OT" },
  { id:"DEU",  name:"Deuteronomy",    chapters:34,  testament:"OT" },
  { id:"JOS",  name:"Joshua",         chapters:24,  testament:"OT" },
  { id:"JDG",  name:"Judges",         chapters:21,  testament:"OT" },
  { id:"RUT",  name:"Ruth",           chapters:4,   testament:"OT" },
  { id:"1SA",  name:"1 Samuel",       chapters:31,  testament:"OT" },
  { id:"2SA",  name:"2 Samuel",       chapters:24,  testament:"OT" },
  { id:"1KI",  name:"1 Kings",        chapters:22,  testament:"OT" },
  { id:"2KI",  name:"2 Kings",        chapters:25,  testament:"OT" },
  { id:"1CH",  name:"1 Chronicles",   chapters:29,  testament:"OT" },
  { id:"2CH",  name:"2 Chronicles",   chapters:36,  testament:"OT" },
  { id:"EZR",  name:"Ezra",           chapters:10,  testament:"OT" },
  { id:"NEH",  name:"Nehemiah",       chapters:13,  testament:"OT" },
  { id:"EST",  name:"Esther",         chapters:10,  testament:"OT" },
  { id:"JOB",  name:"Job",            chapters:42,  testament:"OT" },
  { id:"PSA",  name:"Psalms",         chapters:150, testament:"OT" },
  { id:"PRO",  name:"Proverbs",       chapters:31,  testament:"OT" },
  { id:"ECC",  name:"Ecclesiastes",   chapters:12,  testament:"OT" },
  { id:"SNG",  name:"Song of Songs",  chapters:8,   testament:"OT" },
  { id:"ISA",  name:"Isaiah",         chapters:66,  testament:"OT" },
  { id:"JER",  name:"Jeremiah",       chapters:52,  testament:"OT" },
  { id:"LAM",  name:"Lamentations",   chapters:5,   testament:"OT" },
  { id:"EZK",  name:"Ezekiel",        chapters:48,  testament:"OT" },
  { id:"DAN",  name:"Daniel",         chapters:12,  testament:"OT" },
  { id:"HOS",  name:"Hosea",          chapters:14,  testament:"OT" },
  { id:"JOL",  name:"Joel",           chapters:3,   testament:"OT" },
  { id:"AMO",  name:"Amos",           chapters:9,   testament:"OT" },
  { id:"OBA",  name:"Obadiah",        chapters:1,   testament:"OT" },
  { id:"JON",  name:"Jonah",          chapters:4,   testament:"OT" },
  { id:"MIC",  name:"Micah",          chapters:7,   testament:"OT" },
  { id:"NAM",  name:"Nahum",          chapters:3,   testament:"OT" },
  { id:"HAB",  name:"Habakkuk",       chapters:3,   testament:"OT" },
  { id:"ZEP",  name:"Zephaniah",      chapters:3,   testament:"OT" },
  { id:"HAG",  name:"Haggai",         chapters:2,   testament:"OT" },
  { id:"ZEC",  name:"Zechariah",      chapters:14,  testament:"OT" },
  { id:"MAL",  name:"Malachi",        chapters:4,   testament:"OT" },
  { id:"MAT",  name:"Matthew",        chapters:28,  testament:"NT" },
  { id:"MRK",  name:"Mark",           chapters:16,  testament:"NT" },
  { id:"LUK",  name:"Luke",           chapters:24,  testament:"NT" },
  { id:"JHN",  name:"John",           chapters:21,  testament:"NT" },
  { id:"ACT",  name:"Acts",           chapters:28,  testament:"NT" },
  { id:"ROM",  name:"Romans",         chapters:16,  testament:"NT" },
  { id:"1CO",  name:"1 Corinthians",  chapters:16,  testament:"NT" },
  { id:"2CO",  name:"2 Corinthians",  chapters:13,  testament:"NT" },
  { id:"GAL",  name:"Galatians",      chapters:6,   testament:"NT" },
  { id:"EPH",  name:"Ephesians",      chapters:6,   testament:"NT" },
  { id:"PHP",  name:"Philippians",    chapters:4,   testament:"NT" },
  { id:"COL",  name:"Colossians",     chapters:4,   testament:"NT" },
  { id:"1TH",  name:"1 Thessalonians",chapters:5,   testament:"NT" },
  { id:"2TH",  name:"2 Thessalonians",chapters:3,   testament:"NT" },
  { id:"1TI",  name:"1 Timothy",      chapters:6,   testament:"NT" },
  { id:"2TI",  name:"2 Timothy",      chapters:4,   testament:"NT" },
  { id:"TIT",  name:"Titus",          chapters:3,   testament:"NT" },
  { id:"PHM",  name:"Philemon",       chapters:1,   testament:"NT" },
  { id:"HEB",  name:"Hebrews",        chapters:13,  testament:"NT" },
  { id:"JAS",  name:"James",          chapters:5,   testament:"NT" },
  { id:"1PE",  name:"1 Peter",        chapters:5,   testament:"NT" },
  { id:"2PE",  name:"2 Peter",        chapters:3,   testament:"NT" },
  { id:"1JN",  name:"1 John",         chapters:5,   testament:"NT" },
  { id:"2JN",  name:"2 John",         chapters:1,   testament:"NT" },
  { id:"3JN",  name:"3 John",         chapters:1,   testament:"NT" },
  { id:"JUD",  name:"Jude",           chapters:1,   testament:"NT" },
  { id:"REV",  name:"Revelation",     chapters:22,  testament:"NT" },
];

/**
 * fetchChapter — fetches a full Bible chapter.
 *
 * With API key (NIV via API.Bible):
 *   GET https://api.scripture.api.bible/v1/bibles/{bibleId}/chapters/{bookId}.{chapter}
 *   Returns verses as structured JSON.
 *
 * Without API key (KJV via bible-api.com):
 *   GET https://bible-api.com/{book}+{chapter}
 *   Returns { verses: [{ book_name, chapter, verse, text }] }
 */
async function fetchChapter(bookId, bookName, chapter) {
  if (BIBLE_API_KEY) {
    // ── API.Bible (NIV) — single call fetches entire chapter text ──
    // The /chapters/{id} endpoint returns the full chapter with all verses
    // embedded, avoiding the need for per-verse requests.
    const chapterId = `${bookId}.${chapter}`;
    const url = `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;
    const res = await fetch(url, { headers: { "api-key": BIBLE_API_KEY } });
    if (!res.ok) throw new Error(`API.Bible error: ${res.status}`);
    const data = await res.json();

    // The content comes back as nested JSON items — walk the tree to extract verses
    const verses = [];
    function walk(items) {
      if (!items) return;
      for (const item of items) {
        if (item.type === "verse" && item.attrs?.number) {
          // Collect all text nodes inside this verse
          let text = "";
          function gatherText(nodes) {
            if (!nodes) return;
            for (const n of nodes) {
              if (n.type === "text") text += n.text || "";
              else if (n.items) gatherText(n.items);
            }
          }
          gatherText(item.items);
          if (text.trim()) verses.push({ verse: parseInt(item.attrs.number), text: text.trim() });
        } else if (item.items) {
          walk(item.items);
        }
      }
    }
    walk(data.data?.content);

    // If tree walk yielded nothing, fall back to stripping HTML from the content string
    if (verses.length === 0 && data.data?.content) {
      const raw = typeof data.data.content === "string" ? data.data.content : JSON.stringify(data.data.content);
      // Extract verse numbers and text using a simple pattern
      const matches = [...raw.matchAll(/"number":"(\d+)"[\s\S]*?"text":"([^"]+)"/g)];
      matches.forEach(m => verses.push({ verse: parseInt(m[1]), text: m[2].trim() }));
    }

    if (verses.length === 0) throw new Error("No verse content returned");
    return { book: bookName, chapter, verses, translation: "NIV" };
  } else {
    // ── bible-api.com (KJV fallback) ────────────────────────
    const encoded = encodeURIComponent(`${bookName} ${chapter}`);
    const res = await fetch(`https://bible-api.com/${encoded}`);
    if (!res.ok) throw new Error("bible-api.com error");
    const data = await res.json();
    return {
      book: bookName,
      chapter,
      verses: data.verses.map(v => ({ verse: v.verse, text: v.text.trim() })),
      translation: "KJV",
    };
  }
}

/**
 * searchVerses — searches for verses matching a query string.
 *
 * With API key: uses API.Bible full-text search endpoint.
 * Without API key: filters our local VERSES array as a lightweight fallback.
 */
async function searchVerses(query) {
  if (!query.trim()) return [];

  if (BIBLE_API_KEY) {
    const encoded = encodeURIComponent(query);
    const url = `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/search?query=${encoded}&limit=20`;
    const res = await fetch(url, { headers: { "api-key": BIBLE_API_KEY } });
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();
    return (data.data?.verses || []).map(v => ({
      ref: v.reference,
      text: v.text.trim(),
    }));
  } else {
    // Fallback: search our curated verse list
    const q = query.toLowerCase();
    return VERSES.filter(v =>
      v.text.toLowerCase().includes(q) || v.ref.toLowerCase().includes(q)
    ).map(v => ({ ref: v.ref, text: v.text }));
  }
}

// ─────────────────────────────────────────────────────────────
// BIBLE READER COMPONENT
// ─────────────────────────────────────────────────────────────
function BibleReader({ C, isDesktop, favorites, onToggleFav }) {
  const [tab, setTab]               = useState("browse");   // "browse" | "search"
  const [selectedBook, setSelectedBook] = useState(BIBLE_BOOKS[39]); // default: Matthew
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [chapterData, setChapterData]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);
  const [testament, setTestament]       = useState("NT"); // "OT" | "NT"

  const card = {
    background: C.surface, borderRadius: 18, padding: "20px 22px",
    boxShadow: C.shadow, border: `1px solid ${C.border}`, marginBottom: 14,
  };
  const inp = {
    background: C.surfaceAlt, border: `1.5px solid ${C.border}`, borderRadius: 12,
    padding: "11px 16px", fontSize: 14, color: C.text, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };

  // Load chapter whenever book or chapter changes
  useEffect(() => {
    if (tab !== "browse") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setChapterData(null);
    fetchChapter(selectedBook.id, selectedBook.name, selectedChapter)
      .then(data => { if (!cancelled) setChapterData(data); })
      .catch(e  => { if (!cancelled) setError(e.message); })
      .finally(()=> { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedBook, selectedChapter, tab]);

  // Debounced search
  useEffect(() => {
    if (tab !== "search" || !searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchVerses(searchQuery);
        setSearchResults(results);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery, tab]);

  const otBooks = BIBLE_BOOKS.filter(b => b.testament === "OT");
  const ntBooks = BIBLE_BOOKS.filter(b => b.testament === "NT");
  const books   = testament === "OT" ? otBooks : ntBooks;

  function prevChapter() {
    if (selectedChapter > 1) setSelectedChapter(c => c - 1);
    else {
      const idx = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
      if (idx > 0) { setSelectedBook(BIBLE_BOOKS[idx-1]); setSelectedChapter(BIBLE_BOOKS[idx-1].chapters); }
    }
  }
  function nextChapter() {
    if (selectedChapter < selectedBook.chapters) setSelectedChapter(c => c + 1);
    else {
      const idx = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
      if (idx < BIBLE_BOOKS.length - 1) { setSelectedBook(BIBLE_BOOKS[idx+1]); setSelectedChapter(1); }
    }
  }

  return (
    <div style={{ flex:1, overflowY:"auto", padding: isDesktop ? "32px 40px" : "22px 16px 96px" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize: isDesktop ? 26 : 21, color:C.primary }}>Bible</h2>
          <p style={{ margin:"4px 0 0", fontSize:12, color:C.textMuted }}>
            {BIBLE_API_KEY ? "New International Version (NIV)" : "King James Version (KJV)"}
          </p>
        </div>
      </div>

      {/* Tab switcher: Browse / Search */}
      <div style={{ display:"flex", background:C.surfaceAlt, borderRadius:12,
        padding:4, marginBottom:20, gap:4 }}>
        {["browse","search"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex:1, padding:"9px 0", borderRadius:9, border:"none", cursor:"pointer",
              background: tab===t ? C.surface : "transparent",
              color: tab===t ? C.primary : C.textMuted,
              fontFamily:"inherit", fontSize:14, fontWeight: tab===t ? 700 : 400,
              boxShadow: tab===t ? C.shadow : "none", transition:"all 0.2s" }}>
            {t === "browse" ? "📖 Browse" : "🔍 Search"}
          </button>
        ))}
      </div>

      {/* ── BROWSE TAB ── */}
      {tab === "browse" && (
        <>
          {/* Testament toggle */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {["OT","NT"].map(t => (
              <button key={t} onClick={() => { setTestament(t); }}
                style={{ padding:"7px 20px", borderRadius:20, border:`1.5px solid ${testament===t ? C.primary : C.border}`,
                  background: testament===t ? C.accentSoft : "transparent",
                  color: testament===t ? C.primary : C.textMuted,
                  cursor:"pointer", fontSize:13, fontWeight: testament===t ? 700 : 400,
                  fontFamily:"inherit" }}>
                {t === "OT" ? "Old Testament" : "New Testament"}
              </button>
            ))}
          </div>

          {/* Book + Chapter selectors */}
          <div style={{ ...card, padding:"16px 18px" }}>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
              {/* Book dropdown */}
              <div style={{ flex:2, minWidth:160 }}>
                <label style={{ fontSize:11, color:C.textMuted, display:"block",
                  marginBottom:5, fontFamily:"sans-serif" }}>Book</label>
                <select value={selectedBook.id}
                  onChange={e => {
                    const book = BIBLE_BOOKS.find(b => b.id === e.target.value);
                    setSelectedBook(book);
                    setSelectedChapter(1);
                    setTestament(book.testament);
                  }}
                  style={{ ...inp, width:"100%", cursor:"pointer" }}>
                  <optgroup label="Old Testament">
                    {otBooks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </optgroup>
                  <optgroup label="New Testament">
                    {ntBooks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </optgroup>
                </select>
              </div>

              {/* Chapter dropdown */}
              <div style={{ flex:1, minWidth:90 }}>
                <label style={{ fontSize:11, color:C.textMuted, display:"block",
                  marginBottom:5, fontFamily:"sans-serif" }}>Chapter</label>
                <select value={selectedChapter}
                  onChange={e => setSelectedChapter(Number(e.target.value))}
                  style={{ ...inp, width:"100%", cursor:"pointer" }}>
                  {Array.from({ length: selectedBook.chapters }, (_,i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Chapter navigation */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <button onClick={prevChapter}
              style={{ display:"flex", alignItems:"center", gap:6, background:C.accentSoft,
                border:"none", borderRadius:10, padding:"8px 14px", cursor:"pointer",
                color:C.primary, fontSize:13, fontFamily:"inherit", fontWeight:600 }}>
              <Icons.ChevL /> Prev
            </button>
            <span style={{ fontSize:14, fontWeight:700, color:C.primary }}>
              {selectedBook.name} {selectedChapter}
            </span>
            <button onClick={nextChapter}
              style={{ display:"flex", alignItems:"center", gap:6, background:C.accentSoft,
                border:"none", borderRadius:10, padding:"8px 14px", cursor:"pointer",
                color:C.primary, fontSize:13, fontFamily:"inherit", fontWeight:600 }}>
              Next <Icons.ChevR />
            </button>
          </div>

          {/* Chapter content */}
          {loading && (
            <div style={{ ...card, textAlign:"center", padding:"48px 24px", color:C.textMuted }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📖</div>
              Loading {selectedBook.name} {selectedChapter}...
            </div>
          )}
          {error && (
            <div style={{ ...card, textAlign:"center", padding:"32px 24px" }}>
              <p style={{ color:C.danger, margin:"0 0 12px" }}>Couldn't load chapter. Check your connection.</p>
              <button onClick={() => setSelectedChapter(c => c)}
                style={{ background:C.primary, color:"#FFF", border:"none", borderRadius:10,
                  padding:"10px 20px", cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>
                Try Again
              </button>
            </div>
          )}
          {chapterData && !loading && (
            <div style={card}>
              {/* Translation badge */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <h3 style={{ margin:0, fontSize:18, color:C.primary }}>
                  {chapterData.book} {chapterData.chapter}
                </h3>
                <span style={{ fontSize:11, background:C.accentSoft, color:C.primary,
                  padding:"3px 10px", borderRadius:20, fontFamily:"sans-serif", fontWeight:600 }}>
                  {chapterData.translation}
                </span>
              </div>

              {/* Verses */}
              {chapterData.verses.map(v => (
                <div key={v.verse}
                  style={{ display:"flex", gap:12, padding:"10px 0",
                    borderBottom:`1px solid ${C.border}`, alignItems:"flex-start" }}>
                  {/* Verse number */}
                  <span style={{ fontSize:11, color:C.accent, fontWeight:700,
                    minWidth:22, marginTop:3, fontFamily:"sans-serif", flexShrink:0 }}>
                    {v.verse}
                  </span>
                  {/* Verse text */}
                  <p style={{ margin:0, fontSize:15, lineHeight:1.75, color:C.text, flex:1 }}>
                    {v.text}
                  </p>
                  {/* Favorite button */}
                  <button
                    onClick={() => onToggleFav(`${chapterData.book} ${chapterData.chapter}:${v.verse}`, v.text)}
                    style={{ background:"none", border:"none", cursor:"pointer", flexShrink:0,
                      color: favorites.includes(`${chapterData.book} ${chapterData.chapter}:${v.verse}`)
                        ? "#E8721A" : C.textLight,
                      padding:"2px 4px", marginTop:2, transition:"color 0.2s" }}>
                    <Icons.Heart f={favorites.includes(`${chapterData.book} ${chapterData.chapter}:${v.verse}`)} />
                  </button>
                </div>
              ))}

              {/* Bottom chapter nav */}
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:20 }}>
                <button onClick={prevChapter}
                  style={{ display:"flex", alignItems:"center", gap:6, background:C.accentSoft,
                    border:"none", borderRadius:10, padding:"10px 16px", cursor:"pointer",
                    color:C.primary, fontSize:13, fontFamily:"inherit", fontWeight:600 }}>
                  <Icons.ChevL /> Previous Chapter
                </button>
                <button onClick={nextChapter}
                  style={{ display:"flex", alignItems:"center", gap:6, background:C.accentSoft,
                    border:"none", borderRadius:10, padding:"10px 16px", cursor:"pointer",
                    color:C.primary, fontSize:13, fontFamily:"inherit", fontWeight:600 }}>
                  Next Chapter <Icons.ChevR />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SEARCH TAB ── */}
      {tab === "search" && (
        <>
          <div style={{ ...card, padding:"16px 18px" }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ color:C.textMuted }}><Icons.Search /></div>
              <input
                style={{ ...inp, flex:1 }}
                placeholder={BIBLE_API_KEY
                  ? 'Search NIV — e.g. "love one another" or "John 3:16"'
                  : 'Search — e.g. "strength" or "fear not"'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                  style={{ background:"none", border:"none", cursor:"pointer",
                    color:C.textMuted, fontSize:18, padding:"0 4px" }}>×</button>
              )}
            </div>
          </div>

          

          {searching && (
            <div style={{ textAlign:"center", padding:"32px", color:C.textMuted }}>Searching...</div>
          )}

          {!searching && searchQuery && searchResults.length === 0 && (
            <div style={{ ...card, textAlign:"center", padding:"32px" }}>
              <p style={{ color:C.textMuted, margin:0 }}>No results for "{searchQuery}"</p>
            </div>
          )}

          {searchResults.map((r, i) => (
            <div key={i} style={card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.primary,
                    marginBottom:6, fontFamily:"sans-serif" }}>{r.ref}</div>
                  <p style={{ margin:0, fontSize:14, lineHeight:1.7, color:C.text }}>{r.text}</p>
                </div>
                <button onClick={() => onToggleFav(r.ref, r.text)}
                  style={{ background:"none", border:"none", cursor:"pointer", flexShrink:0,
                    color: favorites.includes(r.ref) ? "#E8721A" : C.textLight,
                    padding:"2px 4px", transition:"color 0.2s" }}>
                  <Icons.Heart f={favorites.includes(r.ref)} />
                </button>
              </div>
            </div>
          ))}

          {!searchQuery && (
            <div style={{ ...card, textAlign:"center", padding:"48px 24px" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
              <p style={{ color:C.textMuted, margin:0, lineHeight:1.6 }}>
                Type a word, phrase, or reference<br/>to search the Bible
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
function Dashboard({ C, isDesktop, profile, firebaseUser, entries, streak, bestStreak,
  verse, isFav, toggleFav, setVerseOffset,
  journalText, setJournalText, mood, setMood,
  savedToday, saveBusy, handleSave, darkMode, setDarkMode }) {

  const card = {
    background: C.surface, borderRadius: 18, padding: "20px 22px",
    boxShadow: C.shadow, border: `1px solid ${C.border}`, marginBottom: 16,
  };
  const inp = {
    background: C.surfaceAlt, border: `1.5px solid ${C.border}`, borderRadius: 12,
    padding: "13px 16px", fontSize: 15, color: C.text, fontFamily: "inherit",
    width: "100%", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isDesktop ? "32px 40px" : "22px 16px 96px" }}>

      {/* Greeting row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin:0, fontSize: isDesktop ? 26 : 21, color:C.primary }}>
            {["Good morning","Good afternoon","Good evening"][new Date().getHours()<12?0:new Date().getHours()<17?1:2]},{" "}
            <span style={{ fontWeight:800 }}>
              {(profile?.name || firebaseUser?.displayName || "friend").split(" ")[0]}
            </span>
          </h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:C.textMuted }}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </p>
        </div>
        {/* Dark mode toggle only shows here on mobile; desktop has it in sidebar */}
        {!isDesktop && (
          <button onClick={() => setDarkMode(d => !d)}
            style={{ background:C.accentSoft, border:"none", borderRadius:10,
              padding:"8px 11px", cursor:"pointer", color:C.primary }}>
            {darkMode ? <Icons.Sun /> : <Icons.Moon />}
          </button>
        )}
      </div>

      {/* Desktop: two-column grid. Mobile: single column */}
      <div style={{
        display: isDesktop ? "grid" : "block",
        gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined,
        gap: isDesktop ? 20 : 0,
        alignItems: "start",
      }}>

        {/* LEFT COLUMN */}
        <div>
          {/* Streak */}
          <div style={{ ...card,
            background: streak>0 ? `linear-gradient(135deg,${C.streakOrange}22,${C.gold}18)` : C.surface,
            border:`1.5px solid ${streak>0?C.streakOrange+"55":C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:32 }}>🔥</span>
                <div>
                  <div style={{ fontSize:30, fontWeight:900, lineHeight:1,
                    color: streak>0 ? C.streakOrange : C.textLight }}>
                    {streak} <span style={{ fontSize:15, fontWeight:600 }}>day{streak!==1?"s":""}</span>
                  </div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                    {streak>0 ? "current streak" : "start your streak today!"}
                  </div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5,
                  justifyContent:"flex-end", color:C.gold, fontSize:24, fontWeight:800 }}>
                  <Icons.Trophy /> {profile?.longestStreak || bestStreak}
                </div>
                <div style={{ fontSize:11, color:C.textMuted }}>best streak</div>
              </div>
            </div>
          </div>

          {/* Daily Verse */}
          <div style={{ ...card,
            background:`linear-gradient(145deg,${C.gradVerse[0]},${C.gradVerse[1]})`,
            color:"#FFF", border:"none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:10, letterSpacing:1.8, opacity:0.75,
                  textTransform:"uppercase", marginBottom:3 }}>Today's Verse</div>
                <div style={{ fontSize:11, opacity:0.9, fontWeight:600,
                  background:"rgba(255,255,255,0.18)", display:"inline-block",
                  padding:"2px 8px", borderRadius:20 }}>{verse.theme}</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={toggleFav}
                  style={{ background:"rgba(255,255,255,0.18)", border:"none", borderRadius:9,
                    padding:"7px 9px", cursor:"pointer",
                    color: isFav ? "#FFD700" : "#FFF", transition:"all 0.2s" }}>
                  <Icons.Heart f={isFav} />
                </button>
                <button onClick={() => setVerseOffset(v => ((v ?? 0) + 1))}
                  style={{ background:"rgba(255,255,255,0.18)", border:"none",
                    borderRadius:9, padding:"7px 9px", cursor:"pointer", color:"#FFF" }}>
                  <Icons.Refresh />
                </button>
              </div>
            </div>
            <div style={{ marginBottom:10 }}><Icons.Quote /></div>
            <p style={{ margin:"0 0 14px", fontSize: isDesktop ? 17 : 16,
              lineHeight:1.75, fontStyle:"italic", fontWeight:500 }}>
              {verse.text}
            </p>
            <div style={{ fontSize:13, fontWeight:700, opacity:0.9 }}>— {verse.ref}</div>
          </div>
        </div>

        {/* RIGHT COLUMN (or below on mobile) */}
        <div>
          {/* Journal Editor */}
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h3 style={{ margin:0, fontSize:16, color:C.primary }}>
                {savedToday ? "Edit Today's Entry" : "Today's Journal"}
              </h3>
              {savedToday && (
                <span style={{ fontSize:11, background:`${C.success}20`, color:C.success,
                  padding:"3px 10px", borderRadius:20, fontFamily:"sans-serif" }}>✓ Saved</span>
              )}
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:C.textMuted, marginBottom:8, fontFamily:"sans-serif" }}>
                How are you feeling?
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {MOODS.map(m => (
                  <button key={m} onClick={() => setMood(m)}
                    style={{ fontSize:19, padding:"5px 9px", borderRadius:10, cursor:"pointer",
                      border:`2px solid ${mood===m?C.primary:"transparent"}`,
                      background: mood===m ? C.accentSoft : "transparent" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={journalText}
              onChange={e => setJournalText(e.target.value)}
              placeholder="Write your thoughts, prayers, or reflections here..."
              style={{ ...inp, minHeight: isDesktop ? 220 : 130, resize:"vertical", lineHeight:1.7, fontSize:14 }}
            />

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
              <span style={{ fontSize:12, color:C.textLight, fontFamily:"sans-serif" }}>
                {journalText.length} chars
              </span>
              <button onClick={handleSave} disabled={saveBusy}
                style={{ background:C.primary, color:"#FFF", border:"none", borderRadius:12,
                  padding:"12px 20px", fontSize:14, fontFamily:"inherit",
                  cursor: saveBusy?"wait":"pointer", fontWeight:600,
                  display:"flex", alignItems:"center", gap:7, opacity: saveBusy?0.7:1 }}>
                <Icons.Save /> {saveBusy ? "Saving..." : savedToday ? "Update" : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────────────────────
function History({ C, isDesktop, entries, bestStreak, profile, expanded, setExpanded }) {
  const card = {
    background: C.surface, borderRadius: 18, padding: "20px 22px",
    boxShadow: C.shadow, border: `1px solid ${C.border}`, marginBottom: 14,
  };
  const keys = Object.keys(entries).sort((a,b) => b.localeCompare(a));

  return (
    <div style={{ flex:1, overflowY:"auto", padding: isDesktop ? "32px 40px" : "22px 16px 96px" }}>
      <h2 style={{ margin:"0 0 4px", fontSize: isDesktop ? 26 : 21, color:C.primary }}>
        Journal History
      </h2>
      <p style={{ margin:"0 0 20px", fontSize:13, color:C.textMuted, fontFamily:"sans-serif" }}>
        {keys.length} entr{keys.length!==1?"ies":"y"} · {profile?.longestStreak || bestStreak} day best streak
      </p>

      {/* 14-day heatmap */}
      <div style={card}>
        <div style={{ fontSize:13, color:C.textMuted, marginBottom:10, fontFamily:"sans-serif", fontWeight:600 }}>
          Last 14 days
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {Array.from({length:14},(_,i) => {
            const dk = toDateKey(new Date(Date.now()-(13-i)*86_400_000));
            const has = !!entries[dk];
            return (
              <div key={dk} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:"100%", height: isDesktop ? 40 : 32, borderRadius:8,
                  background: has ? C.streakOrange : C.surfaceAlt,
                  border: dk===todayKey ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, color:"#FFF", opacity: has ? 1 : 0.45 }}>
                  {has ? "✓" : ""}
                </div>
                <div style={{ fontSize:9, color:C.textLight, fontFamily:"sans-serif" }}>
                  {formatDateShort(dk).split(" ")[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Entry list — 2 columns on desktop */}
      <div style={{
        display: isDesktop ? "grid" : "block",
        gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined,
        gap: isDesktop ? 16 : 0,
        alignItems: "start",
      }}>
        {keys.length === 0 ? (
          <div style={{ ...card, textAlign:"center", padding:"48px 24px", gridColumn:"1/-1" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📖</div>
            <p style={{ color:C.textMuted, margin:0 }}>No entries yet — start writing today!</p>
          </div>
        ) : keys.map(dk => {
          const e = entries[dk];
          const isOpen = expanded === dk;
          return (
            <div key={dk} style={{ ...card, cursor:"pointer", marginBottom: isDesktop ? 0 : 14 }}
              onClick={() => setExpanded(isOpen ? null : dk)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <span style={{ fontSize:18 }}>{e.mood||"✨"}</span>
                    <span style={{ fontSize:14, fontWeight:700, color:C.primary }}>
                      {dk===todayKey?"Today":formatDate(dk)}
                    </span>
                    {dk===todayKey && (
                      <span style={{ fontSize:10, background:`${C.accent}30`, color:C.primary,
                        padding:"2px 8px", borderRadius:20, fontFamily:"sans-serif" }}>today</span>
                    )}
                  </div>
                  <p style={{ margin:0, fontSize:13, color:C.textMuted, lineHeight:1.55,
                    display:"-webkit-box", WebkitLineClamp:isOpen?999:2,
                    WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {e.text}
                  </p>
                  {isOpen && e.verse && (
                    <div style={{ marginTop:10, padding:"8px 12px", background:C.accentSoft,
                      borderRadius:8, fontSize:12, color:C.textMuted, fontStyle:"italic" }}>
                      📖 Verse that day: {e.verse}
                    </div>
                  )}
                </div>
                <span style={{ marginLeft:12, color:C.textLight, fontSize:20,
                  transform:isOpen?"rotate(90deg)":"rotate(0)", transition:"transform 0.2s" }}>›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────
function Profile({ C, isDesktop, profile, firebaseUser, entries, streak, bestStreak,
  darkMode, setDarkMode, handleLogout,
  reminderOn, reminderTime, enableReminder, disableReminder, setReminderTime, formatTime }) {

  const card = {
    background: C.surface, borderRadius: 18, padding: "20px 22px",
    boxShadow: C.shadow, border: `1px solid ${C.border}`, marginBottom: 14,
  };
  const favVerses = VERSES.filter(v => (profile?.favoriteVerses||[]).includes(v.ref));

  return (
    <div style={{ flex:1, overflowY:"auto", padding: isDesktop ? "32px 40px" : "22px 16px 96px" }}>
      <h2 style={{ margin:"0 0 24px", fontSize: isDesktop ? 26 : 21, color:C.primary }}>Profile</h2>

      <div style={{
        display: isDesktop ? "grid" : "block",
        gridTemplateColumns: isDesktop ? "280px 1fr" : undefined,
        gap: isDesktop ? 24 : 0,
        alignItems: "start",
      }}>
        {/* Left: avatar + stats */}
        <div>
          <div style={{ ...card, textAlign:"center", padding:"30px 24px" }}>
            <div style={{ width:80, height:80, borderRadius:"50%",
              background:`linear-gradient(135deg,${C.primary},${C.accent})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 14px", fontSize:32, color:"#FFF", fontWeight:700 }}>
              {(profile?.name || "G")[0].toUpperCase()}
            </div>
            <h3 style={{ margin:"0 0 4px", fontSize:20 }}>{profile?.name}</h3>
            <p style={{ margin:0, fontSize:13, color:C.textMuted }}>{firebaseUser?.email}</p>
            {profile?.joinDate && (
              <p style={{ margin:"6px 0 0", fontSize:12, color:C.textLight }}>
                Since {formatDate(profile.joinDate)}
              </p>
            )}
          </div>

          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:C.primary, marginBottom:14 }}>Stats</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {[
                { label:"Entries", val: Object.keys(entries).length },
                { label:"Streak",  val: `${profile?.currentStreak || streak}🔥` },
                { label:"Best",    val: `${profile?.longestStreak || bestStreak}🏆` },
              ].map(s => (
                <div key={s.label} style={{ background:C.accentSoft, borderRadius:14,
                  padding:"14px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:C.primary }}>{s.val}</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:3, fontFamily:"sans-serif" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:C.primary, marginBottom:14 }}>Settings</div>

            {/* Dark mode toggle */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:14 }}>
                {darkMode ? <Icons.Moon /> : <Icons.Sun />} Dark Mode
              </div>
              <button onClick={() => setDarkMode(d=>!d)}
                style={{ width:48, height:26, borderRadius:13,
                  background: darkMode ? C.primary : C.border,
                  border:"none", cursor:"pointer", position:"relative", transition:"background 0.25s" }}>
                <div style={{ position:"absolute", top:3, width:20, height:20,
                  left: darkMode ? 25 : 3, borderRadius:"50%", background:"#FFF",
                  transition:"left 0.25s" }} />
              </button>
            </div>

            {/* Daily reminder */}
            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: reminderOn ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize:14, display:"flex", alignItems:"center", gap:8 }}>
                    🔔 Daily Reminder
                  </div>
                  <div style={{ fontSize:11, color:C.textLight, marginTop:2, fontFamily:"sans-serif" }}>
                    {reminderOn ? `Scheduled at ${formatTime(reminderTime)}` : "Get a nudge to journal each day"}
                  </div>
                </div>
                <button onClick={() => reminderOn ? disableReminder() : enableReminder(reminderTime)}
                  style={{ width:48, height:26, borderRadius:13,
                    background: reminderOn ? C.primary : C.border,
                    border:"none", cursor:"pointer", position:"relative", transition:"background 0.25s" }}>
                  <div style={{ position:"absolute", top:3, width:20, height:20,
                    left: reminderOn ? 25 : 3, borderRadius:"50%", background:"#FFF",
                    transition:"left 0.25s" }} />
                </button>
              </div>

              {/* Time picker — shown when reminder is on */}
              {reminderOn && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:4 }}>
                  <label style={{ fontSize:13, color:C.textMuted, fontFamily:"sans-serif" }}>
                    Reminder time:
                  </label>
                  <input type="time" value={reminderTime}
                    onChange={e => { setReminderTime(e.target.value); enableReminder(e.target.value); }}
                    style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8,
                      padding:"6px 10px", fontSize:13, color:C.text, fontFamily:"sans-serif",
                      cursor:"pointer", outline:"none" }} />
                </div>
              )}

              {/* Browser notification note */}
              {reminderOn && (
                <p style={{ margin:"10px 0 0", fontSize:11, color:C.textLight,
                  fontFamily:"sans-serif", lineHeight:1.5 }}>
                  ℹ️ Requires browser to be open. For reminders that work anytime, use email reminders.
                </p>
              )}
            </div>
          </div>

          <button onClick={handleLogout}
            style={{ background:"transparent", color:C.danger, border:`1.5px solid ${C.danger}50`,
              borderRadius:12, padding:"12px 20px", fontSize:14, fontFamily:"inherit",
              cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center",
              gap:7, justifyContent:"center", width:"100%" }}>
            <Icons.LogOut /> Sign Out
          </button>
        </div>

        {/* Right: saved verses */}
        <div>
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:C.primary, marginBottom:14 }}>
              ❤️ Saved Verses ({favVerses.length})
            </div>
            {favVerses.length === 0 ? (
              <p style={{ color:C.textMuted, fontSize:14, margin:0, fontStyle:"italic" }}>
                Tap the heart on the daily verse to save it here.
              </p>
            ) : favVerses.map(v => (
              <div key={v.ref} style={{ padding:"14px 0", borderBottom:`1px solid ${C.border}` }}>
                <p style={{ margin:"0 0 6px", fontSize:14, fontStyle:"italic", color:C.text, lineHeight:1.65 }}>
                  "{v.text}"
                </p>
                <div style={{ fontSize:12, color:C.primary, fontWeight:700 }}>— {v.ref}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function GraceNotes() {
  const isDesktop = useIsDesktop();

  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [profile, setProfile]           = useState(null);
  const [screen, setScreen]             = useState("dashboard");
  const [darkMode, setDarkMode]         = useState(getDarkPref);
  const [toast, setToast]               = useState(null);

  const [authMode, setAuthMode]   = useState("login");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [nameInput, setNameInput] = useState("");
  const [authErr, setAuthErr]     = useState("");
  const [authBusy, setAuthBusy]   = useState(false);
  const [forgotMode, setForgotMode] = useState(false);  // shows forgot password form
  const [resetSent, setResetSent]   = useState(false);  // shows confirmation message
  const [resetBusy, setResetBusy]   = useState(false);

  const [entries, setEntries]         = useState({});
  const [journalText, setJournalText] = useState("");
  const [mood, setMood]               = useState("✨");
  const [savedToday, setSavedToday]   = useState(false);
  const [saveBusy, setSaveBusy]       = useState(false);
  const [verseOffset, setVerseOffset] = useState(null);
  const [reminderOn, setReminderOn]     = useState(() => { try { return localStorage.getItem("gn_reminder") === "true"; } catch { return false; } });
  const [reminderTime, setReminderTime] = useState(() => { try { return localStorage.getItem("gn_reminderTime") || "08:00"; } catch { return "08:00"; } });
  const [expanded, setExpanded]       = useState(null);

  const C     = THEMES[darkMode ? "dark" : "light"];
  const verse = getDailyVerse(verseOffset);
  const isFav = (profile?.favoriteVerses || []).includes(verse.ref);
  const { current: streak, longest: bestStreak } = computeStreak(Object.keys(entries));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) { await loadProfile(user.uid); await loadEntries(user.uid); }
      else { setProfile(null); setEntries({}); }
    });
    return unsub;
  }, []);

  useEffect(() => setDarkPref(darkMode), [darkMode]);

  // Schedule the daily browser notification whenever reminderOn or reminderTime changes.
  // Calculates milliseconds until the next occurrence of the chosen time,
  // fires the notification, then sets a 24h interval for subsequent days.
  useEffect(() => {
    if (!reminderOn) return;

    function msUntilNext(timeStr) {
      const [h, m]  = timeStr.split(":").map(Number);
      const now     = new Date();
      const target  = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1); // already passed today → tomorrow
      return target.getTime() - now.getTime();
    }

    function fireNotification() {
      if (Notification.permission === "granted") {
        new Notification("GraceNotes 📖", {
          body: "Time to journal. Your daily verse is waiting.",
          icon: "/favicon.ico",
        });
      }
    }

    // First fire: at the next scheduled time
    const initialDelay = setTimeout(() => {
      fireNotification();
      // Subsequent fires: every 24 hours
      const daily = setInterval(fireNotification, 86_400_000);
      return () => clearInterval(daily);
    }, msUntilNext(reminderTime));

    return () => clearTimeout(initialDelay);
  }, [reminderOn, reminderTime]);

  async function loadProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) setProfile({ uid, ...snap.data() });
  }

  async function loadEntries(uid) {
    try {
      const ref  = collection(db, "entries", uid, "userEntries");
      const q    = query(ref, orderBy("__name__", "desc"));
      const snap = await getDocs(q);
      const map  = {};
      snap.docs.forEach(d => { map[d.id] = d.data(); });
      setEntries(map);
      const todayEntry = map[todayKey];
      if (todayEntry) {
        setJournalText(todayEntry.text || "");
        setMood(todayEntry.mood || "✨");
        setSavedToday(true);
      } else {
        setJournalText(""); setMood("✨"); setSavedToday(false);
      }
    } catch (err) { console.error("Failed to load entries:", err); }
  }

  const notify = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  function handleAuth() {
    setAuthErr("");
    if (!email.trim())       return setAuthErr("Email is required.");
    if (password.length < 6) return setAuthErr("Password must be at least 6 characters.");
    if (authMode === "register") {
      if (!nameInput.trim()) return setAuthErr("Please enter your name.");
      handleRegister();
    } else { handleLogin(); }
  }

  async function handleRegister() {
    setAuthBusy(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: nameInput.trim() });
      await setDoc(doc(db, "users", user.uid), {
        email: user.email, name: nameInput.trim(), joinDate: todayKey,
        currentStreak: 0, longestStreak: 0, lastEntryDate: null,
        favoriteVerses: [], createdAt: serverTimestamp(),
      });
      await loadProfile(user.uid);
    } catch (e) { setAuthErr(friendlyAuthError(e.code)); }
    finally { setAuthBusy(false); }
  }

  async function handleLogin() {
    setAuthBusy(true);
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (e) { setAuthErr(friendlyAuthError(e.code)); }
    finally { setAuthBusy(false); }
  }

  async function handleLogout() {
    await signOut(auth);
    setEntries({}); setJournalText(""); setSavedToday(false);
  }

  // ── FORGOT PASSWORD ──────────────────────────────────────────
  // Firebase sends a reset email automatically — no backend needed.
  // The email contains a secure link that lets the user set a new password.
  async function handleResetPassword() {
    setAuthErr("");
    if (!email.trim()) return setAuthErr("Enter your email address above first.");
    setResetBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true); // show confirmation message
    } catch (e) {
      setAuthErr(friendlyAuthError(e.code));
    } finally {
      setResetBusy(false);
    }
  }

  // ── BROWSER REMINDER SYSTEM ──────────────────────────────────
  // How it works:
  //  1. User enables reminders and picks a time (e.g. 08:00).
  //  2. We request browser Notification permission.
  //  3. A useEffect schedules a setTimeout for the next occurrence of that time.
  //  4. When it fires, we show a notification and reschedule for 24h later.
  //  5. Settings persist in localStorage so they survive page refreshes.
  //
  // Limitation: browser must be open for the notification to fire.
  // For notifications that work even when browser is closed, you'd need
  // a service worker (more complex) or email reminders via a backend.

  async function enableReminder(time) {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        notify("Please allow notifications in your browser settings.", "err");
        return;
      }
      localStorage.setItem("gn_reminder", "true");
      localStorage.setItem("gn_reminderTime", time);
      setReminderOn(true);
      setReminderTime(time);
      notify("Reminder set! You'll be notified daily at " + formatTime(time) + " 🔔", "ok");
    } catch {
      notify("Notifications aren't supported in this browser.", "err");
    }
  }

  function disableReminder() {
    localStorage.setItem("gn_reminder", "false");
    setReminderOn(false);
    notify("Daily reminder turned off.", "ok");
  }

  function formatTime(t) {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2,"0")} ${ampm}`;
  }

  function friendlyAuthError(code) {
    const map = {
      "auth/email-already-in-use":  "That email is already registered. Try signing in.",
      "auth/invalid-email":          "Please enter a valid email address.",
      "auth/weak-password":          "Password must be at least 6 characters.",
      "auth/user-not-found":         "No account found with that email.",
      "auth/wrong-password":         "Incorrect password. Please try again.",
      "auth/invalid-credential":     "Email or password is incorrect.",
      "auth/too-many-requests":      "Too many attempts. Please wait a moment.",
      "auth/network-request-failed": "Network error. Check your connection.",
    };
    return map[code] || "Something went wrong. Please try again.";
  }

  async function handleSave() {
    if (!journalText.trim()) return notify("Write something first 🙏", "err");
    setSaveBusy(true);
    try {
      const uid      = firebaseUser.uid;
      const entryRef = doc(db, "entries", uid, "userEntries", todayKey);
      const existing = await getDoc(entryRef);
      const isNew    = !existing.exists();
      await setDoc(entryRef, {
        text: journalText.trim(), mood, verse: verse.ref,
        updatedAt: serverTimestamp(),
        ...(isNew && { createdAt: serverTimestamp() }),
      }, { merge: true });
      if (isNew) await updateStreakInFirestore(uid);
      setEntries(prev => ({ ...prev, [todayKey]: { text: journalText.trim(), mood, verse: verse.ref } }));
      setSavedToday(true);
      notify(isNew ? "Entry saved 🙏" : "Entry updated ✏️", "ok");
    } catch { notify("Couldn't save. Check your connection.", "err"); }
    finally { setSaveBusy(false); }
  }

  async function updateStreakInFirestore(uid) {
    const userRef  = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const data     = userSnap.exists() ? userSnap.data() : {};
    const last     = data.lastEntryDate;
    let current    = data.currentStreak || 0;
    let longest    = data.longestStreak || 0;
    if (last === todayKey) return;
    else if (last === yesterdayKey) current += 1;
    else current = 1;
    longest = Math.max(longest, current);
    await setDoc(doc(db, "users", uid), { currentStreak: current, longestStreak: longest, lastEntryDate: todayKey }, { merge: true });
    setProfile(prev => ({ ...prev, currentStreak: current, longestStreak: longest }));
  }

  async function toggleFav() {
    if (!firebaseUser) return;
    const current = profile?.favoriteVerses || [];
    const updated = current.includes(verse.ref)
      ? current.filter(v => v !== verse.ref)
      : [...current, verse.ref];
    await setDoc(doc(db, "users", firebaseUser.uid), { favoriteVerses: updated }, { merge: true });
    setProfile(prev => ({ ...prev, favoriteVerses: updated }));
  }

  // ─────────────────────────────────────────────────────────────
  // AUTH SCREEN — centered card, looks great on desktop too
  // ─────────────────────────────────────────────────────────────
  const inp = {
    background: C.surfaceAlt, border: `1.5px solid ${C.border}`, borderRadius: 12,
    padding: "13px 16px", fontSize: 15, color: C.text, fontFamily: "inherit",
    width: "100%", outline: "none", boxSizing: "border-box",
  };

  if (firebaseUser === undefined) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'Georgia','Times New Roman',serif", color:C.textMuted }}>
      <div style={{ color:C.accent, marginBottom:16 }}><Icons.Cross /></div>
      <div style={{ fontSize:22, color:C.primary, fontWeight:700 }}>GraceNotes</div>
      <div style={{ marginTop:16, fontSize:13 }}>Loading...</div>
    </div>
  );

  if (!firebaseUser) return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text,
      fontFamily:"'Georgia','Times New Roman',serif",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent: isDesktop ? "center" : "flex-start",
      padding: isDesktop ? "40px 20px" : "0 20px",
      transition:"background 0.3s" }}>

      <div style={{ width:"100%", maxWidth: 440 }}>
        <div style={{ textAlign:"center", padding: isDesktop ? "0 0 28px" : "56px 0 28px" }}>
          <div style={{ color:C.accent, marginBottom:10 }}><Icons.Cross /></div>
          <h1 style={{ margin:0, fontSize:34, fontWeight:700, color:C.primary, letterSpacing:-0.5 }}>
            GraceNotes
          </h1>
          <p style={{ color:C.textMuted, margin:"8px 0 0", fontSize:15, fontStyle:"italic" }}>
            A quiet place to meet with God
          </p>
        </div>

        <div style={{ background:C.surface, borderRadius:18, boxShadow:C.shadow,
          border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:14 }}>

          {/* Tab bar — hidden when in forgot-password mode */}
          {!forgotMode && (
            <div style={{ display:"flex", borderBottom:`1px solid ${C.border}` }}>
              {["login","register"].map(tab => (
                <button key={tab} onClick={() => { setAuthMode(tab); setAuthErr(""); setResetSent(false); }}
                  style={{ flex:1, padding:"15px 0",
                    background: authMode===tab ? C.surface : C.surfaceAlt,
                    border:"none", cursor:"pointer", fontSize:14,
                    fontWeight: authMode===tab ? 700 : 400,
                    color: authMode===tab ? C.primary : C.textMuted, fontFamily:"inherit" }}>
                  {tab === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding:"26px 24px 30px" }}>

            {/* ── FORGOT PASSWORD PANEL ── */}
            {forgotMode ? (
              resetSent ? (
                // Success state
                <div style={{ textAlign:"center", padding:"8px 0" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>📬</div>
                  <h3 style={{ margin:"0 0 8px", color:C.primary }}>Check your email</h3>
                  <p style={{ color:C.textMuted, fontSize:14, lineHeight:1.6, margin:"0 0 20px" }}>
                    We sent a password reset link to <strong>{email}</strong>.
                    Check your inbox (and spam folder).
                  </p>
                  <button onClick={() => { setForgotMode(false); setResetSent(false); setAuthErr(""); }}
                    style={{ background:C.primary, color:"#FFF", border:"none", borderRadius:12,
                      padding:"12px 20px", fontSize:14, fontFamily:"inherit",
                      cursor:"pointer", fontWeight:600, width:"100%" }}>
                    Back to Sign In
                  </button>
                </div>
              ) : (
                // Forgot password form
                <div>
                  <button onClick={() => { setForgotMode(false); setAuthErr(""); }}
                    style={{ background:"none", border:"none", cursor:"pointer",
                      color:C.textMuted, fontSize:13, fontFamily:"inherit",
                      padding:"0 0 16px", display:"flex", alignItems:"center", gap:6 }}>
                    ← Back to Sign In
                  </button>
                  <h3 style={{ margin:"0 0 6px", color:C.primary }}>Reset your password</h3>
                  <p style={{ margin:"0 0 20px", fontSize:13, color:C.textMuted, lineHeight:1.55 }}>
                    Enter your email and we'll send you a link to create a new password.
                  </p>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ fontSize:12, color:C.textMuted, display:"block", marginBottom:6 }}>Email</label>
                    <input style={inp} type="email" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key==="Enter" && handleResetPassword()} />
                  </div>
                  {authErr && (
                    <div style={{ background:`${C.danger}15`, color:C.danger, borderRadius:10,
                      padding:"10px 14px", fontSize:13, marginBottom:14 }}>{authErr}</div>
                  )}
                  <button onClick={handleResetPassword} disabled={resetBusy}
                    style={{ background:C.primary, color:"#FFF", border:"none", borderRadius:12,
                      padding:"12px 20px", fontSize:14, fontFamily:"inherit", cursor:"pointer",
                      fontWeight:600, width:"100%", opacity:resetBusy?0.7:1 }}>
                    {resetBusy ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              )
            ) : (
              // ── NORMAL LOGIN / REGISTER FORM ──
              <div>
                {authMode === "register" && (
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, color:C.textMuted, display:"block", marginBottom:6 }}>Your Name</label>
                    <input style={inp} placeholder="e.g. Sarah" value={nameInput} onChange={e => setNameInput(e.target.value)} />
                  </div>
                )}
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, color:C.textMuted, display:"block", marginBottom:6 }}>Email</label>
                  <input style={inp} type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div style={{ marginBottom: authMode==="login" ? 8 : 20 }}>
                  <label style={{ fontSize:12, color:C.textMuted, display:"block", marginBottom:6 }}>Password</label>
                  <input style={inp} type="password" placeholder="Min. 6 characters" value={password}
                    onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handleAuth()} />
                </div>

                {/* Forgot password link — only on login tab */}
                {authMode === "login" && (
                  <div style={{ textAlign:"right", marginBottom:16 }}>
                    <button onClick={() => { setForgotMode(true); setAuthErr(""); }}
                      style={{ background:"none", border:"none", cursor:"pointer",
                        color:C.primary, fontSize:13, fontFamily:"inherit",
                        textDecoration:"underline", padding:0 }}>
                      Forgot your password?
                    </button>
                  </div>
                )}

                {authErr && (
                  <div style={{ background:`${C.danger}15`, color:C.danger, borderRadius:10,
                    padding:"10px 14px", fontSize:13, marginBottom:14 }}>{authErr}</div>
                )}
                <button style={{ background:C.primary, color:"#FFF", border:"none", borderRadius:12,
                  padding:"13px 20px", fontSize:15, fontFamily:"inherit", cursor:"pointer",
                  fontWeight:600, width:"100%", opacity:authBusy?0.7:1 }}
                  onClick={handleAuth} disabled={authBusy}>
                  {authBusy ? "Please wait..." : authMode==="login" ? "Sign In" : "Create Account"}
                </button>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign:"center", fontSize:13, color:C.textMuted,
          fontStyle:"italic", lineHeight:1.65, margin:"0 0 12px" }}>
          "Be still, and know that I am God." — Psalm 46:10
        </p>
        <div style={{ background:C.accentSoft, borderRadius:12, padding:"12px 16px",
          border:`1px solid ${C.border}` }}>
          <p style={{ margin:0, fontSize:12, color:C.textMuted, textAlign:"center",
            lineHeight:1.6, fontFamily:"sans-serif" }}>
            🔒 Your journal entries are <strong>completely private</strong>.
            We do not read, share, or sell your data. Only you can see what you write.
          </p>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // MAIN APP SHELL — sidebar on desktop, bottom nav on mobile
  // ─────────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { id:"dashboard", label:"Home",    I:Icons.Home },
    { id:"history",   label:"Journal", I:Icons.Book },
    { id:"bible",     label:"Bible",   I:Icons.Bible },
    { id:"profile",   label:"Profile", I:Icons.User },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text,
      fontFamily:"'Georgia','Times New Roman',serif",
      display:"flex", flexDirection: isDesktop ? "row" : "column",
      transition:"background 0.3s,color 0.3s" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:18, left:"50%", transform:"translateX(-50%)",
          background: toast.type==="err" ? "#C0392B" : "#2E7D52",
          color:"#FFF", padding:"11px 22px", borderRadius:12, fontSize:14,
          fontFamily:"sans-serif", zIndex:999, boxShadow:"0 4px 20px rgba(0,0,0,0.22)",
          whiteSpace:"nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      {isDesktop && (
        <aside style={{ width:220, minHeight:"100vh", background:C.sidebarBg,
          borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column",
          padding:"32px 0", position:"sticky", top:0, flexShrink:0 }}>

          {/* Logo */}
          <div style={{ padding:"0 24px 32px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ color:C.accent }}><Icons.Cross /></div>
              <span style={{ fontSize:20, fontWeight:800, color:C.primary }}>GraceNotes</span>
            </div>
            <p style={{ margin:"6px 0 0", fontSize:11, color:C.textLight, fontStyle:"italic" }}>
              A quiet place to meet with God
            </p>
          </div>

          {/* Nav links */}
          <nav style={{ padding:"20px 12px", flex:1 }}>
            {NAV_ITEMS.map(({id,label,I}) => (
              <button key={id} onClick={() => setScreen(id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:12,
                  padding:"11px 14px", borderRadius:12, border:"none", cursor:"pointer",
                  background: screen===id ? C.accentSoft : "transparent",
                  color: screen===id ? C.primary : C.textMuted,
                  fontFamily:"inherit", fontSize:14,
                  fontWeight: screen===id ? 700 : 400,
                  marginBottom:4, transition:"all 0.15s", textAlign:"left" }}>
                <I /> {label}
              </button>
            ))}
          </nav>

          {/* Sidebar footer: dark mode + user */}
          <div style={{ padding:"20px 16px", borderTop:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <span style={{ fontSize:13, color:C.textMuted }}>
                {darkMode ? "Dark" : "Light"} mode
              </span>
              <button onClick={() => setDarkMode(d=>!d)}
                style={{ width:44, height:24, borderRadius:12,
                  background: darkMode ? C.primary : C.border,
                  border:"none", cursor:"pointer", position:"relative", transition:"background 0.25s" }}>
                <div style={{ position:"absolute", top:2, width:20, height:20,
                  left: darkMode ? 22 : 2, borderRadius:"50%", background:"#FFF",
                  transition:"left 0.25s" }} />
              </button>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%",
                background:`linear-gradient(135deg,${C.primary},${C.accent})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, color:"#FFF", fontWeight:700, flexShrink:0 }}>
                {(profile?.name || "G")[0].toUpperCase()}
              </div>
              <div style={{ overflow:"hidden" }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {profile?.name}
                </div>
                <div style={{ fontSize:11, color:C.textLight,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {firebaseUser?.email}
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex:1, display:"flex", flexDirection:"column",
        minHeight: isDesktop ? "100vh" : undefined,
        maxWidth: isDesktop ? "calc(100vw - 220px)" : undefined }}>

        {screen === "dashboard" && (
          <Dashboard C={C} isDesktop={isDesktop} profile={profile} firebaseUser={firebaseUser}
            entries={entries} streak={streak} bestStreak={bestStreak}
            verse={verse} isFav={isFav} toggleFav={toggleFav} setVerseOffset={setVerseOffset}
            journalText={journalText} setJournalText={setJournalText}
            mood={mood} setMood={setMood} savedToday={savedToday}
            saveBusy={saveBusy} handleSave={handleSave}
            darkMode={darkMode} setDarkMode={setDarkMode} />
        )}
        {screen === "history" && (
          <History C={C} isDesktop={isDesktop} entries={entries} bestStreak={bestStreak}
            profile={profile} expanded={expanded} setExpanded={setExpanded} />
        )}
        {screen === "bible" && (
          <BibleReader C={C} isDesktop={isDesktop}
            favorites={profile?.favoriteVerses || []}
            onToggleFav={async (ref, text) => {
              // Reuse the same favorites array in Firestore — saves any verse ref
              if (!firebaseUser) return;
              const current = profile?.favoriteVerses || [];
              const updated = current.includes(ref)
                ? current.filter(v => v !== ref)
                : [...current, ref];
              await setDoc(doc(db, "users", firebaseUser.uid),
                { favoriteVerses: updated }, { merge: true });
              setProfile(prev => ({ ...prev, favoriteVerses: updated }));
            }}
          />
        )}
        {screen === "profile" && (
          <Profile C={C} isDesktop={isDesktop} profile={profile} firebaseUser={firebaseUser}
            entries={entries} streak={streak} bestStreak={bestStreak}
            darkMode={darkMode} setDarkMode={setDarkMode} handleLogout={handleLogout}
            reminderOn={reminderOn} reminderTime={reminderTime}
            enableReminder={enableReminder} disableReminder={disableReminder}
            setReminderTime={setReminderTime} formatTime={formatTime} />
        )}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      {!isDesktop && (
        <nav style={{ position:"fixed", bottom:0, left:0, right:0,
          background:C.navBg, borderTop:`1px solid ${C.border}`,
          display:"flex", justifyContent:"space-around",
          padding:"10px 0 18px",
          boxShadow:`0 -4px 24px rgba(0,0,0,${darkMode?0.4:0.07})`, zIndex:100 }}>
          {NAV_ITEMS.map(({id,label,I}) => (
            <div key={id} onClick={() => setScreen(id)}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                color: screen===id ? C.primary : C.textLight, cursor:"pointer",
                fontSize:11, fontFamily:"sans-serif", fontWeight:screen===id?700:400,
                padding:"4px 22px", transition:"color 0.2s" }}>
              <I />{label}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}