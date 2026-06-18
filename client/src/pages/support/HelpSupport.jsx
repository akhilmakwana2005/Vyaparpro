import { useState } from 'react';
import { HelpCircle, MessageCircle, Mail, Keyboard, ChevronDown, ChevronUp, Server, Phone } from 'lucide-react';

export default function HelpSupport() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'How do I add a new product?',
      a: 'Go to the "Products" tab in the sidebar and click the "Add Product" button. Fill in the required details like Name, Price, and Stock, then click Save.'
    },
    {
      q: 'How do I generate an invoice/bill?',
      a: 'Navigate to the "Billing" section. Select a customer (or leave as Walk-in), search and add products to the cart, and click "Create Invoice" to print and save the bill.'
    },
    {
      q: 'How can I add my staff members?',
      a: 'If you are the business owner, go to Settings -> Staff in the sidebar. Click "Add Staff", fill in their details and set a temporary password. They can use these credentials to log in.'
    },
    {
      q: 'Why am I not seeing Reports?',
      a: 'Reports and Expenses are restricted to the Business Owner role. If you are logged in as Staff, you will not have access to these sections for security reasons.'
    },
    {
      q: 'How do I use the AI Billing Assistant?',
      a: 'On the Billing page, click the "Sparkles (✨)" icon near the customer selector. Type a command like "add 2 laptop for Rahul" and the AI will automatically fill your cart.'
    }
  ];

  const shortcuts = [
    { keys: ['F2'], action: 'New Invoice / Clear Cart' },
    { keys: ['Ctrl', 'P'], action: 'Print Last Invoice' },
    { keys: ['Esc'], action: 'Close Modal / Dropdown' },
    { keys: ['Enter'], action: 'Submit Form / Add to Cart' },
    { keys: ['Ctrl', 'S'], action: 'Save Current Document' },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="text-primary" /> Help & Support
            </h1>
            <p className="text-sm text-gray-500 mt-1">Get assistance, learn shortcuts, and find answers.</p>
          </div>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="https://wa.me/919876543210?text=Hi%20VyaparPro%20Support,%20I%20need%20help." 
            target="_blank" rel="noreferrer"
            className="bg-green-50 hover:bg-green-100 transition-colors rounded-2xl p-6 border border-green-100 flex items-center gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm shadow-green-200">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-green-900">Chat on WhatsApp</h3>
              <p className="text-sm text-green-700 mt-0.5">Fastest way to get help (+91 98765 43210)</p>
            </div>
          </a>

          <a 
            href="mailto:support@vyaparpro.com"
            className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-2xl p-6 border border-blue-100 flex items-center gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Email Support</h3>
              <p className="text-sm text-blue-700 mt-0.5">support@vyaparpro.com</p>
            </div>
          </a>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* FAQs (Takes 2 cols on lg) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <HelpCircle size={18} className="text-gray-500" />
              <h2 className="font-bold text-gray-900">Frequently Asked Questions</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-4 px-6">
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex justify-between items-center text-left focus:outline-none group"
                  >
                    <span className="font-semibold text-sm text-gray-800 group-hover:text-primary transition-colors">
                      {faq.q}
                    </span>
                    {openFaq === idx ? (
                      <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === idx && (
                    <div className="mt-3 text-sm text-gray-600 leading-relaxed animate-slide-in-right">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            
            {/* Keyboard Shortcuts */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <Keyboard size={18} className="text-gray-500" />
                <h2 className="font-bold text-gray-900">Keyboard Shortcuts</h2>
              </div>
              <div className="p-5 space-y-3">
                {shortcuts.map((sc, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{sc.action}</span>
                    <div className="flex gap-1">
                      {sc.keys.map(k => (
                        <kbd key={k} className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono font-semibold text-gray-600">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5">
              <div className="flex items-center gap-2 mb-4">
                <Server size={18} className="text-primary" />
                <h2 className="font-bold text-gray-900">System Status</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between items-center">
                  <span>Version</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">v1.2.0-beta</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Environment</span>
                  <span className="font-mono bg-green-50 border border-green-100 px-2 py-0.5 rounded text-green-700 font-medium">Production</span>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-1.5"><Phone size={14}/> Support Line</span>
                  <span className="font-semibold text-gray-900">+91 98765 43210</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
