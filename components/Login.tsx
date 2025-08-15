import React, { useState } from 'react';
import { User, Role } from '../types';
import Button from './common/Button';

interface LoginProps {
    users: User[];
    onLogin: (user: User) => void;
    loading: boolean;
    error: string | null;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, loading, error }) => {
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            return;
        }
        const user = users.find(u => u.id === parseInt(selectedUserId, 10));
        if (user) {
            onLogin(user);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center mb-8">
                    <span className="text-5xl">🛠️</span>
                    <h1 className="text-3xl font-bold text-gray-800 mt-2">Equipment Reservation</h1>
                    <p className="text-gray-500">Please select your user ID to log in.</p>
                </div>

                {loading ? (
                    <div className="text-center text-gray-600">Loading users...</div>
                ) : error ? (
                     <div className="text-center p-4 bg-red-100 text-red-700 rounded-md">
                        <strong>Error:</strong><br/> {error}
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">
                                Select User
                            </label>
                            <select
                                id="user-select"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                <option value="" disabled>-- Please choose an option --</option>
                                {users.filter(u => u.role === Role.Technician).map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} (Technician)
                                    </option>
                                ))}
                                {users.filter(u => u.role === Role.Admin).map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} (Admin)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button type="submit" className="w-full" disabled={!selectedUserId}>
                            Log In
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;