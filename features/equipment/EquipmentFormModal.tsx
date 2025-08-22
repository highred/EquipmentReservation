
import React, { useState, useEffect } from 'react';
import { Equipment } from '../../types';
import { TrashIcon, UploadIcon } from '../../components/icons/Icons';

interface EquipmentFormModalProps {
    equipment: Equipment | null;
    onClose: () => void;
    onSubmit: (equipment: Omit<Equipment, 'id'> | Equipment) => Promise<void>;
}

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({ equipment, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<Partial<Equipment>>({
        gageId: '',
        description: '',
        manufacturer: '',
        model: '',
        range: '',
        uom: '',
        imageUrl: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (equipment) {
            setFormData(equipment);
        }
    }, [equipment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (isEditing) {
            await onSubmit(formData as Equipment);
        } else {
            const { id, ...newEquipmentData } = formData;
            await onSubmit(newEquipmentData as Omit<Equipment, 'id'>);
        }
        setIsSubmitting(false);
    };

    const isEditing = !!equipment?.id;
    const isCloning = equipment !== null && !equipment.id;
    
    let modalTitle = 'Add New Equipment';
    if (isEditing) modalTitle = 'Edit Equipment';
    if (isCloning) modalTitle = 'Clone Equipment';


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 overflow-y-auto max-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{modalTitle}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <input type="text" name="description" value={formData.description || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                        </div>
                        <div>
                            <label htmlFor="gageId" className="block text-sm font-medium text-gray-700">Gage ID</label>
                            <input type="text" name="gageId" value={formData.gageId || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                        </div>
                        <div>
                            <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">Manufacturer</label>
                            <input type="text" name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                        </div>
                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
                            <input type="text" name="model" value={formData.model || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                        </div>
                         <div>
                            <label htmlFor="range" className="block text-sm font-medium text-gray-700">Range</label>
                            <input type="text" name="range" value={formData.range || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                        </div>
                        <div>
                            <label htmlFor="uom" className="block text-sm font-medium text-gray-700">Unit of Measurement (UOM)</label>
                            <input type="text" name="uom" value={formData.uom || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"/>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Equipment Photo</label>
                        <div className="mt-2 flex items-center space-x-6">
                            <div className="shrink-0">
                                {formData.imageUrl ? (
                                    <img className="h-20 w-20 object-cover rounded-md" src={formData.imageUrl} alt="Current photo" />
                                ) : (
                                    <div className="h-20 w-20 bg-gray-100 rounded-md flex items-center justify-center">
                                        <UploadIcon className="h-10 w-10 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <label className="block">
                                <span className="sr-only">Choose photo</span>
                                <input type="file" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            </label>
                            {formData.imageUrl && (
                                <button type="button" onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))} className="p-2 text-gray-500 hover:text-status-danger transition-colors" aria-label="Remove photo">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>


                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400">
                            {isSubmitting ? 'Saving...' : 'Save Equipment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EquipmentFormModal;
