<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Page extends Model
{
    use HasFactory;
    protected $fillable = [
        'book_id', 'page_number', 'type',
        'chapter_title', 'content_fa', 'content_en',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}

