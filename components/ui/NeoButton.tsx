"use client";

import React from "react";

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "accent";
  children: React.ReactNode;
}

export function NeoButton({
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: NeoButtonProps) {
  let variantClass = "neo-btn";
  if (variant === "secondary") variantClass += " neo-btn-secondary";
  if (variant === "danger") variantClass += " neo-btn-danger";
  if (variant === "accent") variantClass += " neo-btn-accent";

  return (
    <button
      className={`${variantClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
