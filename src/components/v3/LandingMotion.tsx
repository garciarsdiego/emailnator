import { motion, useReducedMotion } from "motion/react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LandingMotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function LandingMotion({ children, className, delay = 0 }: LandingMotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

interface SectionShellProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function SectionShell({ children, className, ...props }: SectionShellProps) {
  return (
    <section className={cn("v3-section overflow-hidden", className)} {...props}>
      <LandingMotion>{children}</LandingMotion>
    </section>
  );
}
