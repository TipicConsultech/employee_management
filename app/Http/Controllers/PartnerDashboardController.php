<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\OnboardingPartner;
use App\Models\CompanyInfo;
use App\Models\CompanyReceipt;
use App\Models\Plan;
use Carbon\Carbon;

class PartnerDashboardController extends Controller
{
    /**
     * Get partner dashboard data
     */
    public function getDashboardData(Request $request)
    {
        $partner = Auth::guard('sanctum')->user();
        
        if (!$partner) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Get partner with type information
        $partnerWithType = OnboardingPartner::with('partner_types')->find($partner->id);
        
        if (!$partnerWithType) {
            return response()->json(['message' => 'Partner not found'], 404);
        }

        // Get companies referred by this partner
        $companies = CompanyInfo::where('refer_by_id', $partner->id)->get();
        
        // Get plan details for each company
        $companiesWithPlans = $companies->map(function ($company) {
            $plan = Plan::find($company->subscribed_plan);
            $company->plan_details = $plan;
            return $company;
        });

        // Calculate statistics
        $totalCompanies = $companies->count();
        $activeCompanies = $companies->where('block_status', 0)->count();
        $blockedCompanies = $companies->where('block_status', 1)->count();
        
        // Calculate expired subscriptions
        $expiredCompanies = $companies->filter(function ($company) {
            return Carbon::parse($company->subscription_validity)->isPast();
        })->count();

        return response()->json([
            'partner' => $partnerWithType,
            'companies' => $companiesWithPlans,
            'statistics' => [
                'total_companies' => $totalCompanies,
                'active_companies' => $activeCompanies,
                'blocked_companies' => $blockedCompanies,
                'expired_companies' => $expiredCompanies
            ]
        ], 200);
    }

    /**
     * Get commission calculation based on actual receipts for specific month/year
     */
    public function getReceiptBasedCommission(Request $request)
    {
        $partner = Auth::guard('sanctum')->user();
        
        if (!$partner) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:2030'
        ]);

        $month = $request->input('month', date('n'));
        $year = $request->input('year', date('Y'));

        // Get partner with commission rate
        $partnerWithType = OnboardingPartner::with('partner_types')->find($partner->id);
        
        if (!$partnerWithType || !$partnerWithType->partner_types) {
            return response()->json(['message' => 'Partner type not found'], 404);
        }

        $commissionRate = $partnerWithType->partner_types->commission;

        // Get companies referred by this partner
        $companyIds = CompanyInfo::where('refer_by_id', $partner->id)->pluck('company_id');
        
        // Get receipts for the specified month/year for referred companies
        $receipts = CompanyReceipt::whereIn('company_id', $companyIds)
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->where('transaction_status', 'success') // Only successful payments
            ->with(['company', 'plan'])
            ->get();

        $receiptCommissionData = [];
        $totalMonthlyCommission = 0;

        foreach ($receipts as $receipt) {
            $commissionAmount = ($receipt->total_amount * $commissionRate) / 100;
            
            $receiptCommissionData[] = [
                'receipt_id' => $receipt->id,
                'company_id' => $receipt->company_id,
                'company_name' => $receipt->company->company_name ?? 'N/A',
                'plan_name' => $receipt->plan->name ?? 'N/A',
                'transaction_id' => $receipt->transaction_id,
                'receipt_amount' => $receipt->total_amount,
                'commission_rate' => $commissionRate,
                'commission_amount' => $commissionAmount,
                'payment_date' => $receipt->created_at->format('Y-m-d'),
                'valid_till' => $receipt->valid_till
            ];
            
            $totalMonthlyCommission += $commissionAmount;
        }

        return response()->json([
            'month' => $month,
            'year' => $year,
            'commission_rate' => $commissionRate,
            'partner_type' => $partnerWithType->partner_types->partner_type,
            'total_monthly_commission' => $totalMonthlyCommission,
            'total_receipts' => $receipts->count(),
            'total_revenue_generated' => $receipts->sum('total_amount'),
            'receipts_commission' => $receiptCommissionData,
            'summary' => [
                'total_referred_companies' => $companyIds->count(),
                'companies_with_payments' => $receipts->unique('company_id')->count(),
                'successful_transactions' => $receipts->count()
            ]
        ], 200);
    }

    /**
     * Get yearly commission report based on actual receipts
     */
    public function getYearlyReceiptCommissionReport(Request $request)
    {
        $partner = Auth::guard('sanctum')->user();
        
        if (!$partner) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'year' => 'nullable|integer|min:2020|max:2030'
        ]);

        $year = $request->input('year', date('Y'));

        // Get partner with commission rate
        $partnerWithType = OnboardingPartner::with('partner_types')->find($partner->id);
        $commissionRate = $partnerWithType->partner_types->commission ?? 0;

        // Get companies referred by this partner
        $companyIds = CompanyInfo::where('refer_by_id', $partner->id)->pluck('company_id');
        
        $monthlyReport = [];
        $totalYearlyCommission = 0;
        $totalYearlyRevenue = 0;
        
        for ($month = 1; $month <= 12; $month++) {
            // Get receipts for this month
            $monthlyReceipts = CompanyReceipt::whereIn('company_id', $companyIds)
                ->whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->where('transaction_status', 'success')
                ->get();
            
            $monthlyCommission = 0;
            $monthlyRevenue = $monthlyReceipts->sum('total_amount');
            
            foreach ($monthlyReceipts as $receipt) {
                $monthlyCommission += ($receipt->total_amount * $commissionRate) / 100;
            }
            
            $monthlyReport[] = [
                'month' => $month,
                'month_name' => Carbon::create($year, $month, 1)->format('F'),
                'year' => $year,
                'commission' => $monthlyCommission,
                'revenue_generated' => $monthlyRevenue,
                'transaction_count' => $monthlyReceipts->count(),
                'unique_companies' => $monthlyReceipts->unique('company_id')->count()
            ];
            
            $totalYearlyCommission += $monthlyCommission;
            $totalYearlyRevenue += $monthlyRevenue;
        }

        return response()->json([
            'year' => $year,
            'commission_rate' => $commissionRate,
            'partner_type' => $partnerWithType->partner_types->partner_type ?? 'N/A',
            'monthly_report' => $monthlyReport,
            'yearly_summary' => [
                'total_commission' => $totalYearlyCommission,
                'total_revenue_generated' => $totalYearlyRevenue,
                'total_transactions' => CompanyReceipt::whereIn('company_id', $companyIds)
                    ->whereYear('created_at', $year)
                    ->where('transaction_status', 'success')
                    ->count(),
                'average_monthly_commission' => $totalYearlyCommission / 12
            ]
        ], 200);
    }

    /**
     * Get detailed commission breakdown for a specific company
     */
    public function getCompanyCommissionHistory(Request $request, $companyId)
    {
        $partner = Auth::guard('sanctum')->user();
        
        if (!$partner) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Verify this company was referred by the authenticated partner
        $company = CompanyInfo::where('company_id', $companyId)
                             ->where('refer_by_id', $partner->id)
                             ->first();
        
        if (!$company) {
            return response()->json(['message' => 'Company not found or unauthorized'], 404);
        }

        // Get partner commission rate
        $partnerWithType = OnboardingPartner::with('partner_types')->find($partner->id);
        $commissionRate = $partnerWithType->partner_types->commission ?? 0;

        // Get all receipts for this company
        $receipts = CompanyReceipt::where('company_id', $companyId)
            ->where('transaction_status', 'success')
            ->with(['plan'])
            ->orderBy('created_at', 'desc')
            ->get();

        $commissionHistory = $receipts->map(function ($receipt) use ($commissionRate) {
            $commissionAmount = ($receipt->total_amount * $commissionRate) / 100;
            
            return [
                'receipt_id' => $receipt->id,
                'transaction_id' => $receipt->transaction_id,
                'payment_date' => $receipt->created_at->format('Y-m-d'),
                'plan_name' => $receipt->plan->name ?? 'N/A',
                'amount_paid' => $receipt->total_amount,
                'commission_rate' => $commissionRate,
                'commission_earned' => $commissionAmount,
                'valid_till' => $receipt->valid_till,
                'renewal_type' => $receipt->renewal_type ?? 'N/A'
            ];
        });

        $totalCommissionEarned = $commissionHistory->sum('commission_earned');
        $totalRevenueGenerated = $receipts->sum('total_amount');

        return response()->json([
            'company' => $company,
            'commission_rate' => $commissionRate,
            'commission_history' => $commissionHistory,
            'summary' => [
                'total_payments' => $receipts->count(),
                'total_revenue_generated' => $totalRevenueGenerated,
                'total_commission_earned' => $totalCommissionEarned,
                'first_payment' => $receipts->last()->created_at ?? null,
                'last_payment' => $receipts->first()->created_at ?? null
            ]
        ], 200);
    }

    /**
     * Get commission calculation for specific month/year (Original method - kept for backward compatibility)
     */
    public function getCommissionCalculation(Request $request)
    {
        $partner = Auth::guard('sanctum')->user();
        
        if (!$partner) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:2030'
        ]);

        $month = $request->input('month', date('n'));
        $year = $request->input('year', date('Y'));

        // Get partner with commission rate
        $partnerWithType = OnboardingPartner::with('partner_types')->find($partner->id);
        
        if (!$partnerWithType || !$partnerWithType->partner_types) {
            return response()->json(['message' => 'Partner type not found'], 404);
        }

        $commissionRate = $partnerWithType->partner_types->commission;

        // Get companies referred by this partner
        $companies = CompanyInfo::where('refer_by_id', $partner->id)->get();
        
        $monthlyCommissionData = [];
        $totalMonthlyCommission = 0;
        $totalYearlyCommission = 0;

        foreach ($companies as $company) {
            $plan = Plan::find($company->subscribed_plan);
            $planPrice = $plan ? $plan->price : 0;
            
            // Check if subscription is active for the requested month/year
            $subscriptionEnd = Carbon::parse($company->subscription_validity);
            $requestedMonth = Carbon::create($year, $month, 1);
            
            $isActiveInMonth = $subscriptionEnd->greaterThanOrEqualTo($requestedMonth) && 
                              $company->block_status == 0;
            
            $monthlyCommission = $isActiveInMonth ? ($planPrice * $commissionRate) / 100 : 0;
            
            $monthlyCommissionData[] = [
                'company_id' => $company->company_id,
                'company_name' => $company->company_name,
                'plan_name' => $plan ? $plan->name : 'N/A',
                'plan_price' => $planPrice,
                'commission_rate' => $commissionRate,
                'monthly_commission' => $monthlyCommission,
                'is_active' => $isActiveInMonth,
                'subscription_validity' => $company->subscription_validity,
                'block_status' => $company->block_status
            ];
            
            $totalMonthlyCommission += $monthlyCommission;
        }

        // Calculate yearly projection based on active subscriptions
        $activeCompaniesCount = $companies->where('block_status', 0)->count();
        $totalYearlyCommission = $totalMonthlyCommission * 12;

        return response()->json([
            'month' => $month,
            'year' => $year,
            'commission_rate' => $commissionRate,
            'partner_type' => $partnerWithType->partner_types->partner_type,
            'total_monthly_commission' => $totalMonthlyCommission,
            'total_yearly_projection' => $totalYearlyCommission,
            'companies_commission' => $monthlyCommissionData,
            'summary' => [
                'total_companies' => $companies->count(),
                'active_companies' => $activeCompaniesCount,
                'earning_companies' => collect($monthlyCommissionData)->where('is_active', true)->count()
            ]
        ], 200);
    }

    /**
     * Get monthly commission report for the year (Original method - kept for backward compatibility)
     */
    public function getMonthlyCommissionReport(Request $request)
    {
        $partner = Auth::guard('sanctum')->user();
        
        if (!$partner) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'year' => 'nullable|integer|min:2020|max:2030'
        ]);

        $year = $request->input('year', date('Y'));

        // Get partner with commission rate
        $partnerWithType = OnboardingPartner::with('partner_types')->find($partner->id);
        $commissionRate = $partnerWithType->partner_types->commission ?? 0;

        // Get companies referred by this partner
        $companies = CompanyInfo::where('refer_by_id', $partner->id)->get();
        
        $monthlyReport = [];
        
        for ($month = 1; $month <= 12; $month++) {
            $monthlyCommission = 0;
            $activeCompaniesInMonth = 0;
            
            foreach ($companies as $company) {
                $plan = Plan::find($company->subscribed_plan);
                $planPrice = $plan ? $plan->price : 0;
                
                // Check if subscription is active for this month
                $subscriptionEnd = Carbon::parse($company->subscription_validity);
                $monthStart = Carbon::create($year, $month, 1);
                
                $isActiveInMonth = $subscriptionEnd->greaterThanOrEqualTo($monthStart) && 
                                  $company->block_status == 0;
                
                if ($isActiveInMonth) {
                    $monthlyCommission += ($planPrice * $commissionRate) / 100;
                    $activeCompaniesInMonth++;
                }
            }
            
            $monthlyReport[] = [
                'month' => $month,
                'month_name' => Carbon::create($year, $month, 1)->format('F'),
                'year' => $year,
                'commission' => $monthlyCommission,
                'active_companies' => $activeCompaniesInMonth
            ];
        }

        return response()->json([
            'year' => $year,
            'commission_rate' => $commissionRate,
            'partner_type' => $partnerWithType->partner_types->partner_type ?? 'N/A',
            'monthly_report' => $monthlyReport,
            'total_yearly_commission' => array_sum(array_column($monthlyReport, 'commission'))
        ], 200);
    }

    /**
     * Get partner profile information
     */
    public function getPartnerProfile(Request $request)
    {
        $partner = Auth::guard('sanctum')->user();
        
        if (!$partner) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $partnerWithType = OnboardingPartner::with('partner_types')->find($partner->id);
        
        return response()->json([
            'partner' => $partnerWithType
        ], 200);
    }

    /**
     * Get company details for a specific company
     */
    public function getCompanyDetails(Request $request, $companyId)
    {
        $partner = Auth::guard('sanctum')->user();
        
        if (!$partner) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Check if this company was referred by the authenticated partner
        $company = CompanyInfo::where('company_id', $companyId)
                             ->where('refer_by_id', $partner->id)
                             ->first();
        
        if (!$company) {
            return response()->json(['message' => 'Company not found or unauthorized'], 404);
        }

        // Get plan details
        $plan = Plan::find($company->subscribed_plan);
        
        // Get partner commission rate
        $partnerWithType = OnboardingPartner::with('partner_types')->find($partner->id);
        $commissionRate = $partnerWithType->partner_types->commission ?? 0;
        
        // Calculate commission
        $planPrice = $plan ? $plan->price : 0;
        $monthlyCommission = ($planPrice * $commissionRate) / 100;
        
        // Check subscription status
        $subscriptionEnd = Carbon::parse($company->subscription_validity);
        $isExpired = $subscriptionEnd->isPast();
        $daysRemaining = $subscriptionEnd->diffInDays(Carbon::now(), false);

        return response()->json([
            'company' => $company,
            'plan_details' => $plan,
            'commission_info' => [
                'commission_rate' => $commissionRate,
                'monthly_commission' => $monthlyCommission,
                'yearly_commission' => $monthlyCommission * 12
            ],
            'subscription_info' => [
                'is_expired' => $isExpired,
                'days_remaining' => $daysRemaining,
                'validity_date' => $company->subscription_validity,
                'status' => $isExpired ? 'expired' : 'active'
            ]
        ], 200);
    }
}