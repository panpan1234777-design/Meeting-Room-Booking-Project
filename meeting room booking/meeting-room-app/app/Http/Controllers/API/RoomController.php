<?php

namespace App\Http\Controllers\API;

use App\Models\Room;
use App\Models\Booking;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RoomController extends BaseController
{
    public function index(): JsonResponse
    {
        $rooms = Room::all();

        return response()->json([
            'status' => true,
            'data' => $rooms,
        ], 200);
    }

    public function store(StoreRoomRequest $request): JsonResponse
    {
        $room = Room::create($request->validated());

        return response()->json([
            'status' => true,
            'message' => 'Room created successfully',
            'data' => $room,
        ], 201);
    }

    public function show(Room $room): JsonResponse
    {
        return response()->json([
            'status' => true,
            'data' => $room,
        ], 200);
    }

    public function update(UpdateRoomRequest $request, Room $room): JsonResponse
    {
        $room->update($request->validated());

        return response()->json([
            'status' => true,
            'message' => 'Room updated successfully',
            'data' => $room,
        ], 200);
    }

    public function destroy(Room $room): JsonResponse
    {
        $room->delete();

        return response()->json([
            'status' => true,
            'message' => 'Room deleted successfully',
        ], 200);
    }

    public function availableSlots(Request $request, Room $room): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
        ]);

        $date = $request->input('date');

        $operatingStart = config('booking.operating_start');
        $operatingEnd = config('booking.operating_end');

        $bookings = Booking::where('room_id', $room->id)
            ->where('booking_date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('start_time')
            ->get(['start_time', 'end_time']);

        $availableSlots = [];
        $cursor = Carbon::createFromFormat('H:i', $operatingStart);
        $end = Carbon::createFromFormat('H:i', $operatingEnd);

        foreach ($bookings as $booking) {
            $bookingStart = Carbon::createFromFormat('H:i:s', $booking->start_time);
            $bookingEnd = Carbon::createFromFormat('H:i:s', $booking->end_time);

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

        return response()->json([
            'status' => true,
            'date' => $date,
            'available_slots' => $availableSlots,
        ], 200);
    }
}
