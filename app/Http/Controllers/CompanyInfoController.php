<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use App\Models\CompanyInfo;
use App\Models\Plan;
use App\Models\User;
use App\Models\Products;

    
 use Illuminate\Http\JsonResponse;

class CompanyInfoController extends Controller
{  
    public function index(Request $request)
    {
        $user = Auth::user();
        if($user->type==0) {
            return CompanyInfo::all();
        } if($user->type== 3) { 
            //return $user;
            return CompanyInfo::where('refer_by_id', $user->id)->get();
        }else{
            return CompanyInfo::where('company_id', $user->company_id)->get();
        }
    }


    public function checkDuplicate(Request $request)
{
    $request->validate([
        'email_id' => 'required|email',
        'phone_no' => 'required|digits:10',
    ]);
 
    $emailExists = CompanyInfo::where('email_id', $request->email_id)->exists();
    $mobileExists = CompanyInfo::where('phone_no', $request->phone_no)->exists();
 
    $userMobileExists = User::where('mobile', $request->phone_no)->exists();
 
    $errors = [];
    if ($emailExists) {
        $errors['email_id'] = 'This email is already taken.';
    }
    if ($mobileExists || $userMobileExists) {
        $errors['phone_no'] = 'This mobile number is already taken.';
    }
 
    if (!empty($errors)) {
        return response()->json(['errors' => $errors], 422);
    }
 
    return response()->json(['message' => 'Unique'], 200);
}

     public function getProducts()
    {   
       return Products::all();
    }


    public function companyHours()
   {
    $user = Auth::user();

    $hours = CompanyInfo::where('company_id', $user->company_id)->pluck('working_hours');

    return response()->json(['working_hours' => $hours[0]], 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'companyName' => 'required|string|max:255',
            'company_id' => 'required|integer|unique:company_info,company_id',
            'working_hours' => 'required|integer|min:1|max:24',
            'start_time' => 'required|date_format:H:i:s',
            'land_mark' => 'required|string|max:255',
            'Tal' => 'nullable|string|max:255',
            'Dist' => 'nullable|string|max:255',
            'Pincode' => 'nullable|digits:6',
            'phone_no' => [
                'required',
                'digits:10',
                Rule::unique('users', 'mobile'),
                Rule::unique('company_info', 'phone_no'),
            ],
            'email_id' => 'required|string|email|max:255|unique:company_info,email_id',
            'bank_name' => 'nullable|string|max:255',
            'account_no' => 'nullable|string|max:255',
            'IFSC' => 'nullable|string|max:255',
            'logo' => 'required|string',
            'sign' => 'required|string',
            'paymentQRCode' => 'required|string',
            'appMode' => 'required|string|in:basic,advance',
            'payment_mode' => 'required|string|in:online,cash',
            'subscribed_plan' => 'required|integer|exists:plans,id',
            'duration' => 'required|integer|in:1,12',
            'subscription_validity' => 'required|date',
            'refer_by_id' => 'nullable|integer|',
            'user_name' => 'required|string|max:255',
            'password' => 'required|string|min:6',
            'confirm_password' => 'required|string|same:password',
            'product_id' => 'required|integer|exists:products,id',
            'start_of_week' => 'required|string|in:SUNDAY,MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY',
            'week_off' => 'required|array|min:1',
            'week_off.*' => 'string|in:SUNDAY,MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY',
        ]);

        // Save the company info to the database
        $CompanyInfo = new CompanyInfo;
        $CompanyInfo->company_name = $request->input('companyName');
        $CompanyInfo->company_id = $request->input('company_id');
        $CompanyInfo->working_hours = $request->input('working_hours');
        $CompanyInfo->start_time = $request->input('start_time');
        $CompanyInfo->land_mark = $request->input('land_mark');
        $CompanyInfo->tal = $request->input('Tal', '');
        $CompanyInfo->dist = $request->input('Dist', '');
        $CompanyInfo->pincode = $request->input('Pincode', -1);
        $CompanyInfo->phone_no = $request->input('phone_no');
        $CompanyInfo->email_id = $request->input('email_id');
        $CompanyInfo->bank_name = $request->input('bank_name', '');
        $CompanyInfo->logo = $request->input('logo');
        $CompanyInfo->sign = $request->input('sign');
        $CompanyInfo->paymentQRCode = $request->input('paymentQRCode');
        $CompanyInfo->appMode = $request->input('appMode');
        $CompanyInfo->subscribed_plan = $request->input('subscribed_plan');
        $CompanyInfo->subscription_validity = $request->input('subscription_validity');
        $CompanyInfo->refer_by_id = $request->input('refer_by_id',null);
        $CompanyInfo->block_status = 0;
        $CompanyInfo->product_id = $request->input('product_id');
        $CompanyInfo->start_of_week = $request->input('start_of_week');
        $CompanyInfo->week_off = json_encode($request->input('week_off')); // Store array as JSON string
        $CompanyInfo->save();

        $companyDetails = CompanyInfo::where('email_id', $request->input('email_id'))->firstOrFail();

        return response()->json([
            'message' => 'New company is registered successfully',
            'details' => $companyDetails
        ], 200);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        return CompanyInfo::where('company_id', $id)->firstOrFail();
    }

    public function plansAndPartners(){
        $plans = Plan::all();
        $users = User::where('type', 3)->get();
        //Return plans and users in single json object
        return response()->json(['plans' => $plans, 'users' => $users],
        200);
    }

     public function weekStartDay()
    {
       $weekday=CompanyInfo::where('company_id',auth()->user()->company_id)
                           ->where('company_id',auth()->user()->company_id)
                           ->value('start_of_week');
        return  response()->json(['start_of_week' => $weekday],
        200);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $companyInfo = CompanyInfo::where('company_id', $id)->firstOrFail();
    
        $request->validate([
            'company_name' => 'required|string|max:255',
            'land_mark' => 'required|string|max:255',
            'Tal' => 'nullable|string|max:255',
            'Dist' => 'nullable|string|max:255',
            'Pincode' => 'nullable|integer',
            'phone_no' => ['required', 'digits:10', Rule::unique('company_info', 'phone_no')->ignore($companyInfo->company_id, 'company_id')],
            'email_id' => ['required', 'email', Rule::unique('company_info', 'email_id')->ignore($companyInfo->company_id, 'company_id')],
            'bank_name' => 'nullable|string|max:255',
            'account_no' => 'nullable|string|max:255',
            'IFSC' => 'nullable|string|max:255',
            'logo' => 'nullable|string',
            'sign' => 'nullable|string',
            'paymentQRCode' => 'nullable|string',
            'appMode' => 'nullable|string',
            
        ]);
    
        // Now assign values manually
        $companyInfo->company_name = $request->input('company_name');
        $companyInfo->land_mark = $request->input('land_mark');
        $companyInfo->tal = $request->input('Tal') ?? '';
        $companyInfo->dist = $request->input('Dist') ?? '';
        $companyInfo->pincode = $request->input('Pincode') ?? -1;
        $companyInfo->phone_no = $request->input('phone_no');
        $companyInfo->email_id = $request->input('email_id');
        $companyInfo->bank_name = $request->input('bank_name') ?? '';
        $companyInfo->account_no = $request->input('account_no') ?? '';
        $companyInfo->ifsc_code = $request->input('IFSC') ?? '';
        $companyInfo->logo = $request->input('logo') ?? '';
        $companyInfo->sign = $request->input('sign') ?? '';
        $companyInfo->paymentQRCode = $request->input('paymentQRCode') ?? '';
        $companyInfo->appMode = $request->input('appMode') ?? '';
        
        $companyInfo->save();
    
        return response()->json(['message' => 'Company info updated successfully', 'details' => $companyInfo], 200);
    }



public function isFaceAttendance(): JsonResponse
{
    // Grab only the column; null if the row doesn’t exist
    $flag = CompanyInfo::where('company_id',auth()->user()->company_id)
            ->value('face_attendance');   // 1, 0, or null

    if ($flag === null) {
        return response()->json([
            'message'         => 'Company not found.',
            'face_attendance' => false,
        ], 404);
    }

    return response()->json([
        'face_attendance' => (bool) $flag,   // cast 1/0 → true/false
    ]);
}

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $user = Auth::user();
        if($user->type==0) {
            $company = CompanyInfo::where('company_id', $id)->firstOrFail();
            return $company->delete();
        }
        return response()->json(['message' => 'Not allowed'], 401); 
    }

}
