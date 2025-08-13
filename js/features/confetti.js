/**
 * @module js/features/confetti
 * A lightweight, dependency-free confetti effect generator.
 */
const PARTICLE_COUNT = 150;
const COLORS = ["#FFD700", "#FF6B6B", "#82E0AA", "#5DADE2", "#C39BD3"];

export function celebrate(type = 'burst') {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const count = type === 'burst' ? PARTICLE_COUNT : PARTICLE_COUNT / 2;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    container.appendChild(particle);

    const size = Math.random() * 10 + 5;
    const initialX = `calc(${Math.random() * 100}vw - ${size / 2}px)`;
    const duration = Math.random() * 4 + 3;
    const delay = Math.random() * 1;
    const angle = Math.random() * 360;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    particle.style.left = initialX;
    particle.style.animation = `confetti-fall ${duration}s ${delay}s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`;
    particle.style.transform = `rotate(${angle}deg)`;
  }

  setTimeout(() => {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }, 8000);
}