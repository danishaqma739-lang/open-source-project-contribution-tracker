export function KpiCards({ kpis }: { kpis: Record<string, number> }): JSX.Element {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
      {Object.entries(kpis).map(([label, value]) => (
        <article key={label} className="card">
          <p className="muted" style={{ marginBottom: 6 }}>{label}</p>
          <h3 style={{ margin: 0 }}>{value}</h3>
        </article>
      ))}
    </section>
  );
}
