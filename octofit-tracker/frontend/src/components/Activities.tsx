import { useApiData } from '../hooks/useApiData.js';

type Activity = {
  _id?: string;
  type: string;
  minutes: number;
  points: number;
  occurredAt: string;
};

export default function Activities() {
  const state = useApiData<{ activities: Activity[] }>('/api/activities');
  return (
    <section aria-labelledby="activities-heading">
      <h2 id="activities-heading">Activities</h2>
      <p>Track student activity minutes and points.</p>
      {state.status === 'loading' && <p role="status">Loading activities...</p>}
      {state.status === 'error' && <p role="alert">Unable to load activities: {state.message}</p>}
      {state.status === 'success' && (state.data.activities.length === 0
        ? <p>No activities yet.</p>
        : <ul className="list-group">
            {state.data.activities.map((activity, index) => (
              <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
                <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
              </li>
            ))}
          </ul>)}
    </section>
  );
}
