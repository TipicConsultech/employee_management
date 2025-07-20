<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OnboardingPartner;
use App\Models\Company;
use App\Models\Plan;
use Carbon\Carbon;

class OnboardingPartnerDashboardController extends Controller
{
   
    public function getDashboardData(Request $request)
    {
        // Get the authenticated user (could be regular user or onboarding partner)
        $partner = $request->user();

        // Check if this is an onboarding partner
        if (!$partner || !($partner instanceof \App\Models\OnboardingPartner)) {
            return response()->json(['message' => 'Unauthorized - Not an onboarding partner'], 401);
        }

        $partner->load('onboardingPartnerType');

        return response()->json([
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
                'email' => $partner->email,
                'company' => $partner->company,
                'onboarding_partner_type_id' => $partner->onboarding_partner_type_id,
                'status' => $partner->status,
                'partner_type' => [
                    'name' => $partner->onboardingPartnerType->partner_type ?? 'Unknown'
                ]
            ]
        ]);
    }

    // 2. Get monthly commission details
    public function getMonthlyCommissionDetails(Request $request)
    {
        $partner = $request->user();

        if (!$partner || !($partner instanceof \App\Models\OnboardingPartner)) {
            return response()->json(['message' => 'Unauthorized - Not an onboarding partner'], 401);
        }

        $partner->load('onboardingPartnerType');

        $month = $request->query('month', now()->format('Y-m'));
        $start = Carbon::parse($month)->startOfMonth();
        $end = Carbon::parse($month)->endOfMonth();

        $companies = Company::where('onboarding_partner_id', $partner->id)
            ->whereBetween('created_at', [$start, $end])
            ->with('plan')
            ->get();

        $monthlyRevenue = $companies->sum(fn($company) => $company->plan->price ?? 0);
        $commissionRate = $partner->onboardingPartnerType->commission ?? 0;
        $commissionAmount = ($monthlyRevenue * $commissionRate) / 100;

        return response()->json([
            'total_companies' => Company::where('onboarding_partner_id', $partner->id)->count(),
            'monthly_companies' => $companies->count(),
            'monthly_revenue' => $monthlyRevenue,
            'commission_amount' => $commissionAmount,
            'commission_rate' => $commissionRate,
            'partner_type' => [
                'name' => $partner->onboardingPartnerType->partner_type ?? 'Unknown'
            ]
        ]);
    }

    // 3. Get yearly commission data
    public function getYearlyCommissionData(Request $request)
    {
        $partner = $request->user();

        if (!$partner || !($partner instanceof \App\Models\OnboardingPartner)) {
            return response()->json(['message' => 'Unauthorized - Not an onboarding partner'], 401);
        }

        $partner->load('onboardingPartnerType');

        $year = now()->year;
        $start = Carbon::create($year)->startOfYear();
        $end = Carbon::create($year)->endOfYear();

        $companies = Company::where('onboarding_partner_id', $partner->id)
            ->whereBetween('created_at', [$start, $end])
            ->with('plan')
            ->get();

        $yearlyRevenue = $companies->sum(fn($company) => $company->plan->price ?? 0);
        $commissionRate = $partner->onboardingPartnerType->commission ?? 0;
        $commissionAmount = ($yearlyRevenue * $commissionRate) / 100;

        return response()->json([
            'year' => $year,
            'yearly_revenue' => $yearlyRevenue,
            'yearly_commission' => $commissionAmount
        ]);
    }

    // 4. Get partner's companies list
    public function getPartnerCompanies(Request $request)
    {
        $partner = $request->user();

        if (!$partner || !($partner instanceof \App\Models\OnboardingPartner)) {
            return response()->json(['message' => 'Unauthorized - Not an onboarding partner'], 401);
        }

        $companies = Company::where('onboarding_partner_id', $partner->id)
            ->with('plan')
            ->get()
            ->map(function ($company) {
                return [
                    'id' => $company->id,
                    'company_name' => $company->name,
                    'plan_name' => $company->plan->name ?? 'N/A',
                    'plan_price' => $company->plan->price ?? 0,
                    'registration_date' => $company->created_at->format('Y-m-d'),
                    'status' => $company->status
                ];
            });

        return response()->json([
            'companies' => $companies
        ]);
    }

    // 5. Admin - Get all partners commission
    public function getAllPartnersCommission()
    {
        $partners = OnboardingPartner::with(['onboardingPartnerType', 'companies.plan'])->get();

        $data = $partners->map(function ($partner) {
            $monthlyCompanies = $partner->companies()
                ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                ->with('plan')
                ->get();

            $monthlyRevenue = $monthlyCompanies->sum(fn($c) => $c->plan->price ?? 0);
            $commissionRate = $partner->onboardingPartnerType->commission ?? 0;
            $commissionAmount = ($monthlyRevenue * $commissionRate) / 100;

            return [
                'id' => $partner->id,
                'name' => $partner->name,
                'email' => $partner->email,
                'company' => $partner->company,
                'partner_type' => [
                    'name' => $partner->onboardingPartnerType->partner_type ?? 'Unknown'
                ],
                'commission_data' => [
                    'monthly_companies' => $monthlyCompanies->count(),
                    'monthly_revenue' => $monthlyRevenue,
                    'commission_rate' => $commissionRate,
                    'monthly_commission' => $commissionAmount
                ],
                'total_companies' => $partner->companies->count()
            ];
        });

        return response()->json(['partners' => $data]);
    }

    // 6. Admin - Get specific partner dashboard
    public function getPartnerDashboardForAdmin($partnerId)
    {
        $partner = OnboardingPartner::with(['onboardingPartnerType', 'companies.plan'])->findOrFail($partnerId);

        $companies = $partner->companies->map(function ($company) {
            return [
                'id' => $company->id,
                'company_name' => $company->name,
                'plan_name' => $company->plan->name ?? 'N/A',
                'plan_price' => $company->plan->price ?? 0,
                'registration_date' => $company->created_at->format('Y-m-d'),
                'status' => $company->status
            ];
        });

        return response()->json([
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
                'email' => $partner->email,
                'company' => $partner->company,
                'partner_type' => [
                    'name' => $partner->onboardingPartnerType->partner_type ?? 'Unknown'
                ],
                'commission_rate' => $partner->onboardingPartnerType->commission ?? 0
            ],
            'companies' => $companies
        ]);
    }

    // 7. Public route - Get available plans
    public function getAvailablePlans()
    {
        $plans = Plan::select('id', 'name', 'price')->get();
        return response()->json(['plans' => $plans]);
    }
}