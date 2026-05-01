import { ContributionHeatmap } from "../components/ContributionHeatmap";
import { PRTimeline } from "../components/PRTimeline";
import { dummyContributions, dummyPrTimeline } from "../config/dummyData";

export function ContributionsPage(): JSX.Element {
  return (
    <main style={{ padding: "1rem", display: "grid", gap: 16 }}>
      <h2>Contributions</h2>
      <ContributionHeatmap data={dummyContributions} />
      <PRTimeline prs={dummyPrTimeline} />
    </main>
  );
}
