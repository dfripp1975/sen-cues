import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import type { ScheduleMeeting } from '@/types';

export function BookClubScheduleGenerator() {
  const tool = getToolBySlug('book-club-schedule-generator')!;
  const [totalPages, setTotalPages] = useState(300);
  const [totalChapters, setTotalChapters] = useState(30);
  const [startDate, setStartDate] = useState('');
  const [numMeetings, setNumMeetings] = useState(4);
  const [weeksBetween, setWeeksBetween] = useState(2);
  const [schedule, setSchedule] = useState<ScheduleMeeting[]>([]);

  const handleGenerate = () => {
    const start = startDate ? new Date(startDate) : new Date();
    const chaptersPerMeeting = Math.ceil(totalChapters / numMeetings);
    const pagesPerMeeting = Math.ceil(totalPages / numMeetings);
    const meetings: ScheduleMeeting[] = [];
    for (let i = 0; i < numMeetings; i++) {
      const meetingDate = new Date(start);
      meetingDate.setDate(meetingDate.getDate() + (i * weeksBetween * 7));
      const startCh = i * chaptersPerMeeting + 1;
      const endCh = Math.min((i + 1) * chaptersPerMeeting, totalChapters);
      const startPg = i * pagesPerMeeting + 1;
      const endPg = Math.min((i + 1) * pagesPerMeeting, totalPages);
      meetings.push({
        meetingNumber: i + 1,
        date: meetingDate.toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' }),
        chapters: i === numMeetings - 1 ? `Chapters ${startCh}-${totalChapters}` : `Chapters ${startCh}-${endCh}`,
        pages: i === numMeetings - 1 ? `Pages ${startPg}-${totalPages}` : `Pages ${startPg}-${endPg}`,
      });
    }
    setSchedule(meetings);
  };

  return (
    <ToolLayout tool={tool} results={schedule.length > 0 ? (
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Your Reading Schedule</h2>
        <div className="space-y-3">
          {schedule.map(m => (
            <div key={m.meetingNumber} className="card flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${m.meetingNumber * 50}ms` }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg flex items-center justify-center font-bold text-lg">
                {m.meetingNumber}
              </div>
              <div className="flex-1">
                <p className="font-serif font-bold text-forest-500 dark:text-dark-sage">Meeting {m.meetingNumber}</p>
                <p className="text-sm text-warmgrey dark:text-dark-sub">{m.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-charcoal dark:text-dark-text">{m.chapters}</p>
                <p className="text-xs text-warmgrey dark:text-dark-sub">{m.pages}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Book Length (pages)</label>
            <input type="number" value={totalPages} onChange={(e) => setTotalPages(Number(e.target.value))} className="input-field" min="1" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Number of Chapters</label>
            <input type="number" value={totalChapters} onChange={(e) => setTotalChapters(Number(e.target.value))} className="input-field" min="1" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Number of Meetings</label>
            <input type="number" value={numMeetings} onChange={(e) => setNumMeetings(Number(e.target.value))} className="input-field" min="1" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Weeks Between Meetings</label>
            <input type="number" value={weeksBetween} onChange={(e) => setWeeksBetween(Number(e.target.value))} className="input-field" min="1" />
          </div>
        </div>
        <button onClick={handleGenerate} className="btn-accent w-full">
          <CalendarRange className="w-5 h-5" /> Generate Schedule
        </button>
      </div>
    </ToolLayout>
  );
}
