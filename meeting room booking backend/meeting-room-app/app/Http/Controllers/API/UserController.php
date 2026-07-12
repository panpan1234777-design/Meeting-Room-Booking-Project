<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\UpdateUserRequest;
use App\Models\user;
use App\Http\Controllers\API\BaseController;
use App\Http\Requests\StoreUserRequest;

class UserController extends BaseController
{
    public function index()
    {
        $users = User::with('roles')->get();
        return $this->success($users, 'User retrieved successfully.', 200);
    }

    public function show($id)
    {
        $user = User::with('roles')->find($id);
        if (!$user) {
            return $this->error(null, 'User not found.', 404);
        }
        return $this->success($user, 'User retrieved successfully.');
    }

    public function delete($id)
    {
        $user = User::find($id);
        if (!$user) {
            return $this->error(null, "User not found", 404);
        }
        $user->delete();
        return $this->success(null, 'User deleted successfully.');
    }

    public function update(UpdateUserRequest $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return $this->error(null, 'User not found', 404);
        }
        $data = $request->validated();

    if (!empty($data['password'])) {
        $data['password'] = bcrypt($data['password']);
    } else {
        unset($data['password']);
    }
        $user->update($data);

        return $this->success($user, 'User updated successfully.');
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();
        $data['password'] = bcrypt($data['password']);

        $roleName = $data['role'] ?? 'user';
        unset($data['role']);
        //    if (isset($data['role'])) {
        //         if ($request->user() && $request->user()->role !== 'admin') {
        //             return response()->json(['message' => 'unauthorized:Access denied.'], 403);
        //         }
        //         }else{
        //             $data['role']='user';
        //         }

        $user = User::create($data);
        $user->assignRole($roleName);
        return $this->success($user->load('roles'), 'User Created successfully.', 201);
    }
}
