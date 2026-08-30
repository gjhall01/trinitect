import type { Action, DailyPlan, DomainScores, UserProfile } from './types';

const physicalActions: Omit<Action, 'id' | 'completed'>[] = [
  {
    domain: 'physical', title: '10-min zone 2 walk', duration: 10,
    description: 'Brisk outdoor walk, conversational pace.',
    benefit: 'Mitochondrial density, cortisol regulation',
    reflection: `Think about the last time a short walk changed your mood. What shifted — and why do you think that happened?`,
  },
  {
    domain: 'physical', title: 'Cold exposure', duration: 3,
    description: '3-min cold shower or immersion, controlled breathing.',
    benefit: 'Norepinephrine spike, mood elevation, resilience',
    reflection: `Notice how you feel 10 minutes after. What changed? Where did you feel it first?`,
  },
  {
    domain: 'physical', title: 'Mobility flow', duration: 8,
    description: 'Hip flexors, thoracic spine, shoulder circles.',
    benefit: 'Reduced tension, improved posture and energy',
    reflection: `Where do you carry tension in your body? Does it show up more on certain types of days?`,
  },
  {
    domain: 'physical', title: '20 pushups + 10 squats', duration: 5,
    description: 'Two sets, bodyweight compound movement.',
    benefit: 'Testosterone, growth hormone, momentum',
    reflection: `How does a quick physical win affect what you tackle next? Is there a pattern there?`,
  },
  {
    domain: 'physical', title: 'Sleep anchor ritual', duration: 10,
    description: 'Dim lights, no screens 30 min prior, consistent time.',
    benefit: 'Deep sleep quality, next-day energy baseline',
    reflection: `What does the version of you running on real sleep look like? How is that person different from how you showed up today?`,
  },
  {
    domain: 'physical', title: '5-min breath reset', duration: 5,
    description: '4-7-8 breathing or box breathing, 5 cycles.',
    benefit: 'Vagal tone, HRV, acute stress relief',
    reflection: `What happens in your body when stress hits? What would change if you had a reliable way to reset it in under 5 minutes?`,
  },
];

const mentalActions: Omit<Action, 'id' | 'completed'>[] = [
  {
    domain: 'mental', title: '25-min deep focus block', duration: 25,
    description: 'Single-task, phone away, door closed.',
    benefit: 'Dopamine from completion, skill compounding',
    reflection: `When did you last finish something and feel genuinely satisfied? What made that possible — and what is usually in the way?`,
  },
  {
    domain: 'mental', title: 'Read 10 pages', duration: 15,
    description: 'Non-fiction or philosophy, active margin notes.',
    benefit: 'Vocabulary, novel connections, idea density',
    reflection: `What idea from something you have read actually changed how you think or act? How long did that take to sink in?`,
  },
  {
    domain: 'mental', title: 'Brain dump + prioritize', duration: 8,
    description: 'Write everything in your head, circle top 3.',
    benefit: 'Working memory freed, reduced cognitive load',
    reflection: `How much energy are you spending just keeping track of things? What would open up if that weight lifted?`,
  },
  {
    domain: 'mental', title: 'Learn one new concept', duration: 20,
    description: 'Pick one thing to understand deeply today.',
    benefit: 'Neural plasticity, mastery identity',
    reflection: `What is something you have always wanted to understand but kept putting off? What is actually stopping you?`,
  },
  {
    domain: 'mental', title: 'Eliminate one decision', duration: 5,
    description: 'Automate, delegate, or remove one recurring decision.',
    benefit: 'Decision fatigue reduction, sustained willpower',
    reflection: `Which decisions are you making over and over that do not need you making them? What would it feel like to just remove one?`,
  },
  {
    domain: 'mental', title: 'Deliberate practice rep', duration: 15,
    description: 'Focused repetition of a skill slightly above your edge.',
    benefit: 'Flow state access, accelerated mastery',
    reflection: `What is one skill where you can actually feel yourself getting better? What does that progress feel like, and when did you last feel it?`,
  },
];

const spiritualActions: Omit<Action, 'id' | 'completed'>[] = [
  {
    domain: 'spiritual', title: '5-min values reflection', duration: 5,
    description: 'Am I living in alignment with what matters most today?',
    benefit: 'Identity coherence, reduced inner conflict',
    reflection: `What did you do today that you would want your future self to know about? What did you do that you would not?`,
  },
  {
    domain: 'spiritual', title: 'Gratitude — 3 specifics', duration: 3,
    description: 'Three concrete things, why each matters.',
    benefit: 'Dopamine, perspective shift, abundance mindset',
    reflection: `What do you take for granted that someone else would give anything to have? What would change if you felt that fully?`,
  },
  {
    domain: 'spiritual', title: 'One act of contribution', duration: 10,
    description: "Help someone, share insight, or make someone's day easier.",
    benefit: 'Oxytocin, meaning, virtuous cycle activation',
    reflection: `When is the last time you did something for someone with no expectation of return? How did it leave you feeling afterward?`,
  },
  {
    domain: 'spiritual', title: 'Forgiveness sweep', duration: 5,
    description: 'Identify any resentment draining energy, consciously release it.',
    benefit: 'Emotional bandwidth freed, clarity restored',
    reflection: `Is there something you are holding onto that is costing you more energy than it is worth? What would it take to set it down?`,
  },
  {
    domain: 'spiritual', title: 'Evening reflection', duration: 7,
    description: 'What went well? What would I do differently? What am I proud of?',
    benefit: 'Pattern recognition, self-compassion, growth identity',
    reflection: `If you could replay today, what is the one thing you would change — and what pattern would that require breaking?`,
  },
  {
    domain: 'spiritual', title: 'Connection check-in', duration: 8,
    description: 'Reach out meaningfully to one person you care about.',
    benefit: 'Social nourishment, relational depth, belonging',
    reflection: `Who in your life makes you feel most like yourself? When did you last actually tell them what they mean to you?`,
  },
];

export function getAllPatterns() {
  return {
    physical: physicalActions,
    mental: mentalActions,
    spiritual: spiritualActions,
  };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function withId(action: Omit<Action, 'id' | 'completed'>): Action {
  return { ...action, id: Math.random().toString(36).slice(2), completed: false };
}

export function generateDailyPlan(profile: UserProfile, scores: DomainScores): DailyPlan {
  const today = new Date().toISOString().split('T')[0];

  const actions: Action[] = [
    withId(pick(physicalActions)),
    withId(pick(mentalActions)),
    withId(pick(spiritualActions)),
  ];

  if (profile.primaryGoal.toLowerCase().includes('focus') || profile.primaryGoal.toLowerCase().includes('work')) {
    actions[1] = withId(pick(mentalActions));
  }

  return { date: today, actions };
}

export function getReplacementSuggestions(trigger: string): string[] {
  const map: Record<string, string[]> = {
    stress: ['5-min box breathing', 'Cold water face immersion', '10-min walk outside', 'Brain dump on paper'],
    boredom: ['Learn one concept for 15 min', 'Movement snack — 20 reps', 'Reach out to someone', 'Read 5 pages'],
    fatigue: ['Hydrate + 10-min walk', 'Nap 20 min (set alarm)', 'Breathwork reset', 'Low-friction task to build momentum'],
    distraction: ["Phone in another room", "Write today's top 3", '25-min Pomodoro', 'Clarify the one thing'],
  };
  const lower = trigger.toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return ['5-min movement', '3 deep breaths', 'Write what you actually need right now', 'Values check-in'];
}
