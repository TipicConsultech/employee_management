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
             'transaction_id'=> ['nullable', 'string']
        ]);

       
        $data['company_id']=auth()->user()->company_id;
        $data['product_id']=auth()->user()->product_id;
        $data['transaction_type']='credit';
        $data['salary_amount']=$data['payed_amount'];
        $data['payed_amount']=$data['payed_amount'];

        $transaction = EmployeeTransaction::create($data);
        $employee = Employee::find($data['employee_id']);       // returns null if not found
        $employee->credit+=$data['payed_amount'];
        $employee->save();

        return response()->json($transaction, 201);
    }
  
}


