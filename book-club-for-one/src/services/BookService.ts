import { books, searchBooks, getBookBySlug, getPopularBooks, getTrendingBooks, getClassicBooks, getRelatedBooks } from '@/data/books';
import type { Book } from '@/types';

export const BookService = {
  async search(query: string): Promise<Book[]> {
    return searchBooks(query);
  },

  async getBySlug(slug: string): Promise<Book | undefined> {
    return getBookBySlug(slug);
  },

  async getPopular(): Promise<Book[]> {
    return getPopularBooks();
  },

  async getTrending(): Promise<Book[]> {
    return getTrendingBooks();
  },

  async getClassics(): Promise<Book[]> {
    return getClassicBooks();
  },

  async getRelated(book: Book, limit?: number): Promise<Book[]> {
    return getRelatedBooks(book, limit);
  },

  async getAll(): Promise<Book[]> {
    return books;
  },
};
