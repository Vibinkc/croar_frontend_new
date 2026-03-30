"use client";

import { motion } from "framer-motion";

interface SkillMarqueeProps {
    skills: string[];
    direction?: "left" | "right";
    speed?: number;
}

export default function SkillMarquee({
    skills,
    direction = "left",
    speed = 20,
}: SkillMarqueeProps) {
    return (
        <div className="flex overflow-hidden w-full py-4 mask-gradient">
            <motion.div
                className="flex gap-4 flex-nowrap whitespace-nowrap"
                initial={{ x: direction === "left" ? 0 : "-50%" }}
                animate={{ x: direction === "left" ? "-50%" : 0 }}
                transition={{
                    duration: speed,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                {/* Render items twice to create seamless loop */}
                {[...skills, ...skills, ...skills, ...skills].map((skill, idx) => (
                    <span
                        key={`${skill}-${idx}`}
                        className="skill-pill"
                    >
                        {skill}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
