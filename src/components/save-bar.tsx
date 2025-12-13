"use client";

import { useState } from "react";

type SaveBarProps = {
  onSave: (url: string) => Promise<void>;
  onSearch?: (q: string) => void;
};

export default function SaveBar({ onSave, onSearch }: SaveBarProps) {
  const [url, setUrl] = useState("");

  return (
    <div className="flex gap-2">
      <input
        className="input"
        placeholder="Paste URL"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          onSearch?.(e.target.value);
        }}
      />

      <button
        className="btn btn-primary"
        onClick={() => onSave(url)}
      >
        Save
      </button>
    </div>
  );
}
