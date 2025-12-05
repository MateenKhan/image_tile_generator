// import React, { useState, useRef, useEffect } from 'react';
// // import { generateImageAnalysis } from '../services/gemini';
// import { ChatMessage } from '../types';
// import { Loader2, Send, Sparkles } from 'lucide-react';

// interface AssistantChatProps {
//   imageBase64: string | null;
// }

// const AssistantChat: React.FC<AssistantChatProps> = ({ imageBase64 }) => {
//   const [messages, setMessages] = useState<ChatMessage[]>([
//     { role: 'model', text: 'Hi! I can help you with your wall art project. Once you upload an image, ask me about materials, hanging instructions, or style advice!' }
//   ]);
//   const [input, setInput] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const handleSend = async () => {
//     if (!input.trim()) return;
//     if (!imageBase64) {
//       setMessages(prev => [...prev, { role: 'user', text: input }, { role: 'model', text: 'Please upload an image first so I can see what we are working on!' }]);
//       setInput('');
//       return;
//     }

//     const userMsg = input;
//     setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
//     setInput('');
//     setIsLoading(true);

//     // Prepare clean base64 string
//     const cleanBase64 = imageBase64.split(',')[1];
    
//     // const response = await generateImageAnalysis(cleanBase64, userMsg);
    
//     setMessages(prev => [...prev, { role: 'model', text: response }]);
//     setIsLoading(false);
//   };

//   return (
//     <div className="flex flex-col h-[500px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//       <div className="bg-indigo-600 p-4 text-white flex items-center gap-2">
//         <Sparkles size={20} />
//         <h3 className="font-semibold">Project Assistant</h3>
//       </div>
      
//       <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
//         {messages.map((msg, idx) => (
//           <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
//             <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
//               msg.role === 'user' 
//                 ? 'bg-indigo-600 text-white rounded-br-none' 
//                 : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-none'
//             }`}>
//               {msg.text}
//             </div>
//           </div>
//         ))}
//         {isLoading && (
//           <div className="flex justify-start">
//             <div className="bg-white p-3 rounded-lg rounded-bl-none shadow-sm border border-slate-100">
//               <Loader2 className="animate-spin text-indigo-600" size={20} />
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//           placeholder="Ask about this project..."
//           className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//         />
//         <button 
//           onClick={handleSend}
//           disabled={isLoading || !input.trim()}
//           className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-md transition-colors"
//         >
//           <Send size={18} />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AssistantChat;
