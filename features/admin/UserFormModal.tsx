
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { TECHNICIAN_COLORS } from '../../utils';

interface UserFormModalProps {
    user: User | null;
    onClose: () => void;
    onSubmit: (user: Omit<User, 'id'> | User) => Promise<void>;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: UserRole.TECHNICIAN,
        color: TECHNICIAN_COLORS[0],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(user);
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleColorChange = (color: string) => {
        setFormData(prev => ({ ...prev, color }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (isEditing) {
            await onSubmit(formData as User);
        } else {
            const { id, ...newUserData } = formData;
            await onSubmit(newUserData as Omit<User, 'id'>);
        }
        setIsSubmitting(false);
    };

    const isEditing = !!user?.id;
    const modalTitle = isEditing ? 'Edit User' : 'Add New User';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{modalTitle}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                    </div>
                     <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent">
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.TECHNICIAN}>Technician</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Color</label>
                        <div className="mt-2 flex flex-wrap gap-3">
                            {TECHNICIAN_COLORS.map(colorClass => (
                                <button
                                    type="button"
                                    key={colorClass}
                                    onClick={() => handleColorChange(colorClass)}
                                    className={`w-8 h-8 rounded-full ${colorClass} cursor-pointer transition-transform transform hover:scale-110 ${
                                        formData.color === colorClass ? 'ring-2 ring-offset-2 ring-brand-primary' : ''
                                    }`}
                                    aria-label={`Select color ${colorClass}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400">
                            {isSubmitting ? 'Saving...' : 'Save User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;