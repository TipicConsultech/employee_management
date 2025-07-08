<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyCordinate extends Model
{
    use HasFactory;

    // Table name is already the plural of this class (“company_cordinates”),
    // so no need to specify $table.

    /** @var string[] */
    protected $fillable = [
        'product_id',
        'company_id',        // be careful: this matches the column name in your migration
        'required_lat',
        'required_lng',
        'location_tolerance',
    ];
}
