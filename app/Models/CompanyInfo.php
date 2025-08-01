<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyInfo extends Model
{
    use HasFactory;
    protected $table = 'company_info';
    protected $fillable=[
    'comapany_id',
    'product_id',
    'land_mark' ,
    'Tal'  ,
    'Dist' ,
    'Pincode',
    'phone_no',
    'bank_name',
    'account_no',
    'IFSC_code',
    'logo',
    'sign',
    'paymentQRCode',
    'block_status',
    'company_name',
    'appMode',
    'subscribed_plan',
    'subscription_validity',
    'refer_by_id',
    'face_attendance',
    'working_hours',
    'start_time',
    'start_of_week',
    'week_off'
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];
 
}
