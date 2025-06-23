export const backgroundOptions = [
  {
    id: 'scholarai-image',
    label: 'ScholarAI Background',
    type: 'image',
    className: 'bg-contain bg-center bg-no-repeat',
    backgroundImage: '/assets/bg2.png',
  },
  {
    id: 'scholarai-gradient',
    label: 'ScholarAI Gradient',
    type: 'gradient',
    className: 'bg-gradient-to-br from-background via-background to-muted/20',
  },
  {
    id: 'neural-network',
    label: 'Neural Network',
    type: 'animated',
    className: 'bg-gradient-to-br from-primary/5 via-background to-secondary/10',
    overlay: 'neural-dots',
  },
  {
    id: 'research-flow',
    label: 'Research Flow',
    type: 'animated',
    className: 'bg-gradient-to-tr from-background via-muted/10 to-primary/5',
    overlay: 'floating-particles',
  },
  {
    id: 'academic-waves',
    label: 'Academic Waves',
    type: 'animated',
    className: 'bg-gradient-to-br from-background via-primary/3 to-muted/15',
    overlay: 'wave-pattern',
  },
  {
    id: 'knowledge-grid',
    label: 'Knowledge Grid',
    type: 'pattern',
    className: 'bg-gradient-to-br from-background to-muted/10',
    overlay: 'grid-pattern',
  },
];

// Default background for login page
export const defaultBackground = backgroundOptions[0];

// CSS animations and patterns
export const backgroundStyles = `
  @keyframes float {
    0% { transform: translateX(0px) translateY(0px) rotate(0deg); }
    25% { transform: translateX(30px) translateY(-20px) rotate(90deg); }
    50% { transform: translateX(-20px) translateY(-40px) rotate(180deg); }
    75% { transform: translateX(-40px) translateY(-10px) rotate(270deg); }
    100% { transform: translateX(0px) translateY(0px) rotate(360deg); }
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 0.4; transform: scale(1) rotate(0deg); }
    25% { opacity: 0.8; transform: scale(1.2) rotate(90deg); }
    50% { opacity: 1; transform: scale(1.4) rotate(180deg); }
    75% { opacity: 0.8; transform: scale(1.2) rotate(270deg); }
  }

  @keyframes drift {
    0% { transform: translateX(-100px) translateY(0px) rotate(0deg); }
    25% { transform: translateX(25vw) translateY(-30px) rotate(90deg); }
    50% { transform: translateX(50vw) translateY(-60px) rotate(180deg); }
    75% { transform: translateX(75vw) translateY(-30px) rotate(270deg); }
    100% { transform: translateX(calc(100vw + 100px)) translateY(-50px) rotate(360deg); }
  }

  @keyframes wave {
    0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
    25% { transform: translateX(20px) translateY(-15px) rotate(45deg); }
    50% { transform: translateX(-25px) translateY(-30px) rotate(90deg); }
    75% { transform: translateX(-15px) translateY(-15px) rotate(135deg); }
  }

  @keyframes orbit {
    0% { transform: translateX(0px) translateY(0px) rotate(0deg); }
    25% { transform: translateX(50px) translateY(-50px) rotate(90deg); }
    50% { transform: translateX(0px) translateY(-100px) rotate(180deg); }
    75% { transform: translateX(-50px) translateY(-50px) rotate(270deg); }
    100% { transform: translateX(0px) translateY(0px) rotate(360deg); }
  }

  @keyframes zigzag {
    0%, 100% { transform: translateX(0px) translateY(0px); }
    10% { transform: translateX(40px) translateY(-20px); }
    20% { transform: translateX(-30px) translateY(-40px); }
    30% { transform: translateX(60px) translateY(-60px); }
    40% { transform: translateX(-20px) translateY(-80px); }
    50% { transform: translateX(50px) translateY(-100px); }
    60% { transform: translateX(-40px) translateY(-80px); }
    70% { transform: translateX(30px) translateY(-60px); }
    80% { transform: translateX(-50px) translateY(-40px); }
    90% { transform: translateX(20px) translateY(-20px); }
  }

  .neural-dots::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.1) 1px, transparent 1px),
      radial-gradient(circle at 80% 40%, hsl(var(--primary) / 0.08) 1px, transparent 1px),
      radial-gradient(circle at 40% 80%, hsl(var(--primary) / 0.06) 1px, transparent 1px),
      radial-gradient(circle at 90% 10%, hsl(var(--primary) / 0.04) 1px, transparent 1px),
      radial-gradient(circle at 10% 90%, hsl(var(--primary) / 0.05) 1px, transparent 1px);
    background-size: 100px 100px, 150px 150px, 200px 200px, 120px 120px, 180px 180px;
    animation: float 20s ease-in-out infinite;
  }

  .floating-particles::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 25% 25%, hsl(var(--primary) / 0.1) 2px, transparent 2px),
      radial-gradient(circle at 75% 75%, hsl(var(--primary) / 0.08) 1px, transparent 1px),
      radial-gradient(circle at 50% 10%, hsl(var(--primary) / 0.06) 1.5px, transparent 1.5px),
      radial-gradient(circle at 10% 60%, hsl(var(--primary) / 0.04) 1px, transparent 1px),
      radial-gradient(circle at 90% 30%, hsl(var(--primary) / 0.05) 1px, transparent 1px);
    background-size: 200px 200px, 300px 300px, 150px 150px, 250px 250px, 180px 180px;
    animation: drift 30s linear infinite;
  }

  .wave-pattern::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(45deg, transparent 40%, hsl(var(--primary) / 0.03) 50%, transparent 60%),
      linear-gradient(-45deg, transparent 40%, hsl(var(--primary) / 0.02) 50%, transparent 60%),
      linear-gradient(90deg, transparent 45%, hsl(var(--primary) / 0.01) 50%, transparent 55%);
    background-size: 100px 100px, 150px 150px, 200px 200px;
    animation: wave 15s ease-in-out infinite;
  }

  .grid-pattern::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(hsl(var(--border) / 0.1) 1px, transparent 1px),
      linear-gradient(90deg, hsl(var(--border) / 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: radial-gradient(ellipse at center, black 40%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 70%);
  }

  .background-container {
    position: relative;
    overflow: hidden;
  }

  .background-container::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(ellipse at center, transparent 0%, hsl(var(--background) / 0.1) 100%);
    pointer-events: none;
  }

  /* Image background styles */
  .image-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .image-background::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      hsl(var(--background) / 0.8) 0%,
      hsl(var(--background) / 0.6) 50%,
      hsl(var(--background) / 0.8) 100%
    );
    pointer-events: none;
  }

  /* Floating elements for enhanced visual appeal */
  .floating-element {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, hsl(var(--primary) / 0.15) 40%, transparent 80%);
    box-shadow: 
      0 0 20px hsl(var(--primary) / 0.4),
      0 0 40px hsl(var(--primary) / 0.2),
      0 0 60px hsl(var(--primary) / 0.1),
      inset 0 0 20px hsl(var(--primary) / 0.2);
    filter: blur(0.5px);
    border: 1px solid hsl(var(--primary) / 0.3);
    animation: float 20s ease-in-out infinite;
  }

  .floating-element:nth-child(1) {
    width: 60px;
    height: 60px;
    top: 10%;
    left: 10%;
    animation-delay: 0s;
    animation: orbit 25s ease-in-out infinite;
  }

  .floating-element:nth-child(2) {
    width: 40px;
    height: 40px;
    top: 20%;
    right: 15%;
    animation-delay: 5s;
    animation: zigzag 18s ease-in-out infinite;
  }

  .floating-element:nth-child(3) {
    width: 80px;
    height: 80px;
    bottom: 15%;
    left: 20%;
    animation-delay: 10s;
    animation: float 22s ease-in-out infinite;
  }

  .floating-element:nth-child(4) {
    width: 50px;
    height: 50px;
    bottom: 25%;
    right: 10%;
    animation-delay: 15s;
    animation: wave 20s ease-in-out infinite;
  }

  /* Subtle glow effect */
  .glow-element {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(var(--primary) / 0.2) 30%, transparent 70%);
    box-shadow: 
      0 0 40px hsl(var(--primary) / 0.5),
      0 0 80px hsl(var(--primary) / 0.3),
      0 0 120px hsl(var(--primary) / 0.15),
      0 0 160px hsl(var(--primary) / 0.05);
    filter: blur(1px);
    animation: pulse-glow 8s ease-in-out infinite;
  }

  .glow-element:nth-child(1) {
    width: 200px;
    height: 200px;
    top: 5%;
    right: 5%;
    animation-delay: 0s;
    animation: orbit 35s ease-in-out infinite;
  }

  .glow-element:nth-child(2) {
    width: 150px;
    height: 150px;
    bottom: 10%;
    left: 5%;
    animation-delay: 4s;
    animation: float 30s ease-in-out infinite;
  }
`;
