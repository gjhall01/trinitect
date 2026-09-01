export type Domain = 'physical' | 'mental' | 'spiritual';

export type DomainScores = Record<Domain, number>; // 0–100

// Semantic themes that cross-link patterns to goal categories
export type PatternTheme =
  | 'trust'       // faith, safety, reliance on something beyond yourself
  | 'faith'       // belief and action despite uncertainty
  | 'discipline'  // consistent follow-through on what matters
  | 'focus'       // single-task attention, resisting distraction
  | 'energy'      // physical vitality, output capacity
  | 'resilience'  // recovering and adapting under pressure
  | 'purpose'     // meaning, direction, the deeper why
  | 'clarity'     // mental space, decision quality
  | 'gratitude'   // appreciation, abundance orientation
  | 'forgiveness' // releasing resentment, healing resistance
  | 'connection'  // relationships, belonging, reaching out
  | 'identity'    // who you are becoming through your choices
  | 'avoidance'   // breaking procrastination and resistance patterns
  | 'regulation'; // stress response, emotional steadiness

export type Action = {
  id: string;
  domain: Domain;
  title: string;
  duration: number; // minutes
  description: string;
  benefit: string;
  reflection?: string;  // Socratic question — opt-in WHY discovery
  themes?: PatternTheme[]; // semantic tags for goal-matching (optional for back-compat)
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
  lastName?: string;
  email?: string;
  values: string[];
  primaryGoal: string;
  energyLevel: number; // 1–5
  onboarded: boolean;
  phone?: string;
  smsPreferences?: SmsPreferences;
  phoneSkipped?: boolean;
  commitmentDeclaration?: string;
  notLookingBack?: boolean;
  onboardingPath?: 'declared' | 'exploring';
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

export type TaskDifficulty = 'smooth' | 'hard' | 'avoided';

export type Task = {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  difficulty?: TaskDifficulty;
  createdAt: string;
};

export type SubscriptionPlan = 'free' | 'pro';

export type PatternJournalEntry = {
  date: string;        // YYYY-MM-DD
  actionId: string;
  actionTitle: string;
  domain: Domain;
  question: string;    // the Socratic reflection question shown
  response: string;    // user's written response
};

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
  tasks: Task[];
  history: DayRecord[];
  journal: PatternJournalEntry[];
};
