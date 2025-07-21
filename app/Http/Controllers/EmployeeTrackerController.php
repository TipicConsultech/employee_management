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
use App\Models\EmployeeFaceAttendance;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;       // Log::debug(), Log::info(), ...
use App\Models\CompanyInfo;
use App\Models\Products;


class EmployeeTrackerController extends Controller
{
    /* GET /api/employee-tracker */
    public function index(): JsonResponse
    {
        return response()->json(EmployeeTracker::latest()->paginate(15));
    }

public function updateTraker(Request $request, $id) {
    // Validate input fields
    $validatedData = $request->validate([
        'check_in_time'   => 'nullable|date',
        'check_out_time'  => 'nullable|date',
        'half_day'        => 'nullable|boolean',
        'status'          => 'nullable|in:CL,PL,SL,NA,H',
    ]);

    // Find tracker
    $tracker = EmployeeTracker::findOrFail($id);
    $CompanyCoordinates=CompanyCordinate::where('company_id',auth()->user()->company_id)->first();
    // Prepare update array
    $updateData = [];

    if (isset($validatedData['check_in_time'])) {
        $updateData['check_in_time'] = $validatedData['check_in_time'];
    }

    if (isset($validatedData['check_out_time'])) {
        $updateData['check_out_time'] = $validatedData['check_out_time'];
        $updateData['check_out'] = true; // assuming 'check_out' is a boolean column
        $updateData['check_out_gps'] = $CompanyCoordinates->required_lat . "," . $CompanyCoordinates->required_lng;
    }

    if (isset($validatedData['half_day'])) {
        $updateData['half_day'] = $validatedData['half_day'];
    }

    if (isset($validatedData['status'])) {
        $updateData['status'] = $validatedData['status'];
    }

    // Update tracker
    $tracker->update($updateData);

    return response()->json([
        'message' => 'Tracker updated successfully',
        'data' => $tracker
    ]);
}




    public function store(Request $request)
    {
        /* 1. Validate ---------------------------------------------------- */
        $validated = $request->validate([
            'check_in_gps' => ['required', 'string', 'max:255'],
            'checkin_img' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:2048'],
        ]);
        $validated['check_in'] = 1;
        $validated['payment_status'] = 0;
        $validated['check_out'] = 0;


        /* 2. Resolve current user / context ----------------------------- */
        $employee = Employee::where('mobile', auth()->user()->mobile)->firstOrFail();
        $product = Products::findOrFail(auth()->user()->product_id);
        $company = CompanyInfo::where('product_id', $product->id)->first();

        /* 3. Transaction ------------------------------------------------- */
        return DB::transaction(function () use ($validated, $request, $employee, $product, $company) {

            /* 3‑a Guard: only one tracker today ------------------------- */
            $exists = EmployeeTracker::where('employee_id', $employee->id)
                ->whereDate('created_at', Carbon::today())
                ->lockForUpdate()
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'Employee already checked in today.',
                ], 409);
            }

            /* 3‑b Create tracker row ----------------------------------- */
            $tracker = EmployeeTracker::create([
                'check_in' => $validated['check_in'] ?? false,
                'check_out' => $validated['check_out'] ?? false,
                'payment_status' => $validated['payment_status'] ?? false,
                'check_in_gps' => $validated['check_in_gps'] ?? null,
                'company_id' => auth()->user()->company_id,
                'product_id' => auth()->user()->product_id,
                'employee_id' => $employee->id,
            ]);

            /* 3‑c If no image, finish here ---------------------------- */
            if (!$request->hasFile('checkin_img')) {
                return response()->json([
                    'tracker' => $tracker,
                ], 201);
            }

           

            // pull context data exactly like before …
            $employee = Employee::where('mobile', auth()->user()->mobile)->firstOrFail();
            $product = Products::findOrFail(auth()->user()->product_id);
            $company = CompanyInfo::where('product_id', $product->id)->first();

            $file = $request->file('checkin_img');

            /** --------------------------------------------------------------
             *  1) Build the file name (same as before, or whatever you like)
             * --------------------------------------------------------------*/
            $picture = 'checkout_' . now()->format('d-m-Y_H-i-s') . '.' . $file->extension();     // e.g. checkout_1720783214.png

            /** --------------------------------------------------------------
             *  2) Build the full disk path you want to write to
             *     …/public_html/ems/img/{dest}/…
             * --------------------------------------------------------------*/
            $destFolder = $request->input('dest', 'face_attendance' . '/' . Str::slug($product->product_name) . '/' . Str::slug($company->company_name ?? 'company') . '/' . 'emp-' . Str::slug($employee->name));   // default if dest not sent
            $diskPath = public_path(
                env('UPLOAD_PATH') . 'img/' . $destFolder
            );

            /** --------------------------------------------------------------
             *  3) Ensure the directory exists (first run only)
             * --------------------------------------------------------------*/
            if (!\File::exists($diskPath)) {
                \File::makeDirectory($diskPath, 0755, true);
            }

            /** --------------------------------------------------------------
             *  4) Move the file
             * --------------------------------------------------------------*/
            $file->move($diskPath, $picture);

            /** --------------------------------------------------------------
             *  5) Build the public URL so the frontend can load it
             *     https://{APP_URL}/ems/img/{dest}/…
             * --------------------------------------------------------------*/
            $checkinImgUrl = url(
                trim(env('UPLOAD_URL'), '/')  // “ems”
                . '/img/' . $destFolder . '/' . $picture
            );



            $attendance = EmployeeFaceAttendance::create([
                'employee_tracker_id' => $tracker->id,
                'checkin_img' => $checkinImgUrl,
                'checkout_img' => null,
            ]);

            return response()->json([
                'tracker' => $tracker,
                'attendance' => $attendance,
                'message' => 'Tracker & check‑in image saved successfully.',
            ], 201);
        });
    }

    public function payment(Request $request)
    {
        /* 1. Validate input --------------------------------------------------- */
        $validated = $request->validate([
            'start_date' => ['required', 'date_format:Y-m-d'],   // enforce real dates
            'end_date' => ['required', 'date_format:Y-m-d'],
            'employee_id' => ['required', 'integer', 'exists:employee,id'],
            'payed_amount' => ['required', 'integer'],
            'salary_amount' => ['required', 'integer'],
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
                'product_id' => auth()->user()->product_id(),
                'company_id' => auth()->user()->company_id(),
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
            'employees' => ['required', 'array', 'min:1'],
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
        $coord = CompanyCordinate::where('product_id', $productId)
            ->where('company_id', $companyId)
            ->firstOrFail();                       // 404 if missing

        $checkInGps = $coord->required_lat . ',' . $coord->required_lng;
        $today = now()->toDateString();            // “YYYY‑MM‑DD” (Asia/Kolkata)

        /* --------------------------------------------------------------------
         * 4. Insert rows inside one transaction
         * ------------------------------------------------------------------ */
        $inserted = $skipped = 0;

        DB::transaction(function () use ($data, $productId, $companyId, $checkInGps, $today, &$inserted, &$skipped) {
            // 4‑A. Pull IDs already checked‑in today
            $already = EmployeeTracker::where('company_id', $companyId)
                ->whereDate('created_at', $today)
                ->whereIn('employee_id', $data['employees'])
                ->pluck('employee_id')
                ->all();

            $newIds = array_diff($data['employees'], $already);
            $skipped = count($already);

            if (empty($newIds)) {
                // nothing to insert – leave early, transaction is cheap
                return;
            }

            // 4‑B. Build the bulk‑insert array
            $now = now();
            $rows = [];

            foreach ($newIds as $employeeId) {
                $rows[] = [
                    'product_id' => $productId,
                    'company_id' => $companyId,
                    'employee_id' => $employeeId,
                    'check_in' => true,
                    'check_out' => false,
                    'payment_status' => false,
                    'check_in_gps' => $checkInGps,
                    'check_out_gps' => null,
                    'check_out_time' => null,
                    // 'work_date'      => $today,   // <‑‑ new column with unique index
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            EmployeeTracker::insert($rows);  // one round‑trip to DB
            $inserted = count($rows);
        });

        /* --------------------------------------------------------------------
         * 5. Return JSON response
         * ------------------------------------------------------------------ */
        return response()->json([
            'message' => 'Bulk check‑in completed.',
            'attempted' => count($data['employees']),
            'inserted' => $inserted,
            'skipped' => $skipped,
            'product_id' => $productId,
            'company_id' => $companyId,
            'work_date' => $today,
        ], 201);
    }


    public function bulkCheckOut(Request $request)
    {
        /* 1. Validate the payload -------------------------------------------------- */
        $data = $request->validate([
            'employees' => ['required', 'array', 'min:1'],
            'employees.*' => ['integer', 'distinct'],
        ]);

        /* 2. Resolve product & company from the logged‑in user --------------------- */
        $productId = auth()->user()->product_id;   // property, not method
        $companyId = auth()->user()->company_id;

        /* 3. Look up the reference GPS once ---------------------------------------- */
        $coord = CompanyCordinate::where('product_id', $productId)
            ->where('company_id', $companyId)    // spelling matches migration
            ->firstOrFail();                      // 404 if missing

        $checkOutGps = $coord->required_lat . ',' . $coord->required_lng;
        $now = Carbon::now();

        /* 4. Bulk update inside a transaction -------------------------------------- */
        $updated = DB::transaction(function () use ($data, $productId, $companyId, $checkOutGps, $now) {
            return EmployeeTracker::where('product_id', $productId)
                ->where('company_id', $companyId)
                ->whereIn('employee_id', $data['employees'])
                ->whereDate('created_at', $now->toDateString()) // “today’s” entry
                ->update([
                    'check_out' => true,
                    'check_out_gps' => $checkOutGps,
                    'check_out_time' => $now,
                    'updated_at' => $now,   // makes the bulk update explicit
                ]);
        });

        /* 5. Respond ---------------------------------------------------------------- */
        return response()->json([
            'message' => 'Check‑out processed.',
            'rows_updated' => $updated,           // how many employees were matched
            'product_id' => $productId,
            'company_id' => $companyId,
        ], 200);
    }
  


public function workSummary(Request $request)
{
    /* 1. Validate input --------------------------------------------------- */
    $validated = $request->validate([
        'employee_id' => ['required', 'integer', 'exists:employee,id'],
        'start_date'  => ['required', 'date'],
        'end_date'    => ['required', 'date', 'after_or_equal:start_date'],
    ]);

    $employee     = Employee::find($validated['employee_id']);
    $validated['working_hours'] = $employee->working_hours;
    $employeeId   = (int) $validated['employee_id'];
    $standard     = (int) ($validated['working_hours'] ?? 9);

    $start = Carbon::parse($validated['start_date'], 'Asia/Kolkata')->startOfDay();
    $end   = Carbon::parse($validated['end_date'],   'Asia/Kolkata')->endOfDay();

    /* 2. One row per day -------------------------------------------------- */
    $dailyInfo = EmployeeTracker::query()
        ->selectRaw(
            'DATE(created_at)                            AS work_date,
             MAX(status)                                 AS day_status,
             MAX(half_day)                               AS half_day,
             MAX(payment_status)                         AS payment_status,
             SUM(
                 CASE
                     WHEN check_out_time IS NOT NULL
                     THEN TIMESTAMPDIFF(MINUTE, created_at, check_out_time)
                     ELSE 0
                 END
             )                                            AS worked_minutes'
        )
        ->where('employee_id', $employeeId)
        ->whereBetween('created_at', [$start, $end])
        ->groupBy(DB::raw('DATE(created_at)'))
        ->orderBy('work_date')
        ->get();

    /* 3. Helpers ---------------------------------------------------------- */
    $payloadType = static function (string $status, bool $halfDay): string {
        if ($status === 'H')                      return 'H';
        if (in_array($status, ['CL','PL','SL']))  return 'PL';
        return $halfDay ? 'HD' : 'P';
    };

    $attendanceType = static function (string $status, bool $halfDay): string {
        if ($status === 'H')                      return 'H';
        if (in_array($status, ['CL','PL','SL']))  return $status;   // keep real code
        return $halfDay ? 'HD' : 'P';
    };

    /* 4. Build arrays ----------------------------------------------------- */
    $payload  = [];
    $attendance = [];

    $totalWorkedMinutes   = 0;
    $totalOvertimeMinutes = 0;

    $overtimeDayCount = $regularDayCount = $paidLeavesCount = $holidayCount = $halfDayCount = 0;

    foreach ($dailyInfo as $d) {
        $isHalfDay = (bool) $d->half_day;
        $isPaid    = (bool) $d->payment_status;          // 1 = already settled

        $overtimeMinutes = max($d->worked_minutes - ($standard * 60), 0);

        /* ---- ATTENDANCE: always show ----------------------------------- */
        $attendance[] = [
            'type'           => $attendanceType($d->day_status, $isHalfDay),
            'date'           => $d->work_date,
            'total_hours'    => round($d->worked_minutes / 60),   // nearest int
            'payment_status' => $isPaid,
        ];

        /* ---- PAYLOAD & totals: only if NOT paid ------------------------- */
        if (!$isPaid) {
            $payload[] = [
                'type'           => $payloadType($d->day_status, $isHalfDay),
                'date'           => $d->work_date,
                'worked_hours'   => round($d->worked_minutes   / 60, 2),
                'overtime_hours' => round($overtimeMinutes      / 60, 2),
            ];

            // counters
            if ($isHalfDay)                     $halfDayCount++;
            elseif ($d->day_status === 'H')     $holidayCount++;
            elseif (in_array($d->day_status, ['SL','CL','PL'])) $paidLeavesCount++;
            else                                $regularDayCount++;

            if (!$isHalfDay && $overtimeMinutes >= 60)   $overtimeDayCount++;

            // roll‑up only unpaid minutes
            $totalWorkedMinutes   += $d->worked_minutes;
            if (!$isHalfDay)        $totalOvertimeMinutes += $overtimeMinutes;
        }
    }

    /* 5. Totals & rounding ----------------------------------------------- */
    $roundHours = static fn (int $m) => intdiv($m, 60) + (($m % 60) > 30 ? 1 : 0);

    $totalWorkedHours = $roundHours($totalWorkedMinutes);
    $overtimeHours    = $roundHours($totalOvertimeMinutes);
    $regularHours     = max($totalWorkedHours - $overtimeHours, 0);

    /* 6. Response --------------------------------------------------------- */
    return response()->json([
        'employee_id'        => $employeeId,
        'start_date'         => $validated['start_date'],
        'end_date'           => $validated['end_date'],
        'standard_day_hours' => $standard,
        'payload'            => $payload,            // ← unpaid days only
        'total_worked_hours' => $totalWorkedHours,
        'overtime_hours'     => $overtimeHours,
        'regular_hours'      => $regularHours,
        'wage_hour'          => $employee->wage_hour,
        'wage_overtime'      => $employee->wage_overtime,
        'attendance'         => $attendance,         // ← shows both paid/unpaid
        'over_time_day'      => $overtimeDayCount,
        'regular_day'        => $regularDayCount,
        'paid_leaves'        => $paidLeavesCount,
        'holiday'            => $holidayCount,
        'half_day'           => $halfDayCount,
    ]);
}



    public function checkTodayStatus(Request $request): JsonResponse
    {
        // Step 1: Get employee ID from logged-in user’s mobile
        $employee = Employee::where('mobile', auth()->user()->mobile)->first();

        if (!$employee['id']) {
            return response()->json([
                'message' => 'Employee not found for this user.',
            ], 404);
        }

        // Step 2: Check for today's tracker entry
        $today = Carbon::today()->toDateString(); // e.g. "2025-07-07"

        $tracker = EmployeeTracker::where('employee_id', $employee['id'])
            ->whereDate('created_at', $today)
            ->first();

        $companyCordinate=CompanyCordinate::where('company_id',auth()->user()->company_id)
            ->where('product_id',auth()->user()->product_id)->first();
        if (!$tracker) {
            return response()->json([
                'company_gps'=> $companyCordinate['required_lat'].",". $companyCordinate['required_lng'],
                'checkIn' => false,
                'checkOut' => false,
                'tolerance'=> $employee['tolerance']
            ]);
        }

      return response()->json([
    'company_gps'=> $companyCordinate['required_lat'].",". $companyCordinate['required_lng'],
    'tracker_id' => $tracker->id,
    'tolerance'  => $employee['tolerance'], // convert to float
    'checkIn'    => $tracker->check_in ?? false,
    'checkOut'   => $tracker->check_out ?? false,
]);

    }


    /* GET /api/employee-tracker/{tracker} */
    public function show(EmployeeTracker $employeeTracker): JsonResponse
    {
        return response()->json($employeeTracker);
    }

    /* PUT / PATCH /api/employee-tracker/{tracker} */
    // public function update(Request $request,$id){
    //     $data = $request->validate([
    //         'check_out_gps'  => ['nullable', 'string', 'max:255'],
    //     ]);
    //     $data['check_out_time'] = Carbon::now();
    //     $data['check_out'] = true;
    //     $employeeTracker=EmployeeTracker::find($id);
    //     $employeeTracker->update($data);
    //     return response()->json($employeeTracker);
    // }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'check_out_gps' => ['required', 'string', 'max:255'],
            'checkout_img' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:2048'],
        ]);

        /* 2. Locate the tracker row ------------------------------------ */
        $tracker = EmployeeTracker::findOrFail($id);

        // Optional guard: don’t allow double check‑out
        if ($tracker->check_out) {
            return response()->json([
                'message' => 'Employee already checked out.',
            ], 409);
        }

        /* 3. Transaction: update tracker + (maybe) attendance ---------- */
        return DB::transaction(function () use ($request, $validated, $tracker) {

            /* 3‑a  Update the tracker row ------------------------------ */
            $tracker->update([
                'check_out_time' => Carbon::now(),
                'check_out' => true,
                'check_out_gps' => $validated['check_out_gps'] ?? null,
            ]);

            /* 3‑b  If no image, we’re done ----------------------------- */
            if (!$request->hasFile('checkout_img')) {
                return response()->json([
                    'tracker' => $tracker,
                ], 200);
            }

            $employee = Employee::where('mobile', auth()->user()->mobile)->firstOrFail();
            $product = Products::findOrFail(auth()->user()->product_id);
            $company = CompanyInfo::where('product_id', $product->id)->first();

            $file = $request->file('checkout_img');
            $picture = 'checkout_' . now()->format('d-m-Y_H-i-s') . '.' . $file->extension();
            $destFolder = $request->input('dest', 'face_attendance' . '/' . Str::slug($product->product_name) . '/' . Str::slug($company->company_name ?? 'company') . '/' . 'emp-' . Str::slug($employee->name));
            $diskPath = public_path(
                env('UPLOAD_PATH') . 'img/' . $destFolder
            );
            if (!\File::exists($diskPath)) {
                \File::makeDirectory($diskPath, 0755, true);
            }
            $file->move($diskPath, $picture);
            $checkoutImgUrl = url(
                trim(env('UPLOAD_URL'), '/')  // “ems”
                . '/img/' . $destFolder . '/' . $picture
            );
            $attendance = EmployeeFaceAttendance::updateOrCreate(
                ['employee_tracker_id' => $tracker->id],
                ['checkout_img' => $checkoutImgUrl]
            );

            return response()->json([
                'tracker' => $tracker,
                'attendance' => $attendance,
                'message' => 'Check‑out completed and image saved.',
            ], 200);
        });
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
            'product_id' => ['nullable', 'exists:products,id'],
            'employee_id' => ['nullable', 'exists:employee,id'],
            'company_id' => ['nullable', 'integer', 'exists:company_info,company_id'],
            'check_in' => ['boolean'],
            'check_out' => ['boolean'],
            'payment_status' => ['boolean'],
            'check_out_time' => ['nullable', 'string', 'max:255'],
            'check_in_gps' => ['nullable', 'string', 'max:255'],
            'check_out_gps' => ['nullable', 'string', 'max:255'],

        ]);
    }

    public function contractSummary(Request $request): JsonResponse
    {
        // 1. Validate input
        $validated = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employee,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $employeeId = (int) $validated['employee_id'];
        $start = Carbon::parse($validated['start_date'], 'Asia/Kolkata')->startOfDay();
        $end = Carbon::parse($validated['end_date'], 'Asia/Kolkata')->endOfDay();

        // 2. Fetch only worked dates (no calculation of overtime/regular)
        $workdays = EmployeeTracker::query()
            ->selectRaw('DATE(created_at) as date')
            ->selectRaw('payment_status')
            ->selectRaw('ROUND(SUM(TIMESTAMPDIFF(MINUTE, created_at, check_out_time)) / 60, 2) AS total_hours')
            ->where('employee_id', $employeeId)
            ->whereBetween('created_at', [$start, $end])
            ->whereNotNull('check_out_time')
            ->groupBy(DB::raw('DATE(created_at)'), 'payment_status')
            ->orderBy('date')
            ->get();

        // 3. Format the response
        $summary = $workdays->map(fn($day) => [
            'date' => $day->date,
            'total_hours' => round($day->total_hours, 2),
            'payment_status' => (bool) $day->payment_status,
        ]);

        // 4. Count days worked
        $daysWorked = $summary->count();

        // 5. Return
        return response()->json([
            'employee_id' => $employeeId,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'days_worked' => $daysWorked,
            'work_summary' => $summary,
        ]);
    }

    public function weeklyPresenty(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'week_start_day' => 'required|string|in:sunday,monday,tuesday,wednesday,thursday,friday,saturday'
        ]);

        $date = Carbon::parse($validated['date']);
        $weekStartDay = strtolower($validated['week_start_day']);

        $dayIndexMap = [
            'sunday' => 0,
            'monday' => 1,
            'tuesday' => 2,
            'wednesday' => 3,
            'thursday' => 4,
            'friday' => 5,
            'saturday' => 6,
        ];

        $targetIndex = $dayIndexMap[$weekStartDay];
        while ($date->dayOfWeek !== $targetIndex) {
            $date->subDay();
        }

        $startOfWeek = $date->copy()->startOfDay();
        $endOfWeek = $startOfWeek->copy()->addDays(6)->endOfDay();
        $holidayWeekdayName = strtolower($startOfWeek->copy()->subDay()->format('l'));

        $employees = Employee::with([
            'trackers' => function ($query) use ($startOfWeek, $endOfWeek) {
                $query->whereBetween('created_at', [$startOfWeek, $endOfWeek]);
            }
        ])->get();

        $result = [];

        foreach ($employees as $employee) {
            $attendance = [];
            $standardMinutes = ($employee->working_hours ?? 8) * 60;

            // Payment counters
            $regularDays = 0;
            $halfDays = 0;
            $holidayDays = 0;
            $totalOvertimeHours = 0;

            for ($day = $startOfWeek->copy(); $day <= $endOfWeek; $day->addDay()) {
                $dayKey = $day->format('Y-m-d');
                $weekday = strtolower($day->format('l'));

                $tracker = $employee->trackers->first(function ($t) use ($dayKey) {
                    return Carbon::parse($t->created_at)->format('Y-m-d') === $dayKey;
                });

                // HALF DAY
                if ($tracker && $tracker->half_day == 1) {
                    $attendance[$dayKey] = ['status' => 'HF'];
                    $halfDays++;
                    continue;
                }

                // HOLIDAY
                // if ($weekday === $holidayWeekdayName) {
                //     $workedMinutes = 0;

                //     if ($tracker && $tracker->check_in && $tracker->check_out_time) {
                //         $checkIn = Carbon::parse($tracker->created_at);
                //         $checkOut = Carbon::parse($tracker->check_out_time);
                //         $workedMinutes = $checkIn->diffInMinutes($checkOut);
                //     }

                //     $overtime = max($workedMinutes - $standardMinutes, 0);
                //     $attendance[$dayKey] = [
                //         'status' => 'H',
                //         'holiday_overtime_hour' => round($overtime / 60, 2)
                //     ];
                //     $holidayDays++;
                //     $totalOvertimeHours += round($overtime / 60, 2);
                //     continue;
                // }

                // LEAVE / NA logic
                if ($tracker) {
                    $status = strtolower($tracker->status);

                    if (in_array($status, ['sl', 'pl', 'cl'])) {
                        $attendance[$dayKey] = ['status' => strtoupper($status)];
                        $regularDays++;
                        continue;
                    }

                    // ✅ Corrected Holiday status check
                    if ($status === 'h') {
                        $workedMinutes = 0;
                        if ($tracker->check_in && $tracker->check_out_time) {
                            $checkIn = Carbon::parse($tracker->created_at);
                            $checkOut = Carbon::parse($tracker->check_out_time);
                            $workedMinutes = $checkIn->diffInMinutes($checkOut);
                        }

                        $overtime = max($workedMinutes - $standardMinutes, 0);
                        $attendance[$dayKey] = [
                            'status' => 'H',
                            'holiday_overtime_hour' => round($overtime / 60, 2)
                        ];
                        $holidayDays++;
                        $totalOvertimeHours += round($overtime / 60, 2);
                        continue;
                    }

                    if ($status === 'na') {
                        if ($tracker->check_in && $tracker->check_out_time) {
                            $checkIn = Carbon::parse($tracker->created_at);
                            $checkOut = Carbon::parse($tracker->check_out_time);
                            $workedMinutes = $checkIn->diffInMinutes($checkOut);
                            $overtime = max($workedMinutes - $standardMinutes, 0);

                            $attendance[$dayKey] = [
                                'status' => 'P',
                                'overtime_hours' => round($overtime / 60, 2)
                            ];
                            $regularDays++;
                            $totalOvertimeHours += round($overtime / 60, 2);
                        } else {
                            $attendance[$dayKey] = [
                                'status' => 'A',
                                'overtime_hours' => 0
                            ];
                            $regularDays++;
                        }
                        continue;
                    }
                }


                // DEFAULT A or P
                if ($tracker && $tracker->check_in && $tracker->check_out_time) {
                    $checkIn = Carbon::parse($tracker->created_at);
                    $checkOut = Carbon::parse($tracker->check_out_time);
                    $workedMinutes = $checkIn->diffInMinutes($checkOut);
                    $overtime = max($workedMinutes - $standardMinutes, 0);

                    $attendance[$dayKey] = [
                        'status' => 'P',
                        'overtime_hours' => round($overtime / 60, 2)
                    ];
                    $regularDays++;
                    $totalOvertimeHours += round($overtime / 60, 2);
                } else {
                    $attendance[$dayKey] = [
                        'status' => 'A',
                        'overtime_hours' => 0
                    ];
                    $regularDays++;
                }
            }

            // Calculate total payment
            $regularPayment = $regularDays * ($employee->wage_hour ?? 0);
            $overtimePayment = $totalOvertimeHours * ($employee->wage_overtime ?? 0);
            $halfDayPayment = $halfDays * ($employee->half_day_rate ?? 0);
            $holidayPayment = $holidayDays * ($employee->holiday_rate ?? 0);

            $result[] = [
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'wage_hour' => $employee->wage_hour ?? 0,
                'wage_overtime' => $employee->wage_overtime ?? 0,
                'half_day_rate' => $employee->half_day_rate ?? 0,
                'holiday_day_rate' => $employee->holiday_rate ?? 0,
                'working_hours' => $employee->working_hours ?? 0,
                'attendance' => $attendance,
                'payment_details' => [
                    'regular_day_payment' => $regularPayment,
                    'overtime_hr_payment' => $overtimePayment,
                    'half_day_payment' => $halfDayPayment,
                    'holiday_payment' => $holidayPayment
                ]
            ];
        }

        return response()->json([
            'week_start' => $startOfWeek->format('Y-m-d'),
            'week_end' => $endOfWeek->format('Y-m-d'),
            'fixed_holiday' => ucfirst($holidayWeekdayName),
            'data' => $result
        ]);
    }




    public function monthlyPresenty(Request $request)
{
    $validated = $request->validate([
        'month' => 'required|string|in:january,february,march,april,may,june,july,august,september,october,november,december',
        'year' => 'required|integer|min:1900|max:2100',
    ]);

    $monthName = strtolower($validated['month']);
    $year = $validated['year'];

    // Convert month name to numeric month
    $monthIndex = date('m', strtotime($monthName));

    $startOfMonth = Carbon::createFromDate($year, $monthIndex, 1)->startOfDay();
    $endOfMonth = Carbon::createFromDate($year, $monthIndex, 1)->endOfMonth()->endOfDay();

    $employees = Employee::with([
        'trackers' => function ($query) use ($startOfMonth, $endOfMonth) {
            $query->whereBetween('created_at', [$startOfMonth, $endOfMonth]);
        }
    ])->get();

    $result = [];

    foreach ($employees as $employee) {
        $attendance = [];
        $standardMinutes = ($employee->working_hours ?? 8) * 60;

        // Counters
        $regularDays = 0;
        $halfDays = 0;
        $holidayDays = 0;
        $totalOvertimeHours = 0;

        for ($day = $startOfMonth->copy(); $day <= $endOfMonth; $day->addDay()) {
            $dayKey = $day->format('Y-m-d');
            $tracker = $employee->trackers->first(function ($t) use ($dayKey) {
                return Carbon::parse($t->created_at)->format('Y-m-d') === $dayKey;
            });

            // HALF DAY
            if ($tracker && $tracker->half_day == 1) {
                $attendance[$dayKey] = ['status' => 'HF'];
                $halfDays++;
                continue;
            }

            if ($tracker) {
                $status = strtolower($tracker->status);

                if (in_array($status, ['sl', 'pl', 'cl'])) {
                    $attendance[$dayKey] = ['status' => strtoupper($status)];
                    $regularDays++;
                    continue;
                }

                if ($status === 'h') {
                    $workedMinutes = 0;
                    if ($tracker->check_in && $tracker->check_out_time) {
                        $checkIn = Carbon::parse($tracker->created_at);
                        $checkOut = Carbon::parse($tracker->check_out_time);
                        $workedMinutes = $checkIn->diffInMinutes($checkOut);
                    }

                    $overtime = max($workedMinutes - $standardMinutes, 0);
                    $attendance[$dayKey] = [
                        'status' => 'H',
                        'holiday_overtime_hour' => round($overtime / 60, 2)
                    ];
                    $holidayDays++;
                    $totalOvertimeHours += round($overtime / 60, 2);
                    continue;
                }

                if ($status === 'na') {
                    if ($tracker->check_in && $tracker->check_out_time) {
                        $checkIn = Carbon::parse($tracker->created_at);
                        $checkOut = Carbon::parse($tracker->check_out_time);
                        $workedMinutes = $checkIn->diffInMinutes($checkOut);
                        $overtime = max($workedMinutes - $standardMinutes, 0);

                        $attendance[$dayKey] = [
                            'status' => 'P',
                            'overtime_hours' => round($overtime / 60, 2)
                        ];
                        $regularDays++;
                        $totalOvertimeHours += round($overtime / 60, 2);
                    } else {
                        $attendance[$dayKey] = [
                            'status' => 'A',
                            'overtime_hours' => 0
                        ];
                        $regularDays++;
                    }
                    continue;
                }
            }

            // DEFAULT A or P
            if ($tracker && $tracker->check_in && $tracker->check_out_time) {
                $checkIn = Carbon::parse($tracker->created_at);
                $checkOut = Carbon::parse($tracker->check_out_time);
                $workedMinutes = $checkIn->diffInMinutes($checkOut);
                $overtime = max($workedMinutes - $standardMinutes, 0);

                $attendance[$dayKey] = [
                    'status' => 'P',
                    'overtime_hours' => round($overtime / 60, 2)
                ];
                $regularDays++;
                $totalOvertimeHours += round($overtime / 60, 2);
            } else {
                $attendance[$dayKey] = [
                    'status' => 'A',
                    'overtime_hours' => 0
                ];
                $regularDays++;
            }
        }

        $regularPayment = $regularDays * ($employee->wage_hour ?? 0);
        $overtimePayment = $totalOvertimeHours * ($employee->wage_overtime ?? 0);
        $halfDayPayment = $halfDays * ($employee->half_day_rate ?? 0);
        $holidayPayment = $holidayDays * ($employee->holiday_rate ?? 0);

        $result[] = [
            'employee_id' => $employee->id,
            'employee_name' => $employee->name,
            'wage_hour' => $employee->wage_hour ?? 0,
            'wage_overtime' => $employee->wage_overtime ?? 0,
            'half_day_rate' => $employee->half_day_rate ?? 0,
            'holiday_day_rate' => $employee->holiday_rate ?? 0,
            'working_hours' => $employee->working_hours ?? 0,
            'attendance' => $attendance,
            'payment_details' => [
                'regular_day_payment' => $regularPayment,
                'overtime_hr_payment' => $overtimePayment,
                'half_day_payment' => $halfDayPayment,
                'holiday_payment' => $holidayPayment
            ]
        ];
    }

    return response()->json([
        'month' => ucfirst($monthName),
        'year' => $year,
        'month_start' => $startOfMonth->format('Y-m-d'),
        'month_end' => $endOfMonth->format('Y-m-d'),
        'data' => $result
    ]);
}



}
