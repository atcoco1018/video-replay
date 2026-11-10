import type { ClaimSide, Topic } from '../types';

export const TOPICS: Topic[] = [
  { slug: 'transport', name: 'Transport', description: 'How people and goods get around.' },
  { slug: 'cities', name: 'Cities', description: 'Streets, centres and the people who live in them.' },
  { slug: 'climate', name: 'Climate', description: 'Emissions, air and the cost of warming.' },
  { slug: 'health', name: 'Health', description: 'Bodies, minds and the habits that shape them.' },
  { slug: 'work', name: 'Work', description: 'Jobs, teams and where the work gets done.' },
  { slug: 'technology', name: 'Technology', description: 'The tools that change how things are done.' },
  { slug: 'economy', name: 'Economy', description: 'Money, trade and who pays for what.' },
  { slug: 'housing', name: 'Housing', description: 'Where people can afford to live.' },
  { slug: 'education', name: 'Education', description: 'Schools, learning and what children need.' },
  { slug: 'family', name: 'Family', description: 'Home life and the time people share.' },
];

type SideFragments = { openers: string[]; points: string[] };

/**
 * What each debate's claims are built from: an opener and a point, put together at random. Keyed by
 * debate id; each debate's topics are the ones its claims are filed under.
 */
export const DEBATE_TEMPLATES: Record<string, { topicSlugs: string[] } & Record<ClaimSide, SideFragments>> = {
  d1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6: {
    topicSlugs: ['transport', 'cities', 'climate', 'health', 'economy'],
    for: {
      openers: [
        'The evidence is clear:',
        'Look at any city that tried it:',
        'Put simply,',
        'Every survey says',
        'In the long run,',
      ],
      points: [
        'fewer cars means cleaner air in the streets people walk',
        'shops on car-free streets see more customers, not fewer',
        'buses run on time once they stop queuing behind traffic',
        'children can walk to school without crossing four lanes',
        'the space freed from parking becomes parks and cafés',
        'noise drops enough that people sleep with the windows open',
        'cycling grows fastest where it feels safe',
        'road deaths in the centre fall to almost nothing',
      ],
    },
    against: {
      openers: [
        'The trouble is,',
        'For people outside the centre,',
        'Realistically,',
        'Talk to any trader:',
        'Before banning anything,',
      ],
      points: [
        'deliveries still need vans, and vans need streets',
        'older and disabled people depend on being dropped at the door',
        'traffic does not vanish, it moves to the next neighbourhood',
        'night-shift workers have no bus that runs when they finish',
        'small shops lose the customers who drive in from the suburbs',
        'a ban without better transit just punishes people',
        'tradespeople cannot carry their tools on a bike',
        'the centre empties out after the offices close',
      ],
    },
  },
  e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2: {
    topicSlugs: ['work', 'technology', 'economy', 'housing', 'family'],
    for: {
      openers: [
        'In my experience,',
        'The numbers show',
        'Ask anyone with a commute:',
        'Honestly,',
        'Over a whole year,',
      ],
      points: [
        'people get two hours a day back without the commute',
        'teams can hire the best person, wherever they live',
        'focused work goes faster without an open-plan office',
        'parents can be home when their children get back from school',
        'companies save a fortune on office rent',
        'written decisions are easier to find than hallway chats',
        'people can afford to live outside the expensive cities',
        'sick days drop when nobody brings a cold into the office',
      ],
    },
    against: {
      openers: ['The catch is', 'For new starters,', 'Be honest:', 'Over time,', 'What gets lost is that'],
      points: [
        'juniors learn far less without sitting next to seniors',
        'trust between teams is built in person, not on calls',
        'meetings multiply when nobody can just turn around and ask',
        'the line between work and home disappears',
        'loneliness is a real cost that never shows up in the numbers',
        'ideas come from chance conversations that never happen online',
        'not everyone has a quiet room to work from',
        'promotions still go to whoever the boss sees most',
      ],
    },
  },
  f0e1d2c3b4a5968778695a4b3c2d1e0f: {
    topicSlugs: ['education', 'family', 'health'],
    for: {
      openers: [
        'Research keeps finding',
        'For younger children,',
        'Think about the evenings:',
        'Simply put,',
        'From the classroom,',
      ],
      points: [
        'homework adds little to what primary pupils learn',
        'children need time to play, rest and be bored',
        'families with less time or space at home fall further behind',
        'stress about homework is a leading cause of arguments at home',
        'pupils who want to practise more still can',
        'teachers spend hours marking work that was copied anyway',
        'sleep matters more for learning than one more worksheet',
        'clubs and sport teach things a worksheet cannot',
      ],
    },
    against: {
      openers: ['Without it,', 'The point is that', 'Speaking as a teacher,', 'Over a school year,', 'Let us be fair:'],
      points: [
        'practice is how anything sticks, from times tables to spelling',
        'homework teaches pupils to plan their own time',
        'parents see what their children are learning',
        'optional work is skipped by exactly the pupils who need it',
        'there is not enough time in class to practise everything',
        'secondary school is a shock for pupils who never did any',
        'reading at home is the best predictor of reading well',
        'short, regular tasks build habits for exams later',
      ],
    },
  },
};
