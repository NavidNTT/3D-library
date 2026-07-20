<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Suggestion;
use Illuminate\Http\Request;

class SuggestionController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'author'           => 'nullable|string|max:255',
            'genre_suggestion' => 'nullable|string|max:100',
            'note'             => 'nullable|string|max:1000',
        ]);

        Suggestion::create($data);

        return response()->json(['message' => 'پیشنهاد شما ثبت شد.'], 201);
    }
}
