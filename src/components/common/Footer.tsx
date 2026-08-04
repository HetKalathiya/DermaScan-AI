import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-gray-900 border-t border-white/10 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="h-6 w-6 text-cyan-400" />
                            <span className="text-xl font-bold text-white">DermaScan AI</span>
                        </div>
                        <p className="text-gray-400 max-w-sm">
                            Empowering proactive health monitoring through advanced technology. Early detection is your best protection.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Home</a></li>
                            <li><a href="#features" className="hover:text-cyan-400 transition-colors">Technology</a></li>
                            <li><button onClick={() => navigate('/doctor')} className="hover:text-cyan-400 transition-colors">For Doctors</button></li>
                            <li><button onClick={() => navigate('/about')} className="hover:text-cyan-400 transition-colors">About Us</button></li>
                            <li><button onClick={() => navigate('/login')} className="hover:text-cyan-400 transition-colors">Get Started</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Medical Disclaimer</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 mt-8 text-center text-gray-500 text-sm">
                    <p className="flex items-center justify-center gap-2">
                        © 2026 DermaScan AI. Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for a healthier future.
                    </p>
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg max-w-2xl mx-auto text-yellow-200/80">
                        <strong>Disclaimer:</strong> This tool is for educational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for any questions you may have regarding a medical condition.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
