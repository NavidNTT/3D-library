import { useEffect } from "react";
import TestScene from "./components/3d/TestScene";
import BookTooltip from "./components/UI/BookTooltip";
import GestureHint from "./components/UI/GestureHint";
import LoadingOverlay from "./components/UI/LoadingOverlay";
import SuggestionForm from "./components/UI/SuggestionForm";
import useBookStore from "./store/useBookStore";
import "./App.css";

export default function App() {
  const { fetchBooks, isOpen, selectedBook, currentPageIndex, pages, closeBook } = useBookStore();
  useEffect(() => { fetchBooks(); }, [fetchBooks]);
  return (
    <main className={isOpen ? "app app--reading" : "app"}>
      <TestScene />
      <header className="app__header">
        <p>THE ARCHIVE</p>
        <h1 dir="rtl" lang="fa">کتابخانه سه‌بعدی</h1>
        <span>Pick a volume to begin reading</span>
      </header>
      <LoadingOverlay />
      <BookTooltip />
      <GestureHint />
      {isOpen && (
        <section className="reader-controls">
          <button onClick={closeBook}>Close book</button>
          <span dir="auto">{selectedBook?.title_fa || selectedBook?.title_en} · {currentPageIndex + 1}/{pages.length || 1}</span>
          <div>
            <button onClick={() => useBookStore.getState().previousPage()}>←</button>
            <button onClick={() => useBookStore.getState().nextPage()}>→</button>
          </div>
        </section>
      )}
      <SuggestionForm />
    </main>
  );
}
