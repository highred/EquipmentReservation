
import React, { useState, useEffect, useMemo } from 'react';
import { Company, Reservation, Equipment, User } from '../../types';
import { apiService } from '../../services/apiService';

const CompanyView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [companyData, reservationData, equipmentData, userData] = await Promise.all([
                apiService.getCompanies(),
                apiService.getReservations(),
                apiService.getEquipment(),
                apiService.getUsers(),
            ]);
            setCompanies(companyData);
            setReservations(reservationData);
            setEquipment(equipmentData);
            setUsers(userData);
            if (companyData.length > 0) {
                setSelectedCompanyId(companyData[0].id);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const companyEquipmentHistory = useMemo(() => {
        if (!selectedCompanyId) return [];

        const companyReservations = reservations.filter(r => r.companyId === selectedCompanyId);
        
        const equipmentMap = new Map<string, { equipment: Equipment, reservations: Reservation[] }>();

        companyReservations.forEach(res => {
            const eq = equipment.find(e => e.id === res.equipmentId);
            if (eq) {
                if (!equipmentMap.has(eq.id)) {
                    equipmentMap.set(eq.id, { equipment: eq, reservations: [] });
                }
                equipmentMap.get(eq.id)!.reservations.push(res);
            }
        });

        return Array.from(equipmentMap.values()).map(item => ({
            ...item,
            reservations: item.reservations.sort((a, b) => new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime())
        }));

    }, [selectedCompanyId, reservations, equipment]);
    
    const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

    if (loading) {
        return <div className="text-center p-8 text-gray-500">Loading company data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
                <label htmlFor="company-select" className="block text-lg font-bold text-gray-800 mb-2">Select a Company</label>
                <select
                    id="company-select"
                    value={selectedCompanyId}
                    onChange={e => setSelectedCompanyId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                    {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                </select>
            </div>

            {companyEquipmentHistory.length > 0 ? (
                <div className="space-y-4">
                    {companyEquipmentHistory.map(({ equipment, reservations }) => (
                        <div key={equipment.id} className="bg-white p-5 rounded-lg shadow">
                            <h3 className="text-xl font-bold text-gray-800">{equipment.description} ({equipment.gageId})</h3>
                            <p className="text-sm text-gray-500 mb-4">{equipment.manufacturer} - {equipment.model}</p>
                            
                            <div className="border-t pt-3">
                                <h4 className="font-semibold text-gray-700 mb-2">Booking History:</h4>
                                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {reservations.map(res => (
                                        <li key={res.id} className="text-sm p-2 bg-gray-50 rounded-md">
                                            <span className="font-semibold">{getUserName(res.technicianId)}</span> booked from <span className="font-semibold">{new Date(res.pickupDate + 'T00:00:00').toLocaleDateString()}</span> to <span className="font-semibold">{new Date(res.returnDate + 'T00:00:00').toLocaleDateString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700">No Booking History</h3>
                    <p className="text-gray-500">This company has not booked any equipment yet.</p>
                </div>
            )}
        </div>
    );
};

export default CompanyView;