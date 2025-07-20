<?php

namespace App\Http\Controllers;

use App\Models\OnboardingPartner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class OnboardingPartnerController extends Controller
{
    // 1. List all partners
    public function index()
    {
        return response()->json(OnboardingPartner::with('partner_types')->get());
    }

    // 2. Show only ID & name
    public function indexCompany()
    {
        return OnboardingPartner::select('id', 'name')->get();
    }

    // 3. Register new partner
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:onboarding_partners,email',
            'mobile' => 'required|string|digits:10|unique:onboarding_partners,mobile',
            'password' => 'required|min:6|confirmed',
            'type_id' => 'required|integer|exists:onboarding_partner_types,id',
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'ifsc_code' => 'required|string|max:11',
        ]);

        $partner = OnboardingPartner::create([
            'name' => $request->name,
            'email' => $request->email,
            'mobile' => $request->mobile,
            'password' => Hash::make($request->password),
            'type_id' => $request->type_id,
            'type' => 3,
            'bank_name' => $request->bank_name,
            'account_number' => $request->account_number,
            'ifsc_code' => $request->ifsc_code,
        ]);

        // Create token for the newly registered partner
        $token = $partner->createToken('webapp')->plainTextToken;

        return response()->json([
            'message' => 'Partner registered successfully',
            'partner' => $partner->load('partner_types'),
            'token' => $token
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $partner = OnboardingPartner::where('email', $request->email)->first();

        if (!$partner || !Hash::check($request->password, $partner->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        // Create token with consistent naming like AuthController
        $token = $partner->createToken('webapp')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'partner' => $partner,
            'token' => $token,
        ], 201);
    }

    // Mobile login method (similar to AuthController)
    public function mobileLogin(Request $request)
    {
        $request->validate([
            'mobile' => 'required|string',
            'password' => 'required|string'
        ]);

        // Check if mobile no exists
        $partner = OnboardingPartner::where('mobile', $request->mobile)->first();

        // Check password
        if (!$partner || !Hash::check($request->password, $partner->password)) {
            return response()->json([
                'message' => 'Please provide valid credentials'
            ], 401);
        }

        $token = $partner->createToken('webapp')->plainTextToken;
        
        return response()->json([
            'partner' => $partner,
            'token' => $token
        ], 201);
    }

    // Logout method (delete all tokens like AuthController)
    public function logout(Request $request)
    {
        $partner = $request->user();

        if ($partner) {
            // Delete all tokens like in AuthController
            $partner->tokens()->delete();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    // Change password method (similar to AuthController)
    public function changePassword(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
            'new_password' => 'required|string',
        ]);

        // Check if email exists
        $partner = OnboardingPartner::where('email', $request->email)->first();

        // Check password
        if (!$partner || !Hash::check($request->password, $partner->password)) {
            return response()->json([
                'message' => 'Please provide valid credentials'
            ], 401);
        } else {
            $partner->password = Hash::make($request->new_password);
            $partner->save();
            // Delete all existing tokens
            $partner->tokens()->delete();
        }

        return response()->json([
            'message' => 'Password Changed Successfully, Login with new Password',
            'status' => 1
        ], 200);
    }

    // Authenticated partner info
    public function me(Request $request)
    {
        return response()->json([
            'partner' => $request->user(),
        ]);
    }

    // 7. Show single partner
    public function show($id)
    {
        $partner = OnboardingPartner::with('partner_types')->findOrFail($id);
        return response()->json($partner);
    }

    // 8. Update partner
    public function update(Request $request, $id)
    {
        $partner = OnboardingPartner::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:onboarding_partners,email,' . $id,
            'mobile' => 'sometimes|required|string|digits:10|unique:onboarding_partners,mobile,' . $id,
            'type_id' => 'sometimes|required|integer|exists:onboarding_partner_types,id',
            'bank_name' => 'sometimes|required|string|max:255',
            'account_number' => 'sometimes|required|string|max:50',
            'ifsc_code' => 'sometimes|required|string|max:11',
        ]);

        $partner->update($request->except(['password']));
        return response()->json(['message' => 'Partner updated', 'partner' => $partner]);
    }

    // 9. Delete partner
    public function destroy($id)
    {
        OnboardingPartner::destroy($id);
        return response()->json(['message' => 'Partner deleted']);
    }
}