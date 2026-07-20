<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('books', function (Blueprint $table) {
    $table->id();
    $table->foreignId('genre_id')->constrained()->cascadeOnDelete();
    $table->string('title_fa');
    $table->string('title_en');
    $table->string('author_fa');
    $table->string('author_en');
    $table->string('cover_color', 7)->nullable();
    $table->text('description_fa')->nullable();
    $table->text('description_en')->nullable();
    $table->boolean('is_published')->default(false);
    $table->unsignedInteger('order_on_shelf')->default(0);
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
