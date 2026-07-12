<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'=>'sometimes|string|max:255',
            'email'=>'sometimes|email|unique:users,email,' . $this->route('id'),
            'password'=>'nullable|string|min:8',
            'phone'=>'sometimes|string',
            'role'=>'sometimes|in:admin,user',
            ];
    }
}
