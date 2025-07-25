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
        'start_date'   => ['required', 'date_format:Y-m-d'],
        'end_date'     => ['required', 'date_format:Y-m-d'],
        'employee_id'  => ['required', 'integer', 'exists:employee,id'],
        'payed_amount' => ['required', 'numeric'],
        'salary_amount'=> ['required', 'numeric'],
        'payment_type' => ['required', 'in:cash,upi,bank_transfer'],
        'transaction_id'=> ['nullable', 'string']
    ]);

    // Wrap everything in a single DB transaction --------------------------
    $response = DB::transaction(function () use (&$validated) {
        $employee = Employee::lockForUpdate()->find($validated['employee_id']);
        $pending = $validated['salary_amount'] - $validated['payed_amount'];
        $newCredit = $employee->credit ?? 0;
        $newDebit = $employee->debit ?? 0;
        $message = '';

        // 2. Handle credit and debit logic --------------------------------
        if ($pending > 0) {
            if ($newCredit > 0 && $newDebit == 0) {
                // Scenario 1: Employee has credit, no debit, payment less than salary
                $creditUsed = min($newCredit, $pending);
                $newCredit -= $creditUsed;
                $remainingPending = $pending - $creditUsed;
                if ($remainingPending > 0) {
                    // Extended Scenario 1: Insufficient credit, add to debit (Scenario 4)
                    $newDebit += $remainingPending;
                    $message = "Used $creditUsed from credit, added $remainingPending to debit. New credit: $newCredit, new debit: $newDebit.";
                } else {
                    $message = "Used $creditUsed from credit. New credit: $newCredit.";
                }
            } else {
                // Scenario 4: Employee has no credit, has debit, payment less than salary
                $newDebit += $pending;
                $message = "Added $pending to debit. New debit: $newDebit.";
            }
        } else if ($pending == 0) {
            // Scenario 2: Payment equals salary
            $message = "Payment covers full salary. No changes to credit or debit.";
        } else {
            // Payment exceeds salary
            return ['error' => 'Please enter a correct amount.', 'status' => 422];
        }

        // Update employee credit and debit
        $employee->credit = $newCredit;
        $employee->debit = $newDebit;
        $employee->save();

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
            ->where('payment_status', 0)
            ->update(['payment_status' => 1]);

        return ['message' => $message, 'status' => 201];
    });

    if (isset($response['error'])) {
        return response()->json(['message' => $response['error']], $response['status']);
    }

    return response()->json(['message' => $response['message']], $response['status']);
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
