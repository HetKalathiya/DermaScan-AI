import React from 'react';
import { motion } from 'framer-motion';
import { Scan, ArrowRight, Activity } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const Hero = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900 text-white pt-20">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl mix-blend-screen animate-pulse delay-1000" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-cyan-100">AI-Powered Diagnosis</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        Early Detection <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                            Saves Lives
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-lg">
                        Advanced artificial intelligence for instant, clinical-grade skin analysis.
                        Monitor your skin health with precision and peace of mind.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="group flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-cyan-500/25"
                        >
                            <Scan className="w-5 h-5" />
                            Scan Now
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/about')}
                            className="px-8 py-4 rounded-full text-lg font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors backdrop-blur-sm"
                        >
                            Learn More
                        </button>
                    </div>

                    <div className="mt-12 flex items-center gap-8 text-gray-400 text-sm">
                        <div>
                            <p className="text-2xl font-bold text-white">99%</p>
                            <p>Accuracy Rate</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div>
                            <p className="text-2xl font-bold text-white">500+</p>
                            <p>Verified Doctors</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div>
                            <p className="text-2xl font-bold text-white">50K+</p>
                            <p>Scans Analyzed</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative hidden md:block"
                >
                    <div className="relative z-10 bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <div className="aspect-[4/5] rounded-lg overflow-hidden relative bg-gray-900">
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Abstract representation of a scan */}
                                <div className="relative w-64 h-64">
                                    <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-ping" />
                                    <div className="absolute inset-4 border-2 border-blue-500/30 rounded-full animate-ping delay-300" />
                                    <Scan className="absolute inset-0 m-auto text-cyan-400 w-24 h-24" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 to-transparent">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-300">Analysis Complete</span>
                                        <span className="text-cyan-400 text-sm font-bold">Low Risk</span>
                                    </div>
                                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                        <div className="w-[12%] h-full bg-cyan-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero;
