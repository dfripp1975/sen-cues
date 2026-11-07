import { searchBooks } from '@/data/books';
import { tools } from '@/data/tools';
import type { ToolMeta, Book } from '@/types';

export const SearchService = {
  async search(query: string): Promise<{ books: Book[]; tools: ToolMeta[] }> {
    const bookResults = searchBooks(query);
    const toolResults = tools.filter((t: ToolMeta) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.shortTitle.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
    );
    return { books: bookResults, tools: toolResults };
  },
};
