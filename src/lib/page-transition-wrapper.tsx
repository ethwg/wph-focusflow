"use client";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { usePathname } from "next/navigation";

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    backgroundColor: "#859FD5",
    scale: 0.85,
    x: "50%",
    borderRadius: "50%",
    filter: "blur(15px)",
    boxShadow: "0 0 0 rgba(0,0,0,0)",
  },
  in: {
    opacity: 1,
    backgroundColor: "",
    scale: 1,
    x: "0%",
    borderRadius: "16px", // Match your rounded-2xl
    filter: "blur(0px)",
    boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100,
      duration: 0.7,
      delayChildren: 0.3,
      staggerChildren: 0.1,

      // Add a custom cubic bezier for more organic curve
      ease: [0.42, 0, 0.58, 1], // Smooth ease-in-out
    },
  },
  out: {
    opacity: 0,
    backgroundColor: "",
    scale: 1.1,
    x: "-50%",
    borderRadius: "50%",
    filter: "blur(25px)",
    boxShadow: "0 40px 60px rgba(0,0,0,0.2)",
    transition: {
      type: "tween",
      ease: [0.6, -0.05, 0.01, 0.99], // More dramatic curve
      duration: 0.7,
    },
  },
};

const childVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    rotate: -10,
    scale: 0.9,
  },
  in: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 120,
      // Add a slight bounce for more organic feel
      bounce: 0.4,
    },
  },
  out: {
    opacity: 0,
    y: -30,
    rotate: 10,
    scale: 0.9,
  },
};

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        className="min-h-screen bg-primary/5 backdrop-blur-sm shadow-lg
                    transition-all duration-300 ease-in-out
                    border-opacity-10 border-2 border-primary/10
                    rounded-2xl overflow-hidden"
      >
        <motion.div variants={childVariants} className="w-full h-full">
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
