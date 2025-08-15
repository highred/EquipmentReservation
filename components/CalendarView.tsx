import React, { useState } from 'react';
import { Reservation, User } from '../types';

interface CalendarViewProps {
    reservations: Reservation[];
    users: User[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ reservations, users }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const reservationsByDate = reservations.reduce((acc, res) => {
        const date = new Date(res.start).toDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(res);
        return acc;
    }, {} as Record<string, Reservation[]>);

    const getUserName = (userId: number) => users.find(u => u.id === userId)?.name || 'Unknown User';

    const renderDays = () => {
        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-start-${i}`} className="border border-gray-200 bg-gray-50"></div>);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dateString = dayDate.toDateString();
            const dayReservations = reservationsByDate[dateString] || [];
            const isToday = new Date().toDateString() === dateString;

            days.push(
                <div key={i} className={`border border-gray-200 p-2 min-h-[120px] flex flex-col ${isToday ? 'bg-blue-50' : ''}`}>
                    <div className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{i}</div>
                    <div className="mt-1 text-xs space-y-1 overflow-y-auto">
                        {dayReservations.map(res => (
                            <div key={res.id} className="bg-blue-100 text-blue-800 p-1 rounded truncate">
                                {getUserName(res.userId)}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        const totalCells = startDay + daysInMonth;
        const remainingCells = 7 - (totalCells % 7);
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                days.push(<div key={`empty-end-${i}`} className="border border-gray-200 bg-gray-50"></div>);
            }
        }
        return days;
    };
    
    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200">&lt;</button>
                <h2 className="text-2xl font-bold">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200">&gt;</button>
            </div>
            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-2 border-b-2 border-gray-200">{day}</div>
                ))}
                {renderDays()}
            </div>
        </div>
    );
};

export default CalendarView;