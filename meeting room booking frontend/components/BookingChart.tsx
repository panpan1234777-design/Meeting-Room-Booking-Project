"use client";

import { useEffect } from "react";
import Highcharts from "highcharts";


interface Booking {
  room_id: number;
  room?: { name: string };
}

interface BookingChartProps {
  bookings: Booking[];
  roomName: (id: number) => string;
}

export default function BookingChart({ bookings, roomName }: BookingChartProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && Highcharts && bookings && bookings.length > 0) {
      
      const roomCounts: { [key: string]: number } = {};
      bookings.forEach((b) => {
        const name = b.room?.name || roomName(b.room_id);
        roomCounts[name] = (roomCounts[name] || 0) + 1;
      });

      const roomCategories = Object.keys(roomCounts); 
      const roomDataValues = Object.values(roomCounts); 

     
      Highcharts.chart('container', { 
        chart: {
          type: 'column',
          backgroundColor: '#1e293b' 
        },
        title: {
          text: 'Meeting Room Booking Analytics',
          align: 'left',
          style: { color: '#ffffff' }
        },
        subtitle: {
          text: 'Total number of bookings allocated per meeting room',
          align: 'left',
          style: { color: '#94a3b8' }
        },
        xAxis: {
          categories: roomCategories, 
          crosshair: true,
          labels: { style: { color: '#94a3b8' } }
        },
        yAxis: {
          min: 0,
          title: {
            text: 'Total Bookings',
            style: { color: '#94a3b8' }
          },
          labels: { style: { color: '#94a3b8' } },
          gridLineColor: '#334155'
        },
        legend: {
          symbolRadius: 3,
          itemStyle: { color: '#ffffff' }
        },
        tooltip: {
          shared: true,
          useHTML: true,
          backgroundColor: '#0f172a',
          style: { color: '#ffffff' }
        },
        plotOptions: {
          column: {
            pointPadding: 0.2,
            borderWidth: 0
          }
        },
       
        series: [
          {
            name: 'Bookings Count',
            data: roomDataValues,
            color: '#38bdf8' 
          }
        ]
      });
    }
  }, [bookings, roomName]); 

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div id="container" style={{ width: "100%", height: "400px" }}></div>
    </div>
  );
}