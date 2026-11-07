import { useState } from 'react';
import { Copy } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';

const templates = [
  { id: 'elegant', name: 'Elegant', body: 'Dear friends,\n\nYou are warmly invited to join {club_name} for our next meeting.\n\n📚 Book: {book}\n📅 Date: {date}\n🕐 Time: {time}\n📍 Location: {location}\n\n{message}\n\nWe look forward to seeing you there!\n\nWarm regards,\n{club_name}' },
  { id: 'casual', name: 'Casual', body: 'Hey everyone!\n\nIt\'s book club time! Here are the details:\n\n📖 We\'re reading: {book}\n📅 When: {date} at {time}\n📍 Where: {location}\n\n{message}\n\nSee you there!\n{club_name}' },
  { id: 'formal', name: 'Formal', body: 'You are cordially invited to attend the {club_name} meeting.\n\nBook for Discussion: {book}\nDate: {date}\nTime: {time}\nVenue: {location}\n\n{message}\n\nPlease RSVP to confirm your attendance.\n\nRespectfully,\n{club_name}' },
  { id: 'playful', name: 'Playful', body: '📚✨ BOOK CLUB ALERT! ✨📚\n\nCalling all book lovers! {club_name} is meeting again!\n\n📖 What we\'re reading: {book}\n📅 When: {date}\n🕐 Time: {time}\n📍 Where: {location}\n\n{message}\n\nDon\'t forget to bring your thoughts (and maybe a snack)!\n\nHappy reading!\n{club_name}' },
];

export function BookClubInvitationMaker() {
  const tool = getToolBySlug('book-club-invitation-maker')!;
  const [clubName, setClubName] = useState('The Reading Circle');
  const [book, setBook] = useState('Pride and Prejudice');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('7:00 PM');
  const [location, setLocation] = useState('123 Main Street');
  const [message, setMessage] = useState('Bring your favourite snack to share!');
  const [templateId, setTemplateId] = useState('elegant');
  const [copied, setCopied] = useState(false);

  const generateInvitation = () => {
    const template = templates.find(t => t.id === templateId) || templates[0];
    return template.body
      .replace(/{club_name}/g, clubName)
      .replace(/{book}/g, book)
      .replace(/{date}/g, date || 'TBD')
      .replace(/{time}/g, time)
      .replace(/{location}/g, location)
      .replace(/{message}/g, message);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateInvitation());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout tool={tool} results={
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Your Invitation</h2>
        <div className="card bg-sage-50 dark:bg-forest-800 whitespace-pre-wrap">
          <p className="text-charcoal dark:text-dark-text leading-relaxed font-sans">{generateInvitation()}</p>
        </div>
        <button onClick={handleCopy} className="btn-accent">
          <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy Invitation Text'}
        </button>
      </div>
    }>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Book Club Name</label>
            <input type="text" value={clubName} onChange={(e) => setClubName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Book</label>
            <input type="text" value={book} onChange={(e) => setBook(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Date</label>
            <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" placeholder="e.g. Friday, October 20" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Time</label>
            <input type="text" value={time} onChange={(e) => setTime(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Template</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="input-field">
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Optional Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-field min-h-[80px]" />
        </div>
      </div>
    </ToolLayout>
  );
}
