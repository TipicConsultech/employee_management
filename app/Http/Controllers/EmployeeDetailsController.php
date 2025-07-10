<?php

namespace App\Http\Controllers;

use App\Models\EmployeeDetails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeeDetailsController extends Controller
{
    /* GET /api/employee-details */
    public function index(): JsonResponse
    {
        return response()->json(EmployeeDetails::latest()->paginate(15));
    }
    
    /* POST /api/employee-details */
  

public function store(Request $request)
{
    // 1️⃣ Validate just the employee_id (files are dynamic keys)
    $request->validate([
        'employee_id' => ['required', 'exists:employee,id'],
    ]);

    $employeeId = (int) $request->input('employee_id');
    $companyId  = auth()->user()->company_id;   // must exist in company_info.id
    $productId  = auth()->user()->product_id;

    // 2️⃣ Fail fast if no files at all
    if ($request->allFiles() === []) {
        return response()->json([
            'message' => 'No documents uploaded.',
        ], 422);
    }

    $inserted = [];

    // 3️⃣ Loop over every uploaded file (adhaar, pan, etc.)
    foreach ($request->allFiles() as $docName => $file) {

        // Read raw bytes and base‑64 encode (avoids UTF‑8 JSON errors)
        $base64 = base64_encode($file->get());

        $detail = EmployeeDetails::create([
            'product_id'    => $productId,
            'employee_id'   => $employeeId,
            'company_id'    => $companyId,
            'document_id' => $docName,   // "adhaar" | "pan" | ...
            'document_link' => $base64,    // <‑‑ MUST be present
        ]);
        $detail['status']=201;

        $inserted[] = $detail;
    }

    // 4️⃣ Return the rows (document_link is hidden)
    return response()->json($inserted, 201);
}
    /* GET /api/employee-details/{details} */
    public function show(EmployeeDetails $employeeDetail): JsonResponse
    {
        return response()->json($employeeDetail);
    }
    public function all_employee( $employeeDetail): JsonResponse
    { 

        // EmployeeDetails=EmployeeDetails::('employee_id',)
        // return response()->json($employeeDetail);
    }

    /* PUT / PATCH /api/employee-details/{details} */
    public function update(Request $request, EmployeeDetails $employeeDetail): JsonResponse
    {
        $data = $this->validatedData($request);

        $employeeDetail->update($data);

        return response()->json($employeeDetail);
    }

    /* DELETE /api/employee-details/{details} */
    public function destroy(EmployeeDetails $employeeDetail): JsonResponse
    {
        $employeeDetail->delete();

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
            'document_id'  => ['required', 'integer', 'max:255'],
            'document_link'  => ['required', 'url', 'max:2048'],
        ]);
    }

    public function documentView($employee_id)
{
    $documents = DB::table('employee_details')
        ->where('employee_id', $employee_id)
        ->select('employee_id', 'company_id', 'document_id', 'document_link')
        ->get();
 
    return response()->json($documents);
}
}
