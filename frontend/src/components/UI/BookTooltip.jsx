import useBookStore from "../../store/useBookStore";

export default function BookTooltip() {
  const { hoveredBook, hoverScreen, isOpen } = useBookStore();
  if (!hoveredBook || isOpen) return null;
  const genreColor = hoveredBook.genre?.color_hex || "var(--gold)";
  return (
    <div className="book-tooltip" style={{ left: hoverScreen.x, top: hoverScreen.y }}>
      <strong dir="auto">{hoveredBook.title_fa || hoveredBook.title_en}</strong>
      {hoveredBook.title_fa && hoveredBook.title_en && <em>{hoveredBook.title_en}</em>}
      <span dir="auto">{hoveredBook.author_fa || hoveredBook.author_en}</span>
      <small style={{ borderColor: genreColor, color: genreColor }} dir="auto">
        {hoveredBook.genre?.name_fa || hoveredBook.genre?.name_en}
      </small>
    </div>
  );
}
