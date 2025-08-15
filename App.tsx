import React, { useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Supabase Client Setup ---
// These variables must be available in your deployment environment.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// --- Types ---
interface Equipment {
    id: number;
    name: string;
    is_checked_out: boolean;
    checked_out_by: string | null;
}

// --- Constants ---
const EQUIPMENT_ID = 1; // We are only managing a single piece of equipment

const App: React.FC = () => {
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEquipment = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: dbError } = await supabase
                .from('equipment')
                .select('*')
                .eq('id', EQUIPMENT_ID)
                .single();

            if (dbError) {
                throw new Error(dbError.message);
            }

            if (data) {
                setEquipment(data);
            } else {
                throw new Error(`Equipment with ID ${EQUIPMENT_ID} not found.`);
            }
        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (supabase) {
            fetchEquipment();
        }
    }, [fetchEquipment]);
    
    const handleToggleCheckout = async () => {
        if (!equipment || !supabase) return;

        const isCheckingOut = !equipment.is_checked_out;
        let userName: string | null = null;
        
        if (isCheckingOut) {
            userName = prompt("Please enter your name to check out the equipment:");
            if (!userName) {
                return; // User cancelled the prompt
            }
        }
        
        setIsLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('equipment')
                .update({
                    is_checked_out: isCheckingOut,
                    checked_out_by: userName,
                })
                .eq('id', EQUIPMENT_ID);

            if (updateError) {
                throw new Error(updateError.message);
            }
            
            await fetchEquipment();

        } catch (err) {
             console.error(err);
             setError((err as Error).message);
             setIsLoading(false);
        }
    };


    const renderStatus = () => {
        if (equipment?.is_checked_out) {
            return (
                <div className="text-center">
                    <p className="text-lg font-semibold text-yellow-600">Checked Out</p>
                    <p className="text-sm text-gray-500">by {equipment.checked_out_by}</p>
                </div>
            );
        }
        return (
             <div className="text-center">
                <p className="text-lg font-semibold text-green-600">Available</p>
            </div>
        );
    };

    const renderContent = () => {
        if (isLoading && !equipment) {
            return <div className="text-center text-gray-500 animate-pulse">Loading Equipment Status...</div>;
        }

        if (error) {
            return (
                <div className="text-center text-red-600 bg-red-50 p-4 rounded-md">
                    <p className="font-bold">An Error Occurred:</p>
                    <p>{error}</p>
                </div>
            );
        }
        
        if (equipment) {
             return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-800">{equipment.name}</h2>
                    </div>
                    
                    {renderStatus()}

                    <button
                        onClick={handleToggleCheckout}
                        disabled={isLoading}
                        className={`w-full px-4 py-3 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait ${
                            equipment.is_checked_out 
                            ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400' 
                            : 'bg-green-500 hover:bg-green-600 focus:ring-green-400'
                        }`}
                    >
                        {isLoading ? 'Updating...' : (equipment.is_checked_out ? 'Check In' : 'Check Out')}
                    </button>
                </div>
             );
        }

        return null;
    }

    if (!supabase) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
               <div className="p-8 text-center bg-white rounded-lg shadow-xl max-w-md mx-4">
                   <h1 className="text-2xl font-bold text-red-600">Configuration Error</h1>
                   <p className="mt-4 text-gray-700">
                       Supabase URL and Key are not configured.
                   </p>
                    <p className="mt-2 text-sm text-gray-500">
                       Please provide <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> as environment variables to run this application.
                   </p>
               </div>
           </div>
       );
    }
    
    return (
        <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg space-y-4">
                 <h1 className="text-2xl font-bold text-center text-gray-800">
                    🚀 Supabase Checkout
                </h1>
                <div className="border-t border-gray-200 pt-4">
                    {renderContent()}
                </div>
            </div>
        </main>
    );
};

export default App;
