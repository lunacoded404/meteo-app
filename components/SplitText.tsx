'use client';

import React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number; 
  ease?: string;
  splitType?: 'words' | 'chars'; 
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'right' | 'center' | 'justify';
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 0,
  duration = 0.5,
  stagger = 0.05, 
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 50 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-50px',
  textAlign = 'center',
  
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useGSAP(
    () => {
      if (!isReady || !containerRef.current) return;

      const elements = containerRef.current.querySelectorAll('.split-item');

      gsap.fromTo(
        elements,
        { ...from }, 
        {
          ...to,    
          duration,
          ease,
          delay,
          stagger,   
          scrollTrigger: {
            trigger: containerRef.current,
            start: `top ${100 - threshold * 100}%`,
            end: 'bottom top',
            toggleActions: 'play none none reverse', 
          },
        }
      );
    },
    {
      dependencies: [isReady, text, delay, duration, splitType], 
      scope: containerRef,
    }
  );

  const renderContent = () => {
    if (splitType === 'words') {
      const words = text.split(' ');
      return words.map((word, index) => (
        <span
          key={index}
          className="split-item inline-block will-change-transform will-change-opacity"
          style={{ marginRight: '0.25em' }} 
        >
          {word}
        </span>
      ));
    }

    if (splitType === 'chars') {
      return text.split('').map((char, index) => (
        <span
          key={index}
          className="split-item inline-block will-change-transform will-change-opacity"
          style={{ whiteSpace: 'pre' }} 
        >
          {char}
        </span>
      ));
    }

    return text;
  };

  return (
    <div
      ref={containerRef}
      className={`${className}`}
      style={{ textAlign, overflow: 'hidden' }} 
    >
      <div style={{ opacity: isReady ? 1 : 0 }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default SplitText;