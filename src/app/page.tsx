"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

// Disable static prerendering since this is a client-only page that needs browser APIs
export const dynamic = 'force-dynamic';

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

type AppUser = {
  id: string;
  email: string;
};

const faviconCache = new Map<string, string>();

function favicon(domain?: string | null) {
  if (!domain) return null;
  if (faviconCache.has(domain)) return faviconCache.get(domain)!;
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  faviconCache.set(domain, url);
  return url;
}

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setDebouncedValue(value), delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  return useMemo(() => {
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
  }, [text, query]);
}

export default function Home() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
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
  const searchInput = useDebounce(q, 300);
  const searchInputLower = useMemo(() => searchInput.trim().toLowerCase(), [searchInput]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // theme init - load after mount to prevent hydration mismatch
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

  // Surface auth callback messages from /auth/callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("auth");
    if (!status) return;

    if (status === "confirmed") {
      setNotice("Email verified! You're signed in.");
    } else if (status === "callback_error") {
      setError("We couldn't verify your email link. Please try again.");
    } else if (status === "missing_code") {
      setError("The verification link is missing a code.");
    }

    params.delete("auth");
    const next = params.toString();
    const nextUrl = `${window.location.pathname}${next ? `?${next}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement instanceof HTMLInputElement) {
        if ((document.activeElement as HTMLInputElement).className.includes("input")) {
          (document.activeElement as HTMLInputElement).blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const refresh = useCallback(
    async (token?: string) => {
      const authToken = token ?? accessToken;
      if (!authToken) {
        setItems([]);
        return;
      }

      try {
        const res = await fetch("/api/items", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!res.ok) {
          setError("Failed to load items");
          return;
        }
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading items:", err);
        setError("Failed to load items");
      }
    },
    [accessToken]
  );

  useEffect(() => {
    let active = true;

    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error) {
        console.error("Error getting session", error);
        setError("Failed to load session");
        return;
      }

      const session = data.session;
      const nextUser = session?.user
        ? { id: session.user.id, email: session.user.email ?? "Unknown user" }
        : null;
      setUser(nextUser);
      setAccessToken(session?.access_token ?? null);

      if (session?.access_token) {
        refresh(session.access_token);
      } else {
        setItems([]);
      }
    };

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        if (!active) return;
        const nextUser = session?.user
          ? { id: session.user.id, email: session.user.email ?? "Unknown user" }
          : null;
        setUser(nextUser);
        setAccessToken(session?.access_token ?? null);

        if (session?.access_token) {
          refresh(session.access_token);
        } else {
          setItems([]);
        }
      }
    );

    initSession();

    return () => {
      active = false;
      subscription?.subscription.unsubscribe();
    };
  }, [refresh, supabase]);

  const saveItem = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!accessToken) {
      setAuthOpen(true);
      setError("Please log in to save links");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
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
  }, [accessToken, refresh, url]);

  const deleteItem = useCallback(
    (id: string) => {
      if (!accessToken) {
        setAuthOpen(true);
        setError("Please log in to manage items");
        return;
      }

      const prevItems = items;
      setItems((prev) => prev.filter((x) => x.id !== id));

      fetch(`/api/items/${id}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => {
          if (!res.ok) {
            setItems(prevItems);
            setError("Failed to delete item");
          }
        })
        .catch(() => {
          setItems(prevItems);
          setError("Failed to delete item");
        });
    },
    [accessToken, items]
  );

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(null), 2000);
    }).catch(() => {
      setError("Failed to copy");
    });
  }, []);

  const toggleRead = useCallback(
    (id: string, currentState: boolean) => {
      if (!accessToken) {
        setAuthOpen(true);
        setError("Please log in to manage items");
        return;
      }

      const prevItems = items;
      const nextReadAt = !currentState ? new Date().toISOString() : null;

      // Optimistic update
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isRead: !currentState, readAt: nextReadAt } : x))
      );

      fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isRead: !currentState }),
      }).catch(() => {
        // Rollback on error
        setItems(prevItems);
        setError("Failed to update read status");
      });
    },
    [accessToken, items]
  );

  const toggleFavorite = useCallback(
    (id: string, currentState: boolean) => {
      if (!accessToken) {
        setAuthOpen(true);
        setError("Please log in to manage items");
        return;
      }

      const prevItems = items;
      // Optimistic update
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isFavorite: !currentState } : x))
      );

      fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isFavorite: !currentState }),
      }).catch(() => {
        // Rollback on error
        setItems(prevItems);
        setError("Failed to update favorite status");
      });
    },
    [accessToken, items]
  );

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Failed to logout", err);
      setError("Failed to logout, please try again");
    } finally {
      setUser(null);
      setAccessToken(null);
      setItems([]);
    }
  }, [supabase]);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true);
      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setAuthLoading(false);

      if (authError) {
        setError(authError.message);
        return { error: authError.message };
      }

      const session = data.session;
      if (session?.access_token) {
        setAccessToken(session.access_token);
        setUser({ id: session.user.id, email: session.user.email ?? "Unknown user" });
        await refresh(session.access_token);
      }

      setAuthOpen(false);
      return {};
    },
    [refresh, supabase]
  );

  const handleSignup = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true);
      setError(null);
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setAuthLoading(false);

      if (authError) {
        setError(authError.message);
        return { error: authError.message };
      }

      const session = data.session;
      if (session?.access_token) {
        setAccessToken(session.access_token);
        setUser({ id: session.user.id, email: session.user.email ?? "Unknown user" });
        await refresh(session.access_token);
      } else {
        setError("Check your email to confirm your account");
      }

      setAuthOpen(false);
      return {};
    },
    [refresh, supabase]
  );

  const handleForgotPassword = useCallback(
    async (email: string) => {
      setAuthLoading(true);
      setError(null);
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      setAuthLoading(false);

      if (authError) {
        setError(authError.message);
        return { error: authError.message };
      }

      return {};
    },
    [supabase]
  );

  const filtered = useMemo(() => {
    let result = items;

    // Filter by search - early exit if no search
    if (searchInputLower) {
      result = result.filter((it) => {
        const hay = `${it.title ?? ""} ${it.description ?? ""} ${it.domain ?? ""} ${it.url ?? ""}`.toLowerCase();
        return hay.includes(searchInputLower);
      });
    }

    // Sort - avoid spread operator for large lists
    if (sortBy === "title" || sortBy === "domain") {
      return result.sort((a, b) => {
        const aVal = sortBy === "title" ? (a.title ?? "") : (a.domain ?? "");
        const bVal = sortBy === "title" ? (b.title ?? "") : (b.domain ?? "");
        return aVal.localeCompare(bVal);
      });
    }

    if (sortBy === "lastRead") {
      return result.sort((a, b) => 
        new Date(b.readAt ?? 0).getTime() - new Date(a.readAt ?? 0).getTime()
      );
    }

    // Default: sort by date (most recent first)
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [items, searchInputLower, sortBy]);

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
