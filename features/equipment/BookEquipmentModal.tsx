
import React, { useState } from 'react';
import { Equipment, User, Reservation, UserRole, Company } from '../../types';

interface BookEquipmentModalProps {
    equipment: Equipment;
    currentUser: User;
    users: User[];
    companies: Company[];
    upcomingReservations: Reservation[];
    initialCompanyId: string;
    initialReturnDate: string;
    onClose: () => void;
    onSubmit: (reservation: Omit<Reservation, 'id' | 'equipmentId' | 'staged'>, returnDate: string) => Promise<{ success: boolean; message: string; }>;
}

const BookEquipmentModal: React.FC<BookEquipmentModalProps> = ({ equipment, currentUser, users, companies, upcomingReservations, initialCompanyId, initialReturnDate, onClose, onSubmit }) => {
    const today = new Date().toISOString().split('T')[0];
    const [companyId, setCompanyId] = useState(initialCompanyId || (companies[0]?.id || ''));
    const [pickupDate, setPickupDate] = useState(today);
    const [returnDate, setReturnDate] = useState(initialReturnDate);
    const [notes, setNotes] = useState('');
    const [technicianId, setTechnicianId] = useState(currentUser.id);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!companyId || !pickupDate || !returnDate) {
            setError('All fields except notes are required.');
            return;
        }
        if (new Date(returnDate) < new Date(pickupDate)) {
            setError('Return date cannot be before pickup date.');
            return;
        }
        
        setIsSubmitting(true);
        const result = await onSubmit({
            technicianId,
            companyId,
            pickupDate,
            returnDate,
            notes,
        }, returnDate);
        setIsSubmitting(false);

        if (!result.success) {
            setError(result.message);
        }
    };

    const getTechnicianName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';
    const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || 'Unknown';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Book Equipment</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-3xl font-bold">&times;</button>
                </div>
                <div>
                    <p className="text-lg font-semibold dark:text-gray-200">{equipment.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{equipment.gageId} / {equipment.manufacturer}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Upcoming Schedule</h4>
                    {upcomingReservations.length > 0 ? (
                        <div className="max-h-24 overflow-y-auto space-y-1 text-xs">
                            {upcomingReservations.map(res => (
                                <div key={res.id} className="text-gray-600 dark:text-gray-400">
                                    <span className="font-semibold dark:text-gray-300">{getTechnicianName(res.technicianId)} ({getCompanyName(res.companyId)}):</span> {new Date(res.pickupDate + 'T00:00:00').toLocaleDateString()} to {new Date(res.returnDate + 'T00:00:00').toLocaleDateString()}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">This equipment is fully available.</p>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {currentUser.role === UserRole.ADMIN && (
                             <div>
                                <label htmlFor="technician" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Technician</label>
                                <select 
                                    id="technician" 
                                    value={technicianId} 
                                    onChange={e => setTechnicianId(e.target.value)} 
                                    required 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    {users.filter(u => u.role === UserRole.TECHNICIAN || u.role === UserRole.ADMIN).map(tech => (
                                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                            <select
                                id="company"
                                value={companyId}
                                onChange={e => setCompanyId(e.target.value)}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {companies.map(comp => (
                                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pickup Date</label>
                                <input type="date" id="pickupDate" value={pickupDate} onChange={e => setPickupDate(e.target.value)} min={today} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:[color-scheme:dark]"/>
                            </div>
                            <div>
                                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Return Date</label>
                                <input type="date" id="returnDate" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={pickupDate} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:[color-scheme:dark]"/>
                            </div>
                        </div>
                        <div>
                             <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes for Coordinator</label>
                             <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                        </div>
                    </div>
                    {error && <p className="text-red-500 dark:text-red-400 text-sm mt-4">{error}</p>}
                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-500">
                            {isSubmitting ? 'Booking...' : 'Confirm Reservation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookEquipmentModal;