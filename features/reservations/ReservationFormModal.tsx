
import React, { useState, useEffect } from 'react';
import { Equipment, Reservation, Company } from '../../types';

interface ReservationFormModalProps {
    reservation: Reservation;
    equipment: Equipment;
    companies: Company[];
    onClose: () => void;
    onSubmit: (reservation: Reservation) => Promise<{success: boolean, message: string}>;
}

const ReservationFormModal: React.FC<ReservationFormModalProps> = ({ reservation, equipment, companies, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<Reservation>(reservation);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        setFormData(reservation);
    }, [reservation]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.companyId || !formData.pickupDate || !formData.returnDate) {
            setError('All fields except notes are required.');
            return;
        }
        if (new Date(formData.returnDate) < new Date(formData.pickupDate)) {
            setError('Return date cannot be before pickup date.');
            return;
        }
        
        setIsSubmitting(true);
        const result = await onSubmit(formData);
        setIsSubmitting(false);

        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Edit Reservation</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold">&times;</button>
                </div>
                <div>
                    <p className="text-lg font-semibold">{equipment.description}</p>
                    <p className="text-sm text-gray-500 mb-6">{equipment.gageId}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">Company</label>
                        <select
                            name="companyId"
                            id="companyId"
                            value={formData.companyId}
                            onChange={handleChange}
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
                            <input type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                        </div>
                        <div>
                            <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">Return Date</label>
                            <input type="date" name="returnDate" value={formData.returnDate} onChange={handleChange} min={formData.pickupDate} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes for Coordinator</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"></textarea>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationFormModal;