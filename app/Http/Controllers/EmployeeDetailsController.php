<?php

namespace App\Http\Controllers;

use App\Models\EmployeeDetails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\DocumentType;
 

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
    $request->validate([
        'employee_id' => ['required', 'exists:employee,id'],
        'custom_document_name' => 'nullable|string|max:255',
        'custom_document_file' => 'nullable|file|max:10240|mimes:jpeg,jpg,png,pdf',
    ]);
 
    $employeeId = (int) $request->input('employee_id');
    $companyId  = auth()->user()->company_id;
    $productId  = auth()->user()->product_id;
 
    $files = $request->allFiles();
 
    if (empty($files) && !$request->hasFile('custom_document_file')) {
        return response()->json([
            'message' => 'No documents uploaded.',
        ], 422);
    }
 
    $inserted = [];
 
    // 1️⃣ Process standard documents
    foreach ($files as $docId => $file) {
        if ($docId === 'custom_document_file') continue;
 
        $base64 = base64_encode($file->get());
 
        // Check if exists
        $existing = EmployeeDetails::where('employee_id', $employeeId)
            ->where('document_id', $docId)
            ->first();
 
        if ($existing) {
            $existing->update(['document_link' => $base64]);
            $existing['status'] = 200;
            $inserted[] = $existing;
        } else {
            $detail = EmployeeDetails::create([
                'product_id'    => $productId,
                'employee_id'   => $employeeId,
                'company_id'    => $companyId,
                'document_id'   => $docId,
                'document_link' => $base64,
            ]);
            $detail['status'] = 201;
            $inserted[] = $detail;
        }
    }
 
    // 2️⃣ Handle custom "Other Document" — exact logic style from your original code
    if ($request->filled('custom_document_name') && $request->hasFile('custom_document_file')) {
        $docName = $request->input('custom_document_name');
        $file = $request->file('custom_document_file');
        $base64 = base64_encode($file->get());
 
        // Create the document_type row (⚠️ same logic as before, not firstOrCreate)
        $documentType = DocumentType::create([
            'document_name' => $docName,
            'product_id'=>auth()->user()->product_id,
            'company_id'=>auth()->user()->company_id
        ]);
 
        $customDocId = $documentType->id;
 
        // Check if this custom doc already exists for this employee
        $existing = EmployeeDetails::where('employee_id', $employeeId)
            ->where('document_id', $customDocId)
            ->first();
 
        if ($existing) {
            $existing->update(['document_link' => $base64]);
            $existing['status'] = 200;
            $inserted[] = $existing;
        } else {
            $detail = EmployeeDetails::create([
                'product_id'    => $productId,
                'employee_id'   => $employeeId,
                'company_id'    => $companyId,
                'document_id'   => $customDocId,
                'document_link' => $base64,
            ]);
            $detail['status'] = 201;
            $inserted[] = $detail;
        }
    }
 
    return response()->json($inserted);
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
        ->where('employee_details.employee_id', $employee_id)
        ->join('document_type', 'employee_details.document_id', '=', 'document_type.id')
        ->select(
            'employee_details.employee_id',
            'employee_details.company_id',
            'employee_details.document_id',
            'employee_details.document_link',
            'document_type.document_name as document_type_name' // ✅ Corrected column name
        )
        ->get();
 
    return response()->json($documents);
}
}
