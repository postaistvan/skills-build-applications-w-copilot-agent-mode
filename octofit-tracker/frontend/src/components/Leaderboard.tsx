import { useApiData } from '../hooks/useApiData.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const state = useApiData<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
  return (
    <section aria-labelledby="leaderboard-heading">
      <h2 id="leaderboard-heading">Leaderboard</h2>
      <p>Compare team point totals.</p>
      {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
      {state.status === 'error' && <p role="alert">Unable to load leaderboard: {state.message}</p>}
      {state.status === 'success' && (state.data.leaderboard.length === 0
        ? <p>No leaderboard rankings yet.</p>
        : <ol className="list-group list-group-numbered">
            {state.data.leaderboard.map((entry) => (
              <li className="list-group-item" key={entry.rank}>
                <strong>{entry.teamName}</strong>: {entry.totalPoints} points
              </li>
            ))}
          </ol>)}
    </section>
  );
}
