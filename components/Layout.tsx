import React from 'react';
import { Tab, User, UserRole } from '../types';
import { CalendarIcon, CogIcon, UserIcon, WrenchScrewdriverIcon } from './icons/Icons';

interface LayoutProps {
    children: React.ReactNode;
    tabs: { id: Tab; label: string; roles: UserRole[] }[];
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    currentUser: User;
    users: User[];
    onUserChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const ICONS: Record<Tab, React.ReactNode> = {
    CALENDAR: <CalendarIcon className="w-5 h-5 mr-2" />,
    EQUIPMENT: <WrenchScrewdriverIcon className="w-5 h-5 mr-2" />,
    TECHNICIAN: <UserIcon className="w-5 h-5 mr-2" />,
    ADMIN: <CogIcon className="w-5 h-5 mr-2" />,
};

const Layout: React.FC<LayoutProps> = ({ children, tabs, activeTab, onTabChange, currentUser, users, onUserChange }) => {
    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-brand-primary shadow-lg">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center">
                            <svg className="w-10 h-10 text-white mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 16v-2m8-8h2M4 12H2m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414M18.364 4.222l-1.414 1.414M5.636 18.364l-1.414 1.414M12 16a4 4 0 110-8 4 4 0 010 8z" />
                            </svg>
                            <h1 className="text-2xl font-bold text-white tracking-wider">ATI Equipment Reservation</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                             <div className="text-white text-sm">
                                <label htmlFor="user-select" className="font-semibold mr-2">View As:</label>
                                <select
                                    id="user-select"
                                    value={currentUser.id}
                                    onChange={onUserChange}
                                    className="bg-brand-secondary border border-brand-accent rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-brand-light"
                                >
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="bg-white shadow-md">
                     <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-start space-x-2">
                             {tabs.map(tab => {
                                let label = tab.label;
                                if (tab.id === 'TECHNICIAN' && currentUser.role === UserRole.ADMIN) {
                                    label = 'Reservations';
                                }
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => onTabChange(tab.id)}
                                        className={`flex items-center px-4 py-3 text-sm font-medium border-b-4 transition-colors duration-200 ease-in-out
                                            ${activeTab === tab.id
                                                ? 'border-brand-primary text-brand-primary'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {ICONS[tab.id]}
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </nav>
            </header>
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;