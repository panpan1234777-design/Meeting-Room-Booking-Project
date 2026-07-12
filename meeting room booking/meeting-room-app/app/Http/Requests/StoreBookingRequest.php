<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Booking;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'room_id' => ['required', 'exists:rooms,id'],
            'booking_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'purpose' => ['required', 'string', 'max:255'],
            'remark' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $roomId = $this->input('room_id');
            $date = $this->input('booking_date');
            $start = $this->input('start_time');
            $end = $this->input('end_time');

            if (!$roomId || !$date || !$start || !$end) {
                return;
            }

            $overlap = Booking::where('room_id', $roomId)
                ->where('booking_date', $date)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where(function ($query) use ($start, $end) {
                    $query->where('start_time', '<', $end)
                          ->where('end_time', '>', $start);
                })
                ->exists();

            if ($overlap) {
                $validator->errors()->add(
                    'start_time',
                    'already taken'
                );
            }
        });
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Validation error',
            'errors' => $validator->errors(),
        ], 422));
    }
}
