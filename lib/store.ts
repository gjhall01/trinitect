'use client';

import type { AppState, DailyPlan, DomainScores, Goal, SmsPreferences, UserProfile } from './types';

const KEY = 'trinitect_state';

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
}

export function updateGoal(goal: Goal): void {
  const state = loadState();
  const goals = (state.goals || []).map(g => g.id === goal.id ? goal : g);
  saveState({ ...state, goals });
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
}

export function archiveGoal(goalId: string): void {
  const state = loadState();
  const goals = (state.goals || []).map(g =>
    g.id === goalId ? { ...g, archived: true } : g
  );
  saveState({ ...state, goals });
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
  if (allDone && state.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    streak = state.lastActiveDate === yStr ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);
  }

  saveState({
    ...state,
    todaysPlan: updatedPlan,
    domainScores: updatedScores,
    streak,
    longestStreak,
    lastActiveDate: allDone ? today : state.lastActiveDate,
    currentGoal: {
      ...state.currentGoal,
      completedDays: allDone && state.lastActiveDate !== today
        ? state.currentGoal.completedDays + 1
        : state.currentGoal.completedDays,
    },
  });
}
