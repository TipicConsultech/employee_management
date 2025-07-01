<?php
namespace App\Http\Controllers;
 
use Illuminate\Http\Request;
 
use Razorpay\Api\Api;
 
class RazorpayController extends Controller
 
{
 
    protected $api;
 
    public function __construct()
 
    {
 
        $this->api = new Api(env('RAZORPAY_KEY_ID'), env('RAZORPAY_KEY_SECRET'));
 
    }
 
    // Create Order
 
    public function createOrder(Request $request)
 
    {
 
        $amount = $request->amount;
        try {
            $orderData = [
                'receipt' => 'order_rcptid_' . rand(1000, 9999),
                'amount' => $amount * 100, // Convert to paise
                'currency' => 'INR',
                'payment_capture' => 1,
            ];
 
            $order = $this->api->order->create($orderData);
 
            \Log::info('Order Created: ', $order->toArray());
 
            return response()->json([
                'success' => true,
                'order' => $order->toArray(),
                'key' => env('RAZORPAY_KEY_ID')
            ], 201);
 
        } catch (\Exception $e) {
 
            \Log::error('Order Creation Failed: ' . $e->getMessage());
 
            return response()->json([
 
                'success' => false,
 
                'message' => 'Failed to create order. ' . $e->getMessage(),
 
            ], 500);
 
        }
 
    }
 
    // Verify Payment
 
    public function verifyPayment(Request $request)
 
    {
 
        $request->validate([
 
            'razorpay_order_id' => 'required',
 
            'razorpay_payment_id' => 'required',
 
            'razorpay_signature' => 'required',
 
        ]);
 
        try {
 
            $attributes = [
 
                'razorpay_order_id' => $request->razorpay_order_id,
 
                'razorpay_payment_id' => $request->razorpay_payment_id,
 
                'razorpay_signature' => $request->razorpay_signature,
 
            ];
 
            $this->api->utility->verifyPaymentSignature($attributes);
 
            return response()->json(['success' => true, 'message' => 'Payment verified successfully']);
 
        } catch (\Exception $e) {
 
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
 
        }
 
    }
 
  
 
}