<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;

class BookController extends Controller
{
    public function index()
    {
        $books = Book::with('genre:id,name_fa,name_en,color_hex')
            ->where('is_published', true)
            ->orderBy('order_on_shelf')
            ->get(['id', 'genre_id', 'title_fa', 'title_en', 'author_fa', 'author_en', 'cover_color', 'order_on_shelf']);

        return response()->json($books);
    }

    public function show(Book $book)
    {
        if (! $book->is_published) {
            abort(404);
        }

        $book->load([
            'genre:id,name_fa,name_en,color_hex',
            'pages' => fn($q) => $q->select('id', 'book_id', 'page_number', 'type', 'chapter_title', 'content_fa', 'content_en')
                                   ->orderBy('page_number'),
        ]);

        return response()->json($book);
    }
}
