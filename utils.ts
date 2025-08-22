import { User } from './types';

export const TECHNICIAN_COLORS = [
    'bg-blue-500', 'bg-green-500', 'bg-indigo-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-yellow-600',
    'bg-teal-500', 'bg-red-500'
];

export const getTechnicianColor = (technician: User | undefined): string => {
    if (technician?.color) {
        return technician.color;
    }
    
    if (!technician?.id) {
        return 'bg-gray-400';
    }

    let hash = 0;
    for (let i = 0; i < technician.id.length; i++) {
        hash = technician.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % TECHNICIAN_COLORS.length);
    return TECHNICIAN_COLORS[index];
};
