<?php
namespace App\Http\Controllers;

use App\Models\OnboardingPartnerType;
use Illuminate\Http\Request;

class OnboardingPartnerTypeController extends Controller
{
    public function index()
    {
        return response()->json(OnboardingPartnerType::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'partner_type' => 'required|string',
            'commission' => 'required|numeric',
        ]);

        $type = OnboardingPartnerType::create($request->all());

        return response()->json(['message' => 'Partner type created', 'data' => $type], 201);
    }

    public function show($id)
    {
        $type = OnboardingPartnerType::findOrFail($id);
        return response()->json($type);
    }

    public function update(Request $request, $id)
    {
        $type = OnboardingPartnerType::findOrFail($id);

        $request->validate([
            'partner_type' => 'required|string',
            'commission' => 'required|numeric',
        ]);

        $type->update($request->all());

        return response()->json(['message' => 'Partner type updated', 'data' => $type]);
    }

    public function destroy($id)
    {
        OnboardingPartnerType::destroy($id);
        return response()->json(['message' => 'Partner type deleted']);
    }
}
