<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnboardingPartnerType extends Model
{
    protected $fillable = ['partner_type', 'commission'];

    public function partners()
    {
        return $this->hasMany(OnboardingPartner::class, 'type_id');
    }
}
