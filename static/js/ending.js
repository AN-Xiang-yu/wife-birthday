(() => {
  const canvas = document.getElementById('ending-heart-canvas');
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const colorStops = [
    [111, 231, 211],
    [91, 224, 205],
    [134, 244, 227],
    [70, 210, 196]
  ];

  let particles = [];
  let animationId;
  let renderWidth = 0;
  let renderHeight = 0;

  const heartPoint = (t, scale, centerX, centerY) => {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return {
      x: centerX + x * scale,
      y: centerY - y * scale
    };
  };

  const buildParticles = () => {
    const bounds = canvas.getBoundingClientRect();
    const width = bounds.width;
    const height = bounds.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 34;

    const particleCount = Math.round(Math.min(width, height) * 5.5);
    const haloCount = Math.round(particleCount * 0.22);

    particles = [];

    for (let i = 0; i < particleCount; i += 1) {
      const t = Math.random() * Math.PI * 2;
      const spread = Math.random() * 0.25 + 0.85;
      const point = heartPoint(t, scale * spread, centerX, centerY);
      const color = colorStops[Math.floor(Math.random() * colorStops.length)];
      particles.push({
        baseX: point.x + (Math.random() - 0.5) * scale * 1.5,
        baseY: point.y + (Math.random() - 0.5) * scale * 1.5,
        radius: Math.random() * 1.4 + 0.6,
        alpha: Math.random() * 0.4 + 0.4,
        twinkle: Math.random() * 0.6 + 0.4,
        drift: (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
        color
      });
    }

    for (let i = 0; i < haloCount; i += 1) {
      const t = Math.random() * Math.PI * 2;
      const point = heartPoint(t, scale * (1.05 + Math.random() * 0.3), centerX, centerY);
      const color = colorStops[Math.floor(Math.random() * colorStops.length)];
      particles.push({
        baseX: point.x + (Math.random() - 0.5) * scale * 4,
        baseY: point.y + (Math.random() - 0.5) * scale * 4,
        radius: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.25 + 0.2,
        twinkle: Math.random() * 0.5 + 0.2,
        drift: (Math.random() - 0.5) * 0.8,
        phase: Math.random() * Math.PI * 2,
        color
      });
    }
  };

  const resizeCanvas = () => {
    const bounds = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    renderWidth = bounds.width;
    renderHeight = bounds.height;
    canvas.width = Math.max(1, Math.floor(renderWidth * dpr));
    canvas.height = Math.max(1, Math.floor(renderHeight * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildParticles();
  };

  const draw = (time) => {
    ctx.clearRect(0, 0, renderWidth, renderHeight);

    particles.forEach((particle) => {
      const twinkle = 0.6 + Math.sin(time * 0.002 + particle.phase) * particle.twinkle;
      const offsetX = Math.sin(time * 0.001 + particle.phase) * particle.drift;
      const offsetY = Math.cos(time * 0.0012 + particle.phase) * particle.drift;
      const [r, g, b] = particle.color;

      ctx.beginPath();
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, particle.alpha * twinkle)})`;
      ctx.arc(
        particle.baseX + offsetX,
        particle.baseY + offsetY,
        particle.radius * twinkle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    animationId = window.requestAnimationFrame(draw);
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  if (animationId) {
    window.cancelAnimationFrame(animationId);
  }
  animationId = window.requestAnimationFrame(draw);
})();
