<?php

namespace App\Http\Controllers;
use App\Models\CompanyCordinate;
use Illuminate\Http\Request;
use App\Models\Employee;

class CompanyCordinateController extends Controller
{
    /**
     * GET /api/company-cordinates
     */
    public function index(Request $request)
    {
        $query = CompanyCordinate::query();

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * POST /api/company-cordinates
     */
    public function storeCordinates(Request $request)
    {
        // 1. Validate the client‑supplied fields
        $validated = $request->validate([
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
            'tolerance' => ['required', 'numeric'],
        ]);


        // 2. Inject server‑side data
        $validated['product_id'] = auth()->user()->product_id;
        $validated['company_id'] = auth()->user()->company_id;   // keep spelling in sync

        /* ------------------------------------------------------------------
           3. Upsert: if a row for this (product_id, comapany_id) already
           exists, update its coords/tolerance; otherwise create a new one.
        ------------------------------------------------------------------ */
        $cordinate = CompanyCordinate::updateOrCreate(
            [
                'product_id' => $validated['product_id'],
                'company_id' => $validated['company_id'],
            ],
            [
                'required_lat' => $validated['latitude'],
                'required_lng' => $validated['longitude'],
                'location_tolerance' => $validated['tolerance'],
            ],
        );

        // 4. Return the up‑to‑date record with HTTP 201/200 as appropriate
        $statusCode = $cordinate->wasRecentlyCreated ? 201 : 201;

        return response()->json($cordinate, $statusCode);
    }

    public function getCordinates()
    {
        $productId = auth()->user()->product_id;
        $comapanyId = auth()->user()->company_id;
        $cordinate = CompanyCordinate::where('product_id', $productId)
            ->where('company_id', $comapanyId)
            ->get();
        return response()->json($cordinate, 201);
    }

    /**
     * GET /api/company-cordinates/{id}
     */
    public function show(CompanyCordinate $companyCordinate)
    {
        return response()->json($companyCordinate);
    }

    /**
     * PUT/PATCH /api/company-cordinates/{id}
     */
    public function update(Request $request, CompanyCordinate $companyCordinate)
    {
        // use `sometimes` so callers can PATCH only the fields they need
        $validated = $request->validate([
            'product_id' => ['sometimes', 'required', 'integer'],
            'comapany_id' => ['sometimes', 'required', 'integer'],
            'required_lat' => ['sometimes', 'required', 'numeric'],
            'required_lng' => ['sometimes', 'required', 'numeric'],
            'location_tolerance' => ['sometimes', 'required', 'numeric'],
        ]);

        $companyCordinate->update($validated);

        return response()->json($companyCordinate); // 200 OK
    }

    /**
     * DELETE /api/company-cordinates/{id}
     */
    public function destroy(CompanyCordinate $companyCordinate)
    {
        $companyCordinate->delete();

        return response()->noContent();             // 204 No Content
    }
}

