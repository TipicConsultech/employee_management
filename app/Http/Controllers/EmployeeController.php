<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    /* GET /api/employees */
    public function index(): JsonResponse
    {
        return response()->json(Employee::latest()->paginate(15));
    }

    /* POST /api/employees */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);

        $employee = Employee::create($data);

        return response()->json($employee, 201);
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
    protected function validatedData(Request $request, int|null $id = null): array
    {
        return $request->validate([
            'product_id'    => ['required', 'exists:products,id'],
            'company_id'    => ['required', 'integer', 'exists:company_info,company_id'],
            'name'          => ['required','string','max:255'],
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
        ]);
    }
}
