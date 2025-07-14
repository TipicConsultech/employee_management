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
    {
        Schema::table('employee', function (Blueprint $table) {
            // Adjust the ->after() positions to suit your table order
            $table->integer('half_day_rate')->default(0);
            $table->integer('holiday_rate')->default(0);
            $table->integer('user_id')->nullble();
            $table->dropColumn('price');
            $table->enum('overtime_type', ['fixed', 'hourly'])
                  ->default('hourly')
                  ->before('overtime_rate');

            $table->enum('contract_type', ['volume_based', 'fixed'])
                  ->default('fixed')                        // default value must be in the list
                  ->after('overtime_type');

            $table->enum('attendance_type', ['face_attendance', 'location', 'both'])
                  ->default('location')
                  ->after('contract_type');
           
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['overtime_type', 'contract_type', 'attendance_type']);
        });
    }
};

