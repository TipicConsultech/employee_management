<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentType extends Model
{
    use HasFactory;

    /**
     * Because the table name is singular (`document_type`),
     * tell Eloquent not to look for the default plural form.
     */
    protected $table = 'document_type';

    /**
     * Mass‑assignable columns.
     */
    protected $fillable = [
        'document_name',
    ];
}
