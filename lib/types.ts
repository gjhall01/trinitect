export type Domain = 'physical' | 'mental' | 'spiritual' | 'metaphysical';

export type DomainScores = Record<Domain, number>; // 0–100

export type Action = {
  id: string;
  domain: Domain;
  title: string;
  duration: number; // minutes
  description: string;
  benefit: string;
  completed: boolean;
};

export type DailyPlan = {
  date: string; // YYYY-MM-DD
  actions: Action[];
};

export type SmsPreferences = {
  loginConfirmation: boolean;
  dailyReminders: boolean;
  milestoneNotifications: boolean;
};

export type UserProfile = {
  name: string;
  values: string[];
  primaryGoal: string;
  energyLevel: number; // 1–5
  onboarded: boolean;
  phone?: string;
  smsPreferences?: SmsPreferences;
  phoneSkipped?: boolean; // user dismissed the save-progress modal
};

export type StageGoal = {
  id: string;
  title: string;
  description: string;
  targetDays: number;
  completedDays: number;
};

export type SubscriptionPlan = 'free' | 'pro';

export type AppState = {
  profile: UserProfile;
  domainScores: DomainScores;
  todaysPlan: DailyPlan | null;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  currentGoal: StageGoal;
  subscriptionPlan: SubscriptionPlan;
};
