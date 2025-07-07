<?php

namespace App\Http\Controllers;

use App\Models\EmployeeTracker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;


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
