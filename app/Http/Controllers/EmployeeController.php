<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\EmployeeFaceAttendance;


class EmployeeController extends Controller
{
    /* GET /api/employees */
    public function index(): JsonResponse
    {     $employee=Employee::where('product_id',auth()->user()->product_id)
                            ->where('company_id',auth()->user()->company_id)->get();
        return response()->json($employee);
    }

    /* POST /api/employees */
    // public function store(Request $request)
    // {

    //     /** 1️⃣ Validate ---------------------------------------------------- */
    //     $data = $this->validatedData($request);

    //     /* extra rule: email must be unique if login requested */
    //     if (($data['isLogin'] ?? false) && User::where('email', $data['email'])->exists()) {
    //         return response()->json([
    //             'message' => 'Email already taken',
    //         ], 409);
    //     }

    //     $productId = auth()->user()->product_id;
    //     $comapnyId = auth()->user()->company_id;

    //     /** 2️⃣ Atomic create ---------------------------------------------- */
    //     $result = DB::transaction(function () use ($data, $productId, $comapnyId) {

    //         $user = null;

    //         if ($data['is_login'] == true) {

    //             $user = User::create([
    //                 'name' => $data['name'],
    //                 'email' => $data['email'],
    //                 'mobile' => $data['mobile'],
    //                 'type' => 10,//employee
    //                 'company_id' => $comapnyId,
    //                 'product_id' => $productId,
    //                 'password' => bcrypt($data['password']),
    //             ]);
    //         }

    //         /* Remove fields not present in employee table */
    //         $employeePayload = collect($data)->except(['isLogin', 'password'])->toArray();
    //         $employeePayload['product_id'] = $productId;
    //         $employeePayload['company_id'] = $comapnyId;
    //         $employee = Employee::create($employeePayload);

    //         return [$employee, $user];
    //     });

    //     [$employee, $user] = $result;

    //     return response()->json([
    //         'employee' => $employee,
    //         'user' => $user,      // null if not requested
    //     ], 201);
    // }
    public function store(Request $request)
    {
        /** 1️⃣ Validate ---------------------------------------------------- */
        $data = $this->validatedData($request);

        /** 2️⃣ Check for unique mobile and Aadhaar globally -------------- */
        $mobileExists = User::where('mobile', $data['mobile'])->exists();
        $aadhaarExists = Employee::where('adhaar_number', $data['adhaar_number'])->exists();

        if (!empty($data['email'])) {
            $emailExists = User::where('email', $data['email'])->exists();
            if ($emailExists) {
                return response()->json([
                    'message' => 'Email already taken',
                ], 201); // Conflict
            }
        }

        if ($mobileExists) {
            return response()->json([
                'message' => 'Mobile number already taken',
            ], 201); // Conflict
        }

        if ($aadhaarExists) {
            return response()->json([
                'message' => 'Aadhaar number already taken',
            ], 201); // Conflict
        }

        /** 3️⃣ Get Auth Context ------------------------------------------- */
        $productId = auth()->user()->product_id;
        $companyId = auth()->user()->company_id;

        /** 4️⃣ Atomic Create --------------------------------------------- */
        $result = DB::transaction(function () use ($data, $productId, $companyId) {
            $user = null;

            if ($data['is_login'] == true) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'] ?? null,
                    'mobile' => $data['mobile'],
                    'type' => 10, // employee
                    'company_id' => $companyId,
                    'product_id' => $productId,
                    'password' => bcrypt($data['password']),
                ]);
            }

            $employeePayload = collect($data)
                ->except(['isLogin', 'password']) // remove unnecessary fields
                ->toArray();

            $employeePayload['product_id'] = $productId;
            $employeePayload['company_id'] = $companyId;

            $employee = Employee::create($employeePayload);

            return [$employee, $user];
        });

        [$employee, $user] = $result;

        /** 5️⃣ Final Response -------------------------------------------- */
        return response()->json([
            'employee' => $employee,
            'user' => $user,
        ], 201);
    }

    public function employeeDtailsForDashboard(Request $request)
    {   

        $productId = auth()->user()->product_id;
        $companyId = auth()->user()->company_id;
        // $today = now()->toDateString();
        $today=$request->date;
        $employees = Employee::where('product_id', $productId)
            ->where('company_id', $companyId)
            ->with([
                'trackers' => function ($q) use ($today) {
                    $q->whereDate('created_at', $today)
                        ->latest('created_at')
                        ->limit(1)
                        ->with('faceAttendance');          // ← here
                }
            ])->get()
            ->map(function ($emp) use ($productId, $companyId) {

                if ($emp->trackers->isEmpty()) {
                    $emp->trackers = collect([
                        (object) [
                            'id' => null,
                            'product_id' => $productId,
                            'employee_id' => $emp->id,
                            'company_id' => $companyId,
                            'check_in' => false,
                            'check_out' => false,
                            'payment_status' => false,
                            'check_in_gps' => null,
                            'check_out_gps' => null,
                            'check_out_time' => null,
                            'checkin_img' => null,
                            'checkout_img' => null,
                            'created_at' => null,
                            'updated_at' => null,
                        ]
                    ]);
                } else {
                    // Merge attendance URLs into the tracker object
                    $emp->trackers->transform(function ($t) {
                        $t->checkin_img = optional($t->faceAttendance)->checkin_img;
                        $t->checkout_img = optional($t->faceAttendance)->checkout_img;
                        unset($t->faceAttendance);   // avoid nested clutter
                        return $t;
                    });
                }

                return $emp;
            });

        return response()->json($employees);
    }



    public function showEmployeesDetails($id)
    {
        $employee = Employee::with('trackers')->find($id);
        if (!$employee) {
            return response()->json(['message' => 'Not Found'], 404);
        }
        return response()->json($employee);
    }


    /* GET /api/employees/{employee} */
    // public function show(Employee $employee): JsonResponse
    // {
    //     return response()->json($employee);
    // }
    public function show(Employee $employee): JsonResponse
    {
        // Get users whose mobile number matches the employee's mobile
        $users = User::where('mobile', $employee->mobile)->get();

        // Convert employee to array and append users array below
        $response = $employee->toArray();
        $response['user'] = $users;

        return response()->json($response);
    }




    /* PUT / PATCH /api/employees/{employee} */
    // public function update(Request $request, Employee $employee): JsonResponse
    // {
    //     $data = $request->only($employee->getFillable()); // Only allow fillable fields

    //     // Optionally validate only the fields that are being updated
    //     $validated = validator($data, [
    //         'product_id' => 'sometimes|integer|exists:products,id',
    //         'company_id' => 'sometimes|integer|exists:company_info,company_id',
    //         'name' => 'sometimes|string|max:255',
    //         'gender' => 'sometimes|in:male,female,other',
    //         'payment_type' => 'sometimes|string|max:100',
    //         'work_type' => 'sometimes|string|max:100',
    //         'price' => 'sometimes|numeric',
    //         'wage_hour' => 'sometimes|numeric',
    //         'wage_overtime' => 'nullable|numeric',
    //         'credit' => 'sometimes|numeric',
    //         'debit' => 'sometimes|numeric',
    //         'adhaar_number' => 'sometimes|string|max:20',
    //         'mobile' => 'sometimes|string|max:15',
    //         'refferal_by' => 'sometimes|string|max:255',
    //         'isActive' => 'sometimes|boolean',
    //         'half_day_rate' => 'sometimes',
    //         'holiday_rate' => 'sometimes',
    //         'overtime_type' => 'sometimes|string|max:50',
    //         'contract_type' => 'nullable|string|max:50',
    //         'attendance_type' => 'sometimes|string|max:50',
    //         'refferal_number' => 'nullable|string|max:20',
    //         'user_id' => 'sometimes|integer|exists:users,id',
    //         'working_hours' => 'sometimes|numeric',
    //     ])->validate();

    //     $employee->update($validated);

    //     return response()->json([
    //         'message' => 'Employee updated successfully.',
    //         'data' => $employee
    //     ]);
    // }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        // Step 1: Save old mobile before updating
        $oldMobile = $employee->mobile;

        // Step 2: Extract only fillable fields (email is NOT in employees table)
        $data = $request->only($employee->getFillable());
        $cleanedRequest = collect($request->all())->filter(function ($value) {
    return $value !== ''; // remove empty strings
})->toArray();

        // Step 3: Validate incoming fields
    $validated = validator($cleanedRequest, [
    'product_id' => 'sometimes|integer|exists:products,id',
    'company_id' => 'sometimes|integer|exists:company_info,company_id',
    'name' => 'sometimes|string|max:255',
    'email' => 'nullable|email|max:255',
    'gender' => 'sometimes|in:male,female,other',
    'payment_type' => 'nullable|string|max:100',
    'work_type' => 'nullable|string|max:100',
    'price' => 'nullable|numeric',
    'wage_hour' => 'nullable|numeric',
    'wage_overtime' => 'nullable|numeric',
    'credit' => 'nullable|numeric',
    'debit' => 'nullable|numeric',
    'adhaar_number' => 'nullable|string|max:20',
    'mobile' => 'nullable|string|max:15',
    'refferal_by' => 'nullable|string|max:255',
    'isActive' => 'sometimes|boolean',
    'half_day_rate' => 'nullable',
    'holiday_rate' => 'nullable',
    'overtime_type' => 'nullable|string|max:50',
    'contract_type' => 'nullable|string|max:50',
    'attendance_type' => 'nullable|string|max:50',
    'refferal_number' => 'nullable|string|max:20',
    'user_id' => 'nullable|integer|exists:users,id',
    'working_hours' => 'nullable|numeric',
])->validate();

        // Step 4: Update employee table
        $employee->update($validated);

        // Step 5: Sync to user table (match by old mobile)
        $user = User::where('mobile', $oldMobile)->first();

        if ($user) {
            $userUpdate = [];

            if (isset($validated['name'])) {
                $userUpdate['name'] = $validated['name'];
            }

            if (isset($validated['mobile'])) {
                $userUpdate['mobile'] = $validated['mobile'];
            }

            if ($request->filled('email')) {
                $userUpdate['email'] = $request->input('email');
            }

            if (!empty($userUpdate)) {
                $user->update($userUpdate);
            }
        }

        // Step 6: Prepare response — include user info if available
        $response = $employee->toArray();
        $response['user'] = $user ? [$user] : [];

        return response()->json([
            'message' => 'Employee and user updated successfully.',
            'data' => $response
        ]);
    }

    /* DELETE /api/employees/{employee} */
    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();

        return response()->json(null, 204);
    }

    /* ────────────────
       Central validator
    ─────────────────── */
    protected function validatedData(Request $request, int|null $id = null)
    {
        return $request->validate([
            'product_id' => ['nullable', 'exists:products,id'],
            'company_id' => ['nullable', 'integer', 'exists:company_info,company_id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'gender' => ['required', 'in:male,female,other'],
            'payment_type' => ['nullable', 'in:weekly,monthly'],
            'work_type' => ['required', 'in:fulltime,contract'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'wage_hour' => ['nullable', 'numeric', 'min:0'],
            'wage_overtime' => ['nullable', 'numeric', 'min:0'],
            'credit' => ['nullable', 'numeric', 'min:0'],
            'debit' => ['nullable', 'numeric', 'min:0'],
            'adhaar_number' => ['nullable', 'string', 'max:20'],
            'mobile' => ['required', 'string', 'max:15'],
            'refferal_by' => ['nullable', 'string', 'max:255'],
            'refferal_number' => ['nullable', 'string', 'max:255'],
            'isActive' => ['boolean'],  // true / false
            'is_login' => ['nullable', 'boolean'],
            'password' => ['nullable', 'string', 'max:255'],

            'user_id' => ['nullable', 'integer'],
            'half_day_rate' => ['nullable', 'numeric', 'min:0'],
            'holiday_rate' => ['nullable', 'numeric', 'min:0'],
            'overtime_type' => ['nullable', 'in:fixed,hourly'],
            'contract_type' => ['nullable', 'in:volume_based,fixed'],
            'attendance_type' => ['nullable', 'in:face_attendance,location,both'],
            'refferal_number' => ['nullable', 'string'],
            'user_id' => ['nullable', 'string']

        ]);
    }
}
