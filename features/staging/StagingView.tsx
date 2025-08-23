
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, StagingItem, UserRole } from '../../types';
import { apiService } from '../../services/apiService';
import { PrintIcon } from '../../components/icons/Icons';

const StagingItemCard: React.FC<{ item: StagingItem; onStageToggle: (id: string, staged: boolean) => void; }> = ({ item, onStageToggle }) => {
    return (
        <div className={`p-4 rounded-lg flex items-center transition-colors duration-300 ${item.staged ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'} print:bg-white print:border-b print:border-gray-300 print:rounded-none print:p-2`}>
            <input
                type="checkbox"
                checked={item.staged}
                onChange={(e) => onStageToggle(item.id, e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-accent dark:bg-gray-900 dark:border-gray-600"
            />
            <div className={`ml-4 flex-grow ${item.staged ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'} print:text-black print:no-underline`}>
                <p className="font-bold">{item.equipment.description} <span className="font-normal text-gray-600 dark:text-gray-400 print:text-gray-700">({item.equipment.gageId})</span></p>
                <p className="text-sm">For: <span className="font-semibold">{item.user.name}</span> at <span className="font-semibold">{item.company.name}</span></p>
                 {item.notes && <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 italic print:text-gray-800">Note: "{item.notes}"</p>}
            </div>
        </div>
    )
};


const StagingView: React.FC<{ users: User[] }> = ({ users }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [stagingList, setStagingList] = useState<StagingItem[]>([]);
    const [loadingStaging, setLoadingStaging] = useState(false);
    const [filterTechId, setFilterTechId] = useState<string>('all');

    const fetchStagingList = useCallback(async (date: string) => {
        setLoadingStaging(true);
        const data = await apiService.getStagingList(date);
        setStagingList(data);
        setLoadingStaging(false);
    }, []);

    useEffect(() => { fetchStagingList(selectedDate); }, [selectedDate, fetchStagingList]);
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value);
    
    const handleStageToggle = async (reservationId: string, staged: boolean) => {
        const result = await apiService.updateStagingStatus(reservationId, staged);
        if (result.success) {
            setStagingList(prevList => prevList.map(item => item.id === reservationId ? { ...item, staged } : item));
        }
    };

    const handlePrint = () => {
        window.print();
    };
    
    const filteredStagingList = useMemo(() => {
        if (filterTechId === 'all') {
            return stagingList;
        }
        return stagingList.filter(item => item.user.id === filterTechId);
    }, [stagingList, filterTechId]);

    const stagedCount = filteredStagingList.filter(item => item.staged).length;
    const totalCount = filteredStagingList.length;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl print:shadow-none">
            <div className="print:hidden flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Staging Checklist</h2>
                <div className="flex items-center flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="tech-filter" className="font-semibold text-gray-700 dark:text-gray-300">Technician:</label>
                        <select
                            id="tech-filter"
                            value={filterTechId}
                            onChange={e => setFilterTechId(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                        >
                            <option value="all">All Technicians</option>
                            {users.filter(u => u.role === UserRole.TECHNICIAN || u.role === UserRole.ADMIN).sort((a, b) => a.name.localeCompare(b.name)).map(tech => (
                                <option key={tech.id} value={tech.id}>{tech.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="staging-date" className="font-semibold text-gray-700 dark:text-gray-300">Pickup Date:</label>
                        <input type="date" id="staging-date" value={selectedDate} onChange={handleDateChange} className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:[color-scheme:dark]"/>
                    </div>
                    <button onClick={handlePrint} className="flex items-center justify-center bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300">
                        <PrintIcon className="w-5 h-5 mr-2" /> Print List
                    </button>
                </div>
            </div>

            <div className="hidden print:block mb-4 text-center">
                <h1 className="text-2xl font-bold">Staging Checklist for {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</h1>
                <h2 className="text-lg">{filterTechId === 'all' ? 'All Technicians' : users.find(u => u.id === filterTechId)?.name}</h2>
            </div>

            <div className="mb-4 print:hidden">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Progress: {stagedCount} / {totalCount} items staged</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                    <div className="bg-status-success h-2.5 rounded-full" style={{ width: `${totalCount > 0 ? (stagedCount/totalCount)*100 : 0}%` }}></div>
                </div>
            </div>
            {loadingStaging ? <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading staging list...</p> : filteredStagingList.length > 0 ? (
                <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md print:bg-white print:p-0">
                    {filteredStagingList.map(item => (<StagingItemCard key={item.id} item={item} onStageToggle={handleStageToggle} />))}
                </div>
            ) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">No equipment scheduled for pickup on this day for the selected technician.</p>}
        </div>
    );
};

export default StagingView;
