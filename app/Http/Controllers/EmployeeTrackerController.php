<?php

namespace App\Http\Controllers;

use App\Models\EmployeeTracker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\EmployeeTransaction;
use App\Models\CompanyCordinate;


class EmployeeTrackerController extends Controller
{
    /* GET /api/employee-tracker */
    public function index(): JsonResponse
    {
        return response()->json(EmployeeTracker::latest()->paginate(15));
    }

    /* POST /api/employee-tracker */
    public function store(Request $request)
{
    $data = $this->validatedData($request);

    // get the single employee row that matches the logged‑in user’s mobile
    $employeeId = Employee::where('mobile', auth()->user()->mobile)
                          ->value('id');          // returns the id directly

    $data['company_id'] = auth()->user()->company_id;
    $data['product_id'] = auth()->user()->product_id;
    $data['employee_id'] = $employeeId;           // now an actual integer

    $tracker = EmployeeTracker::create($data);

    return response()->json($tracker, 201);
}

public function payment(Request $request)
{
    /* 1. Validate input --------------------------------------------------- */
    $validated = $request->validate([
        'start_date'   => ['required', 'date_format:Y-m-d'],   // enforce real dates
        'end_date'     => ['required', 'date_format:Y-m-d'],
        'employee_id'  => ['required', 'integer', 'exists:employee,id'],
        'payed_amount' => ['required','integer'],
        'salary_amount'=> ['required', 'integer'],
        'payment_type' => ['required', 'in:cash,upi,bank_transfer'],
    ]);

    if ($validated['payed_amount'] > $validated['salary_amount']) {
        return response()->json(['message' => 'Please enter a correct amount.'], 422);
    }

    // Wrap everything in a single DB transaction --------------------------
    DB::transaction(function () use (&$validated) {

        $employee = Employee::lockForUpdate()->find($validated['employee_id']);

        // 2. Handle debit logic --------------------------------------------
        if ($validated['payed_amount'] < $validated['salary_amount']) {
            $debit = $validated['salary_amount'] - $validated['payed_amount'];
            $employee->debit += $debit;
            $employee->save();                // remember: save(), not update()
        }

        // 3. Create the employee transaction -------------------------------
        $validated += [
            'product_id'       => auth()->user()->product_id(),
            'company_id'       => auth()->user()->company_id(),
            'transaction_type' => 'payment',
        ];
        EmployeeTransaction::create($validated);

        // 4. Mark tracker rows as paid -------------------------------------
        EmployeeTracker::where('employee_id', $employee->id)
            ->whereDate('work_date', '>=', $validated['start_date'])
            ->whereDate('work_date', '<=', $validated['end_date'])
            ->where('payment_status', 0)      // only unpaid rows
            ->update(['payment_status' => 1]);
    });

    return response()->json(['message' => 'Payment recorded and trackers updated.'], 201);
}


public function bulkCheckIn(Request $request)
    {
        /* --------------------------------------------------------------------
         * 1. Validate input
         * ------------------------------------------------------------------ */
        $data = $request->validate([
            'employees'   => ['required', 'array', 'min:1'],
            'employees.*' => ['integer', 'distinct'],
        ]);

        /* --------------------------------------------------------------------
         * 2. Resolve product / company from the logged‑in user
         * ------------------------------------------------------------------ */
        $productId = auth()->user()->product_id;   // property, not method
        $companyId = auth()->user()->company_id;

        /* --------------------------------------------------------------------
         * 3. Fetch the single reference‑coordinate row for this company
         * ------------------------------------------------------------------ */
        $coord = CompanyCordinate::where('product_id',  $productId)
                  ->where('company_id', $companyId)
                  ->firstOrFail();                       // 404 if missing

        $checkInGps = $coord->required_lat . ',' . $coord->required_lng;
        $today      = now()->toDateString();            // “YYYY‑MM‑DD” (Asia/Kolkata)

        /* --------------------------------------------------------------------
         * 4. Insert rows inside one transaction
         * ------------------------------------------------------------------ */
        $inserted = $skipped = 0;

        DB::transaction(function () use (
            $data, $productId, $companyId, $checkInGps, $today,
            &$inserted, &$skipped
        ) {
            // 4‑A. Pull IDs already checked‑in today
            $already = EmployeeTracker::where('company_id', $companyId)
                       ->whereDate('created_at', $today)
                       ->whereIn('employee_id', $data['employees'])
                       ->pluck('employee_id')
                       ->all();

            $newIds = array_diff($data['employees'], $already);
            $skipped  = count($already);

            if (empty($newIds)) {
                // nothing to insert – leave early, transaction is cheap
                return;
            }

            // 4‑B. Build the bulk‑insert array
            $now  = now();
            $rows = [];

            foreach ($newIds as $employeeId) {
                $rows[] = [
                    'product_id'     => $productId,
                    'company_id'     => $companyId,
                    'employee_id'    => $employeeId,
                    'check_in'       => true,
                    'check_out'      => false,
                    'payment_status' => false,
                    'check_in_gps'   => $checkInGps,
                    'check_out_gps'  => null,
                    'check_out_time' => null,
                    // 'work_date'      => $today,   // <‑‑ new column with unique index
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ];
            }

            EmployeeTracker::insert($rows);  // one round‑trip to DB
            $inserted = count($rows);
        });

        /* --------------------------------------------------------------------
         * 5. Return JSON response
         * ------------------------------------------------------------------ */
        return response()->json([
            'message'     => 'Bulk check‑in completed.',
            'attempted'   => count($data['employees']),
            'inserted'    => $inserted,
            'skipped'     => $skipped,
            'product_id'  => $productId,
            'company_id'  => $companyId,
            'work_date'   => $today,
        ], 201);
    }


public function bulkCheckOut(Request $request)
{
    /* 1. Validate the payload -------------------------------------------------- */
    $data = $request->validate([
        'employees'   => ['required', 'array', 'min:1'],
        'employees.*' => ['integer', 'distinct'],
    ]);

    /* 2. Resolve product & company from the logged‑in user --------------------- */
    $productId = auth()->user()->product_id;   // property, not method
    $companyId = auth()->user()->company_id;

    /* 3. Look up the reference GPS once ---------------------------------------- */
    $coord = CompanyCordinate::where('product_id',  $productId)
              ->where('company_id', $companyId)    // spelling matches migration
              ->firstOrFail();                      // 404 if missing

    $checkOutGps = $coord->required_lat . ',' . $coord->required_lng;
    $now         = Carbon::now();

    /* 4. Bulk update inside a transaction -------------------------------------- */
    $updated = DB::transaction(function () use (
        $data, $productId, $companyId, $checkOutGps, $now
    ) {
        return EmployeeTracker::where('product_id',  $productId)
            ->where('company_id',  $companyId)
            ->whereIn('employee_id', $data['employees'])
            ->whereDate('created_at', $now->toDateString()) // “today’s” entry
            ->update([
                'check_out'      => true,
                'check_out_gps'  => $checkOutGps,
                'check_out_time' => $now,
                'updated_at'     => $now,   // makes the bulk update explicit
            ]);
    });

    /* 5. Respond ---------------------------------------------------------------- */
    return response()->json([
        'message'      => 'Check‑out processed.',
        'rows_updated' => $updated,           // how many employees were matched
        'product_id'   => $productId,
        'company_id'   => $companyId,
    ], 200);
}


 public function workSummary(Request $request)
    {
        /* 1. Validate input --------------------------------------------------- */
        $validated = $request->validate([
            'employee_id'    => ['required', 'integer', 'exists:employee,id'],
            'start_date'     => ['required', 'date'],
            'end_date'       => ['required', 'date', 'after_or_equal:start_date'],
            'working_hours'  => ['sometimes', 'numeric', 'min:1'],
        ]);

        $employeeId = (int) $validated['employee_id'];
        $standard   = (int) ($validated['working_hours'] ?? 9);

        $start = Carbon::parse($validated['start_date'], 'Asia/Kolkata')->startOfDay();
        $end   = Carbon::parse($validated['end_date'],   'Asia/Kolkata')->endOfDay();

        /* 2. Aggregate per day (one SQL query) ------------------------------- */
      $daily = EmployeeTracker::query()
    ->selectRaw(
        'DATE(created_at) AS work_date,
         SUM(TIMESTAMPDIFF(MINUTE, created_at, check_out_time))                 AS worked_minutes,
         SUM(GREATEST(TIMESTAMPDIFF(MINUTE, created_at, check_out_time) - ?, 0)) AS overtime_minutes',
        [$standard * 60]
    )
    ->where('employee_id', $employeeId)
    ->where('payment_status', 0)          // ← only rows that are still unpaid
    ->whereBetween('created_at', [$start, $end])
    ->whereNotNull('check_out_time')
    ->groupBy(DB::raw('DATE(created_at)'))
    ->orderBy('work_date')
    ->get();


        /* 3. Build per‑day payload ------------------------------------------- */
        $payload = $daily->map(fn ($d) => [
            'date'           => $d->work_date,
            'worked_hours'   => round($d->worked_minutes   / 60, 2),
            'overtime_hours' => round($d->overtime_minutes / 60, 2),
        ]);

        /* 4. Grand totals (minutes) ------------------------------------------ */
        $totalWorkedMinutes   = $daily->sum('worked_minutes');
        $totalOvertimeMinutes = $daily->sum('overtime_minutes');

        /* 5. Apply 30‑minute rounding on totals ------------------------------ */
        $roundHours = static fn (int $minutes) => intdiv($minutes, 60)
                                            + (($minutes % 60) > 30 ? 1 : 0);

        $totalWorkedHours   = $roundHours($totalWorkedMinutes);
        $overtimeHours      = $roundHours($totalOvertimeMinutes);

        /* 6. NEW: regular hours (worked – overtime) -------------------------- */
        $regularHours = max($totalWorkedHours - $overtimeHours, 0);

        /* 7. Respond ---------------------------------------------------------- */
        return response()->json([
            'employee_id'         => $employeeId,
            'start_date'          => $validated['start_date'],
            'end_date'            => $validated['end_date'],
            'standard_day_hours'  => $standard,
            'payload'             => $payload,
            'total_worked_hours'  => $totalWorkedHours,
            'overtime_hours'      => $overtimeHours,
            'regular_hours'       => $regularHours,   // ← third output you asked for
        ]);
    }

public function checkTodayStatus(Request $request): JsonResponse
{
    // Step 1: Get employee ID from logged-in user’s mobile
    $employeeId = Employee::where('mobile', auth()->user()->mobile)->value('id');

    if (!$employeeId) {
        return response()->json([
            'message' => 'Employee not found for this user.',
        ], 404);
    }

    // Step 2: Check for today's tracker entry
    $today = Carbon::today()->toDateString(); // e.g. "2025-07-07"

    $tracker = EmployeeTracker::where('employee_id', $employeeId)
        ->whereDate('created_at', $today)
        ->first();

    if (!$tracker) {
        return response()->json([
            'checkIn' => false,
            'checkOut' => false,
        ]);
    }

    return response()->json([
        'tracker_id'=>$tracker->id,
        'checkIn' => $tracker->check_in ?? false,
        'checkOut' => $tracker->check_out ?? false,
    ]);
}


    /* GET /api/employee-tracker/{tracker} */
    public function show(EmployeeTracker $employeeTracker): JsonResponse
    {
        return response()->json($employeeTracker);
    }

    /* PUT / PATCH /api/employee-tracker/{tracker} */
    public function update(Request $request,$id){
        $data = $request->validate([
            'check_out_gps'  => ['nullable', 'string', 'max:255'],
        ]);
        $data['check_out_time'] = Carbon::now();
        $data['check_out'] = true;
        $employeeTracker=EmployeeTracker::find($id);
        $employeeTracker->update($data);
        return response()->json($employeeTracker);
    }

    /* DELETE /api/employee-tracker/{tracker} */
    public function destroy(EmployeeTracker $employeeTracker): JsonResponse
    {
        $employeeTracker->delete();

        return response()->json(null, 204);
    }

    /* ────────────────
       Central validator
    ─────────────────── */
    protected function validatedData(Request $request)
    {
        return $request->validate([
            'product_id'    => ['nullable', 'exists:products,id'],
            'employee_id'    => ['nullable', 'exists:employee,id'],
            'company_id'     => ['nullable', 'integer', 'exists:company_info,company_id'],
            'check_in'       => ['boolean'],
            'check_out'      => ['boolean'],
            'payment_status' => ['boolean'],
            'check_out_time' => ['nullable', 'string', 'max:255'],
            'check_in_gps'   => ['nullable', 'string', 'max:255'],
            'check_out_gps'  => ['nullable', 'string', 'max:255'],
        ]);
    }
}
