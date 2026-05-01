import type { Badge } from "../types";

export function BadgeCard({ badge }: { badge: Badge }): JSX.Element {
  return (
    <article className="card">
      <h4 style={{ marginTop: 0 }}>{badge.badge_name}</h4>
      <p className="muted" style={{ marginBottom: 0 }}>{badge.description}</p>
    </article>
  );
}
