"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string | null;
  createdAt: string;
  readAt: string | null;
};

function setTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

export default function AppShell() {
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [theme, setThemeState] = useState<"light" | "dark">("dark");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "light" | "dark" | null) ?? "dark";
    setThemeState(saved);
    setTheme(saved);
  }, []);

  async function load() {
    const res = await fetch("/api/items", { cache: "no-store" });
    const data = (await res.json()) as Item[];
    // newest first
    setItems(data.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  }

  useEffect(() => {
    load();
  }, []);

  async function saveItem() {
    const u = url.trim();
    if (!u) return;

    setSaving(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed to save");
        return;
      }

      setUrl("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      const hay = [
        it.title ?? "",
        it.description ?? "",
        it.domain ?? "",
        it.url ?? "",
      ].join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [items, q]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="logo" />
            <div>
              <h1>Readlist</h1>
              <p>Notion/Pocket-style saves</p>
            </div>
          </div>

          <div className="row" style={{ flex: 1, maxWidth: 520 }}>
            <input
              className="search"
              placeholder="Search by title, domain, URL…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="row">
            <span className="pill">{filtered.length} items</span>
            <button className="btn" onClick={toggleTheme}>
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="row">
          <input
            className="input"
            placeholder="Paste a URL…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveItem();
            }}
          />
          <button className="btn btn-primary" onClick={saveItem} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="grid">
          {filtered.map((it) => (
            <article key={it.id} className="card">
              <div className="thumb">
                {it.image ? <img src={it.image} alt="" /> : null}
              </div>

              <div className="meta">
                <h3>{it.title ?? it.domain ?? it.url}</h3>

                <div className="sub">
                  <span>{it.domain ?? new URL(it.url).hostname}</span>
                  <span>•</span>
                  <span>{new Date(it.createdAt).toLocaleString()}</span>
                </div>

                {it.description ? <div className="desc">{it.description}</div> : null}

                <div className="card-actions">
                  <a className="btn small" href={it.url} target="_blank" rel="noreferrer">
                    Open
                  </a>
                  <button
                    className="btn small"
                    onClick={() => navigator.clipboard.writeText(it.url)}
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
