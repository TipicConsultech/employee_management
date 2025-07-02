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
        Schema::create('employee', function (Blueprint $table) {

            /* -----------------------------------------------------------------
             | Primary key
             * ----------------------------------------------------------------- */
            $table->id();                                      // BIGINT UNSIGNED

            /* -----------------------------------------------------------------
             | Foreign keys
             * ----------------------------------------------------------------- */

            // product_id  →  products.id   (BIGINT UNSIGNED)
            $table->foreignId('product_id')                    // unsignedBigInteger + index
                  ->constrained()                              // defaults to products.id
                  ->cascadeOnDelete();

            // company_id  →  company_info.id   (INT SIGNED)
            $table->integer('company_id');                     // match INT type exactly
            $table->foreign('company_id')
                  ->references('id')->on('company_info')
                  ->cascadeOnDelete();

            /* -----------------------------------------------------------------
             | Employee details
             * ----------------------------------------------------------------- */
            $table->string('name');
            $table->enum('gender',        ['male', 'female', 'other']);
            $table->enum('payment_type',  ['weekly', 'monthly'])->default('monthly');
            $table->enum('work_type',     ['fulltime', 'contract'])->default('fulltime');

            // money / rates   (use decimal if you prefer exact currency storage)
            $table->double('price')->default(0);
            $table->double('wage_hour');
            $table->double('wage_overtime');
            $table->double('credit')->default(0);
            $table->double('debit')->default(0);

            $table->string('adhaar_number')->nullable();
            $table->string('mobile');
            $table->string('refferal_by');

            $table->boolean('isActive')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee');
    }
};
