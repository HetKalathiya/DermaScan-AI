import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Shield, Clock, Smartphone, Database, Lock } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: <Brain className="w-6 h-6" />,
            title: "Advanced AI Model",
            description: "Trained on over 100,000 clinical images for dermatologist-level accuracy.",
            color: "from-purple-500 to-indigo-500"
        },
        {
            icon: <Clock className="w-6 h-6" />,
            title: "Instant Results",
            description: "Get analysis results in seconds, not days. Real-time processing on your device.",
            color: "from-cyan-500 to-blue-500"
        },
        {
            icon: <GuardIcon />,
            title: "Privacy First",
            description: "Your health data is encrypted and never shared without your explicit consent.",
            color: "from-emerald-500 to-teal-500"
        },
        {
            icon: <Smartphone className="w-6 h-6" />,
            title: "Easy to Use",
            description: "Simple interface designed for everyone. Just snap a photo and let AI do the rest.",
            color: "from-orange-500 to-red-500"
        }
    ];

    return (
        <section id="features" className="py-24 bg-gray-900 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold text-white mb-4"
                    >
                        Why Choose <span className="text-cyan-400">DermaScan AI?</span>
                    </motion.h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Combining medical expertise with cutting-edge artificial intelligence to provide accessible skin processing for everyone.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} bg-opacity-10 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <div className="text-white">
                                    {feature.icon}
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const GuardIcon = () => (
    <Shield className="w-6 h-6" />
);

export default Features;
