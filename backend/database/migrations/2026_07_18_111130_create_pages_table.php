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
        Schema::create('pages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('book_id')->constrained()->cascadeOnDelete();
    $table->unsignedInteger('page_number');
    $table->enum('type', ['toc', 'blank', 'content'])->default('content');
    $table->string('chapter_title')->nullable();
    $table->longText('content_fa')->nullable();
    $table->longText('content_en')->nullable();
    $table->timestamps();

    $table->unique(['book_id', 'page_number']);
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
