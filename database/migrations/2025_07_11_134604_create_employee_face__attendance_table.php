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
      Schema::create('employee_face_attendance', function (Blueprint $table) {
    $table->id();

    $table->foreignId('employee_tracker_id')   // column name
          ->constrained('employee_tracker')    // <‑‑ parent table name
          ->cascadeOnDelete();

    $table->string('checkin_img');
    $table->string('checkout_img')->nullable();
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_face__attendance');
    }
};
