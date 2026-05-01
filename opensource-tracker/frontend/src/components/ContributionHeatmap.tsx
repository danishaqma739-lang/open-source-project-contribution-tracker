export function ContributionHeatmap({
  data,
}: {
  data: Array<{ date: string; pr_count: number; commit_count: number }>;
}): JSX.Element {
  return (
    <section className="card">
      <h3>Contribution Heatmap</h3>
      {data.length === 0 ? <p className="muted">No contribution data available yet.</p> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 6 }}>
        {data.slice(0, 30).map((item) => (
          <div key={item.date} style={{ background: "#bbf7d0", minHeight: 24, borderRadius: 6 }} title={`${item.date}: ${item.commit_count} commits`} />
        ))}
      </div>
    </section>
  );
}
