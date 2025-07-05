<?php

namespace App\Http\Controllers;

use App\Models\EmployeeTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeTransactionController extends Controller
{
    /* GET /api/employee-transactions */
    public function index(): JsonResponse
    {
        return response()->json(EmployeeTransaction::latest()->paginate(15));
    }

    /* POST /api/employee-transactions */
   public function store(Request $request)
{   
    $data = $this->validatedData($request);

    $transaction = [];
    $transaction['employee_id']     = $data['employee_id'];
    $transaction['transaction_type'] = $data['transaction_type']; 
    $transaction['payment_type']     = $data['payment_type']; 
    $transaction['payed_amount']     = $data['payed_amount'];
    $transaction['salary_amount']    = $data['salary_amount'];
    $transaction['company_id']       = auth()->user()->company_id;
    $transaction['product_id']       = auth()->user()->product_id;

    $Transactions = EmployeeTransaction::create($transaction);

    return response()->json($Transactions, 201);
}


    /* GET /api/employee-transactions/{transaction} */
    public function show(EmployeeTransaction $employeeTransaction): JsonResponse
    {
        return response()->json($employeeTransaction);
    }

    /* PUT / PATCH /api/employee-transactions/{transaction} */
    public function update(Request $request, EmployeeTransaction $employeeTransaction): JsonResponse
    {
        $data = $this->validatedData($request);

        $employeeTransaction->update($data);

        return response()->json($employeeTransaction);
    }

    /* DELETE /api/employee-transactions/{transaction} */
    public function destroy(EmployeeTransaction $employeeTransaction): JsonResponse
    {
        $employeeTransaction->delete();

        return response()->json(null, 204);
    }

    /* ────────────────
       Central validator
    ─────────────────── */
    protected function validatedData(Request $request)
    {
        return $request->validate([
            'product_id'    => ['nullable','exists:products,id'],
            'employee_id'       => ['required', 'exists:employee,id'],
            'company_id'        => ['nullable', 'integer', 'exists:company_info,company_id'],
            'transaction_type'  => ['required', 'in:credit,payment'],
            'payment_type'      => ['required', 'in:cash,upi,bank_transfer'],
            'salary_amount'     => ['required', 'numeric', 'min:0'],
            'payed_amount'      => ['required', 'numeric', 'min:0'],
        ]);
    }
}
