<?php

use App\Mail\ResetPasswordEmail;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MailController;
use Illuminate\Support\Facades\Mail;

Route::view("/", "welcome");
Route::get('/send-email', [MailController::class, 'index']);
Route::post('/reset-password-link', [MailController::class, 'sendEmail']);

