"use client";

import { useState } from "react";

interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
}

export default function PostForm({
  onCreated,
}: {
  onCreated: (post: Post) => void;
}) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        imageUrl: imageUrl || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onCreated(data);
      setContent("");
      setImageUrl("");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's new?"
        className="w-full border rounded p-2"
      />
      <input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Image URL (optional)"
        className="w-full border rounded p-2"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Post
      </button>
    </form>
  );
}

