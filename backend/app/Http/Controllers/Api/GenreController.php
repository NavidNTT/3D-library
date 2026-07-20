<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Genre;

class GenreController extends Controller
{
    public function index()
    {
        return response()->json(Genre::all(['id', 'name_fa', 'name_en', 'slug', 'color_hex']));
    }
}
