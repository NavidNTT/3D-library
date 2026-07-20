import api from "./axios";

export async function getBooks() {
  const { data } = await api.get("/books");
  return data;
}

export async function getBookById(id) {
  const { data } = await api.get(`/books/${id}`);
  return data;
}

export async function submitSuggestion(payload) {
  const { data } = await api.post("/suggestions", payload);
  return data;
}
