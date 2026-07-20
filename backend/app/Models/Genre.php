<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Genre extends Model
{
    use HasFactory;
    protected $fillable = ['name_fa', 'name_en', 'slug', 'color_hex'];

    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }
}