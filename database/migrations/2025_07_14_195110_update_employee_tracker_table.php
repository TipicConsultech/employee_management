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
    {  Schema::table('employee_tracker', function (Blueprint $table) {
        $table->tinyInteger('half_day')->default(0);   //
        $table->enum('status',['P','A','CL','PL','SL','NA'])->default('NA');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_tracker', function (Blueprint $table) {
        $table->dropColumn('half_day');  //
        $table->dropColumn('status');  //

         });
    }
};
