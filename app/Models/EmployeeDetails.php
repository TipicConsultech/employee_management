<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeDetails extends Model
{
    use HasFactory;

    /* explicit table name because it's not the plural‑guess */
    protected $table = 'employee_details';

    /* mass‑assignable columns */
    protected $fillable = [
        'product_id',
        'employee_id',
        'company_id',
        'document_id',
        'document_link', 
    ];
   protected $hidden = ['document_link'];
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
