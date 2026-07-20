<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Suggestion extends Model
{
    protected $fillable = ['title', 'author', 'genre_suggestion', 'note', 'status'];
}

