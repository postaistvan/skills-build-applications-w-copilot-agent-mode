import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) && Types.ObjectId.isValid(value);
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw badRequest('Activity body must be an object');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw badRequest('A valid userId and teamId are required');
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw badRequest('Activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Activity minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw notFound('User not found');
  if (!team) throw notFound('Team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw badRequest('Team body must be an object');
  const { name, mascot } = input;
  if (typeof name !== 'string' || !name.trim()) {
    throw badRequest('Team name is required');
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw badRequest('Team mascot is required');
  }

  const rawMembers = input.members ?? [];
  if (!Array.isArray(rawMembers) || !rawMembers.every(isObjectId)) {
    throw badRequest('Team members must be valid user IDs');
  }
  const members = await User.find({ _id: { $in: rawMembers } }).select('_id').lean();
  if (members.length !== rawMembers.length) {
    throw badRequest('Every team member must be an existing user');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: rawMembers });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

function activityFocus(type: string) {
  const normalized = type.trim().toLowerCase();
  if (/run|cycl|swim|cardio|endurance/.test(normalized)) return 'endurance';
  if (/strength|weight|resistance/.test(normalized)) return 'strength';
  if (/yoga|stretch|flexib/.test(normalized)) return 'flexibility';
  if (/walk|mobility/.test(normalized)) return 'mobility';
  return normalized;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw notFound('User not found');

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentFocus = recentActivities[0] ? activityFocus(recentActivities[0].type) : '';
  const goalFocus = user.fitnessGoal?.trim() ?? '';
  let focus = goalFocus || recentFocus;
  if (!focus) return [];

  const findByFocus = (value: string) => Workout.find({
    focus: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  }).lean();
  let workouts = await findByFocus(focus);
  if (!workouts.length && recentFocus && recentFocus.toLowerCase() !== focus.toLowerCase()) {
    focus = recentFocus;
    workouts = await findByFocus(focus);
  }
  const recentTypes = [...new Set(recentActivities.map(({ type }) => type))];
  const reason = goalFocus.toLowerCase() === focus.toLowerCase()
    ? recentTypes.length
      ? `Matches your ${focus} goal and recent ${recentTypes.join(', ')} activity.`
      : `Matches your ${focus} fitness goal.`
    : `Recommended based on your recent ${recentTypes.join(', ')} activity.`;
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
