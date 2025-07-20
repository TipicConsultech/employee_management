<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens; // 🔑 Required for token generation
use Illuminate\Notifications\Notifiable;

class OnboardingPartner extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'mobile',
        'password',
        'type_id',
        'type',
        'bank_name',
        'account_number',
        'ifsc_code',
    ];

    protected $hidden = [
        'password',
        'remember_token', // Optional if you’re using "remember me" login
    ];

    public function partner_types()
    {
        return $this->belongsTo(OnboardingPartnerType::class, 'type_id');
    }

    public function referredCompanies()
{
    return $this->hasMany(Company::class, 'refer_by_id');
}
}
