import type { Action, DailyPlan, Domain, DomainScores, Goal, GoalCategory, PatternTheme, UserProfile } from './types';

type PatternTemplate = Omit<Action, 'id' | 'completed'>;

// ── Semantic theme → goal category mapping ────────────────────────────────────
// This is the intelligence layer. Goal categories map to the themes that drive
// real transformation in that area. Patterns are then matched to goals by theme overlap.

export const GOAL_CATEGORY_THEMES: Record<GoalCategory, PatternTheme[]> = {
  career:        ['focus', 'discipline', 'avoidance', 'identity', 'clarity'],
  physical:      ['energy', 'resilience', 'discipline', 'regulation'],
  spiritual:     ['trust', 'faith', 'gratitude', 'forgiveness', 'purpose'],
  relationships: ['connection', 'trust', 'forgiveness', 'gratitude'],
  financial:     ['discipline', 'avoidance', 'trust', 'clarity'],
  personal:      ['identity', 'clarity', 'purpose', 'regulation'],
};

// ── Pattern library ───────────────────────────────────────────────────────────
// Each pattern carries semantic themes that determine when it gets recommended.
// A spiritual goal about faith → forgiveness sweep and gratitude score highest.
// A career goal about avoidance → brain dump and focus block score highest.

const physicalActions: PatternTemplate[] = [
  {
    domain: 'physical', title: '10-min zone 2 walk', duration: 10,
    themes: ['energy', 'regulation', 'clarity'],
    description: 'Brisk outdoor walk, conversational pace.',
    benefit: 'Mitochondrial density, cortisol regulation',
    reflection: `Think about the last time a short walk changed your mood. What shifted — and why do you think that happened?`,
  },
  {
    domain: 'physical', title: 'Cold exposure', duration: 3,
    themes: ['resilience', 'discipline', 'regulation'],
    description: '3-min cold shower or immersion, controlled breathing.',
    benefit: 'Norepinephrine spike, mood elevation, resilience',
    reflection: `Notice how you feel 10 minutes after. What changed? Where did you feel it first?`,
  },
  {
    domain: 'physical', title: 'Mobility flow', duration: 8,
    themes: ['energy', 'regulation', 'clarity'],
    description: 'Hip flexors, thoracic spine, shoulder circles.',
    benefit: 'Reduced tension, improved posture and energy',
    reflection: `Where do you carry tension in your body? Does it show up more on certain types of days?`,
  },
  {
    domain: 'physical', title: '20 pushups + 10 squats', duration: 5,
    themes: ['discipline', 'energy', 'identity'],
    description: 'Two sets, bodyweight compound movement.',
    benefit: 'Testosterone, growth hormone, momentum',
    reflection: `How does a quick physical win affect what you tackle next? Is there a pattern there?`,
  },
  {
    domain: 'physical', title: 'Sleep anchor ritual', duration: 10,
    themes: ['discipline', 'energy', 'regulation'],
    description: 'Dim lights, no screens 30 min prior, consistent time.',
    benefit: 'Deep sleep quality, next-day energy baseline',
    reflection: `What does the version of you running on real sleep look like? How is that person different from how you showed up today?`,
  },
  {
    domain: 'physical', title: '5-min breath reset', duration: 5,
    themes: ['regulation', 'trust', 'clarity'],
    description: '4-7-8 breathing or box breathing, 5 cycles.',
    benefit: 'Vagal tone, HRV, acute stress relief',
    reflection: `What happens in your body when stress hits? What would change if you had a reliable way to reset it in under 5 minutes?`,
  },
];

const mentalActions: PatternTemplate[] = [
  {
    domain: 'mental', title: '25-min deep focus block', duration: 25,
    themes: ['focus', 'discipline', 'avoidance'],
    description: 'Single-task, phone away, door closed.',
    benefit: 'Dopamine from completion, skill compounding',
    reflection: `When did you last finish something and feel genuinely satisfied? What made that possible — and what is usually in the way?`,
  },
  {
    domain: 'mental', title: 'Read 10 pages', duration: 15,
    themes: ['identity', 'clarity', 'purpose'],
    description: 'Non-fiction or philosophy, active margin notes.',
    benefit: 'Vocabulary, novel connections, idea density',
    reflection: `What idea from something you have read actually changed how you think or act? How long did that take to sink in?`,
  },
  {
    domain: 'mental', title: 'Brain dump + prioritize', duration: 8,
    themes: ['clarity', 'avoidance', 'focus'],
    description: 'Write everything in your head, circle top 3.',
    benefit: 'Working memory freed, reduced cognitive load',
    reflection: `How much energy are you spending just keeping track of things? What would open up if that weight lifted?`,
  },
  {
    domain: 'mental', title: 'Learn one new concept', duration: 20,
    themes: ['identity', 'purpose', 'discipline'],
    description: 'Pick one thing to understand deeply today.',
    benefit: 'Neural plasticity, mastery identity',
    reflection: `What is something you have always wanted to understand but kept putting off? What is actually stopping you?`,
  },
  {
    domain: 'mental', title: 'Eliminate one decision', duration: 5,
    themes: ['clarity', 'discipline', 'focus'],
    description: 'Automate, delegate, or remove one recurring decision.',
    benefit: 'Decision fatigue reduction, sustained willpower',
    reflection: `Which decisions are you making over and over that do not need you making them? What would it feel like to just remove one?`,
  },
  {
    domain: 'mental', title: 'Deliberate practice rep', duration: 15,
    themes: ['identity', 'discipline', 'resilience'],
    description: 'Focused repetition of a skill slightly above your edge.',
    benefit: 'Flow state access, accelerated mastery',
    reflection: `What is one skill where you can actually feel yourself getting better? What does that progress feel like, and when did you last feel it?`,
  },
];

const spiritualActions: PatternTemplate[] = [
  {
    domain: 'spiritual', title: '5-min values reflection', duration: 5,
    themes: ['purpose', 'identity', 'trust'],
    description: 'Am I living in alignment with what matters most today?',
    benefit: 'Identity coherence, reduced inner conflict',
    reflection: `What did you do today that you would want your future self to know about? What did you do that you would not?`,
  },
  {
    domain: 'spiritual', title: 'Gratitude — 3 specifics', duration: 3,
    themes: ['gratitude', 'trust', 'clarity'],
    description: 'Three concrete things, why each matters.',
    benefit: 'Dopamine, perspective shift, abundance mindset',
    reflection: `What do you take for granted that someone else would give anything to have? What would change if you felt that fully?`,
  },
  {
    domain: 'spiritual', title: 'One act of contribution', duration: 10,
    themes: ['connection', 'purpose', 'gratitude'],
    description: "Help someone, share insight, or make someone's day easier.",
    benefit: 'Oxytocin, meaning, virtuous cycle activation',
    reflection: `When is the last time you did something for someone with no expectation of return? How did it leave you feeling afterward?`,
  },
  {
    domain: 'spiritual', title: 'Forgiveness sweep', duration: 5,
    themes: ['forgiveness', 'trust', 'clarity'],
    description: 'Identify any resentment draining energy, consciously release it.',
    benefit: 'Emotional bandwidth freed, clarity restored',
    reflection: `Is there something you are holding onto that is costing you more energy than it is worth? What would it take to set it down?`,
  },
  {
    domain: 'spiritual', title: 'Evening reflection', duration: 7,
    themes: ['clarity', 'identity', 'purpose'],
    description: 'What went well? What would I do differently? What am I proud of?',
    benefit: 'Pattern recognition, self-compassion, growth identity',
    reflection: `If you could replay today, what is the one thing you would change — and what pattern would that require breaking?`,
  },
  {
    domain: 'spiritual', title: 'Connection check-in', duration: 8,
    themes: ['connection', 'gratitude', 'trust'],
    description: 'Reach out meaningfully to one person you care about.',
    benefit: 'Social nourishment, relational depth, belonging',
    reflection: `Who in your life makes you feel most like yourself? When did you last actually tell them what they mean to you?`,
  },
];

// ── Driver → theme mapping ────────────────────────────────────────────────────
// Maps the 12 onboarding drivers to their semantic themes.
// Used to personalize the practice preview in onboarding before any goal is set.

export const DRIVER_THEMES: Record<string, PatternTheme[]> = {
  Vitality:   ['energy', 'resilience', 'regulation'],
  Clarity:    ['clarity', 'focus', 'avoidance'],
  Mastery:    ['identity', 'discipline', 'focus'],
  Meaning:    ['purpose', 'trust', 'identity'],
  Freedom:    ['clarity', 'avoidance', 'regulation'],
  Connection: ['connection', 'gratitude', 'trust'],
  Discipline: ['discipline', 'focus', 'resilience'],
  Creativity: ['clarity', 'identity', 'purpose'],
  Wisdom:     ['purpose', 'clarity', 'identity'],
  Impact:     ['purpose', 'discipline', 'connection'],
  Growth:     ['identity', 'resilience', 'discipline'],
  Peace:      ['regulation', 'trust', 'forgiveness'],
};

// ── Recommendation engine ─────────────────────────────────────────────────────

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function scorePattern(pattern: PatternTemplate, goalThemes: PatternTheme[]): number {
  return (pattern.themes || []).filter(t => goalThemes.includes(t)).length;
}

// Picks best-matching pattern for the current goal themes, rotating among
// equally-scored patterns by day so users don't get the same thing every day.
function bestMatch(patterns: PatternTemplate[], goalThemes: PatternTheme[]): PatternTemplate {
  if (goalThemes.length === 0) {
    return patterns[dayOfYear() % patterns.length];
  }

  const scored = patterns
    .map(p => ({ p, score: scorePattern(p, goalThemes) }))
    .sort((a, b) => b.score - a.score);

  const topScore = scored[0].score;
  if (topScore === 0) {
    return patterns[dayOfYear() % patterns.length];
  }

  const topTier = scored.filter(s => s.score === topScore).map(s => s.p);
  return topTier[dayOfYear() % topTier.length];
}

function withId(template: PatternTemplate): Action {
  return { ...template, id: Math.random().toString(36).slice(2), completed: false };
}

// ── Public API ────────────────────────────────────────────────────────────────

// Generates a practice preview for the onboarding "taste of value" step,
// matched to the drivers the user selected before any goal/commitment exists.
export function generatePracticePreview(drivers: string[]): Action[] {
  const themes = drivers.flatMap(d => DRIVER_THEMES[d] || []);
  return [
    withId(bestMatch(physicalActions, themes)),
    withId(bestMatch(mentalActions, themes)),
    withId(bestMatch(spiritualActions, themes)),
  ];
}

export function getAllPatterns() {
  return {
    physical: physicalActions,
    mental: mentalActions,
    spiritual: spiritualActions,
  };
}

// Goal-aware daily plan. When the user has active goals, patterns are chosen
// by matching their semantic themes to the goal's category themes.
// "Spiritual goal about faith → Forgiveness sweep + Gratitude today."
// When no goals exist, falls back to driver themes so patterns still feel personal.
export function generateDailyPlan(
  profile: UserProfile,
  scores: DomainScores,
  goals: Goal[] = [],
): DailyPlan {
  const today = new Date().toISOString().split('T')[0];
  const activeGoals = goals.filter(g => !g.archived);
  const goalThemes = activeGoals.flatMap(g => GOAL_CATEGORY_THEMES[g.category]);

  // Fall back to driver themes so new users get patterns matched to their values
  const driverThemes = (profile.values || []).flatMap(d => DRIVER_THEMES[d] || []);
  const themes = goalThemes.length > 0 ? goalThemes : driverThemes;

  return {
    date: today,
    actions: [
      withId(bestMatch(physicalActions, themes)),
      withId(bestMatch(mentalActions, themes)),
      withId(bestMatch(spiritualActions, themes)),
    ],
  };
}

// Returns the best pattern match per domain for a given goal, with explanation.
// Used in Plan page ("why this pattern") and task difficulty response.
export type PatternRecommendation = {
  pattern: PatternTemplate;
  matchedThemes: PatternTheme[];
  explanation: string;
};

function themeLabel(theme: PatternTheme): string {
  const labels: Record<PatternTheme, string> = {
    trust: 'builds trust', faith: 'strengthens faith', discipline: 'builds discipline',
    focus: 'sharpens focus', energy: 'restores energy', resilience: 'builds resilience',
    purpose: 'reconnects with purpose', clarity: 'clears mental space',
    gratitude: 'opens gratitude', forgiveness: 'releases resistance',
    connection: 'deepens connection', identity: 'reinforces identity',
    avoidance: 'breaks avoidance patterns', regulation: 'steadies your emotional state',
  };
  return labels[theme] || theme;
}

export function getGoalPatternSuggestions(
  category: GoalCategory,
  context: 'hard' | 'avoided',
): PatternRecommendation[] {
  const goalThemes = GOAL_CATEGORY_THEMES[category];
  const allPatterns = [...physicalActions, ...mentalActions, ...spiritualActions];

  const scored = allPatterns
    .map(p => {
      const matched = (p.themes || []).filter(t => goalThemes.includes(t));
      return { p, matched, score: matched.length };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // One per domain, top 3
  const result: PatternRecommendation[] = [];
  const usedDomains = new Set<string>();

  for (const { p, matched } of scored) {
    if (!usedDomains.has(p.domain) && result.length < 3) {
      const topTheme = matched[0];
      result.push({
        pattern: p,
        matchedThemes: matched,
        explanation: topTheme ? themeLabel(topTheme) : '',
      });
      usedDomains.add(p.domain);
    }
  }

  return result;
}

// For the Plan page — given today's actions + active goals, explains why
// each pattern was chosen.
export function explainPattern(
  action: Action,
  goals: Goal[],
): { goalTitle: string; matchedThemes: PatternTheme[] } | null {
  const actionThemes = action.themes || [];
  if (actionThemes.length === 0) return null;

  const activeGoals = goals.filter(g => !g.archived);
  let bestGoal: Goal | null = null;
  let bestMatches: PatternTheme[] = [];

  for (const goal of activeGoals) {
    const goalThemes = GOAL_CATEGORY_THEMES[goal.category];
    const matched = actionThemes.filter(t => goalThemes.includes(t));
    if (matched.length > bestMatches.length) {
      bestMatches = matched;
      bestGoal = goal;
    }
  }

  if (!bestGoal || bestMatches.length === 0) return null;
  return { goalTitle: bestGoal.title, matchedThemes: bestMatches };
}

// Returns up to 3 alternative patterns for the same domain, excluding the current one.
// Used for the per-card swap feature on the Today page.
export function getAlternativesForDomain(
  domain: Domain,
  excludeTitle: string,
  goalThemes: PatternTheme[] = [],
): PatternTemplate[] {
  const pool = domain === 'physical' ? physicalActions
    : domain === 'mental' ? mentalActions
    : spiritualActions;

  const candidates = pool.filter(p => p.title !== excludeTitle);

  if (goalThemes.length > 0) {
    // Sort by theme match, then rotate by day for variety
    const scored = candidates
      .map(p => ({ p, score: scorePattern(p, goalThemes) }))
      .sort((a, b) => b.score !== a.score ? b.score - a.score : 0);
    return scored.slice(0, 3).map(s => s.p);
  }

  // No themes — rotate 3 starting from today's offset to add variety
  const offset = dayOfYear() % candidates.length;
  const rotated = [...candidates.slice(offset), ...candidates.slice(0, offset)];
  return rotated.slice(0, 3);
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

// ── Personalized "why this for you" explanation ───────────────────────────────
// Connects the action's themes to the user's specific drivers.
// Returns a 1-sentence insight, or null if no overlap found.

const THEME_DRIVER_COPY: Partial<Record<PatternTheme, Partial<Record<string, string>>>> = {
  focus: {
    Mastery:    'Focus sessions are how expertise compounds — this is Mastery in practice.',
    Clarity:    'Single-task focus is the foundation of the mental clarity you\'re building.',
    Discipline: 'Focused blocks are discipline in its most concrete form.',
    Freedom:    'Protected focus time is how you reclaim your calendar from distraction.',
  },
  discipline: {
    Discipline: 'Discipline is doing it when you don\'t feel like it. That\'s today.',
    Mastery:    'Consistent practice is how mastery accumulates — one session at a time.',
    Growth:     'Growth happens in the daily reps nobody sees. This is one of them.',
    Impact:     'Sustainable impact runs on discipline, not motivation.',
  },
  energy: {
    Vitality:   'This directly builds the physical vitality you named.',
    Growth:     'Physical energy is infrastructure — everything runs better when this is strong.',
    Discipline: 'High energy makes discipline effortless. This is the foundation.',
  },
  resilience: {
    Discipline: 'Resilience is discipline\'s foundation — this builds both.',
    Vitality:   'Physical resilience compounds. Each session raises your baseline.',
    Growth:     'Stress + recovery is the growth equation. This is the recovery side.',
  },
  purpose: {
    Meaning:    'This connects to your why — the source of meaning you named.',
    Wisdom:     'Reflection and purpose compound together. This builds both.',
    Impact:     'Clarity of purpose is what makes impact sustainable.',
    Growth:     'Growth without purpose is just motion. This pattern anchors the direction.',
  },
  clarity: {
    Clarity:    'Mental clarity is your core driver — this removes the noise.',
    Freedom:    'Clear thinking is how you reclaim your time and attention.',
    Wisdom:     'Wisdom requires clarity first. This creates the space for it.',
    Mastery:    'Clarity lets you work on what matters most — a prerequisite for Mastery.',
  },
  identity: {
    Mastery:    'Each rep builds the identity of someone who does this. That\'s Mastery.',
    Growth:     'Identity is built in the daily choices. This is one of them.',
    Discipline: 'Discipline is an identity, not just a behavior. This reinforces it.',
    Creativity: 'Creative identity is built in the practice, not the inspiration.',
  },
  connection: {
    Connection: 'Relationships compound just like patterns do. This is relational investment.',
    Impact:     'The relationships you invest in amplify everything else you\'re building.',
  },
  regulation: {
    Peace:      'Regulation is how peace becomes accessible under pressure.',
    Vitality:   'A regulated nervous system is the foundation of physical vitality.',
    Freedom:    'Stress regulation is how you reclaim energy and mental bandwidth.',
  },
  trust: {
    Peace:      'Trust is how anxiety releases. This pattern builds that capacity.',
    Meaning:    'Meaning requires trusting that your effort compounds. This reinforces both.',
    Connection: 'Trust is what transforms relationships from surface-level to real.',
  },
  gratitude: {
    Connection: 'Gratitude deepens connection — it\'s the foundation of real relationships.',
    Peace:      'Gratitude is the most direct path to the peace you\'re building.',
    Meaning:    'Noticing what\'s real is how meaning becomes visible.',
  },
  forgiveness: {
    Peace:      'Forgiveness is the fastest way to free up the bandwidth peace requires.',
    Freedom:    'Resentment costs energy. This releases it.',
  },
  avoidance: {
    Freedom:    'Breaking avoidance is how you reclaim your time and energy.',
    Clarity:    'Avoidance is clarity\'s enemy. This pattern breaks the loop.',
    Discipline: 'Avoidance is what discipline is trained to override.',
  },
};

export function getPersonalizedExplanation(
  action: Action,
  drivers: string[],
): { driver: string; text: string } | null {
  const actionThemes = action.themes || [];
  if (actionThemes.length === 0 || drivers.length === 0) return null;

  for (const driver of drivers) {
    const driverThemes = DRIVER_THEMES[driver] || [];
    for (const theme of actionThemes) {
      if (driverThemes.includes(theme)) {
        const copy = THEME_DRIVER_COPY[theme]?.[driver]
          ?? THEME_DRIVER_COPY[theme]?.[Object.keys(THEME_DRIVER_COPY[theme] || {})[0]];
        if (copy) return { driver, text: copy };
      }
    }
  }
  return null;
}
