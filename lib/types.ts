export type Domain = 'physical' | 'mental' | 'spiritual';

export type DomainScores = Record<Domain, number>; // 0–100

export type Action = {
  id: string;
  domain: Domain;
  title: string;
  duration: number; // minutes
  description: string;
  benefit: string;
  reflection?: string; // Socratic question — opt-in WHY discovery
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

export type DayRecord = {
  date: string;      // YYYY-MM-DD
  domains: Domain[]; // which domains were fully completed that day
};

export type GoalCategory = 'career' | 'physical' | 'spiritual' | 'relationships' | 'financial' | 'personal';

export type GoalMilestone = {
  id: string;
  text: string;
  completed: boolean;
};

export type Goal = {
  id: string;
  category: GoalCategory;
  title: string;
  outcome: string;
  targetDate: string; // YYYY-MM-DD
  createdAt: string;  // YYYY-MM-DD
  linkedDomains: Domain[];
  milestones: GoalMilestone[];
  archived: boolean;
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
  goals: Goal[];
  history: DayRecord[]; // last 90 days of daily completions
};
