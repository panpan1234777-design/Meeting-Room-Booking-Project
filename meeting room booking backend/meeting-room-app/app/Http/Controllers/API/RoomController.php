<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class RoomController extends Controller
{
    /**
     * Get all rooms
     */
    public function index(): JsonResponse
    {
        $rooms = Room::latest()->get();

        return response()->json([
            'status' => true,
            'data' => $rooms,
        ], 200);
    }


    /**
     * Create new room
     */
    public function store(StoreRoomRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Default status
        $data['status'] = $data['status'] ?? 'available';

        if ($request->hasFile('image')) {
            // ယာယီအသုံးပြုရန် (သို့မဟုတ် ဖိုင်အသစ် သိမ်းဆည်းရန်)
            // storage/app/public/rooms folder ထဲသို့ Laravel ရဲ့ storage disk ဖြင့် သိမ်းမည်
            $path = $request->file('image')->store('rooms', 'public');

            $data['image'] = $path; // ပုံ path ကို $data ထဲသို့ ထည့်သွင်းခြင်း
        }

        $room = Room::create($data);

        return response()->json([
            'status' => true,
            'message' => 'Room created successfully.',
            'data' => $room,
        ], 201);
    }


    /**
     * Get single room
     */
    public function show(Room $room): JsonResponse
    {
        return response()->json([
            'status' => true,
            'data' => $room,
        ], 200);
    }


    /**
     * Update room
     */
    public function update(
        UpdateRoomRequest $request,
        Room $room
    ): JsonResponse {

        $data = $request->validated();

        /*
        |--------------------------------------------------------------------------
        | Upload new image
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('image')) {

            // Delete old image
            if ($room->image && Storage::disk('public')->exists($room->image)) {
                Storage::disk('public')->delete($room->image);
            }

            // Store new image
            $data['image'] = $request
                ->file('image')
                ->store('rooms', 'public');
        }

        $room->update($data);

        return response()->json([
            'status' => true,
            'message' => 'Room updated successfully.',
            'data' => $room->fresh(),
        ], 200);
    }


    /**
     * Delete room
     */
    public function destroy(Room $room): JsonResponse
    {
        /*
        |--------------------------------------------------------------------------
        | Don't allow deleting room if it has bookings
        |--------------------------------------------------------------------------
        */

        if ($room->bookings()->exists()) {
            return response()->json([
                'status' => false,
                'message' => 'This room cannot be deleted because it has bookings.',
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | Delete image
        |--------------------------------------------------------------------------
        */

        if ($room->image && Storage::disk('public')->exists($room->image)) {
            Storage::disk('public')->delete($room->image);
        }

        /*
        |--------------------------------------------------------------------------
        | Delete room
        |--------------------------------------------------------------------------
        */

        $room->delete();

        return response()->json([
            'status' => true,
            'message' => 'Room deleted successfully.',
        ], 200);
    }


    /**
     * Get available booking slots
     */
    public function availableSlots(Room $room)
    {
        /*
        |--------------------------------------------------------------------------
        | Maintenance room cannot be booked
        |--------------------------------------------------------------------------
        */

        if ($room->status === 'maintenance') {
            return response()->json([
                'status' => false,
                'message' => 'This room is currently under maintenance.',
                'available_slots' => [],
            ], 409);
        }

        request()->validate([
            'date' => [
                'required',
                'date',
            ],
        ]);

        $date = request()->input('date');

        $operatingStart = config('booking.operating_start');
        $operatingEnd = config('booking.operating_end');

        $bookings = \App\Models\Booking::where('room_id', $room->id)
            ->where('booking_date', $date)
            ->where('status', '!=', 'cancelled')
            ->orderBy('start_time')
            ->get([
                'start_time',
                'end_time',
            ]);

        $availableSlots = [];

        $cursor = \Carbon\Carbon::createFromFormat(
            'H:i',
            $operatingStart
        );

        $end = \Carbon\Carbon::createFromFormat(
            'H:i',
            $operatingEnd
        );

        foreach ($bookings as $booking) {

            $bookingStart = \Carbon\Carbon::createFromFormat(
                'H:i:s',
                $booking->start_time
            );

            $bookingEnd = \Carbon\Carbon::createFromFormat(
                'H:i:s',
                $booking->end_time
            );

            if ($cursor->lt($bookingStart)) {
                $availableSlots[] = [
                    'start' => $cursor->format('H:i'),
                    'end' => $bookingStart->format('H:i'),
                ];
            }

            if ($bookingEnd->gt($cursor)) {
                $cursor = $bookingEnd->copy();
            }
        }

        if ($cursor->lt($end)) {
            $availableSlots[] = [
                'start' => $cursor->format('H:i'),
                'end' => $end->format('H:i'),
            ];
        }

        // If requested date is today, filter out past slots
        $todayStr = now()->format('Y-m-d');
        $nowTimeStr = now()->format('H:i');

        if ($date === $todayStr) {
            $filteredSlots = [];
            foreach ($availableSlots as $slot) {
                if ($slot['end'] > $nowTimeStr) {
                    $slotStart = max($slot['start'], $nowTimeStr);
                    if ($slotStart < $slot['end']) {
                        $filteredSlots[] = [
                            'start' => $slotStart,
                            'end' => $slot['end'],
                        ];
                    }
                }
            }
            $availableSlots = $filteredSlots;
        }

        return response()->json([
            'status' => true,
            'date' => $date,
            'available_slots' => $availableSlots,
        ], 200);
    }
}
