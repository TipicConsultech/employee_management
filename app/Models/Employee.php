<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    /* ───── Explicit table name because we called it “employee”, not “employees” ───── */
    protected $table = 'employee';

    /* ───── Mass‑assignable columns ───── */
    protected $fillable = [
        'product_id',
        'company_id',
        'name',
        'gender',
        'payment_type',
        'work_type',
        'price',
        'wage_hour',
        'wage_overtime',
        'credit',
        'debit',
        'adhaar_number',
        'mobile',
        'refferal_by',
        'isActive',
        'half_day_rate',
        'holiday_rate',
        'overtime_type',
        'contract_type',
        'attendance_type',
        'refferal_number',
        'user_id',
        'working_hours',
        'tolerance'
    ];

    /* ───── Casts ───── */
    protected $casts = [
        'isActive'      => 'boolean',   // returns true / false
        'price'         => 'float',
        'wage_hour'     => 'float',
        'wage_overtime' => 'float',
        'credit'        => 'float',
        'debit'         => 'float',
    ];
  
    /* ───── Relationships ───── */
     public function trackers()
{
    return $this->hasMany(EmployeeTracker::class, 'employee_id');
} 

    public function company()
    {
        // local key company_id -> foreign key company_id on company_info
        return $this->belongsTo(CompanyInfo::class, 'company_id', 'company_id');
    }
}
