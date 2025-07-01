<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use App\Models\CompanyInfo;
use App\Models\Plan;
use App\Models\User;

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
    
    public function store(Request $request)
    {
        $request->validate([
            'land_mark' => 'required|string|max:255',
            'companyName' => 'required|string|max:255',
            // 'Tal' => 'required|string|max:255',
            // 'Dist' => 'required|string|max:255',
            // 'Pincode' => 'required|integer',
            
            'phone_no' => ['required', 'digits:10',
                    Rule::unique('users', 'mobile'),
                    Rule::unique('company_info', 'phone_no')],
            //add validation for email id with unique across table 
            'email_id' => 'required|string|unique:company_info',
            // 'bank_name' => 'required|string|max:255',
            // 'account_no' => 'required|string|max:255',
            // 'IFSC' => 'required|string|max:255',
            'logo' => 'required|string',
            'sign' => 'required|string', // Assuming sign is also an image file
            'paymentQRCode' => 'required|string', 
            'appMode' => 'required|string',
            'subscribed_plan' => 'required|integer',
            'refer_by_id' => 'required',
            'subscription_validity' => 'required',
        ]);

        // Save the company info to the database
        $CompanyInfo = new CompanyInfo;
        $CompanyInfo->company_name = $request->input('companyName');
        $CompanyInfo->land_mark = $request->input('land_mark');
        $CompanyInfo->tal = $request->input('Tal') ? $request->input('Tal') : '';
        $CompanyInfo->dist = $request->input('Dist') ? $request->input('Dist') : '';
        $CompanyInfo->pincode = $request->input('Pincode') ? $request->input('Pincode') : -1;
        $CompanyInfo->phone_no = $request->input('phone_no');
        $CompanyInfo->email_id = $request->input('email_id');
        $CompanyInfo->bank_name = $request->input('bank_name') ? $request->input('bank_name') : '';;
        $CompanyInfo->account_no = $request->input('account_no') ? $request->input('account_no') : '';
        $CompanyInfo->ifsc_code = $request->input('IFSC') ? $request->input('IFSC') : '';
        $CompanyInfo->logo = $request->input('logo'); 
        $CompanyInfo->sign = $request->input('sign');  
        $CompanyInfo->paymentQRCode = $request->input('paymentQRCode');  
        $CompanyInfo->appMode = $request->input('appMode');  
        $CompanyInfo->subscribed_plan = $request->input('subscribed_plan');  
        $CompanyInfo->subscription_validity = $request->input('subscription_validity');  
        $CompanyInfo->refer_by_id = $request->input('refer_by_id');  
        $CompanyInfo->block_status = 0;

        $CompanyInfo->save();
        //$companyDetails = CompanyInfo::create($CompanyInfo);
        $companyDetails = CompanyInfo::where('email_id', $request->input('email_id'))->firstOrFail();

        return response()->json(['message' => 'New company is registered successfully', 'details' => $companyDetails], 200);
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
