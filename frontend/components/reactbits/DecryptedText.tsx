"use client";

import React, { useEffect, useState, useRef } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  characters?: string;
  animateOn?: "mount" | "hover" | "view";
}

const DEFAULT_CHARS = "0123456789ABCDEF!@#$%^&*";

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 35,
  maxIterations = 10,
  className = "",
  characters = DEFAULT_CHARS,
  animateOn = "mount",
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAnimation = () => {
    let iteration = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((char, index) => {
            if (char === " " || char === "\n") return char;
            if (index < iteration / (maxIterations / text.length)) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("")
      );

      if (iteration >= maxIterations * 1.5) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
      }
      iteration += 1;
    }, speed);
  };

  useEffect(() => {
    if (animateOn === "mount") {
      startAnimation();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  const handleMouseEnter = () => {
    if (animateOn === "hover" && !isHovered) {
      setIsHovered(true);
      startAnimation();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <span
      className={`font-mono inline-block tracking-tight transition-colors duration-200 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {displayText}
    </span>
  );
};

export default DecryptedText;
