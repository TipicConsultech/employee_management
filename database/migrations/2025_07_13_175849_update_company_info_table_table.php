<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{ 
     
    /**
     * Run the migrations.
     */
    public function up(): void
    {  Schema::table('company_info', function (Blueprint $table) {
        $table->tinyInteger('face_attendance')->default(0);   //
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_info', function (Blueprint $table) {
        $table->dropColumn('face_attendance');  //
         });
    }
};
