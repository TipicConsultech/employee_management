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
            
            $table->renameColumn('wage_hour', 'wage_day');
        
        });//
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
       Schema::table('employee', function (Blueprint $table) {
            // Adjust the ->after() positions to suit your table order
         
            $table->renameColumn('wage_day', 'wage_hour');
      
        });
    }
};
