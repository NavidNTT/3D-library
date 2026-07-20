<?php

namespace App\Filament\Resources\BookResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class PagesRelationManager extends RelationManager
{
    protected static string $relationship = 'pages';

    public function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('page_number')->required()->numeric(),
            Forms\Components\Select::make('type')
                ->options(['toc' => 'TOC', 'blank' => 'Blank', 'content' => 'Content'])
                ->default('content')->required(),
            Forms\Components\TextInput::make('chapter_title'),
            Forms\Components\Textarea::make('content_fa')->rows(5),
            Forms\Components\Textarea::make('content_en')->rows(5),
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('page_number')
            ->defaultSort('page_number')
            ->columns([
                Tables\Columns\TextColumn::make('page_number')->sortable(),
                Tables\Columns\TextColumn::make('type'),
                Tables\Columns\TextColumn::make('chapter_title'),
            ])
            ->headerActions([Tables\Actions\CreateAction::make()])
            ->actions([Tables\Actions\EditAction::make(), Tables\Actions\DeleteAction::make()])
            ->bulkActions([Tables\Actions\BulkActionGroup::make([Tables\Actions\DeleteBulkAction::make()])]);
    }
}
