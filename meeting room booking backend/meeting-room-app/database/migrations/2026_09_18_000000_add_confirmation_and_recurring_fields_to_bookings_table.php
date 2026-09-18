<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * NOTE: If your `status` column is a native MySQL ENUM (not a plain
     * string/varchar), you also need to widen it to allow the new
     * 'unconfirmed' value, e.g.:
     *
     *   DB::statement("ALTER TABLE bookings MODIFY status
     *       ENUM('booked','unconfirmed','cancelled','rejected') NOT NULL DEFAULT 'booked'");
     *
     * Check your original create_bookings_table migration to see which
     * type was used before running this.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Timestamp set when the user presses "Confirm Booking".
            // Stays null until confirmed; used to detect no-shows.
            $table->timestamp('confirmed_at')->nullable()->after('status');

            // Shared id across all bookings created together via the
            // "repeat on consecutive days" feature. Lets us group/cancel
            // an entire series later if needed.
            $table->uuid('recurring_group_id')->nullable()->after('remark');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['confirmed_at', 'recurring_group_id']);
        });
    }
};
