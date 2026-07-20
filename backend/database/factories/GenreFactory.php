<?php

namespace Database\Factories;

use App\Models\Genre;
use Illuminate\Database\Eloquent\Factories\Factory;

class GenreFactory extends Factory
{
    protected $model = Genre::class;

    public function definition(): array
    {
        return [
            'name_fa' => 'فلسفه',
            'name_en' => 'Philosophy',
            'slug' => 'philosophy',
            'color_hex' => '#2e5339',
        ];
    }
}
