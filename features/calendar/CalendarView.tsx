import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { User, Reservation, Equipment, User as Technician, UserRole } from '../../types';
import { apiService } from '../../services/apiService';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons/Icons';
import { getTechnicianColor } from '../../utils';

type ViewMode = 'week' | 'month';

interface HoveredData {
    reservations: Reservation[];
    position: {
        x: number;
        y: number;
    };
}

const formatDate = (date: Date, format: 'long' | 'short' | 'day' | 'month-year') => {
    if (format === 'long') return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (format === 'short') return date.toISOString().split('T')[0];
    if (format === 'day') return date.getDate().toString();
    if (format === 'month-year') return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return '';
};

const getCalendarDays = (date: Date, view: ViewMode): Date[] => {
    if (view === 'week') {
        const days = [];
        const startOfWeek = new Date(date);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        for (let i = 0; i < 7; i++) {
            const weekDay = new Date(startOfWeek);
            weekDay.setDate(weekDay.getDate() + i);
            days.push(weekDay);
        }
        return days;
    } else { // month
        const days = [];
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const endDate = new Date(lastDayOfMonth);
        if (endDate.getDay() !== 6) {
            endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
        }
        
        let currentDate = new Date(startDate);
        while(currentDate <= endDate) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return days;
    }
};

const CalendarView: React.FC<{ currentUser: User, onDayClick: (date: string) => void }> = ({ onDayClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [calendarDays, setCalendarDays] = useState<Date[]>(getCalendarDays(currentDate, viewMode));
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredData, setHoveredData] = useState<HoveredData | null>(null);
    const [filterTechId, setFilterTechId] = useState<string>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const start = calendarDays[0];
        const end = calendarDays[calendarDays.length - 1];
        const [resData, eqData, techData] = await Promise.all([
            apiService.getReservations(formatDate(start, 'short'), formatDate(end, 'short')),
            apiService.getEquipment(),
            apiService.getUsers()
        ]);
        setReservations(resData);
        setEquipment(eqData);
        setTechnicians(techData);
        setLoading(false);
    }, [calendarDays]);

    useEffect(() => {
        setCalendarDays(getCalendarDays(currentDate, viewMode));
    }, [currentDate, viewMode]);

    useEffect(() => {
        if (calendarDays.length > 0) {
            fetchData();
        }
    }, [calendarDays, fetchData]);
    
    const changePeriod = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if(viewMode === 'week') {
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
            } else {
                newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
            }
            return newDate;
        });
    };
    
    const filteredReservations = useMemo(() => {
        if (filterTechId === 'all') {
            return reservations;
        }
        return reservations.filter(res => res.technicianId === filterTechId);
    }, [reservations, filterTechId]);
    
    const getReservationDetails = (res: Reservation) => {
        const eq = equipment.find(e => e.id === res.equipmentId);
        const tech = technicians.find(t => t.id === res.technicianId);
        return { eq, tech };
    };
    
    const handleMouseEnter = (reservations: Reservation[], e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredData({
            reservations,
            position: { x: rect.left, y: rect.bottom + window.scrollY }
        });
    };

    const handleMouseLeave = () => {
        setHoveredData(null);
    };

    const weekDayHeaders = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);

    const renderWeekView = () => (
        <div className="relative min-h-[500px] overflow-y-auto">
            <div className="grid grid-cols-7 absolute inset-0">
                {calendarDays.map(day => (
                    <div key={day.toISOString()} className="border-r border-gray-200"></div>
                ))}
                {loading ? (
                    <div className="col-span-7 flex items-center justify-center h-full text-gray-500">Loading reservations...</div>
                ) : (
                    filteredReservations.map((res, index) => {
                        const { eq, tech } = getReservationDetails(res);
                        if (!tech) return null;
                        const pickup = new Date(res.pickupDate + 'T00:00:00');
                        const ret = new Date(res.returnDate + 'T00:00:00');
                        
                        const startDayIndex = calendarDays.findIndex(d => formatDate(d, 'short') === formatDate(pickup, 'short'));
                        let endDayIndex = calendarDays.findIndex(d => formatDate(d, 'short') === formatDate(ret, 'short'));
                        
                        if (startDayIndex === -1 && pickup > calendarDays[6]) return null;
                        if (endDayIndex === -1 && ret < calendarDays[0]) return null;

                        const startIndex = Math.max(0, startDayIndex);
                        const endIndex = Math.min(6, endDayIndex === -1 ? 6 : endDayIndex);
                        let duration = endIndex - startIndex + 1;
                        if (duration <= 0) duration = 1;

                        return (
                            <button
                                key={res.id}
                                onClick={() => onDayClick(formatDate(pickup, 'short'))}
                                onMouseEnter={(e) => handleMouseEnter([res], e)}
                                onMouseLeave={handleMouseLeave}
                                className={`col-start-1 row-start-1 mt-2 mx-1 p-2 rounded-lg text-white text-xs ${getTechnicianColor(tech.id)} hover:opacity-80 transition-opacity cursor-pointer text-left`}
                                style={{
                                    gridColumnStart: startIndex + 1,
                                    gridColumnEnd: `span ${duration}`,
                                    top: `${(index % 10) * 3}rem`
                                }}
                                title={`${tech?.name} - ${eq?.description} for ${res.company}`}
                            >
                                <p className="font-bold truncate">{tech?.name || 'Technician not found'}</p>
                                <p className="truncate">{eq?.description} for {res.company}</p>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );

    const renderMonthView = () => (
        <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const dayReservations = filteredReservations.filter(res => {
                    const pickup = new Date(res.pickupDate + 'T00:00:00');
                    const ret = new Date(res.returnDate + 'T00:00:00');
                    const dayStart = new Date(day);
                    dayStart.setHours(0,0,0,0);
                    return dayStart >= pickup && dayStart <= ret;
                });

                const reservationsByTech = dayReservations.reduce<Record<string, Reservation[]>>((acc, res) => {
                    if (!acc[res.technicianId]) {
                        acc[res.technicianId] = [];
                    }
                    acc[res.technicianId].push(res);
                    return acc;
                }, {});


                return (
                    <div key={index} className={`min-h-[6rem] p-1 border-t border-l border-gray-200 ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}`}>
                        <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>{formatDate(day, 'day')}</span>
                        <div className="mt-1 space-y-1 overflow-hidden">
                            {Object.entries(reservationsByTech).map(([techId, techReservations]) => {
                                const tech = technicians.find(t => t.id === techId);
                                if (!tech) return null;

                                return (
                                    <button
                                        key={techId}
                                        onClick={() => onDayClick(formatDate(day, 'short'))}
                                        onMouseEnter={(e) => handleMouseEnter(techReservations, e)}
                                        onMouseLeave={handleMouseLeave}
                                        className={`w-full text-left px-1 py-0.5 text-xs text-white rounded ${getTechnicianColor(tech.id)} hover:opacity-80 transition-opacity cursor-pointer truncate`}
                                    >
                                        {tech.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl">
            {hoveredData && ReactDOM.createPortal(
                <div 
                    style={{ top: `${hoveredData.position.y + 10}px`, left: `${hoveredData.position.x}px` }} 
                    className="absolute z-50 p-3 bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm text-sm"
                >
                    <p className="font-bold text-gray-900 mb-2">
                        {technicians.find(t => t.id === hoveredData.reservations[0].technicianId)?.name}
                    </p>
                    <div className="space-y-2 border-t pt-2 max-h-60 overflow-y-auto">
                        {hoveredData.reservations.map(res => {
                            const { eq } = getReservationDetails(res);
                            return (
                                <div key={res.id} className="border-b pb-1 last:border-b-0">
                                    <p className="font-semibold">{eq?.description || 'N/A'} ({eq?.gageId})</p>
                                    <p className="text-xs text-gray-600">For: {res.company}</p>
                                    <p className="text-xs text-gray-600">
                                        Reservation: {new Date(res.pickupDate + 'T00:00:00').toLocaleDateString()} - {new Date(res.returnDate + 'T00:00:00').toLocaleDateString()}
                                    </p>
                                    {res.notes && <p className="text-xs italic mt-1 text-gray-700">Note: "{res.notes}"</p>}
                                </div>
                            )
                        })}
                    </div>
                </div>,
                document.body
            )}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    {formatDate(currentDate, 'month-year')}
                </h2>
                <div className="flex items-center space-x-2 flex-wrap">
                    <div>
                        <select
                            id="tech-filter"
                            value={filterTechId}
                            onChange={e => setFilterTechId(e.target.value)}
                            className="bg-white border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent text-gray-900"
                        >
                            <option value="all">All Technicians</option>
                            {technicians.filter(t => t.role === UserRole.TECHNICIAN).map(tech => (
                                <option key={tech.id} value={tech.id}>{tech.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                         <button onClick={() => changePeriod('prev')} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-semibold text-brand-primary border border-brand-accent rounded-md hover:bg-brand-light transition-colors">
                            Today
                        </button>
                        <button onClick={() => changePeriod('next')} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <ChevronRightIcon className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    <div className="ml-0 md:ml-4 md:border-l md:pl-4">
                        <div className="flex rounded-md border border-gray-300">
                            <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-sm font-semibold rounded-l-md ${viewMode === 'week' ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Week</button>
                            <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-sm font-semibold rounded-r-md ${viewMode === 'month' ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Month</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className={`grid grid-cols-7 border-t border-l border-gray-200 ${viewMode === 'week' ? '' : 'border-b'}`}>
                {weekDayHeaders.map((day, index) => (
                    <div key={day} className="text-center py-3 border-r border-b border-gray-200 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-500">{day}</p>
                        {viewMode === 'week' && <p className="text-2xl font-bold text-gray-800">{calendarDays[index] ? formatDate(calendarDays[index], 'day') : ''}</p>}
                    </div>
                ))}
            </div>

            {viewMode === 'week' ? renderWeekView() : renderMonthView()}
        </div>
    );
};

export default CalendarView;
