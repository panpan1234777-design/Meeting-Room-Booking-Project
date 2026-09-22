<?php

namespace App\Http\Requests;

use App\Models\Booking;
use App\Models\Room;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
// use Illuminate\Support\Facades\Validator;

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

            // NEW — sent by the frontend when "repeat on consecutive days"
            // is used, so every booking in the series shares one id.
            // Not required for a normal single-day booking.
            // 'recurring_group_id' => ['nullable', 'uuid'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $roomId = $this->input('room_id');
            $date = $this->input('booking_date');
            $start = $this->input('start_time');
            $end = $this->input('end_time');

            $room = Room::find($roomId);

            if ($room && $room->status === 'maintenance') {
                $validator->errors()->add(
                    'room_id',
                    'This room is currently under maintenance and cannot be booked.'
                );
                return;
            }

            if (!$roomId || !$date || !$start || !$end) {
                return;
            }

            // 1. Office hours validation (09:00 - 17:00)
            $operatingStart = config('booking.operating_start', '09:00');
            $operatingEnd = config('booking.operating_end', '17:00');

            if ($start < $operatingStart || $end > $operatingEnd) {
                $validator->errors()->add(
                    'start_time',
                    'Bookings are only allowed during office hours (9:00 AM – 5:00 PM).'
                );
                return;
            }

            // 2. Do not allow a past time when booking for today
            $todayStr = now()->format('Y-m-d');
            if ($date === $todayStr) {
                $currentTime = now()->format('H:i');

                if ($start <= $currentTime) {
                    $validator->errors()->add(
                        'start_time',
                        'This time has already passed. Please select a current time.'
                    );
                    return;
                }
            }

            // 3. Check existing booking overlap (excluding cancelled)
            $overlap = Booking::where('room_id', $roomId)
                ->where('booking_date', $date)
                ->where('status', '!=', 'cancelled')
                ->where(function ($query) use ($start, $end) {
                    $query->where('start_time', '<', $end)
                          ->where('end_time', '>', $start);
                })
                ->exists();

            if ($overlap) {
                $validator->errors()->add(
                    'start_time',
                    'This time slot overlaps with an existing booking.'
                );
            }
        });
    }

    protected function failedValidation(ValidatorContract $validator)
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Validation error',
            'errors' => $validator->errors(),
        ], 422));
    }
}
