import { create } from "zustand";
import { getBookById, getBooks } from "../api/books";

const useBookStore = create((set, get) => ({
  books: [],
  selectedBook: null,
  pages: [],
  loading: false,
  error: null,
  isOpen: false,
  currentPageIndex: 0,
  // hover tooltip: book being pointed at + its projected screen position
  hoveredBook: null,
  hoverScreen: { x: 0, y: 0 },

  fetchBooks: async () => {
    set({ loading: true, error: null });
    try {
      const books = await getBooks();
      set({ books, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  selectBook: async (bookId) => {
    if (get().loading) return;
    set({ loading: true, error: null, currentPageIndex: 0, hoveredBook: null });
    try {
      const selectedBook = await getBookById(bookId);
      set({ selectedBook, pages: selectedBook.pages ?? [], loading: false, isOpen: true });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  closeBook: () => set({ isOpen: false, currentPageIndex: 0 }),
  nextPage: () => set((state) => ({
    currentPageIndex: Math.min(state.currentPageIndex + 1, Math.max(state.pages.length - 1, 0)),
  })),
  previousPage: () => set((state) => ({
    currentPageIndex: Math.max(state.currentPageIndex - 1, 0),
  })),

  setHoveredBook: (hoveredBook, hoverScreen) => set(
    hoveredBook ? { hoveredBook, hoverScreen } : { hoveredBook: null },
  ),
}));

export default useBookStore;
