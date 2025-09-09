import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { runChatbotAgent } from '../services/agentOrchestrator';
import type { ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Loader from './Loader';

const Chatbot: React.FC = () => {
  const { project } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: uuidv4(), sender: 'ai', text: 'Bonjour ! Je suis votre assistant EBIOS RM. Posez-moi une question sur votre projet en cours.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (isOpen) {
      // Focus the input field when the chatbot opens for better accessibility
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: uuidv4(), sender: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponseText = await runChatbotAgent(userInput, project);
      const aiMessage: ChatMessage = { id: uuidv4(), sender: 'ai', text: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Erreur de l'agent chatbot:", error);
      const errorMessage: ChatMessage = { id: uuidv4(), sender: 'system', text: `Désolé, une erreur est survenue : ${error.message}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, project]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 bg-brand-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-brand-dark transition-transform transform hover:scale-110 z-50"
        aria-label="Ouvrir le chatbot"
      >
        <svg className="w-8 h-8" fill="currentColor">
          <use href={isOpen ? "#icon-close" : "#icon-chat"}></use>
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-28 right-8 w-full max-w-md h-full max-h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-40 animate-fade-in-up">
          <header className="bg-brand-primary text-white p-4 rounded-t-lg">
            <h2 className="text-lg font-semibold">Assistant EBIOS RM</h2>
          </header>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-brand-accent text-white flex items-center justify-center flex-shrink-0">IA</div>}
                  <div className={`px-4 py-2 rounded-lg max-w-xs md:max-w-sm ${
                    msg.sender === 'user' ? 'bg-blue-500 text-white' : 
                    msg.sender === 'ai' ? 'bg-gray-200 text-text-primary' : 'bg-red-100 text-red-800' // Style for system/error messages
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex justify-center"><Loader text="L'assistant réfléchit..."/></div>}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent"
                placeholder="Votre question..."
                disabled={isLoading}
              />
              <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-lg shadow-sm hover:bg-brand-dark disabled:opacity-50" disabled={isLoading}>
                Envoyer
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;