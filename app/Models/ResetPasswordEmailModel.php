<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResetPasswordEmailModel extends Model
{
    use HasFactory;
    public $timestamps = false; 
    // Specify the table name if it doesn't follow Laravel's naming convention
    protected $table = 'password_reset_tokens';

    // Disable timestamps if you only have custom timestamps (created_at, updated_at)

    // Specify the fillable fields to allow mass assignment
    protected $fillable = [
        'email',
        'token',
        'created_at', 
    ];

    // Optionally, define custom date casting for timestamps
    protected $casts = [
        // 'created_at' => 'datetime',
        // 'updated_at' => 'datetime',
    ];
}