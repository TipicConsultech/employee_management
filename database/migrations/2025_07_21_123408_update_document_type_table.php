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
       
           Schema::table('document_type', function (Blueprint $table) {
              $table->integer('product_id');
              $table->integer('company_id');

        } );//
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
           Schema::table('document_type', function (Blueprint $table) {
              $table-> $table->dropColumn('product_id');
              $table-> $table->dropColumn('company_id');
        } );
    }
};
