"use client";

import { useEffect, useState } from "react";
import PostForm from "./post-form";

interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  _count: { likes: number; comments: number };
}

export default function FeedClient() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }, []);

  const handleCreated = (post: Post) => {
    setPosts((p) => [post, ...p]);
  };

  const toggleLike = async (id: string) => {
    const res = await fetch(`/api/posts/${id}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setPosts((p) =>
        p.map((post) =>
          post.id === id
            ? {
                ...post,
                _count: {
                  ...post._count,
                  likes:
                    post._count.likes + (data.liked ? 1 : post._count.likes > 0 ? -1 : 0),
                },
              }
            : post,
        ),
      );
    }
  };

  return (
    <div className="space-y-4">
      <PostForm onCreated={handleCreated} />
      {posts.map((post) => (
        <div key={post.id} className="border rounded p-4">
          <p>{post.content}</p>
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="mt-2 max-h-64" />
          )}
          <button
            onClick={() => toggleLike(post.id)}
            className="mt-2 text-sm text-blue-600"
          >
            Like ({post._count.likes})
          </button>
        </div>
      ))}
    </div>
  );
}

