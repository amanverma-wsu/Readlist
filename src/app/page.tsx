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

function favicon(domain?: string | null) {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [url, setUrl] = useState("");
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const searchInput = useDebounce(q, 300);

  // theme init
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial =
      stored ??
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>(".searchWrap input")?.focus();
      }
      if (e.key === "Escape" && document.activeElement?.className.includes("input")) {
        (document.activeElement as HTMLInputElement).blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function refresh() {
    const res = await fetch("/api/items", { cache: "no-store" });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function saveItem() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save URL");
        return;
      }

      setUrl("");
      await refresh();
    } catch (err) {
      setError("Failed to save URL. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    const prev = items;
    setItems(prev.filter((x) => x.id !== id));

    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(prev);
      setError("Failed to delete item");
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Failed to copy");
    }
  }

  const filtered = useMemo(() => {
    const s = searchInput.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      const hay = [
        it.title ?? "",
        it.description ?? "",
        it.domain ?? "",
        it.url ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [items, searchInput]);

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <div className="logo">R</div>
          <div>
            <div className="title">Readlist</div>
            <div className="subtitle">Save links. Search fast. Read later.</div>
          </div>
        </div>

        <div className="actions">
          <div className="searchWrap">
            <input
              className="input"
              placeholder="Search (title, domain, description)… (⌘K)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span className="toggle-icon">
              {theme === "dark" ? "☀️" : "🌙"}
            </span>
          </button>
        </div>
      </header>

      {error && (
        <div className="toast error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="toast-close">×</button>
        </div>
      )}

      <section className="composer card">
        <div className="composerRow">
          <input
            className="input"
            placeholder="Paste a URL…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveItem();
            }}
          />
          <button className="btn primary" onClick={saveItem} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        <div className="hint">
          Tip: paste any article/blog link — we’ll auto-grab title + preview.
        </div>
      </section>

      <main className="grid">
        {filtered.map((it) => (
          <article key={it.id} className="item card">
            <div className="itemBody">
              <div className="metaLine">
                <img className="favicon" src={favicon(it.domain) ?? ""} alt="" />
                <span className="domain">{it.domain ?? "link"}</span>
                <span className="dot">•</span>
                <span className="time">
                  {new Date(it.createdAt).toLocaleString()}
                </span>
              </div>

              <a className="itemTitle" href={it.url} target="_blank" rel="noreferrer">
                <HighlightText text={it.title ?? it.url} query={q} />
              </a>

              {it.description ? (
                <p className="desc">
                  <HighlightText text={it.description} query={q} />
                </p>
              ) : (
                <p className="desc muted">No description found.</p>
              )}

              <div className="row">
                <a className="btn ghost" href={it.url} target="_blank" rel="noreferrer">
                  Open
                </a>
                <button 
                  className="btn ghost"
                  onClick={() => copyToClipboard(it.url, it.id)}
                  title="Copy URL"
                >
                  {copied === it.id ? "Copied!" : "Copy"}
                </button>
                <button className="btn danger" onClick={() => deleteItem(it.id)}>
                  Delete
                </button>
              </div>
            </div>

            {it.image ? (
              <a className="thumbWrap" href={it.url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="thumb" src={it.image} alt="" />
              </a>
            ) : (
              <div className="thumbWrap placeholder" />
            )}
          </article>
        ))}

        {!filtered.length && (
          <div className="empty card">
            <div className="emptyTitle">No results</div>
            <div className="emptyText">Try a different search or save a new URL.</div>
          </div>
        )}
      </main>
    </div>
  );
}
