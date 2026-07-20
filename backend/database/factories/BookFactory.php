<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Genre;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookFactory extends Factory
{
    protected $model = Book::class;

    public function definition(): array
    {
        return [
            'genre_id' => Genre::factory(),
            'title_fa' => 'فلسفه ذهن',
            'title_en' => 'Philosophy of Mind',
            'author_fa' => 'مارک روولندز',
            'author_en' => 'Mark Rowlands',
            'cover_color' => '#2e5339',
            'description_fa' => 'کتابی درباره فلسفه ذهن',
            'description_en' => 'A book about philosophy of mind',
            'is_published' => true,
            'order_on_shelf' => 1,
        ];
    }
}
