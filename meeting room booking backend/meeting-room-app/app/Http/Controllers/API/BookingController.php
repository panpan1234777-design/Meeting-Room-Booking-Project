<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BookingController extends BaseController
{
    // private const CONFIRMATION_WINDOW_MINUTES = 10;

    public function index(): JsonResponse
    {
        //  $this->autoFlagUnconfirmedBookings();
        $bookings = Booking::with(['user', 'room'])->get();

        return response()->json([
            'status' => true,
            'data' => $bookings,
        ], 200);
    }

   public function store(StoreBookingRequest $request): JsonResponse
{
    $room = Room::findOrFail($request->room_id);

    if ($room->status === 'maintenance') {
        return response()->json([
            'status' => false,
            'message' => 'This room is currently under maintenance and cannot be booked.',
        ], 409);
    }

    $data = $request->validated();
    $data['user_id'] = Auth::id();
    $data['status'] = 'booked';

    $booking = Booking::create($data);

    return response()->json([
        'status' => true,
        'message' => 'Booking created successfully',
        'data' => $booking->load(['user', 'room']),
    ], 201);
}

public function show(Booking $booking): JsonResponse
    {
        return response()->json([
            'status' => true,
            'data' => $booking->load(['user', 'room']),
        ], 200);
    }

    public function update(UpdateBookingRequest $request, Booking $booking): JsonResponse
    {
        $booking->update($request->validated());

        return response()->json([
            'status' => true,
            'message' => 'Booking updated successfully',
            'data' => $booking->load(['user', 'room']),
        ], 200);
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $booking->delete();

        return response()->json([
            'status' => true,
            'message' => 'Booking deleted successfully',
        ], 200);
    }

   public function confirm(Booking $booking): JsonResponse
    {
        if ($booking->status !== 'pending') {
            return response()->json([
                'status' => false,
                'message' => 'Only pending bookings can be confirmed.',
            ], 422);
        }

       $booking->update(['status' => 'confirmed']);

        return response()->json([
            'status' => true,
            'message' => 'Booking confirmed successfully',
            'data' => $booking->load(['user', 'room']),
        ], 200);
    }

  public function reject(Booking $booking): JsonResponse
    {
        if (!in_array($booking->status, ['booked'], true)) {
            return response()->json([
                'status' => false,
                'message' => 'Only booked reservations can be rejected.',
            ], 422);
        }

        $booking->update(['status' => 'rejected']);

        return response()->json([
            'status' => true,
            'message' => 'Booking rejected successfully',
            'data' => $booking->load(['user', 'room']),
        ], 200);
    }

    public function cancel(Booking $booking): JsonResponse
    {
        if ((int) $booking->user_id !== (int) Auth::id()) {
            return response()->json([
                'status' => false,
                'message' => 'You can only cancel your own booking.',
            ], 403);
        }

        if ($booking->status !== 'booked') {
            return response()->json([
                'status' => false,
                'message' => 'Only booked reservations can be cancelled.',
            ], 422);
        }

        $booking->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Booking cancelled successfully',
            'data' => $booking->load(['user', 'room']),
        ], 200);
    }

    // private function autoFlagUnconfirmedBookings(): void
    // {
    //     $now = Carbon::now();

    //     Booking::where('status', 'booked')
    //         ->whereNull('confirmed_at')
    //         ->get()
    //         ->each(function (Booking $booking) use ($now) {
    //             $startDateTime = Carbon::parse($booking->booking_date)->setTimeFromTimeString($booking->start_time);

    //             if ($now->greaterThanOrEqualTo($startDateTime)) {
    //                 $booking->update(['status' => 'unconfirmed']);
    //             }
    //         });
    // }
}
