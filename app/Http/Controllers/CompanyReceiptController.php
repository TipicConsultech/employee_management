<?php
namespace App\Http\Controllers;

use App\Models\CompanyReceipt;
use Illuminate\Http\Request;

class CompanyReceiptController extends Controller
{
    /**
     * Store a newly created company receipt in storage.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // Validate the incoming request
        $validated = $request->validate([
            'company_id' => 'required|integer',
            'plan_id' => 'required|integer',
            'user_id' => 'required|integer',
            'total_amount' => 'required|numeric',
            'valid_till' => 'required|date',
            'transaction_id' => 'required|string',
            'transaction_status' => 'required|string',
        ]);

        // Create a new company receipt record
        $resp = CompanyReceipt::create($request->all());

        $companyReceipt = CompanyReceipt::with(['user:id,name,email,mobile','plan','company:company_id,company_name,email_id,phone_no'])
        ->where('id', $resp->id)->get();

        // Return a success response
        return response()->json([
            'success' => true,
            'message' => 'Company receipt saved successfully!',
            'data' => $companyReceipt,
        ], 201); // 201 Created
    }

    /**
     * Display a listing of the company receipts.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $companyReceipts = CompanyReceipt::with(['user:id,name,email,mobile','plan','company:company_id,company_name,email_id,phone_no'])
        ->orderBy('id', 'desc')->paginate(25);
        // $companyReceipts = CompanyReceipt::all();

        return response()->json([
            'success' => true,
            'data' => $companyReceipts
        ]);
    }
}
