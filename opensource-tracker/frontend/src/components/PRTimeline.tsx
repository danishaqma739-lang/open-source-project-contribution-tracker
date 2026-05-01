export function PRTimeline({ prs }: { prs: Array<{ title: string; state: string }> }): JSX.Element {
  return (
    <section className="card">
      <h3>PR Timeline</h3>
      {prs.length === 0 ? <p className="muted">No pull requests found yet. Open your first PR to start the timeline.</p> : null}
      <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
        {prs.map((pr) => (
          <li key={pr.title} style={{ marginBottom: 4 }}>
            {pr.title} - {pr.state}
          </li>
        ))}
      </ul>
    </section>
  );
}
