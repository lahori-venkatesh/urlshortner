import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Paperclip, Phone, Mail, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSupportContext } from '../../context/SupportContext';
import toast from 'react-hot-toast';

interface SupportWidgetProps {
  className?: string;
}

interface SupportMessage {
  id: string;
  message: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  attachments?: string[];
}

const SupportWidget: React.FC<SupportWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'contact' | 'faq'>('chat');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulate initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        setMessages([{
          id: '1',
          message: `Hi ${user?.name || 'there'}! 👋 I'm here to help you with any questions about TinySlash. How can I assist you today?`,
          sender: 'agent',
          timestamp: new Date()
        }]);
      }, 500);
    }
  }, [isOpen, user?.name, messages.length]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: SupportMessage = {
      id: Date.now().toString(),
      message: message.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      setIsTyping(false);
      const agentResponse: SupportMessage = {
        id: (Date.now() + 1).toString(),
        message: "Thanks for reaching out! I've received your message and will get back to you shortly. For urgent payment issues, please include your transaction ID.",
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className={`fixed bottom-6 right-6 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-[#36a1ce] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="message"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </motion.div>

      {/* Support Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#36a1ce] text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">TinySlash Support</h3>
                  <p className="text-blue-100 text-sm">We're here to help! 🚀</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs">Online</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mt-4">
                {[
                  { id: 'chat', label: 'Chat', icon: MessageCircle },
                  { id: 'contact', label: 'Contact', icon: Mail },
                  { id: 'faq', label: 'FAQ', icon: HelpCircle }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      activeTab === id
                        ? 'bg-white/20 text-white'
                        : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl ${
                            msg.sender === 'user'
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-800 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-end space-x-2">
                      <div className="flex-1 relative">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="w-full p-3 pr-10 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={1}
                          style={{ minHeight: '44px', maxHeight: '100px' }}
                        />
                        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <Paperclip className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="p-4 h-full overflow-y-auto">
                  <ContactForm />
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="p-4 h-full overflow-y-auto">
                  <FAQSection />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Contact Form Component
const ContactForm: React.FC = () => {
  const { user } = useAuth();
  const { createTicket } = useSupportContext();
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'payment', label: '💳 Payment Support', desc: 'Razorpay issues, failed payments, subscriptions' },
    { value: 'technical', label: '🔧 Technical Support', desc: 'Bugs, platform issues, troubleshooting' },
    { value: 'account', label: '👤 Account Support', desc: 'Login issues, profile problems' },
    { value: 'general', label: '💬 General Inquiry', desc: 'Questions, feedback, suggestions' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Please log in to submit a support ticket');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createTicket({
        category: formData.category as any,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority as any
      });
      
      toast.success('Support ticket created successfully! We\'ll get back to you soon.');
      
      // Reset form
      setFormData({
        category: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      
      // Handle authentication errors specifically
      if (error?.message?.includes('Authentication required') || 
          error?.message?.includes('Please log in')) {
        toast.error('Your session has expired. Please log in again to submit a support ticket.');
      } else if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast.error('Authentication failed. Please log in again to submit a support ticket.');
      } else {
        const errorMessage = error?.message || 'Failed to create support ticket. Please try again.';
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show login prompt if user is not authenticated
  if (!user?.id) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
          <p className="text-gray-600 mb-4">
            Please log in to submit a support ticket. This helps us provide better assistance and follow up on your request.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Brief description of your issue"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Describe your issue in detail..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">Low - General question</option>
          <option value="medium">Medium - Standard issue</option>
          <option value="high">High - Urgent problem</option>
          <option value="urgent">Urgent - Critical issue</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Ticket...
          </>
        ) : (
          'Submit Ticket'
        )}
      </button>
    </form>
  );
};

// FAQ Section Component
const FAQSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqs = [
    {
      id: '1',
      category: 'Payment',
      question: 'My payment failed but money was deducted',
      answer: 'If your payment failed but money was deducted, it\'s usually a temporary hold by your bank. The amount will be refunded within 5-7 business days. If not, please contact us with your transaction ID.'
    },
    {
      id: '2',
      category: 'Technical',
      question: 'My QR code is not working',
      answer: 'Ensure your QR code is generated correctly and the link is active. Try scanning with different QR code readers. If the issue persists, regenerate the QR code.'
    },
    {
      id: '3',
      category: 'Account',
      question: 'I can\'t log into my account',
      answer: 'Try resetting your password using the "Forgot Password" link. If you\'re using Google OAuth, ensure you\'re using the correct Google account. Clear your browser cache if needed.'
    },
    {
      id: '4',
      category: 'General',
      question: 'How do I upgrade my plan?',
      answer: 'Go to your Profile page and click on "Upgrade to Pro". Choose your preferred plan and complete the payment process. Your account will be upgraded immediately.'
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search FAQs..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        {filteredFAQs.map((faq) => (
          <div key={faq.id} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {faq.category}
                  </span>
                  <p className="font-medium text-gray-900 mt-1">{faq.question}</p>
                </div>
                <span className="text-gray-400">
                  {expandedFAQ === faq.id ? '−' : '+'}
                </span>
              </div>
            </button>
            
            {expandedFAQ === faq.id && (
              <div className="px-3 pb-3">
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFAQs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No FAQs found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default SupportWidget;