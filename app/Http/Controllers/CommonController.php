<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use App\Models\Employee;
use App\Models\EmployeeTracker;
use App\Models\EmployeeDetails;
use App\Models\EmployeeTransaction;

class CommonController extends Controller
{
  public function employeeCredit(Request $request)
{
    $data = $request->validate([
        'employee_id'       => ['required', 'exists:employee,id'],
        'payment_type'      => ['required', 'in:cash,upi,bank_transfer'],
        'payed_amount'      => ['required', 'numeric', 'min:1'],
        'transaction_id'    => ['nullable', 'string'],
    ]);

    $employee = Employee::find($data['employee_id']);

    if (!$employee) {
        return response()->json(['error' => 'Employee not found.'], 404);
    }

    $oldDebit = $employee->debit;
    $payed = $data['payed_amount'];
    $creditToAdd = 0;

    // Apply your logic
    if ($oldDebit > 0) {
        if ($payed < $oldDebit) {
            // Case 1: Payed amount is less than debit
            $employee->debit -= $payed;
        } else {
            // Case 2: Payed amount is equal to or more than debit
            $creditToAdd = $payed - $oldDebit;
            $employee->debit = 0;
            $employee->credit += $creditToAdd;
        }
    } else {
        // Case 3: No debit, just credit
        $employee->credit += $payed;
    }

    $employee->save();

    // Add transaction data
    $data['company_id'] = auth()->user()->company_id;
    $data['product_id'] = auth()->user()->product_id;
    $data['transaction_type'] = 'credit';
    $data['salary_amount'] = $payed;

    $transaction = EmployeeTransaction::create($data);

    return response()->json([
        'message' => 'Payment processed successfully.',
        'transaction' => $transaction,
        'employee' => $employee
    ], 201);
}

  
}


