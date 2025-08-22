import React, { useState } from 'react';
import { Equipment, User, Reservation, UserRole, Company } from '../../types';

interface BatchBookEquipmentModalProps {
    selectedEquipment: Equipment[];
    currentUser: User;
    users: User[];
    companies: Company[];
    initialCompanyId: string;
    initialReturnDate: string;
    onClose: () => void;
    onSubmit: (reservations: Omit<Reservation, 'id' | 'staged'>[], returnDate: string) => Promise<{ success: boolean; message: string; }>;
}

const BatchBookEquipmentModal: React.FC<BatchBookEquipmentModalProps> = ({ selectedEquipment, currentUser, users, companies, initialCompanyId, initialReturnDate, onClose, onSubmit }) => {
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
        if (!companyId || !pickupDate || !returnDate || selectedEquipment.length === 0) {
            setError('All fields are required and at least one equipment item must be selected.');
            return;
        }
        if (new Date(returnDate) < new Date(pickupDate)) {
            setError('Return date cannot be before pickup date.');
            return;
        }
        
        setIsSubmitting(true);

        const reservationsToCreate = selectedEquipment.map(eq => ({
            equipmentId: eq.id,
            technicianId,
            companyId,
            pickupDate,
            returnDate,
            notes,
        }));

        const result = await onSubmit(reservationsToCreate, returnDate);
        setIsSubmitting(false);

        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Batch Book Equipment</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold">&times;</button>
                </div>

                <div className="bg-gray-50 p-3 rounded-md mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Selected Equipment ({selectedEquipment.length})</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                        {selectedEquipment.map(eq => (
                            <div key={eq.id} className="text-gray-800 font-medium">
                                {eq.description} <span className="text-gray-500">({eq.gageId})</span>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                         {currentUser.role === UserRole.ADMIN && (
                             <div>
                                <label htmlFor="technician" className="block text-sm font-medium text-gray-700">Technician</label>
                                <select 
                                    id="technician" 
                                    value={technicianId} 
                                    onChange={e => setTechnicianId(e.target.value)} 
                                    required 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                                >
                                    {users.filter(u => u.role === UserRole.TECHNICIAN || u.role === UserRole.ADMIN).map(tech => (
                                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
                            <select
                                id="company"
                                value={companyId}
                                onChange={e => setCompanyId(e.target.value)}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                            >
                                {companies.map(comp => (
                                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700">Pickup Date</label>
                                <input type="date" id="pickupDate" value={pickupDate} onChange={e => setPickupDate(e.target.value)} min={today} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                            </div>
                            <div>
                                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">Return Date</label>
                                <input type="date" id="returnDate" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={pickupDate} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                            </div>
                        </div>
                        <div>
                             <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes for Coordinator</label>
                             <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"></textarea>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400">
                            {isSubmitting ? 'Booking...' : `Book ${selectedEquipment.length} Items`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BatchBookEquipmentModal;