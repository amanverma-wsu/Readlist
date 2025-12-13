"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  url: string;
  title: string | null;
  image: string | null;
  domain: string | null;
};

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  const filtered = items.filter(
    (i) =>
      i.url.toLowerCase().includes(query.toLowerCase()) ||
      i.domain?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-4 py-2 outline-none"
      />

      <ul className="grid gap-4">
        {filtered.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-xl border border-black/10 dark:border-white/10 p-4 hover:bg-black/5 dark:hover:bg-white/5"
          >
            {item.image && (
              <img
                src={item.image}
                alt=""
                className="h-16 w-24 rounded-md object-cover"
              />
            )}

            <div className="flex-1">
              <a
                href={item.url}
                target="_blank"
                className="font-medium hover:underline"
              >
                {item.title ?? item.url}
              </a>
              <p className="text-sm opacity-60">{item.domain}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
