'use client';

import { ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}

export default function AnimatedSection({
  children,
  className = '',
  id,
  delay = 0,
}: AnimatedSectionProps) {
  return (
    <motion.section
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: fadeUpVariants.hidden,
        visible: {
          ...fadeUpVariants.visible,
          transition: {
            ...(fadeUpVariants.visible as { transition: object }).transition,
            delay,
          },
        },
      }}
    >
      {children}
    </motion.section>
  );
}
