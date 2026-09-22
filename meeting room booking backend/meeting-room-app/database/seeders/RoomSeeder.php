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
                'capacity' => 5,
                'location' => '4th floor',
                'status' => 'available',
                'description' => 'Small meeting room for focused discussions.',
                'image' => null,
            ],
            [
                'name' => 'Infinity Room',
                'capacity' => 10,
                'location' => '4th floor',
                'status' => 'available',
                'description' => 'Large meeting room for team meetings.',
                'image' => null,
            ],
        ];
        foreach ($rooms as $room) {
            Room::create($room);
        }
    }
}
