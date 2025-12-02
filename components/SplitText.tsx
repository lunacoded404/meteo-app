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
  stagger?: number; // Thời gian trễ giữa các chữ
  ease?: string;
  splitType?: 'words' | 'chars'; // Tạm thời hỗ trợ words và chars
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
  stagger = 0.05, // Mặc định mỗi chữ cách nhau 0.05s
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 50 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-50px',
  textAlign = 'center',
  
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dùng state để đảm bảo hydrat hóa (hydration) khớp giữa server/client
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
        { ...from }, // Trạng thái bắt đầu
        {
          ...to,     // Trạng thái kết thúc
          duration,
          ease,
          delay,
          stagger,   // Hiệu ứng đuổi nhau
          scrollTrigger: {
            trigger: containerRef.current,
            start: `top ${100 - threshold * 100}%`, // Tính toán vị trí kích hoạt
            end: 'bottom top',
            toggleActions: 'play none none reverse', // Chơi khi vào, reverse khi ra
            // markers: true, // Bật lên để debug vị trí scroll nếu cần
          },
        }
      );
    },
    {
      dependencies: [isReady, text, delay, duration, splitType], // Chạy lại khi các props này thay đổi
      scope: containerRef,
    }
  );

  // Hàm render chia nhỏ text
  const renderContent = () => {
    if (splitType === 'words') {
      const words = text.split(' ');
      return words.map((word, index) => (
        <span
          key={index}
          className="split-item inline-block will-change-transform will-change-opacity"
          style={{ marginRight: '0.25em' }} // Khoảng cách giữa các từ
        >
          {word}
        </span>
      ));
    }

    if (splitType === 'chars') {
      // Chia theo từng ký tự
      return text.split('').map((char, index) => (
        <span
          key={index}
          className="split-item inline-block will-change-transform will-change-opacity"
          style={{ whiteSpace: 'pre' }} // Giữ nguyên khoảng trắng nếu có
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
      style={{ textAlign, overflow: 'hidden' }} // overflow hidden để tránh scroll bar khi chữ bay từ ngoài vào
    >
      {/* Mẹo: Render opacity 0 ban đầu để tránh FOUC (Flash of Unstyled Content), 
        GSAP sẽ set lại opacity khi chạy.
      */}
      <div style={{ opacity: isReady ? 1 : 0 }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default SplitText;