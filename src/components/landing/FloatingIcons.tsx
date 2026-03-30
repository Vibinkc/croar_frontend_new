"use client";

import { motion } from "framer-motion";

const icons = [
    // Coding
    { icon: "code", x: "10%", y: "20%", delay: 0 },
    { icon: "terminal", x: "80%", y: "15%", delay: 1 },
    { icon: "data_object", x: "15%", y: "70%", delay: 2 },

    // Aptitude
    { icon: "calculate", x: "70%", y: "80%", delay: 0.5 },
    { icon: "functions", x: "5%", y: "40%", delay: 1.5 },

    // Communication
    { icon: "mic", x: "90%", y: "50%", delay: 0.8 },
    { icon: "chat", x: "75%", y: "30%", delay: 2.2 },
];

export default function FloatingIcons() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            {icons.map((item, idx) => (
                <motion.div
                    key={idx}
                    className="absolute text-indigo-200 dark:text-indigo-900/30"
                    style={{ left: item.x, top: item.y }}
                    animate={{
                        y: [-10, 10, -10],
                        rotate: [-5, 5, -5],
                    }}
                    transition={{
                        duration: 6,
                        delay: item.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <span className="material-icons-outlined text-6xl md:text-8xl">
                        {item.icon}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}
