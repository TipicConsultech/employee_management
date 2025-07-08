<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeTracker extends Model
{
    use HasFactory;

    /* explicit table name (no trailing “s”) */
    protected $table = 'employee_tracker';

    /* mass‑assignable columns */
    protected $fillable = [
        'product_id',
        'employee_id',
        'company_id',
        'check_in',
        'check_out',
        'payment_status',
        'check_in_gps',
        'check_out_gps',
        'check_out_time'
    ];

    /* casts → booleans return true / false */
    protected $casts = [
        'check_in'       => 'boolean',
        'check_out'      => 'boolean',
        'payment_status' => 'boolean',
    ];

    /* ─────── Relationships ─────── */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function employees()
{
    return $this->belongsTo(Employee::class, 'employee_id');
}

    public function company()
    {
        // local company_id → foreign company_id on company_info
        return $this->belongsTo(CompanyInfo::class, 'company_id', 'company_id');
    }
}
