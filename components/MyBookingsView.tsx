import React, { useMemo } from 'react';
import { User, Reservation, Equipment } from '../types';
import Button from './common/Button';
import TrashIcon from './icons/TrashIcon';

interface MyBookingsViewProps {
    currentUser: User;
    reservations: Reservation[];
    equipment: Equipment[];
    deleteReservation: (reservationId: number) => Promise<void>;
}

const BookingCard: React.FC<{
    reservation: Reservation;
    item: Equipment | undefined;
    onDelete: (id: number) => void;
    status: 'Upcoming' | 'Active' | 'Past';
}> = ({ reservation, item, onDelete, status }) => {
    
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

    const statusColors = {
        Upcoming: 'border-blue-500',
        Active: 'border-green-500',
        Past: 'border-gray-400'
    };

    return (
        <div className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${statusColors[status]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold">{item?.name || 'Unknown Equipment'}</h3>
                    <p className="text-sm text-gray-500 mt-1">{reservation.jobDescription}</p>
                    <div className="text-sm text-gray-700 mt-2">
                        <p><strong>From:</strong> {formatDate(reservation.start)}</p>
                        <p><strong>To:</strong> {formatDate(reservation.end)}</p>
                    </div>
                </div>
                {status !== 'Past' && (
                    <Button variant="danger" onClick={() => onDelete(reservation.id)} className="p-2">
                        <TrashIcon />
                    </Button>
                )}
            </div>
        </div>
    );
};


const MyBookingsView: React.FC<MyBookingsViewProps> = ({ currentUser, reservations, equipment, deleteReservation }) => {
    
    const myReservations = useMemo(() => {
        return reservations
            .filter(res => res.userId === currentUser.id)
            .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
    }, [reservations, currentUser.id]);

    const getEquipmentById = (id: number) => equipment.find(e => e.id === id);

    const now = new Date();
    const activeBookings = myReservations.filter(r => new Date(r.start) <= now && new Date(r.end) > now);
    const upcomingBookings = myReservations.filter(r => new Date(r.start) > now);
    const pastBookings = myReservations.filter(r => new Date(r.end) <= now);

    const handleDelete = async (id: number) => {
        if(window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                await deleteReservation(id);
            } catch (error) {
                alert(`Failed to cancel booking: ${(error as Error).message}`);
            }
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">Active Bookings ({activeBookings.length})</h2>
                {activeBookings.length > 0 ? (
                    <div className="space-y-4">
                        {activeBookings.map(res => (
                            <BookingCard key={res.id} reservation={res} item={getEquipmentById(res.equipmentId)} onDelete={handleDelete} status="Active" />
                        ))}
                    </div>
                ) : <p className="text-gray-500">No active bookings.</p>}
            </div>
            
            <div>
                <h2 className="text-2xl font-bold mb-4">Upcoming Bookings ({upcomingBookings.length})</h2>
                 {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingBookings.map(res => (
                            <BookingCard key={res.id} reservation={res} item={getEquipmentById(res.equipmentId)} onDelete={handleDelete} status="Upcoming" />
                        ))}
                    </div>
                ) : <p className="text-gray-500">No upcoming bookings.</p>}
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Booking History ({pastBookings.length})</h2>
                {pastBookings.length > 0 ? (
                    <div className="space-y-4">
                        {pastBookings.map(res => (
                             <BookingCard key={res.id} reservation={res} item={getEquipmentById(res.equipmentId)} onDelete={handleDelete} status="Past" />
                        ))}
                    </div>
                ) : <p className="text-gray-500">No past bookings.</p>}
            </div>
        </div>
    );
};

export default MyBookingsView;