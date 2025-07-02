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
        Schema::create('employee_details', function (Blueprint $table) {
            /* -----------------------------------------------------------------
             | Primary key
             * ----------------------------------------------------------------- */
            $table->id();                                      // BIGINT UNSIGNED

            /* -----------------------------------------------------------------
             | Foreign keys
             * ----------------------------------------------------------------- */

            // product_id  →  products.id   (BIGINT UNSIGNED)
            $table->foreignId('product_id')
                  ->constrained()                              // defaults to products.id
                  ->cascadeOnDelete();

            // employee_id  →  employee.id  (BIGINT UNSIGNED)
            $table->foreignId('employee_id')
                  ->constrained('employee')                    // points to employee.id
                  ->cascadeOnDelete();

            // company_id  →  company_info.id (INT signed)
            $table->integer('company_id');                     // matches INT type exactly
            $table->foreign('company_id')
                  ->references('id')->on('company_info')
                  ->cascadeOnDelete();

            /* -----------------------------------------------------------------
             | Document metadata
             * ----------------------------------------------------------------- */
            $table->string('document_name');
            $table->string('document_link');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_details');
    }
};
