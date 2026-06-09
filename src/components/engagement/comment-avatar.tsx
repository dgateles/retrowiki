function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? p[0]?.[1] ?? "")).toUpperCase();
}

export function CommentAvatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="comment-avatar comment-avatar--img" loading="lazy" />
    );
  }
  return (
    <span className="comment-avatar" aria-hidden="true">
      {initials(name)}
    </span>
  );
}
