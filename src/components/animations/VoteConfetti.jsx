import React, { useState, useEffect } from 'react';

const VoteConfetti = ({ isActive, color }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    if (isActive) {
      // Create new particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i * 30) + Math.random() * 30,
        speed: 2 + Math.random() * 2,
        life: 1
      }));
      
      setParticles(newParticles);
      
      // Cleanup animation after 500ms
      const timer = setTimeout(() => {
        setParticles([]);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isActive]);
  
  if (!isActive && particles.length === 0) return null;
  
  return (
    <div className="absolute" style={{ pointerEvents: 'none' }}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: color,
            transform: `rotate(${particle.angle}deg) translate(${particle.speed * 10}px, 0)`,
            opacity: particle.life,
            transition: 'all 500ms ease-out',
          }}
        />
      ))}
    </div>
  );
};

export default VoteConfetti;