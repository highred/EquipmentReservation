
import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect } from 'react';
import { Equipment, Reservation, Company, ChatMessage } from '../../types';
import { SparklesIcon } from '../../components/icons/Icons';

interface ChatbotProps {
    equipmentList: Equipment[];
    reservations: Reservation[];
    companies: Company[];
}

const Chatbot: React.FC<ChatbotProps> = ({ equipmentList, reservations, companies }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if(isOpen && messages.length === 0) {
            setMessages([{ role: 'model', content: "Hello! I'm GageBot. I can help you find available equipment for your job. What are you looking for?" }]);
        }
    }, [isOpen, messages.length]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Determine available equipment for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];

            const bookedEquipmentIds = new Set<string>();
            reservations.forEach(res => {
                const pickup = new Date(res.pickupDate + 'T00:00:00');
                const ret = new Date(res.returnDate + 'T00:00:00');
                if (today >= pickup && today <= ret) {
                    bookedEquipmentIds.add(res.equipmentId);
                }
            });

            const availableEquipment = equipmentList.filter(eq => !bookedEquipmentIds.has(eq.id));

            const systemInstruction = `You are GageBot, an expert AI assistant for ATI, a company that rents out accredited calibration equipment. Your purpose is to help technicians find the right available equipment for their jobs.

**Your Instructions:**
1.  **Primary Goal:** Recommend equipment based on the user's request. You can use the provided context about companies' past rentals to make smarter recommendations. Also, consider general ISO 17025 calibration principles (e.g., if a user needs to measure 5V, a 10V multimeter is better than a 1000V one).
2.  **MANDATORY: Use Provided Data Only.** Your knowledge is strictly limited to the JSON data provided below about available equipment, companies, and existing reservations.
3.  **MANDATORY: Recommend ONLY AVAILABLE Equipment.** The "AVAILABLE EQUIPMENT" list contains items that are not booked for today. These are the ONLY items you can recommend. Do not suggest equipment that is not on this list.
4.  **Be Specific:** When recommending, you MUST state the equipment's \`description\` and its unique \`gageId\`. For example: "I recommend the Digital Multimeter (G-1001)."
5.  **Handle Multiple Copies:** If multiple identical pieces of equipment are available (same description, different \`gageId\`), list all available \`gageId\`s. For example: "We have two Digital Multimeters available: G-1001 and G-1004."
6.  **Handle Unavailability:** If no suitable equipment is available, clearly state that and explain why (e.g., "All our oscilloscopes are currently booked."). You can suggest when one might become free by looking at the reservations data.
7.  **Be Conversational & Helpful:** Keep your tone professional but friendly. Keep responses concise.

**CONTEXTUAL DATA:**

AVAILABLE EQUIPMENT (for today, ${todayStr}):
${JSON.stringify(availableEquipment)}

ALL COMPANIES:
${JSON.stringify(companies)}

ALL RESERVATIONS (for historical context and checking future availability):
${JSON.stringify(reservations)}
`;
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: `USER QUERY: "${inputValue}"`,
              config: {
                systemInstruction: systemInstruction,
              },
            });

            const text = response.text;
            const modelMessage: ChatMessage = { role: 'model', content: text };
            setMessages(prev => [...prev, modelMessage]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I'm having trouble connecting to my brain right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-brand-primary dark:bg-brand-accent text-white rounded-full p-4 shadow-lg hover:bg-brand-secondary dark:hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent dark:focus:ring-offset-gray-900 transition-transform transform hover:scale-110 z-50"
                aria-label="Open AI Chatbot"
            >
                <SparklesIcon className="w-8 h-8" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100]">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg h-[70vh] flex flex-col m-4">
                        <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                <SparklesIcon className="w-6 h-6 mr-2 text-brand-primary dark:text-brand-accent"/>
                                GageBot Assistant
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-3xl font-bold">&times;</button>
                        </header>

                        <main className="flex-grow p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                     <div className="flex justify-start">
                                        <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </main>

                        <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Ask for an equipment recommendation..."
                                    className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    disabled={isLoading}
                                />
                                <button type="submit" disabled={isLoading || !inputValue.trim()} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-secondary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-500">
                                    Send
                                </button>
                            </form>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
