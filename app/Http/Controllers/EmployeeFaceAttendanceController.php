<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeFaceAttendance extends Model
{
    use HasFactory;

    protected $table = 'employee_face_attendance';   // explicit because of singular “attendance”

    protected $fillable = [
        'employee_tracker_id',
        'checkin_img',
        'checkout_img',
    ];

    /* ------------------------------------------------- *
     |  Relationships                                    |
     * ------------------------------------------------- */

    public function tracker()
    {
        // App\Models\EmployeeTracker assumed
        return $this->belongsTo(EmployeeTracker::class, 'employee_tracker_id');
    }
}

