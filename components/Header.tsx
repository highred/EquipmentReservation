
import React from 'react';
import { User, View, Role } from '../types';
import CalendarIcon from './icons/CalendarIcon';
import EquipmentIcon from './icons/EquipmentIcon';
import AdminIcon from './icons/AdminIcon';
import MyBookingsIcon from './icons/MyBookingsIcon';
import LogoutIcon from './icons/LogoutIcon';

interface HeaderProps {
    currentUser: User;
    activeView: View;
    onNavigate: (view: View) => void;
    onLogout: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const Header: React.FC<HeaderProps> = ({ currentUser, activeView, onNavigate, onLogout }) => {
    return (
        <header className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <span className="text-2xl">🛠️</span>
                        <h1 className="text-xl font-bold text-gray-800">EquipReserve</h1>
                    </div>

                    <nav className="flex items-center gap-2 sm:gap-4">
                        <NavItem icon={<CalendarIcon />} label="Calendar" isActive={activeView === View.Calendar} onClick={() => onNavigate(View.Calendar)} />
                        <NavItem icon={<EquipmentIcon />} label="Equipment" isActive={activeView === View.Equipment} onClick={() => onNavigate(View.Equipment)} />
                        <NavItem icon={<MyBookingsIcon />} label="My Bookings" isActive={activeView === View.MyBookings} onClick={() => onNavigate(View.MyBookings)} />
                        {(currentUser.role === Role.Admin) && (
                           <NavItem icon={<AdminIcon />} label="Admin" isActive={activeView === View.Admin} onClick={() => onNavigate(View.Admin)} />
                        )}
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-800">{currentUser.name}</div>
                            <div className="text-xs text-gray-500">{currentUser.role}</div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            aria-label="Logout"
                        >
                            <LogoutIcon />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
