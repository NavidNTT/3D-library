import useBookStore from "../../store/useBookStore";

export default function LoadingOverlay() {
  const { loading, error, books } = useBookStore();
  if (!loading && !error) return <p className="shelf-hint">{books.length ? "Hover over a book, then click its cover." : "No published books are available."}</p>;
  return <div className="status-overlay">{loading ? "Loading the archive…" : `Unable to load books: ${error}`}</div>;
}
