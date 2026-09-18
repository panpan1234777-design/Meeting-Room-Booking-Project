<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $fillable = [
        'user_id',
        'room_id',
        'booking_date',
        'start_time',
        'end_time',
        'purpose',
        'status',
        'remark',
    //     'confirmed_at',
    //     'recurring_group_id',
    // ];
    //  protected $casts = [
    //     'booking_date' => 'date:Y-m-d',
    //     'confirmed_at' => 'datetime',
    ];
    public function user():BelongsTo
    {
        return $this->belongsTo(User::class,'user_id');
    }
    public function room():BelongsTo
    {
        return $this->belongsTo(Room::class,'room_id');
    }
}
