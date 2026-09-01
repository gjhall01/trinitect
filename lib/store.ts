'use client';

import type { AppState, DailyPlan, Domain, DomainScores, Goal, SmsPreferences, Task, TaskDifficulty, UserProfile } from './types';

const KEY = 'trinitect_state';

// ── Server sync (fire-and-forget, debounced) ──────────────────────────────────

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function queueSync(): void {
  if (typeof window === 'undefined') return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const { syncState } = await import('./api-client');
      const s = loadState();
      await syncState({
        profile: s.profile,
        domainScores: s.domainScores,
        streak: s.streak,
        longestStreak: s.longestStreak,
        lastActiveDate: s.lastActiveDate,
        goals: s.goals,
        tasks: s.tasks,
        history: s.history,
        todaysPlan: s.todaysPlan,
      });
    } catch {
      // Sync failure is non-fatal — data is safe in localStorage
    }
  }, 1500);
}

const defaultState: AppState = {
  profile: {
    name: '',
    values: [],
    primaryGoal: '',
    energyLevel: 3,
    onboarded: false,
  },
  domainScores: { physical: 40, mental: 35, spiritual: 25 },
  todaysPlan: null,
  streak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  subscriptionPlan: 'free',
  goals: [],
  tasks: [],
  history: [],
  currentGoal: {
    id: 'phase0-foundation',
    title: '21-Day Foundation',
    description: 'Complete at least one action in each domain for 21 consecutive days.',
    targetDays: 21,
    completedDays: 0,
  },
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function updateProfile(profile: UserProfile): void {
  const state = loadState();
  saveState({ ...state, profile });
  queueSync();
}

export function updatePlan(plan: DailyPlan): void {
  const state = loadState();
  saveState({ ...state, todaysPlan: plan });
}

export function savePhoneNumber(phone: string, smsPreferences: SmsPreferences): void {
  const state = loadState();
  saveState({ ...state, profile: { ...state.profile, phone, smsPreferences, phoneSkipped: false } });
}

export function skipPhoneCollection(): void {
  const state = loadState();
  saveState({ ...state, profile: { ...state.profile, phoneSkipped: true } });
}

export function addGoal(goalData: Omit<Goal, 'id' | 'createdAt'>): void {
  const state = loadState();
  const newGoal: Goal = {
    ...goalData,
    id: Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString().split('T')[0],
  };
  saveState({ ...state, goals: [...(state.goals || []), newGoal] });
  queueSync();
}

export function updateGoal(goal: Goal): void {
  const state = loadState();
  const goals = (state.goals || []).map(g => g.id === goal.id ? goal : g);
  saveState({ ...state, goals });
  queueSync();
}

export function toggleMilestone(goalId: string, milestoneId: string): void {
  const state = loadState();
  const goals = (state.goals || []).map(g => {
    if (g.id !== goalId) return g;
    return {
      ...g,
      milestones: g.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      ),
    };
  });
  saveState({ ...state, goals });
  queueSync();
}

export function archiveGoal(goalId: string): void {
  const state = loadState();
  const goals = (state.goals || []).map(g =>
    g.id === goalId ? { ...g, archived: true } : g
  );
  saveState({ ...state, goals });
  queueSync();
}

export function restoreGoal(goalId: string): void {
  const state = loadState();
  const goals = (state.goals || []).map(g =>
    g.id === goalId ? { ...g, archived: false } : g
  );
  saveState({ ...state, goals });
  queueSync();
}

export function addTask(goalId: string, title: string): void {
  const state = loadState();
  const newTask: Task = {
    id: Math.random().toString(36).slice(2),
    goalId,
    title,
    completed: false,
    createdAt: new Date().toISOString().split('T')[0],
  };
  saveState({ ...state, tasks: [...(state.tasks || []), newTask] });
  queueSync();
}

export function completeTask(taskId: string, difficulty: TaskDifficulty): void {
  const state = loadState();
  const tasks = (state.tasks || []).map(t =>
    t.id === taskId
      ? { ...t, completed: true, completedAt: new Date().toISOString().split('T')[0], difficulty }
      : t
  );
  saveState({ ...state, tasks });
  queueSync();
}

export function reopenTask(taskId: string): void {
  const state = loadState();
  const tasks = (state.tasks || []).map(t =>
    t.id === taskId ? { ...t, completed: false, completedAt: undefined, difficulty: undefined } : t
  );
  saveState({ ...state, tasks });
  queueSync();
}

export function deleteTask(taskId: string): void {
  const state = loadState();
  const tasks = (state.tasks || []).filter(t => t.id !== taskId);
  saveState({ ...state, tasks });
  queueSync();
}

export function completedAction(actionId: string): void {
  const state = loadState();
  if (!state.todaysPlan) return;
  const actions = state.todaysPlan.actions.map(a =>
    a.id === actionId ? { ...a, completed: true } : a
  );
  const updatedPlan = { ...state.todaysPlan, actions };

  const updatedScores: DomainScores = { ...state.domainScores };
  const domains = ['physical', 'mental', 'spiritual'] as const;
  for (const domain of domains) {
    const domainActions = actions.filter(a => a.domain === domain);
    if (domainActions.length > 0 && domainActions.every(a => a.completed)) {
      updatedScores[domain] = Math.min(100, updatedScores[domain] + 8);
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const allDone = actions.every(a => a.completed);
  let streak = state.streak;
  let longestStreak = state.longestStreak;
  let history = state.history || [];

  if (allDone && state.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    streak = state.lastActiveDate === yStr ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);

    // Record completed domains for today
    const completedDomains = [...new Set(actions.map(a => a.domain))] as Domain[];
    history = [...history.filter(h => h.date !== today), { date: today, domains: completedDomains }].slice(-90);
  } else if (!allDone) {
    // Partial completion — record what's done so far (overwrite if exists)
    const completedDomains = [...new Set(
      actions.filter(a => a.completed).map(a => a.domain)
    )] as Domain[];
    if (completedDomains.length > 0) {
      history = [...history.filter(h => h.date !== today), { date: today, domains: completedDomains }].slice(-90);
    }
  }

  saveState({
    ...state,
    todaysPlan: updatedPlan,
    domainScores: updatedScores,
    streak,
    longestStreak,
    lastActiveDate: allDone ? today : state.lastActiveDate,
    history,
    currentGoal: {
      ...state.currentGoal,
      completedDays: allDone && state.lastActiveDate !== today
        ? state.currentGoal.completedDays + 1
        : state.currentGoal.completedDays,
    },
  });
  queueSync();
}

// ── Server state hydration ────────────────────────────────────────────────────

export async function hydrateFromServer(): Promise<void> {
  try {
    const { getMe } = await import('./api-client');
    const { user } = await getMe();
    if (!user) return;
    const local = loadState();

    // If local user completed onboarding but server hasn't synced yet,
    // keep local profile and let queueSync push it. Server wins in all other cases.
    const serverOnboarded = user.profile?.onboarded === true;
    const localOnboarded = local.profile.onboarded === true;
    const useLocalProfile = localOnboarded && !serverOnboarded;

    const merged: AppState = {
      ...local,
      profile: useLocalProfile ? local.profile : (user.profile ?? local.profile),
      domainScores: user.domainScores ?? local.domainScores,
      streak: user.streak ?? local.streak,
      longestStreak: user.longestStreak ?? local.longestStreak,
      lastActiveDate: user.lastActiveDate ?? local.lastActiveDate,
      goals: user.goals ?? local.goals ?? [],
      tasks: user.tasks ?? local.tasks ?? [],
      history: user.history ?? local.history ?? [],
      todaysPlan: user.todaysPlan ?? local.todaysPlan,
    };
    saveState(merged);

    // If local had more progress, push it up now so server catches up
    if (useLocalProfile) queueSync();
  } catch {
    // Not authenticated or offline — use localStorage
  }
}
