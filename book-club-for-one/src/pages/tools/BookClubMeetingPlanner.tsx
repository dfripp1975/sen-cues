import { useState, useMemo } from 'react';
import { ClipboardList, Plus, Minus } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import type { MeetingAgendaItem } from '@/types';

export function BookClubMeetingPlanner() {
  const tool = getToolBySlug('book-club-meeting-planner')!;
  const [book, setBook] = useState('');
  const [duration, setDuration] = useState(90);
  const [attendees, setAttendees] = useState(8);
  const [style, setStyle] = useState('deep');
  const [agenda, setAgenda] = useState<MeetingAgendaItem[]>([]);

  const generateAgenda = useMemo(() => {
    const styles: Record<string, { activity: string; weight: number; description: string }[]> = {
      casual: [
        { activity: 'Welcome & Social', weight: 15, description: 'Arrive, settle in, and catch up.' },
        { activity: 'Initial Reactions', weight: 20, description: 'Quick share of first impressions.' },
        { activity: 'General Discussion', weight: 40, description: 'Open conversation about the book.' },
        { activity: 'Favourite Passages', weight: 15, description: 'Share and read favourite quotes.' },
        { activity: 'Next Book Selection', weight: 10, description: 'Choose the next book.' },
      ],
      deep: [
        { activity: 'Welcome', weight: 10, description: 'Brief introduction and agenda overview.' },
        { activity: 'Initial Reactions', weight: 15, description: 'Share first thoughts on the book.' },
        { activity: 'Deep Discussion', weight: 40, description: 'Explore themes, characters, and deeper meaning.' },
        { activity: 'Favourite Passages', weight: 15, description: 'Read and discuss memorable quotes.' },
        { activity: 'Predictions & Next Book', weight: 10, description: 'Share predictions and select next book.' },
        { activity: 'Closing', weight: 10, description: 'Final thoughts and logistics.' },
      ],
      fun: [
        { activity: 'Icebreaker', weight: 15, description: 'Fun book-related icebreaker question.' },
        { activity: 'Book Discussion', weight: 35, description: 'Casual chat about the book.' },
        { activity: 'Book Trivia', weight: 20, description: 'Quick trivia game about the book or author.' },
        { activity: 'Snacks & Social', weight: 20, description: 'Food, drinks, and social time.' },
        { activity: 'Next Book', weight: 10, description: 'Pick the next read.' },
      ],
      academic: [
        { activity: 'Welcome & Overview', weight: 10, description: 'Introduction and discussion framework.' },
        { activity: 'Context & Background', weight: 15, description: 'Historical and literary context of the book.' },
        { activity: 'Theme Analysis', weight: 25, description: 'In-depth discussion of major themes.' },
        { activity: 'Character Study', weight: 20, description: 'Detailed character analysis.' },
        { activity: 'Writing Style', weight: 15, description: 'Examine the author\'s craft and technique.' },
        { activity: 'Conclusions', weight: 15, description: 'Synthesize discussion and next book.' },
      ],
    };
    return styles;
  }, []);

  const handleGenerate = () => {
    const template = generateAgenda[style] || generateAgenda.casual;
    const totalWeight = template.reduce((sum, s) => sum + s.weight, 0);
    const items: MeetingAgendaItem[] = template.map(s => ({
      activity: s.activity,
      duration: Math.round((s.weight / totalWeight) * duration),
      description: s.description,
    }));
    setAgenda(items);
  };

  const adjustTime = (i: number, delta: number) => {
    setAgenda(prev => prev.map((item, idx) => idx === i ? { ...item, duration: Math.max(0, item.duration + delta) } : item));
  };

  return (
    <ToolLayout tool={tool} results={agenda.length > 0 ? (
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Meeting Agenda for {book || 'Your Book Club'}</h2>
        <p className="text-sm text-warmgrey dark:text-dark-sub">{duration} minutes · {attendees} attendees · {style} style</p>
        <div className="space-y-3">
          {agenda.map((item, i) => (
            <div key={i} className="card flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg flex items-center justify-center font-bold text-lg">
                {i + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-forest-500 dark:text-dark-sage">{item.activity}</h3>
                <p className="text-sm text-warmgrey dark:text-dark-sub">{item.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => adjustTime(i, -5)} className="p-1 rounded-lg hover:bg-stone-light dark:hover:bg-forest-700"><Minus className="w-4 h-4" /></button>
                <span className="text-sm font-semibold text-forest-500 dark:text-dark-sage min-w-[60px] text-center">{item.duration} min</span>
                <button onClick={() => adjustTime(i, 5)} className="p-1 rounded-lg hover:bg-stone-light dark:hover:bg-forest-700"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="card bg-sage-50 dark:bg-forest-800">
          <p className="text-sm text-charcoal dark:text-dark-text">Total: <strong className="text-forest-500 dark:text-dark-sage">{agenda.reduce((sum, a) => sum + a.duration, 0)} minutes</strong></p>
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Book</label>
          <input type="text" value={book} onChange={(e) => setBook(e.target.value)} className="input-field" placeholder="e.g. Pride and Prejudice" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Meeting Duration (min)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input-field" min="15" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Number of Attendees</label>
            <input type="number" value={attendees} onChange={(e) => setAttendees(Number(e.target.value))} className="input-field" min="2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Meeting Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-field capitalize">
              <option value="casual">Casual</option>
              <option value="deep">Deep Discussion</option>
              <option value="fun">Fun & Social</option>
              <option value="academic">Academic</option>
            </select>
          </div>
        </div>
        <button onClick={handleGenerate} className="btn-accent w-full">
          <ClipboardList className="w-5 h-5" /> Generate Agenda
        </button>
      </div>
    </ToolLayout>
  );
}
