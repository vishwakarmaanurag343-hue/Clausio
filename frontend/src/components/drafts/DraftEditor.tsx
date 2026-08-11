'use client'

import React from 'react'
import { motion, type Variants } from 'framer-motion'
import DraftTypeSelector from './DraftTypeSelector'
import StrategicNotes from './StrategicNotes'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
}

export default function DraftEditor() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: 24, height: 'fit-content' }}
    >
      <motion.div variants={itemVariants}><DraftTypeSelector /></motion.div>
      <motion.div variants={itemVariants}><StrategicNotes /></motion.div>
    </motion.div>
  )
}