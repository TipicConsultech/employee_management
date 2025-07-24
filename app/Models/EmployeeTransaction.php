<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeTransaction extends Model
{
    use HasFactory;

    /* explicit table name (no trailing “s”) */
    protected $table = 'employee_transaction';

    protected $fillable = [
        'product_id',
        'employee_id',
        'company_id',
        'transaction_type',
        'payment_type',
        'salary_amount',
        'payed_amount',
        'transaction_id'
    ];

    protected $casts = [
        'salary_amount' => 'float',
        'payed_amount'  => 'float',
    ];

    /* ─────── Relationships ─────── */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function company()
    {
        // local company_id → foreign company_id on company_info
        return $this->belongsTo(CompanyInfo::class, 'company_id', 'company_id');
    }
}
