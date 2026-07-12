<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Booking;

class BookingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $bookings = [
            [
                'user_id' => 1,
                'room_id' => 1,
                'booking_date'=> '2026-07-01',
                'start_time'=>'09:00',
                'end_time'=>'10:00',
                'purpose'=>'Meeting',
                'status'=>'pending',

            ],
            [
                'user_id' =>2,
                'room_id' =>2,
                'booking_date'=> '2026.06.26',
                'start_time' => '10:00',
                'end_time'=>'12:00',
                'purpose'=>'Study',
                'status'=>'pending',
            ],
        ];
         foreach($bookings as $booking){
            Booking::create($booking);
        }


    }
}
