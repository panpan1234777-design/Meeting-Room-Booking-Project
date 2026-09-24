<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;


class Room extends Model
{
    protected $fillable = [
        'name',
        'capacity',
        'location',
        'status',
        'description',
        'image',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];

    protected $appends = [
        'image_url',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }

        return url(Storage::url($this->image));
    }
}
