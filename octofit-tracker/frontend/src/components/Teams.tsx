import { useApiData } from '../hooks/useApiData.js';

type Team = {
  _id?: string;
  name: string;
  mascot: string;
  members: string[];
};

export default function Teams() {
  const state = useApiData<{ teams: Team[] }>('/api/teams');
  return (
    <section aria-labelledby="teams-heading">
      <h2 id="teams-heading">Teams</h2>
      <p>Manage teams and members.</p>
      {state.status === 'loading' && <p role="status">Loading teams...</p>}
      {state.status === 'error' && <p role="alert">Unable to load teams: {state.message}</p>}
      {state.status === 'success' && (state.data.teams.length === 0
        ? <p>No teams yet.</p>
        : <ul className="list-group">
            {state.data.teams.map((team) => (
              <li className="list-group-item" key={team._id ?? team.name}>
                <strong>{team.name}</strong> ({team.mascot}) — {team.members.length} members
              </li>
            ))}
          </ul>)}
    </section>
  );
}
