<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('milk_tanks', function (Blueprint $table) {
            $table->id();
            $table->integer('company_id');
            // Add your other milk_tanks columns here
            $table->timestamps();
        });

        // Add the foreign key constraint after table creation
        if (Schema::hasTable('company_info')) {
            Schema::table('milk_tanks', function (Blueprint $table) {
                $table->foreign('company_id')->references('company_id')->on('company_info');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('milk_tanks');
    }
};
