<?php

namespace App\Http\Controllers;

use App\Models\EmployeeTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;
use App\Models\EmployeeTracker;


class EmployeeTransactionController extends Controller
{
    /* GET /api/employee-transactions */
    public function index(): JsonResponse
    {
        return response()->json(EmployeeTransaction::latest()->paginate(15));
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
            'product_id'       => auth()->user()->product_id,
            'company_id'       => auth()->user()->company_id,
            'transaction_type' => 'payment',
        ];
        EmployeeTransaction::create($validated);

        // 4. Mark tracker rows as paid -------------------------------------
        EmployeeTracker::where('employee_id', $employee->id)
            ->whereDate('created_at', '>=', $validated['start_date'])
            ->whereDate('created_at', '<=', $validated['end_date'])
            ->where('payment_status', 0)      // only unpaid rows
            ->update(['payment_status' => 1]);
    });

    return response()->json(['message' => 'Payment recorded and trackers updated.'], 201);
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
