<?php

namespace App\Http\Controllers;

use App\Models\EmployeeTracker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeTrackerController extends Controller
{
    /* GET /api/employee-tracker */
    public function index(): JsonResponse
    {
        return response()->json(EmployeeTracker::latest()->paginate(15));
    }

    /* POST /api/employee-tracker */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);

        $tracker = EmployeeTracker::create($data);

        return response()->json($tracker, 201);
    }

    /* GET /api/employee-tracker/{tracker} */
    public function show(EmployeeTracker $employeeTracker): JsonResponse
    {
        return response()->json($employeeTracker);
    }

    /* PUT / PATCH /api/employee-tracker/{tracker} */
    public function update(Request $request, EmployeeTracker $employeeTracker): JsonResponse
    {
        $data = $this->validatedData($request);

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
    protected function validatedData(Request $request): array
    {
        return $request->validate([
            'product_id'    => ['required', 'exists:products,id'],
            'employee_id'    => ['required', 'exists:employee,id'],
            'company_id'     => ['required', 'integer', 'exists:company_info,company_id'],
            'check_in'       => ['boolean'],
            'check_out'      => ['boolean'],
            'payment_status' => ['boolean'],

            'check_in_gps'   => ['nullable', 'string', 'max:255'],
            'check_out_gps'  => ['nullable', 'string', 'max:255'],
        ]);
    }
}
