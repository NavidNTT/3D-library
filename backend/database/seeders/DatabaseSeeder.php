<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Genre;
use App\Models\Page;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->firstOrCreate(['email' => 'admin@example.com'], ['name' => 'Admin', 'password' => bcrypt('password')]);

        Page::query()->delete();
        Book::query()->delete();
        Genre::query()->delete();

        $catalogue = [
            ['Thus Spoke Zarathustra', 'چنین گفت زرتشت', 'Nietzsche', 'نیچه', 'Philosophy', 'فلسفه', 'philosophy', '#2D4A2D'],
            ['Pride and Prejudice', 'غرور و تعصب', 'Jane Austen', 'جین آستن', 'Romance', 'عاشقانه', 'romance', '#722F37'],
            ['1984', '۱۹۸۴', 'George Orwell', 'جورج اورول', 'Sci-Fi', 'علمی تخیلی', 'sci-fi', '#1B2A4A'],
            ['History of Ancient Iran', 'تاریخ ایران باستان', 'Pirnia', 'حسن پیرنیا', 'Historical', 'تاریخی', 'historical', '#C68B2F'],
            ['The Shining', 'درخشش', 'Stephen King', 'استیون کینگ', 'Horror', 'ترسناک', 'horror', '#1A1A1A'],
        ];

        foreach ($catalogue as $order => [$titleEn, $titleFa, $authorEn, $authorFa, $genreEn, $genreFa, $slug, $color]) {
            $genre = Genre::updateOrCreate(['slug' => $slug], ['name_en' => $genreEn, 'name_fa' => $genreFa, 'color_hex' => $color]);
            $book = Book::updateOrCreate(['title_en' => $titleEn], [
                'genre_id' => $genre->id, 'title_fa' => $titleFa, 'author_en' => $authorEn, 'author_fa' => $authorFa,
                'cover_color' => $color, 'description_en' => "A curated edition of {$titleEn}.",
                'description_fa' => "نسخه‌ای برگزیده از {$titleFa}.", 'is_published' => true, 'order_on_shelf' => $order + 1,
            ]);
            $book->pages()->delete();
            Page::create(['book_id' => $book->id, 'page_number' => 1, 'type' => 'toc', 'chapter_title' => 'فهرست مطالب', 'content_fa' => "۱. آغاز مطالعه\n۲. فصل نخست\n۳. ادامه داستان"]);
            Page::create(['book_id' => $book->id, 'page_number' => 2, 'type' => 'blank']);
            Page::create(['book_id' => $book->id, 'page_number' => 3, 'type' => 'blank']);
            Page::create(['book_id' => $book->id, 'page_number' => 4, 'type' => 'content', 'chapter_title' => $titleFa, 'content_fa' => "این صفحه آغاز تجربه خواندن {$titleFa} است. متن کامل هر کتاب را از پنل مدیریت وارد کنید تا بافت صفحه به‌صورت پویا به‌روزرسانی شود.", 'content_en' => "Begin reading {$titleEn}. Add the complete text in the admin panel and the reader will render it as a page texture."]);
            Page::create(['book_id' => $book->id, 'page_number' => 5, 'type' => 'content', 'chapter_title' => 'Chapter Two', 'content_en' => 'The reading experience supports English and Persian pages. Direction is selected from the supplied page content.']);
        }
    }
}
