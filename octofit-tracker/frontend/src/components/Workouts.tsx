import { useApiData } from '../hooks/useApiData.js';

type WorkoutSuggestion = {
  _id?: string;
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
};

export default function Workouts() {
  const userEmail = 'mona@example.com';
  const state = useApiData<{ suggestions: WorkoutSuggestion[] }>(
    `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`,
  );
  return (
    <section aria-labelledby="workouts-heading">
      <h2 id="workouts-heading">Workout suggestions</h2>
      <p>Recommend workouts from activity patterns.</p>
      {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
      {state.status === 'error' && <p role="alert">Unable to load workout suggestions: {state.message}</p>}
      {state.status === 'success' && (state.data.suggestions.length === 0
        ? <p>No workout suggestions yet.</p>
        : <ul className="list-group">
            {state.data.suggestions.map((workout) => (
              <li className="list-group-item" key={workout._id ?? workout.title}>
                <strong>{workout.title}</strong>: {workout.focus}, {workout.minutes} minutes ({workout.difficulty}).
                {' '}{workout.reason}
              </li>
            ))}
          </ul>)}
    </section>
  );
}
