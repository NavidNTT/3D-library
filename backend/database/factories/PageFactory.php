<?php

namespace Database\Factories;

use App\Models\Page;
use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;

class PageFactory extends Factory
{
    protected $model = Page::class;

    public function definition(): array
    {
        return [
            'book_id' => Book::factory(),
            'page_number' => 1,
            'type' => 'content',
            'chapter_title' => null,
            'content_fa' => 'این یک متن نمونه برای صفحه کتاب است. فلسفه ذهن به مطالعه ماهیت ذهن، حالات ذهنی، آگاهی و رابطه آنها با بدن فیزیکی می‌پردازد.',
            'content_en' => 'This is sample text for the book page. Philosophy of mind studies the nature of the mind, mental states, consciousness, and their relationship to the physical body.',
        ];
    }
}
