<?php

namespace App\Http\Controllers\API;

use App\Models\Booking;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BookingController extends BaseController
{
    public function index(): JsonResponse
    {
        $bookings = Booking::with(['user', 'room'])->get();

        return response()->json([
            'status' => true,
            'data' => $bookings,
        ], 200);
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = auth::id();

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
        if ($booking->status !== 'pending') {
            return response()->json([
                'status' => false,
                'message' => 'Only pending bookings can be rejected.',
            ], 422);
        }

        $booking->update(['status' => 'rejected']);

        return response()->json([
            'status' => true,
            'message' => 'Booking rejected successfully',
            'data' => $booking->load(['user', 'room']),
        ], 200);
    }
}
