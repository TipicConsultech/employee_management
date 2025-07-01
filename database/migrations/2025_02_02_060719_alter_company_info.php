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
        // add new columns email_id with constraint unique in table company_info
        Schema::table('company_info', function (Blueprint $table) {
            //make email_id unique only if present so that existing table colums will not throw error
            // $table->string('email_id')->unique()->nullable()->change();
            // $table->string('email_id')->unique()->after('Phone_no');
            $table->string('email_id')->unique()->nullable()->after('Phone_no');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //rollback
        Schema::table('company_info', function (Blueprint $table) {
            $table->dropColumn('email_id');
        });
    }
};
