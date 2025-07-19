<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\OnboardingPartner;
use App\Models\CompanyInfo;
use App\Models\CompanyReceipt;
use App\Models\Plan;
use App\Models\Customer;
use App\Models\PaymentTracker;
use Carbon\Carbon;

class TipicAdminDashboardController extends Controller
{
    /**
     * Get complete admin dashboard overview
     */
    public function getDashboardOverview(Request $request)
    {
        try {
            // Get date filters
            $startDate = $request->query('startDate', Carbon::now()->startOfMonth()->format('Y-m-d'));
            $endDate = $request->query('endDate', Carbon::now()->endOfMonth()->format('Y-m-d'));

            // 1. Overall Sales Summary (All Companies)
            $salesSummary = $this->getAllCompaniesSales($startDate, $endDate);
            
            // 2. Sales Partners Summary
            $partnersSummary = $this->getSalesPartnersSummary();
            
            // 3. Payment Overview
            $paymentOverview = $this->getPaymentOverview($startDate, $endDate);
            
            // 4. Commission Summary
            $commissionSummary = $this->getAllPartnersCommissionSummary($startDate, $endDate);
            
            // 5. Renewal Alerts
            $renewalAlerts = $this->getRenewalAlerts();

            return response()->json([
                'success' => true,
                'data' => [
                    'sales_summary' => $salesSummary,
                    'partners_summary' => $partnersSummary,
                    'payment_overview' => $paymentOverview,
                    'commission_summary' => $commissionSummary,
                    'renewal_alerts' => $renewalAlerts,
                    'date_range' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * A) Get sales summary for all companies
     */
    public function getAllCompaniesSales($startDate = null, $endDate = null)
    {
        $startDate = $startDate ?: Carbon::now()->startOfMonth()->format('Y-m-d');
        $endDate = $endDate ?: Carbon::now()->endOfMonth()->format('Y-m-d');

        // Get all companies with their sales data
        $companiesSales = DB::table('orders')
            ->join('company_info', 'orders.company_id', '=', 'company_info.company_id')
            ->leftJoin('onboarding_partners', 'company_info.refer_by_id', '=', 'onboarding_partners.id')
            ->where('orders.orderStatus', 1) // Delivered orders only
            ->whereBetween('orders.invoiceDate', [$startDate, $endDate])
            ->select(
                'company_info.company_id',
                'company_info.company_name',
                'company_info.phone_no',
                'onboarding_partners.name as partner_name',
                'onboarding_partners.mobile as partner_mobile',
                DB::raw('COUNT(orders.id) as total_orders'),
                DB::raw('SUM(orders.totalAmount) as total_sales'),
                DB::raw('SUM(orders.paidAmount) as total_paid'),
                DB::raw('SUM(orders.finalAmount - orders.paidAmount) as total_pending'),
                DB::raw('SUM(orders.profit) as total_profit')
            )
            ->groupBy(
                'company_info.company_id', 
                'company_info.company_name', 
                'company_info.phone_no',
                'onboarding_partners.name',
                'onboarding_partners.mobile'
            )
            ->orderBy('total_sales', 'desc')
            ->get();

        // Calculate totals
        $totalSales = $companiesSales->sum('total_sales');
        $totalOrders = $companiesSales->sum('total_orders');
        $totalPaid = $companiesSales->sum('total_paid');
        $totalPending = $companiesSales->sum('total_pending');
        $totalProfit = $companiesSales->sum('total_profit');

        return [
            'companies_sales' => $companiesSales,
            'summary' => [
                'total_companies' => $companiesSales->count(),
                'total_orders' => $totalOrders,
                'total_sales' => $totalSales,
                'total_paid' => $totalPaid,
                'total_pending' => $totalPending,
                'total_profit' => $totalProfit,
                'average_sale_per_company' => $companiesSales->count() > 0 ? $totalSales / $companiesSales->count() : 0
            ]
        ];
    }

    /**
     * B) Get customers onboarded by each sales partner
     */
    public function getSalesPartnersSummary()
    {
        $partnersSummary = DB::table('onboarding_partners')
            ->leftJoin('company_info', 'onboarding_partners.id', '=', 'company_info.refer_by_id')
            ->leftJoin('onboarding_partner_types', 'onboarding_partners.type_id', '=', 'onboarding_partner_types.id')
            ->select(
                'onboarding_partners.id as partner_id',
                'onboarding_partners.name as partner_name',
                'onboarding_partners.mobile as partner_mobile',
                'onboarding_partners.email as partner_email',
                'onboarding_partner_types.partner_type',
                'onboarding_partner_types.commission as commission_rate',
                DB::raw('COUNT(company_info.company_id) as total_customers_onboarded'),
                DB::raw('COUNT(CASE WHEN company_info.block_status = 0 THEN 1 END) as active_customers'),
                DB::raw('COUNT(CASE WHEN company_info.block_status = 1 THEN 1 END) as blocked_customers'),
                DB::raw('COUNT(CASE WHEN company_info.subscription_validity < NOW() THEN 1 END) as expired_subscriptions')
            )
            ->groupBy(
                'onboarding_partners.id',
                'onboarding_partners.name',
                'onboarding_partners.mobile',
                'onboarding_partners.email',
                'onboarding_partner_types.partner_type',
                'onboarding_partner_types.commission'
            )
            ->orderBy('total_customers_onboarded', 'desc')
            ->get();

        // Get customers count per partner with detailed info
        foreach ($partnersSummary as $partner) {
            $customers = DB::table('customers')
                ->join('company_info', 'customers.company_id', '=', 'company_info.company_id')
                ->where('company_info.refer_by_id', $partner->partner_id)
                ->select(
                    DB::raw('COUNT(customers.id) as total_end_customers'),
                    DB::raw('SUM(CASE WHEN customers.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_customers_last_30_days')
                )
                ->first();

            $partner->total_end_customers = $customers->total_end_customers ?? 0;
            $partner->new_customers_last_30_days = $customers->new_customers_last_30_days ?? 0;
        }

        return [
            'partners' => $partnersSummary,
            'summary' => [
                'total_partners' => $partnersSummary->count(),
                'total_customers_onboarded' => $partnersSummary->sum('total_customers_onboarded'),
                'total_active_customers' => $partnersSummary->sum('active_customers'),
                'total_blocked_customers' => $partnersSummary->sum('blocked_customers'),
                'total_expired_subscriptions' => $partnersSummary->sum('expired_subscriptions'),
                'total_end_customers' => $partnersSummary->sum('total_end_customers')
            ]
        ];
    }

    /**
 * C) Get payment details across all categories
 */
public function getPaymentOverview($startDate, $endDate)
{
    // Partner commission payments
    $partnerPayments = DB::table('company_receipts')
        ->join('company_info', 'company_receipts.company_id', '=', 'company_info.company_id')
        ->join('onboarding_partners', 'company_info.refer_by_id', '=', 'onboarding_partners.id')
        ->join('onboarding_partner_types', 'onboarding_partners.type_id', '=', 'onboarding_partner_types.id')
        ->whereBetween('company_receipts.created_at', [$startDate, $endDate])
        ->where('company_receipts.transaction_status', 'success')
        ->select(
            'onboarding_partners.name as partner_name',
            'onboarding_partner_types.commission as commission_rate',
            DB::raw('SUM(company_receipts.total_amount) as total_revenue'),
            DB::raw('SUM((company_receipts.total_amount * onboarding_partner_types.commission) / 100) as total_commission'),
            DB::raw('COUNT(company_receipts.id) as total_transactions')
        )
        ->groupBy('onboarding_partners.id', 'onboarding_partners.name', 'onboarding_partner_types.commission')
        ->get();

    // Subscription payments
    $subscriptionPayments = DB::table('company_receipts')
        ->join('plans', 'company_receipts.plan_id', '=', 'plans.id')
        ->whereBetween('company_receipts.created_at', [$startDate, $endDate])
        ->where('company_receipts.transaction_status', 'success')
        ->select(
            'plans.name as plan_name',
            'plans.price as plan_price',
            DB::raw('COUNT(company_receipts.id) as total_subscriptions'),
            DB::raw('SUM(company_receipts.total_amount) as total_revenue')
        )
        ->groupBy('plans.id', 'plans.name', 'plans.price')
        ->get();

    // Get available columns from company_info table to handle different schema versions
    $companyColumns = DB::getSchemaBuilder()->getColumnListing('company_info');
    
    // Determine which owner field to use
    $ownerField = null;
    if (in_array('owner_name', $companyColumns)) {
        $ownerField = 'company_info.owner_name';
    } elseif (in_array('owner', $companyColumns)) {
        $ownerField = 'company_info.owner';
    } elseif (in_array('contact_person', $companyColumns)) {
        $ownerField = 'company_info.contact_person';
    } else {
        $ownerField = 'company_info.company_name'; // fallback to company name
    }

    // Customer payment details - combining subscription info with outstanding balances (filtered by date)
    $customerPayments = DB::table('company_info')
        ->leftJoin('plans', 'company_info.subscribed_plan', '=', 'plans.id')
        ->leftJoin('payment_trackers', function($join) {
            $join->on('payment_trackers.customer_id', '=', DB::raw('(SELECT id FROM customers WHERE company_id = company_info.company_id LIMIT 1)'));
        })
        ->leftJoin(DB::raw("(SELECT 
            company_id, 
            SUM(total_amount) as amount_paid,
            MAX(created_at) as last_payment_date,
            CASE 
                WHEN COUNT(CASE WHEN transaction_status = 'success' THEN 1 END) = COUNT(*) THEN 'paid'
                WHEN COUNT(CASE WHEN transaction_status = 'success' THEN 1 END) > 0 THEN 'partial'
                ELSE 'unpaid'
            END as payment_status
            FROM company_receipts 
            WHERE transaction_status IN ('success', 'pending', 'failed')
            AND created_at BETWEEN '{$startDate}' AND '{$endDate}'
            GROUP BY company_id
        ) as receipt_summary"), 'receipt_summary.company_id', '=', 'company_info.company_id')
        ->where('company_info.block_status', 0) // Only active companies
        ->whereExists(function($query) use ($startDate, $endDate) {
            $query->select(DB::raw(1))
                  ->from('company_receipts')
                  ->whereRaw('company_receipts.company_id = company_info.company_id')
                  ->whereBetween('company_receipts.created_at', [$startDate, $endDate]);
        })
        ->select(
            'company_info.company_name',
            DB::raw("{$ownerField} as owner_name"),
            'plans.name as plan_name',
            DB::raw('COALESCE(receipt_summary.amount_paid, 0) as amount_paid'),
            DB::raw('COALESCE(payment_trackers.amount, 0) as outstanding_amount'),
            DB::raw('COALESCE(receipt_summary.payment_status, "unpaid") as payment_status'),
            'receipt_summary.last_payment_date'
        )
        ->orderBy('company_info.company_name')
        ->get();

    return [
        'partner_payments' => $partnerPayments,
        'customer_payments' => $customerPayments,
        'subscription_payments' => $subscriptionPayments,
        'summary' => [
            'total_partner_commission' => $partnerPayments->sum('total_commission'),
            'total_subscription_revenue' => $subscriptionPayments->sum('total_revenue'),
            'total_customer_outstanding' => $customerPayments->sum('outstanding_amount'),
            'total_customer_receivable' => $customerPayments->where('outstanding_amount', '>', 0)->sum('outstanding_amount'),
            'total_customer_payable' => $customerPayments->where('outstanding_amount', '<', 0)->sum(function($payment) {
                return abs($payment->outstanding_amount);
            })
        ]
    ];
}

   /**
 * D) Get commission calculation for all partners with date range support
 */
public function getAllPartnersCommissionSummary($startDate, $endDate)
{
    // Handle different date scenarios
    $isAllMonths = empty($startDate) || $startDate === 'all' || $startDate === null;
    
    if ($isAllMonths) {
        // For all months, don't apply date filters
        $periodLabel = 'All Time';
        $month = null;
        $year = null;
    } else {
        // Parse the date for specific month/year
        $startDateParsed = Carbon::parse($startDate);
        $month = $startDateParsed->month;
        $year = $startDateParsed->year;
        $periodLabel = $startDateParsed->format('F Y');
    }

    $query = DB::table('onboarding_partners')
        ->leftJoin('onboarding_partner_types', 'onboarding_partners.type_id', '=', 'onboarding_partner_types.id')
        ->leftJoin('company_info', 'onboarding_partners.id', '=', 'company_info.refer_by_id')
        ->leftJoin('company_receipts', function($join) use ($isAllMonths, $startDate, $endDate) {
            $join->on('company_info.company_id', '=', 'company_receipts.company_id')
                 ->where('company_receipts.transaction_status', 'success');
            
            // Apply date filters only if not "all months"
            if (!$isAllMonths) {
                if ($startDate && $endDate) {
                    // Date range filter
                    $join->whereBetween('company_receipts.created_at', [$startDate, $endDate]);
                } elseif ($startDate) {
                    // Single month filter
                    $startDateParsed = Carbon::parse($startDate);
                    $join->whereMonth('company_receipts.created_at', $startDateParsed->month)
                         ->whereYear('company_receipts.created_at', $startDateParsed->year);
                }
            }
        });

    $partnersCommission = $query->select(
            'onboarding_partners.id as partner_id',
            'onboarding_partners.name as partner_name',
            'onboarding_partners.mobile as partner_mobile',
            'onboarding_partners.email as partner_email',
            'onboarding_partner_types.partner_type',
            'onboarding_partner_types.commission as commission_rate',
            DB::raw('COUNT(DISTINCT company_info.company_id) as total_referred_companies'),
            DB::raw('COUNT(DISTINCT company_receipts.company_id) as companies_with_payments'),
            DB::raw('COUNT(company_receipts.id) as total_transactions'),
            DB::raw('COALESCE(SUM(company_receipts.total_amount), 0) as revenue_generated'),
            DB::raw('COALESCE(SUM((company_receipts.total_amount * onboarding_partner_types.commission) / 100), 0) as commission_earned')
        )
        ->groupBy(
            'onboarding_partners.id',
            'onboarding_partners.name',
            'onboarding_partners.mobile',
            'onboarding_partners.email',
            'onboarding_partner_types.partner_type',
            'onboarding_partner_types.commission'
        )
        ->orderBy('commission_earned', 'desc')
        ->get();

    return [
        'partners_commission' => $partnersCommission,
        'period' => [
            'month' => $month,
            'year' => $year,
            'month_name' => $periodLabel,
            'is_all_months' => $isAllMonths,
            'start_date' => $startDate,
            'end_date' => $endDate
        ],
        'summary' => [
            'total_partners' => $partnersCommission->count(),
            'total_commission_paid' => $partnersCommission->sum('commission_earned'),
            'total_revenue_generated' => $partnersCommission->sum('revenue_generated'),
            'partners_with_earnings' => $partnersCommission->where('commission_earned', '>', 0)->count(),
            'average_commission_per_partner' => $partnersCommission->count() > 0 ? 
                $partnersCommission->sum('commission_earned') / $partnersCommission->count() : 0
        ]
    ];
}

    /**
 * E) Get renewal alerts and subscription follow-up info
 */
public function getRenewalAlerts()
{
    $today = Carbon::now();
    $oneMonthFromNow = $today->copy()->addMonth();
    
    // Use start of day for more accurate date comparisons
    $todayStart = $today->startOfDay();
    $todayEnd = $today->copy()->endOfDay();

    // First, let's check what columns exist in company_info table
    // Get available columns from company_info table
    $companyColumns = DB::getSchemaBuilder()->getColumnListing('company_info');
    
    // Determine which owner field to use
    $ownerField = null;
    if (in_array('owner_name', $companyColumns)) {
        $ownerField = 'company_info.owner_name';
    } elseif (in_array('owner', $companyColumns)) {
        $ownerField = 'company_info.owner';
    } elseif (in_array('contact_person', $companyColumns)) {
        $ownerField = 'company_info.contact_person';
    } else {
        $ownerField = 'company_info.company_name'; // fallback to company name
    }

    // Companies expiring within 1 month (but not yet expired)
    $expiringCompanies = DB::table('company_info')
        ->leftJoin('onboarding_partners', 'company_info.refer_by_id', '=', 'onboarding_partners.id')
        ->leftJoin('plans', 'company_info.subscribed_plan', '=', 'plans.id')
        ->whereRaw('DATE(company_info.subscription_validity) >= ?', [$todayStart->format('Y-m-d')])
        ->whereRaw('DATE(company_info.subscription_validity) <= ?', [$oneMonthFromNow->format('Y-m-d')])
        ->where('company_info.block_status', 0)
        ->select(
            'company_info.company_id',
            'company_info.company_name',
            'company_info.email_id',
            DB::raw("{$ownerField} as owner_name"),
            'company_info.phone_no',
            'company_info.subscription_validity',
            'plans.name as current_plan',
            'plans.price as plan_price',
            'onboarding_partners.name as partner_name',
            'onboarding_partners.mobile as partner_mobile',
            DB::raw('DATEDIFF(DATE(company_info.subscription_validity), CURDATE()) as days_remaining')
        )
        ->orderBy('company_info.subscription_validity', 'asc')
        ->get();

    // Already expired companies (subscription_validity is before today)
    $expiredCompanies = DB::table('company_info')
        ->leftJoin('onboarding_partners', 'company_info.refer_by_id', '=', 'onboarding_partners.id')
        ->leftJoin('plans', 'company_info.subscribed_plan', '=', 'plans.id')
        ->whereRaw('DATE(company_info.subscription_validity) < ?', [$todayStart->format('Y-m-d')])
        ->where('company_info.block_status', 0)
        ->select(
            'company_info.company_id',
            'company_info.company_name',
            'company_info.email_id',
            DB::raw("{$ownerField} as owner_name"),
            'company_info.phone_no',
            'company_info.subscription_validity',
            'plans.name as current_plan',
            'plans.price as plan_price',
            'onboarding_partners.name as partner_name',
            'onboarding_partners.mobile as partner_mobile',
            DB::raw('DATEDIFF(CURDATE(), DATE(company_info.subscription_validity)) as days_expired')
        )
        ->orderBy('company_info.subscription_validity', 'desc')
        ->get();

    // Debug: Add some logging to see what's happening
    \Log::info('Renewal Alerts Debug:', [
        'today' => $todayStart->format('Y-m-d'),
        'expiring_count' => $expiringCompanies->count(),
        'expired_count' => $expiredCompanies->count(),
        'sample_subscription_dates' => DB::table('company_info')
            ->select('company_id', 'company_name', 'subscription_validity')
            ->where('block_status', 0)
            ->limit(5)
            ->get()
    ]);

    // Renewal statistics by urgency
    $renewalStats = [
        'expiring_this_week' => $expiringCompanies->where('days_remaining', '<=', 7)->count(),
        'expiring_this_month' => $expiringCompanies->count(),
        'already_expired' => $expiredCompanies->count(),
        'total_requiring_attention' => $expiringCompanies->count() + $expiredCompanies->count()
    ];

    return [
        'expiring_companies' => $expiringCompanies,
        'expired_companies' => $expiredCompanies,
        'renewal_stats' => $renewalStats,
        'summary' => [
            'critical_renewals' => $expiringCompanies->where('days_remaining', '<=', 7)->count(),
            'upcoming_renewals' => $expiringCompanies->where('days_remaining', '>', 7)->count(),
            'overdue_renewals' => $expiredCompanies->count(),
            'potential_revenue_at_risk' => $expiringCompanies->sum('plan_price') + $expiredCompanies->sum('plan_price')
        ]
    ];
}

    /**
     * Get detailed sales report for specific company
     */
    public function getCompanyDetailedSales(Request $request, $companyId)
    {
        $startDate = $request->query('startDate', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->query('endDate', Carbon::now()->endOfMonth()->format('Y-m-d'));

        $companySales = Order::with(['customer:id,name,mobile', 'user:id,name,mobile', 'items'])
            ->where('company_id', $companyId)
            ->where('orderStatus', 1)
            ->whereBetween('invoiceDate', [$startDate, $endDate])
            ->orderBy('invoiceDate', 'desc')
            ->get();

        $companyInfo = CompanyInfo::where('company_id', $companyId)->first();

        $summary = [
            'total_orders' => $companySales->count(),
            'total_sales' => $companySales->sum('totalAmount'),
            'total_paid' => $companySales->sum('paidAmount'),
            'total_pending' => $companySales->sum(function($order) {
                return $order->finalAmount - $order->paidAmount;
            }),
            'total_profit' => $companySales->sum('profit'),
            'unique_customers' => $companySales->pluck('customer_id')->unique()->count()
        ];

        return response()->json([
            'success' => true,
            'company_info' => $companyInfo,
            'sales_data' => $companySales,
            'summary' => $summary,
            'date_range' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ], 200);
    }

    /**
     * Get partner detailed commission report
     */
    public function getPartnerDetailedCommission(Request $request, $partnerId)
    {
        $month = $request->query('month', Carbon::now()->month);
        $year = $request->query('year', Carbon::now()->year);

        $partner = OnboardingPartner::with('partner_types')->find($partnerId);
        
        if (!$partner) {
            return response()->json([
                'success' => false,
                'message' => 'Partner not found'
            ], 404);
        }

        $commissionRate = $partner->partner_types->commission ?? 0;

        // Get companies referred by this partner
        $companyIds = CompanyInfo::where('refer_by_id', $partnerId)->pluck('company_id');
        
        // Get receipts for the specified month/year for referred companies
        $receipts = CompanyReceipt::whereIn('company_id', $companyIds)
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->where('transaction_status', 'success')
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
            'success' => true,
            'partner' => $partner,
            'month' => $month,
            'year' => $year,
            'commission_rate' => $commissionRate,
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
     * Get monthly trends for admin dashboard
     */
    public function getMonthlyTrends(Request $request)
    {
        $year = $request->query('year', Carbon::now()->year);

        $monthlyData = [];
        
        for ($month = 1; $month <= 12; $month++) {
            // Sales data
            $monthlySales = Order::whereMonth('invoiceDate', $month)
                ->whereYear('invoiceDate', $year)
                ->where('orderStatus', 1)
                ->sum('totalAmount');

            // Commission data
            $monthlyCommission = DB::table('company_receipts')
                ->join('company_info', 'company_receipts.company_id', '=', 'company_info.company_id')
                ->join('onboarding_partners', 'company_info.refer_by_id', '=', 'onboarding_partners.id')
                ->join('onboarding_partner_types', 'onboarding_partners.type_id', '=', 'onboarding_partner_types.id')
                ->whereMonth('company_receipts.created_at', $month)
                ->whereYear('company_receipts.created_at', $year)
                ->where('company_receipts.transaction_status', 'success')
                ->sum(DB::raw('(company_receipts.total_amount * onboarding_partner_types.commission) / 100'));

            // New companies onboarded
            $newCompanies = CompanyInfo::whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->count();

            $monthlyData[] = [
                'month' => $month,
                'month_name' => Carbon::create($year, $month, 1)->format('F'),
                'year' => $year,
                'total_sales' => $monthlySales,
                'total_commission' => $monthlyCommission,
                'new_companies' => $newCompanies
            ];
        }

        return response()->json([
            'success' => true,
            'year' => $year,
            'monthly_trends' => $monthlyData,
            'yearly_summary' => [
                'total_sales' => array_sum(array_column($monthlyData, 'total_sales')),
                'total_commission' => array_sum(array_column($monthlyData, 'total_commission')),
                'total_new_companies' => array_sum(array_column($monthlyData, 'new_companies'))
            ]
        ], 200);
    }
}