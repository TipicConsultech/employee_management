<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;


class EmployeeController extends Controller
{
    /* GET /api/employees */
    public function index(): JsonResponse
    {
        return response()->json(Employee::latest()->paginate(15));
    }

    /* POST /api/employees */
    public function store(Request $request)
{
   
    /** 1️⃣ Validate ---------------------------------------------------- */
    $data = $this->validatedData($request);

    /* extra rule: email must be unique if login requested */
    if (($data['isLogin'] ?? false) && User::where('email', $data['email'])->exists()) {
        return response()->json([
            'message' => 'Email already taken',
        ], 409);
    }

    $productId=auth()->user()->product_id;
    $comapnyId=auth()->user()->company_id;

    /** 2️⃣ Atomic create ---------------------------------------------- */
   $result = DB::transaction(function () use ($data, $productId, $comapnyId) {

        $user = null;

        if ($data['is_login']==true) {
           
            $user = User::create([
                'name'       => $data['name'],
                'email'      => $data['email'],
                'mobile'     => $data['mobile'],
                'type'       => 10,//employee
                'company_id' => $comapnyId,
                'product_id' => $productId,
                'password'   => bcrypt($data['password']),
            ]);
        }

        /* Remove fields not present in employee table */
        $employeePayload = collect($data)->except(['isLogin', 'password'])->toArray();
        $employeePayload['product_id']=$productId;
        $employeePayload['company_id']=$comapnyId;
        $employee = Employee::create($employeePayload);

        return [$employee, $user];
    });

    [$employee, $user] = $result;

    return response()->json([
        'employee' => $employee,
        'user'     => $user,      // null if not requested
    ], 201);
}


    /* GET /api/employees/{employee} */
    public function show(Employee $employee): JsonResponse
    {
        return response()->json($employee);
    }

    /* PUT / PATCH /api/employees/{employee} */
    public function update(Request $request, Employee $employee): JsonResponse
    {
        $data = $this->validatedData($request, $employee->id);

        $employee->update($data);

        return response()->json($employee);
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
            'product_id'    => ['nullable', 'exists:products,id'],
            'company_id'    => ['nullable', 'integer', 'exists:company_info,company_id'],
            'name'          => ['required','string','max:255'],
            'email'          => ['required','email','max:255'],
            'gender'        => ['required','in:male,female,other'],
            'payment_type'  => ['required','in:weekly,monthly'],
            'work_type'     => ['required','in:fulltime,contract'],
            'price'         => ['nullable','numeric','min:0'],
            'wage_hour'     => ['required','numeric','min:0'],
            'wage_overtime' => ['required','numeric','min:0'],
            'credit'        => ['nullable','numeric','min:0'],
            'debit'         => ['nullable','numeric','min:0'],
            'adhaar_number' => ['nullable','string','max:20'],
            'mobile'        => ['required','string','max:15'],
            'refferal_by'   => ['required','string','max:255'],
            'isActive'      => ['boolean'],  // true / false
            'is_login'       => ['nullable','boolean'],
            'password'      => ['nullable','string','max:255'],

        ]);
    }
}
