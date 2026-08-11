'use client'

import React from 'react'

interface ButtonProps {
  children: React.ReactNode

  onClick?: () => void

  type?: 'button' | 'submit' | 'reset'

  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'

  size?: 'sm' | 'md' | 'lg'

  icon?: string

  disabled?: boolean

  fullWidth?: boolean
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {

  //---------------------------------------
  // COLORS
  //---------------------------------------

  const variants = {

    primary: {
      background: '#2563eb',
      color: '#fff',
      border: '1px solid #2563eb',
    },

    secondary: {
      background: '#fff',
      color: '#334155',
      border: '1px solid #cbd5e1',
    },

    success: {
      background: '#22c55e',
      color: '#fff',
      border: '1px solid #22c55e',
    },

    danger: {
      background: '#ef4444',
      color: '#fff',
      border: '1px solid #ef4444',
    },

    warning: {
      background: '#f59e0b',
      color: '#fff',
      border: '1px solid #f59e0b',
    },

    ghost: {
      background: 'transparent',
      color: '#334155',
      border: '1px solid transparent',
    },

  }

  //---------------------------------------
  // SIZES
  //---------------------------------------

  const sizes = {

    sm: {
      height: 32,
      padding: '0 12px',
      fontSize: 12,
    },

    md: {
      height: 38,
      padding: '0 18px',
      fontSize: 13,
    },

    lg: {
      height: 44,
      padding: '0 22px',
      fontSize: 14,
    },

  }

  //---------------------------------------

  return (

    <button

      type={type}

      onClick={onClick}

      disabled={disabled}

      style={{

        display: 'inline-flex',

        alignItems: 'center',

        justifyContent: 'center',

        gap: 8,

        borderRadius: 10,

        cursor: disabled ? 'not-allowed' : 'pointer',

        fontFamily: 'Inter',

        fontWeight: 600,

        transition: '.2s',

        outline: 'none',

        whiteSpace: 'nowrap',

        width: fullWidth ? '100%' : 'auto',

        opacity: disabled ? 0.6 : 1,

        ...variants[variant],

        ...sizes[size],

      }}

    >

      {icon && (

        <i

          className={`ti ${icon}`}

          style={{

            fontSize: 16,

          }}

        />

      )}

      {children}

    </button>

  )

}