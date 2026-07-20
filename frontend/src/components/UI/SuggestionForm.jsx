import { useRef, useState } from "react";
import { submitSuggestion } from "../../api/books";

export default function SuggestionForm() {
  const dialog = useRef(null);
  const [status, setStatus] = useState("");

  function open() {
    setStatus("");
    dialog.current?.showModal();
  }

  async function submit(event) {
    event.preventDefault();
    const formElement = event.currentTarget; // currentTarget is null after await
    const form = new FormData(formElement);
    try {
      await submitSuggestion(Object.fromEntries(form));
      formElement.reset();
      setStatus("Thank you — your suggestion was received.");
    } catch (error) {
      setStatus(error.response?.data?.message || "Could not submit your suggestion.");
    }
  }

  return (
    <>
      <button type="button" className="suggest-fab" onClick={open}>
        ✦ Suggest a book
      </button>
      <dialog
        ref={dialog}
        className="suggestion-dialog"
        onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}
      >
        <form className="suggestion-form" onSubmit={submit} method="dialog">
          <header>
            <strong>Suggest a book</strong>
            <button type="button" aria-label="Close" onClick={() => dialog.current?.close()}>✕</button>
          </header>
          <input name="title" required placeholder="Title" dir="auto" />
          <input name="author" placeholder="Author" dir="auto" />
          <input name="genre_suggestion" placeholder="Genre" dir="auto" />
          <button type="submit" className="suggestion-form__send">Send</button>
          {status && <small dir="auto">{status}</small>}
        </form>
      </dialog>
    </>
  );
}
