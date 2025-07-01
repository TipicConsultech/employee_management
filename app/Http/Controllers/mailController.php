<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\ResetPasswordEmailModel;
use App\Mail\ResetPasswordEmail;
use Illuminate\Support\Str;


class MailController extends Controller
{
    public function sendEmail(Request $request)
    {
        // Log the incoming request
        // Log::info('Received request to send password reset email', ['email' => $request->email]);
    
        // Validate the request
        $request->validate([
            'email' => 'required|email',
        ]);
    
        $email = $request->email;
    
        // Check if email exists in users table
        if (!User::where('email', $email)->exists()) {
             return response()->json(['message' => 'User is not registered.'], 200);
        }
    
        // Generate and store token
        $token = Str::random(64);
    
        // Hash the token before storing it in the database
        $hashedToken = Hash::make($token);
    
        // Clean up old tokens and insert a new one in password_reset_tokens table
        DB::table('password_reset_tokens')
            ->where('created_at', '<', now()->subMinutes(60)) // Remove expired tokens
            ->delete();
    
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email], // Match email
            [
                'token' => $hashedToken,  // Save token
                'created_at' => now(),    // Save creation time
            ]
        );
    
        // Update the user's remember_token column via an API call
        try {
            User::where('email', $email)->update(['remember_token' => $hashedToken]);
            Log::info('Remember token updated successfully in the users table', ['email' => $email]);
        } catch (Exception $e) {
            Log::error('Error updating remember_token in the users table', ['email' => $email, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to update user information.'], 500);
        }
    
        // Send email
        try {
            Mail::to($email)->send(new ResetPasswordEmail($hashedToken));
    
            // Log::info('Password reset email sent successfully', ['email' => $email]);
    
            return response()->json(['message' => 'Link is sent on email.'], 201);
        } catch (Exception $e) {
            Log::error('Error sending password reset email', ['email' => $email, 'error' => $e->getMessage()]);
    
            return response()->json(['error' => 'Failed to send email. Please try again later.'], 500);
        }
    }
 
    public function resetPassword(Request $request)
    {
        try {
            // Validate input
            $request->validate([
                'token' => 'required',
                'newPassword' => 'required', // Ensure confirmation and length
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed during password reset', [
                'errors' => $e->errors(),
                'request' => $request->all(),
            ]);
    
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        }
    
        try {
            // Find token data
            $tokenData = ResetPasswordEmailModel::where('token', $request->token)->first();
    
            if (!$tokenData) {
                Log::warning('Invalid or expired token attempted', [
                    'token' => $request->token,
                ]);
    
                return response()->json(['message' => 'Invalid or expired token'], 400);
            }
    
            // Find user by email
            $user = User::where('email', $tokenData->email)->first();
    
            if (!$user) {
                Log::warning('User not found for token', [
                    'email' => $tokenData->email,
                ]);
    
                return response()->json(['message' => 'User not found'], 404);
            }
        } catch (\Exception $e) {
            Log::error('Error while processing password reset token or user lookup', [
                'error' => $e->getMessage(),
                'token' => $request->token,
            ]);
    
            return response()->json(['message' => 'An error occurred while processing the request', 'error' => $e->getMessage()], 500);
        }
    
        try {
            // Update user password securely
            $user->update(['password' => bcrypt($request->newPassword)]);
    
            // Invalidate the token by setting it to an empty string
            ResetPasswordEmailModel::where('email', $tokenData->email)
                ->update(['token' => '']); // Use an empty string instead of null
    
            Log::info('Password updated successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
        } catch (\Exception $e) {
            Log::error('Error while updating password or invalidating token', [
                'error' => $e->getMessage(),
                'user_id' => $user->id ?? null,
                'email' => $user->email ?? null,
            ]);
    
            return response()->json(['message' => 'An error occurred while updating the password', 'error' => $e->getMessage()], 500);
        }
    
        return response()->json(['message' => 'Password updated successfully'], 200);
    }
    

    
    
}