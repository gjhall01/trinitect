'use client';

import type { AppState, DomainScores, Plan, SmsPreferences, UserProfile } from './types';

const KEY = 'trinitect_state';

const defaultState: AppState = {
  profile: {
    name: '',
    values: [],
    primaryGoal: '',
    energyLevel: 3,
    onboarded: false,
  },
  domainScores: { physical: 40, mental: 35, spiritual: 25, metaphysical: 20 },
  todaysPlan: null,
  streak: 0,
  longestStreak: 0,
  lastActiveDate: null,
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

export function updatePlan(plan: Plan): void {
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

export function completedAction(actionId: string): void {
  const state = loadState();
  if (!state.todaysPlan) return;
  const actions = state.todaysPlan.actions.map(a =>
    a.id === actionId ? { ...a, completed: true } : a
  );
  const updatedPlan = { ...state.todaysPlan, actions };

  // Update domain scores when all actions for a domain are complete
  const updatedScores: DomainScores = { ...state.domainScores };
  const domains = ['physical', 'mental', 'spiritual', 'metaphysical'] as const;
  for (const domain of domains) {
    const domainActions = actions.filter(a => a.domain === domain);
    if (domainActions.length > 0 && domainActions.every(a => a.completed)) {
      updatedScores[domain] = Math.min(100, updatedScores[domain] + 8);
    }
  }

  // Streak logic
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
