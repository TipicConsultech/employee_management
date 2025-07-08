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
        Schema::create('company_cordinates', function (Blueprint $table) {
            $table->id();
            $table->integer('product_id');
            $table->integer('company_id');
            $table->string('required_lat');
            $table->string('required_lng');
            $table->string('location_tolerance');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_cordinates');
    }
};
