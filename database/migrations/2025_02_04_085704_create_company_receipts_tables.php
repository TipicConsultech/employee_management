<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('company_receipts', function (Blueprint $table) {
            $table->id();
            $table->integer('company_id');
            $table->integer('plan_id');
            $table->integer('user_id');
            $table->date('valid_till');
            $table->decimal('total_amount', 8, 2);
            $table->string('transaction_id')->nullable();
            $table->string('transaction_status')->nullable();
            // Add foreign keys with cascade rules if necessary
            $table->foreign('company_id')
                  ->references('company_id')->on('company_info')
                  ->onDelete('cascade');
            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');
            $table->foreign('plan_id')
                  ->references('id')->on('plans')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_receipts');
    }
};
