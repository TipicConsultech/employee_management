<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyReceipt extends Model
{
    use HasFactory;

    // Define the table associated with the model
    protected $table = 'company_receipts';

    // Define the fillable attributes
    protected $fillable = [
        'company_id',
        'plan_id',
        'user_id',
        'valid_till',
        'transaction_id',
        'total_amount',
        'transaction_status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function company()
    {
        return $this->belongsTo(CompanyInfo::class, 'company_id');
    }
}
