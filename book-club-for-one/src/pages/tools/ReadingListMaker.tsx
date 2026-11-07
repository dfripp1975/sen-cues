import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Shuffle } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import { books } from '@/data/books';
import type { ReadingListItem } from '@/types';

const categories = [
  { id: 'want-to-read', label: 'Want To Read' },
  { id: 'next-up', label: 'Next Up' },
  { id: 'priority', label: 'Priority' },
  { id: 'someday', label: 'Someday' },
] as const;

export function ReadingListMaker() {
  const tool = getToolBySlug('reading-list-maker')!;
  const [items, setItems] = useState<ReadingListItem[]>([
    { id: '1', title: 'Pride and Prejudice', author: 'Jane Austen', category: 'want-to-read', order: 0 },
    { id: '2', title: '1984', author: 'George Orwell', category: 'next-up', order: 0 },
    { id: '3', title: 'Dracula', author: 'Bram Stoker', category: 'someday', order: 0 },
  ]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<'want-to-read' | 'next-up' | 'priority' | 'someday'>('want-to-read');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const addItem = (t: string, a: string, cat: typeof category) => {
    if (!t.trim()) return;
    setItems([...items, { id: Date.now().toString(), title: t, author: a || 'Unknown', category: cat, order: items.length }]);
    setTitle('');
    setAuthor('');
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const moveItem = (id: string, dir: -1 | 1) => {
    const cat = items.find(i => i.id === id)?.category;
    if (!cat) return;
    const catItems = items.filter(i => i.category === cat).sort((a, b) => a.order - b.order);
    const idx = catItems.findIndex(i => i.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= catItems.length) return;
    const swapItem = catItems[swapIdx];
    setItems(items.map(i => {
      if (i.id === id) return { ...i, order: swapItem.order };
      if (i.id === swapItem.id) return { ...i, order: catItems[idx].order };
      return i;
    }));
  };

  const randomise = () => {
    setItems(items.map(i => ({ ...i, order: Math.random() })));
  };

  const searchResults = searchQuery ? books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5) : [];

  const filteredItems = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory);

  return (
    <ToolLayout tool={tool} results={items.length > 0 ? (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Your Reading List ({items.length} books)</h2>
          <button onClick={randomise} className="btn-ghost text-sm"><Shuffle className="w-4 h-4" /> Randomise</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg' : 'bg-stone-light dark:bg-forest-800 text-charcoal dark:text-dark-text'}`}>All</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === c.id ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg' : 'bg-stone-light dark:bg-forest-800 text-charcoal dark:text-dark-text'}`}>{c.label}</button>
          ))}
        </div>
        <div className="space-y-2">
          {filteredItems.sort((a, b) => a.order - b.order).map(item => (
            <div key={item.id} className="card flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveItem(item.id, -1)} className="p-0.5 hover:text-forest-500 dark:hover:text-dark-sage"><ArrowUp className="w-3 h-3" /></button>
                <button onClick={() => moveItem(item.id, 1)} className="p-0.5 hover:text-forest-500 dark:hover:text-dark-sage"><ArrowDown className="w-3 h-3" /></button>
              </div>
              <div className="flex-1">
                <p className="font-medium text-charcoal dark:text-dark-text">{item.title}</p>
                <p className="text-xs text-warmgrey dark:text-dark-sub">{item.author}</p>
              </div>
              <span className="badge-sage capitalize">{categories.find(c => c.id === item.category)?.label}</span>
              <button onClick={() => removeItem(item.id)} className="p-1 text-warmgrey hover:text-terracotta-400 dark:hover:text-dark-terra"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Book Title</label>
            <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setSearchQuery(e.target.value); }} className="input-field" placeholder="Enter a book title" />
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map(b => (
                  <button key={b.id} onClick={() => { setTitle(b.title); setAuthor(b.author); setSearchQuery(''); }} className="block w-full text-left px-3 py-1.5 rounded-lg hover:bg-sage-50 dark:hover:bg-forest-700 text-sm text-charcoal dark:text-dark-text">
                    {b.title} by {b.author}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Author</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="input-field" placeholder="Author name" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === c.id ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg' : 'bg-stone-light dark:bg-forest-800 text-charcoal dark:text-dark-text'}`}>{c.label}</button>
            ))}
          </div>
        </div>
        <button onClick={() => addItem(title, author, category)} disabled={!title.trim()} className="btn-accent w-full">
          <Plus className="w-5 h-5" /> Add to List
        </button>
      </div>
    </ToolLayout>
  );
}
