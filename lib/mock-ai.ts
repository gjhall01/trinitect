import type { Action, DailyPlan, DomainScores, UserProfile } from './types';

const physicalActions: Omit<Action, 'id' | 'completed'>[] = [
  { domain: 'physical', title: '10-min zone 2 walk', duration: 10, description: 'Brisk outdoor walk, conversational pace.', benefit: 'Mitochondrial density, cortisol regulation' },
  { domain: 'physical', title: 'Cold exposure', duration: 3, description: '3-min cold shower or ice immersion, controlled breathing.', benefit: 'Norepinephrine spike, mood elevation, resilience' },
  { domain: 'physical', title: 'Mobility flow', duration: 8, description: 'Hip flexors, thoracic spine, shoulder circles.', benefit: 'Reduced tension, improved posture and energy' },
  { domain: 'physical', title: '20 pushups + 10 squats', duration: 5, description: 'Two sets, bodyweight compound movement.', benefit: 'Testosterone, growth hormone, momentum' },
  { domain: 'physical', title: 'Sleep anchor ritual', duration: 10, description: 'Dim lights, no screens 30min prior, consistent time.', benefit: 'Deep sleep quality, next-day energy baseline' },
  { domain: 'physical', title: '5-min breath reset', duration: 5, description: '4-7-8 breathing or box breathing, 5 cycles.', benefit: 'Vagal tone, HRV, acute stress relief' },
];

const mentalActions: Omit<Action, 'id' | 'completed'>[] = [
  { domain: 'mental', title: '25-min deep focus block', duration: 25, description: 'Single-task, phone away, door closed.', benefit: 'Dopamine from completion, skill compounding' },
  { domain: 'mental', title: 'Read 10 pages', duration: 15, description: 'Non-fiction or philosophy, active margin notes.', benefit: 'Vocabulary, novel connections, idea density' },
  { domain: 'mental', title: 'Brain dump + prioritize', duration: 8, description: 'Write everything in your head, circle top 3.', benefit: 'Working memory freed, reduced cognitive load' },
  { domain: 'mental', title: 'Learn one new concept', duration: 20, description: 'Pick one thing to understand deeply today.', benefit: 'Neural plasticity, mastery identity' },
  { domain: 'mental', title: 'Eliminate one decision', duration: 5, description: 'Automate, delegate, or remove one recurring decision.', benefit: 'Decision fatigue reduction, sustained willpower' },
  { domain: 'mental', title: 'Deliberate practice rep', duration: 15, description: 'Focused repetition of a skill slightly above your edge.', benefit: 'Flow state access, accelerated mastery' },
];

const spiritualActions: Omit<Action, 'id' | 'completed'>[] = [
  { domain: 'spiritual', title: '5-min values reflection', duration: 5, description: 'Am I living in alignment with what matters most today?', benefit: 'Identity coherence, reduced inner conflict' },
  { domain: 'spiritual', title: 'Gratitude — 3 specifics', duration: 3, description: 'Three concrete things, why each matters.', benefit: 'Dopamine, perspective shift, abundance mindset' },
  { domain: 'spiritual', title: 'One act of contribution', duration: 10, description: "Help someone, share insight, or make someone's day easier.", benefit: 'Oxytocin, meaning, virtuous cycle activation' },
  { domain: 'spiritual', title: 'Forgiveness sweep', duration: 5, description: 'Identify any resentment draining energy, consciously release it.', benefit: 'Emotional bandwidth freed, clarity restored' },
  { domain: 'spiritual', title: 'Evening reflection', duration: 7, description: 'What went well? What would I do differently? What am I proud of?', benefit: 'Pattern recognition, self-compassion, growth identity' },
  { domain: 'spiritual', title: 'Connection check-in', duration: 8, description: 'Reach out meaningfully to one person you care about.', benefit: 'Social nourishment, relational depth, belonging' },
];


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

  // If user has a primary goal keyword, bias one action
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
