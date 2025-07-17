<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Allowed controllers
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyInfoController;
use App\Http\Controllers\CompanyReceiptController;
use App\Http\Controllers\FileUpload;
use App\Http\Controllers\MailController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\RazorpayController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeTrackerController;
use App\Http\Controllers\EmployeeTransactionController;
use App\Http\Controllers\EmployeeDetailsController;
use App\Http\Controllers\CommonController;
use App\Http\Controllers\CompanyCordinateController;
use App\Http\Controllers\DocumentTypeController;

// use App\Http\Controllers\PaymentTrackerController;   // include when you add routes

/*
|--------------------------------------------------------------------------
| Public (unauthenticated) routes
|--------------------------------------------------------------------------
*/
Route::post('/register',      [AuthController::class, 'register']);
Route::post('/login',         [AuthController::class, 'login']);
Route::post('/mobileLogin',   [AuthController::class, 'mobileLogin']);

Route::post('/reset-password-link', [MailController::class, 'sendEmail']);
Route::post('/newPassword',         [MailController::class, 'resetPassword']);

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/employee-tracker/status', [EmployeeTrackerController::class, 'checkTodayStatus']);
Route::middleware('auth:sanctum')->post('/employee-tracker/{id}', [EmployeeTrackerController::class, 'update']);
Route::middleware('auth:sanctum')->post('/workSummary', [EmployeeTrackerController::class, 'workSummary']);
Route::middleware('auth:sanctum')->post('/payment', [EmployeeTransactionController::class, 'payment']);
Route::middleware('auth:sanctum')->post('/storeCordinates', [CompanyCordinateController::class, 'storeCordinates']);
Route::middleware('auth:sanctum')->get('/getCordinates', [CompanyCordinateController::class, 'getCordinates']);
Route::middleware('auth:sanctum')->post('/bulkCheckIn', [EmployeeTrackerController::class, 'bulkCheckIn']);
Route::middleware('auth:sanctum')->post('/bulkCheckOut', [EmployeeTrackerController::class, 'bulkCheckOut']);
Route::middleware('auth:sanctum')->post('/employeeCredit', [CommonController::class, 'employeeCredit']);
Route::middleware('auth:sanctum')->get('/isface-attendance', [CompanyInfoController::class, 'isFaceAttendance']);
Route::middleware('auth:sanctum')->post('/contractSummary', [EmployeeTrackerController::class, 'contractSummary']);
 Route::middleware('auth:sanctum')->post('/weeklyPresenty', [EmployeeTrackerController::class, 'weeklyPresenty']);

Route::middleware(['auth:sanctum'])->group(function () {
  /* ---------- EmployeeController APIs---------- */
    Route::apiResource('document-type', DocumentTypeController::class);
    Route::apiResource('employee-details', EmployeeDetailsController::class);
    Route::apiResource('employee-transactions', EmployeeTransactionController::class);  
    Route::apiResource('employee-tracker', EmployeeTrackerController::class);
    Route::apiResource('employees', EmployeeController::class);
    Route::get ('/employeeDtailsForDashboard',[EmployeeController::class, 'employeeDtailsForDashboard']);
    Route::get('/employee/{id}', [EmployeeController::class, 'showEmployeesDetails']);
 Route::put('/employees/{employee}', [EmployeeController::class, 'update']);
 Route::put('/employeetracker/{id}', [EmployeeTrackerController::class, 'updateTraker']);

    /* ---------- AuthController ---------- */
    Route::post('/changePassword', [AuthController::class, 'changePassword']);
    Route::post('/logout',         [AuthController::class, 'logout']);
    Route::post('/registerUser',   [AuthController::class, 'registerUser']);
    Route::put ('/appUsers',       [AuthController::class, 'update']);
    Route::get ('/appUsers',       [AuthController::class, 'allUsers']);

    /* ---------- PlanController ---------- */
    Route::resource('plan', PlanController::class);

    /* ---------- FileUpload ---------- */
    Route::post('/fileUpload', [FileUpload::class, 'fileUpload']);
    Route::get('/documents/{employee_id}', [EmployeeDetailsController::class, 'documentView']);
 

    /* ---------- CompanyInfoController ---------- */
    Route::resource('company', CompanyInfoController::class);


    /* ---------- RazorpayController ---------- */
    Route::post('/create-order',  [RazorpayController::class, 'createOrder']);
    Route::post('/verify-payment', [RazorpayController::class, 'verifyPayment']);

    /* ---------- CompanyReceiptController ---------- */
    Route::post('/company-receipt',  [CompanyReceiptController::class, 'store']);
    Route::get ('/company-receipts', [CompanyReceiptController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Authenticated user info (closure, no controller)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
