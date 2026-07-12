<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $userRole = Role::firstOrCreate(['name' => 'user']);

        $RoomList = Permission::firstOrCreate(['name'=>'RoomList']);
        $RoomUpdate = Permission::firstOrCreate(['name'=>'RoomUpdate']);
        $RoomCreate = Permission::firstOrCreate(['name'=>'RoomCreate']);
        $RoomDelete = Permission::firstOrCreate(['name'=>'RoomDelete']);

        $UserStore = Permission::firstOrCreate(['name'=>'UserStore']);
        $UserUpdate = Permission::firstOrCreate(['name'=>'UserUpdate']);
        $UserDelete = Permission::firstOrCreate(['name'=>'UserDelete']);

        $BookingConfirm = Permission::firstOrCreate(['name'=>'BookingConfirm']);
        $BookingReject = Permission::firstOrCreate(['name'=>'BookingReject']);

        $adminRole->givePermissionTo(Permission::all());
        $userRole->givePermissionTo(['RoomList']);
    }
}
