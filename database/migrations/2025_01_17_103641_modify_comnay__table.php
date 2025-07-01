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
        Schema::table('company_info', function (Blueprint $table) {
            $table->integer('subscribed_plan')->default(1)->after('appMode');
            $table->date('subscription_validity')->nullable()->after('subscribed_plan');
            $table->unsignedBigInteger('refer_by_id')->nullable()->after('subscription_validity');

            $table->foreign('refer_by_id')->references('id')->on('users')->onDelete('set null');
            // optional: onDelete('set null') means if user deleted, refer_by_id becomes NULL
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_info', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['refer_by_id']);
            // Then drop the column
            $table->dropColumn('refer_by_id');
            $table->dropColumn('subscribed_plan');
            $table->dropColumn('subscription_validity');
        });
    }
};
