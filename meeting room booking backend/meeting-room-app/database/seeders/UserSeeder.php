<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name'=>'May Yi ko',
                'email'=>'mayyi@gmail.com',
                'phone'=>'09756916318',
                'password'=>Hash::make('mayyi3122'),
                'role'=>'admin',
            ],
            [
                'name'=>'MS',
                'email'=>'MSSSSSSSS@gmail.com',
                'phone'=>'09898968007',
                'password'=>Hash::make('panpan3122'),
                'role'=>'user',
            ],
        ];
        foreach($users as $userData){
            $roleName = $userData['role'];
            unset($userData['role']);

            $user=User::create($userData);
            $user->assignRole($roleName);
        }
    }
}
