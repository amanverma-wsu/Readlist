/**
 * Readlist - Main Page
 * A beautiful link saving and reading list app
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic"; // Requires runtime env vars

// Types
type Item = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string | null;
  isRead: boolean;
  isFavorite: boolean;
  createdAt: string;
  readAt: string | null;
};

type SortOption = "date" | "title" | "domain" | "lastRead";
type AppUser = { id: string; email: string };

// Favicon cache to avoid redundant URL generation
const faviconCache = new Map<string, string>();
const getFavicon = (domain?: string | null) => {
  if (!domain) return null;
  if (!faviconCache.has(domain)) {
    faviconCache.set(domain, `https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
  }
  return faviconCache.get(domain)!;
};

/** Debounce hook - delays value updates for search optimization */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setDebounced(value), delay);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [value, delay]);

  return debounced;
}

/** Highlights search query matches in text */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() 
          ? <mark key={i}>{part}</mark> 
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export default function Home() {
  // Initialize Supabase client (singleton)
  const supabase = useMemo(() => {
    try { return createSupabaseBrowserClient(); } 
    catch { return null; }
  }, []);

  // State
  const [items, setItems] = useState<Item[]>([]);
  const [url, setUrl] = useState("");
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Derived state
  const searchQuery = useDebounce(q, 300);
  const searchLower = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  // Theme initialization (after mount to prevent hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial = stored ?? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Handle auth callback messages from email verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("auth");
    if (!status) return;

    if (status === "confirmed") setNotice("Email verified! You're signed in.");
    else if (status === "callback_error") setError("We couldn't verify your email link.");
    else if (status === "missing_code") setError("The verification link is missing a code.");

    // Clean URL
    params.delete("auth");
    window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
  }, []);

  // Keyboard shortcuts (⌘K to focus search)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Fetch user's items from API
  const refresh = useCallback(async (token?: string) => {
    const authToken = token ?? accessToken;
    if (!authToken) { setItems([]); return; }

    try {
      const res = await fetch("/api/items", {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });
      if (res.ok) setItems(await res.json());
      else setError("Failed to load items");
    } catch {
      setError("Failed to load items");
    }
  }, [accessToken]);

  // Initialize session and subscribe to auth changes
  useEffect(() => {
    let active = true;

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const session = data.session;
      const nextUser = session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null;
      setUser(nextUser);
      setAccessToken(session?.access_token ?? null);
      if (session?.access_token) refresh(session.access_token);
      else setItems([]);
    };

    // Listen for auth state changes (login/logout)
    const { data: subscription } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (!active) return;
      const nextUser = session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null;
      setUser(nextUser);
      setAccessToken(session?.access_token ?? null);
      session?.access_token ? refresh(session.access_token) : setItems([]);
    });

    initSession();
    return () => { active = false; subscription?.subscription.unsubscribe(); };
  }, [refresh, supabase]);

  // Save new URL
  const saveItem = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!accessToken) { setAuthOpen(true); setError("Please log in to save links"); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) { setError((await res.json()).error || "Failed to save"); return; }
      setUrl("");
      await refresh();
    } catch {
      setError("Failed to save URL");
    } finally {
      setSaving(false);
    }
  }, [accessToken, refresh, url]);

  // Delete item with optimistic update
  const deleteItem = useCallback((id: string) => {
    if (!accessToken) { setAuthOpen(true); return; }
    const prev = items;
    setItems(items.filter(x => x.id !== id));
    fetch(`/api/items/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } })
      .then(res => { if (!res.ok) { setItems(prev); setError("Failed to delete"); } })
      .catch(() => { setItems(prev); setError("Failed to delete"); });
  }, [accessToken, items]);

  // Copy URL to clipboard
  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  // Toggle read status with optimistic update
  const toggleRead = useCallback((id: string, current: boolean) => {
    if (!accessToken) { setAuthOpen(true); return; }
    const prev = items;
    setItems(items.map(x => x.id === id ? { ...x, isRead: !current, readAt: !current ? new Date().toISOString() : null } : x));
    fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ isRead: !current }),
    }).catch(() => { setItems(prev); setError("Failed to update"); });
  }, [accessToken, items]);

  // Toggle favorite with optimistic update
  const toggleFavorite = useCallback((id: string, current: boolean) => {
    if (!accessToken) { setAuthOpen(true); return; }
    const prev = items;
    setItems(items.map(x => x.id === id ? { ...x, isFavorite: !current } : x));
    fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ isFavorite: !current }),
    }).catch(() => { setItems(prev); setError("Failed to update"); });
  }, [accessToken, items]);

  // Auth handlers
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    setItems([]);
  }, [supabase]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) { setError(error.message); return { error: error.message }; }
    
    if (data.session) {
      setAccessToken(data.session.access_token);
      setUser({ id: data.session.user.id, email: data.session.user.email ?? "" });
      await refresh(data.session.access_token);
    }
    setAuthOpen(false);
    return {};
  }, [refresh, supabase]);

  const handleSignup = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setAuthLoading(false);
    if (error) { setError(error.message); return { error: error.message }; }

    if (data.session) {
      setAccessToken(data.session.access_token);
      setUser({ id: data.session.user.id, email: data.session.user.email ?? "" });
      await refresh(data.session.access_token);
    } else {
      setNotice("Check your email to confirm your account");
    }
    setAuthOpen(false);
    return {};
  }, [refresh, supabase]);

  const handleForgotPassword = useCallback(async (email: string) => {
    setAuthLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    setAuthLoading(false);
    if (error) { setError(error.message); return { error: error.message }; }
    return {};
  }, [supabase]);
  // Filter and sort items
  const filtered = useMemo(() => {
    let result = items;

    // Search filter
    if (searchLower) {
      result = result.filter(it => 
        `${it.title ?? ""} ${it.description ?? ""} ${it.domain ?? ""} ${it.url}`.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (sortBy) {
      case "title": return [...result].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
      case "domain": return [...result].sort((a, b) => (a.domain ?? "").localeCompare(b.domain ?? ""));
      case "lastRead": return [...result].sort((a, b) => new Date(b.readAt ?? 0).getTime() - new Date(a.readAt ?? 0).getTime());
      default: return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [items, searchLower, sortBy]);

  return (
    <div className="page" suppressHydrationWarning>
      <header className="top">
        <div className="brand">
          <div className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/read-svgrepo-com.svg" 
              alt="Readlist" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div>
            <div className="title">Readlist</div>
            <div className="subtitle">Save links. Search fast. Read later.</div>
          </div>
        </div>

        <div className="actions">
          <div className="searchWrap">
            <input
              ref={searchInputRef}
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

          <div className="authButtons">
            {user ? (
              <>
                <span className="userEmail">{user.email}</span>
                <button 
                  className="btn ghost"
                  onClick={handleLogout}
                  title="Logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                className="btn primary"
                onClick={() => setAuthOpen(true)}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="toast error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="toast-close">×</button>
        </div>
      )}

      {notice && (
        <div className="toast success">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="toast-close">×</button>
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
      <div className="filterBar">
        <div className="itemStats">
          {items.length} item{items.length !== 1 ? "s" : ""} saved
          {q.trim() && ` · ${filtered.length} found`}
        </div>
        <select
          className="sortSelect"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="date">Newest first</option>
          <option value="title">By title</option>
          <option value="domain">By domain</option>
          <option value="lastRead">Recently read</option>
        </select>
      </div>
      <main className="grid">
        {filtered.map((it) => (
          <article key={it.id} className="item card">
            <div className="itemBody">
              <div className="metaLine">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="favicon" src={getFavicon(it.domain) ?? ""} alt="" />
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
                <button 
                  className={`btn ghost ${it.isFavorite ? "active" : ""}`}
                  onClick={() => toggleFavorite(it.id, it.isFavorite)}
                  title={it.isFavorite ? "Favorited" : "Favorite"}
                >
                  {it.isFavorite ? "★" : "☆"}
                </button>
                <button 
                  className={`btn ghost ${it.isRead ? "read" : ""}`}
                  onClick={() => toggleRead(it.id, it.isRead)}
                  title={it.isRead ? "Read" : "Unread"}
                >
                  {it.isRead ? "✓" : "○"}
                </button>
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

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onForgotPassword={handleForgotPassword}
        loading={authLoading}
      />
    </div>
  );
}
