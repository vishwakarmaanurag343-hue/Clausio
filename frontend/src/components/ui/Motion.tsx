'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

export function MotionCard({ className = '', children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      whileHover={{ y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function MotionButton({ className = '', children, ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      className={`glass-button ${className}`}
      whileHover={{ y: -1, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
