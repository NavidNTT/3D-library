<?php

use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\GenreController;
use App\Http\Controllers\Api\SuggestionController;
use Illuminate\Support\Facades\Route;

Route::get('/genres', [GenreController::class, 'index']);
Route::get('/books', [BookController::class, 'index']);
Route::get('/books/{book}', [BookController::class, 'show']);
Route::post('/suggestions', [SuggestionController::class, 'store'])->middleware('throttle:suggestions');
