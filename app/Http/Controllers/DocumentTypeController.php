<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use Illuminate\Http\Request;

class DocumentTypeController extends Controller
{
    /**
     * GET /api/document-types
     */
    public function index()
    { 
        $documentType=DocumentType::where('company_id',auth()->user()->company_id)
                                   ->where('product_id',auth()->user()->product_id)->get();  
        return response()->json($documentType);
    }

    /**
     * POST /api/document-types
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'document_name' => 'required|string|max:255',
        ]);

        $validated['company_id']=auth()->user()->company_id;
         $validated['product_id']=auth()->user()->product_id;

        $documentType = DocumentType::create($validated);

        return response()->json($documentType, 201);
    }

    /**
     * GET /api/document-types/{document_type}
     * Route‑model–bound parameter type‑hints resolve automatically.
     */
    public function show(DocumentType $document_type)
    {
        return response()->json($document_type);
    }

    /**
     * PUT/PATCH /api/document-types/{document_type}
     */
    public function update(Request $request, DocumentType $document_type)
    {
        $validated = $request->validate([
            'document_name' => 'required|string|max:255',
        ]);

        $document_type->update($validated);

        return response()->json($document_type);
    }

    /**
     * DELETE /api/document-types/{document_type}
     */
    public function destroy(DocumentType $document_type)
    {
        $document_type->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
