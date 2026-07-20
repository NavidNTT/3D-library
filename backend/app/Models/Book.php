<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    use HasFactory;
    protected $fillable = [
        'genre_id', 'title_fa', 'title_en', 'author_fa', 'author_en',
        'cover_color', 'description_fa', 'description_en',
        'is_published', 'order_on_shelf',
    ];

    protected $casts = ['is_published' => 'boolean'];

    public function genre(): BelongsTo
    {
        return $this->belongsTo(Genre::class);
    }

    public function pages(): HasMany
    {
        return $this->hasMany(Page::class)->orderBy('page_number');
    }
}

