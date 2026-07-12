<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Room;


class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rooms = [
            [
                'name' => 'Mind Room',
                'capacity'=> 5,
                'location'=> '4th floor',
                'status'=>'available',
            ],
            [
                'name'=>'Infinity Room',
                'capacity'=> 10,
                'location'=>'4th floor',
            ],
        ];
         foreach($rooms as $room){
            Room::create($room);
        }

    }
}
