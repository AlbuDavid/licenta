/* components/editor/utils/textures.ts
   Generates deterministic canvas textures for material preview. */

export function makeWoodCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d')!;

  // Base gradient
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0,   '#5C2E0A');
  g.addColorStop(0.2, '#7A3E18');
  g.addColorStop(0.45,'#9B5228');
  g.addColorStop(0.7, '#7B3D14');
  g.addColorStop(1,   '#5C2E0A');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  // Grain lines
  const grainColors = [
    'rgba(30,10,3,.35)',
    'rgba(180,110,55,.18)',
    'rgba(20,8,2,.28)',
    'rgba(200,130,70,.12)',
  ];
  for (let i = 0; i < 80; i++) {
    const y0 = (i / 80) * 512;
    ctx.beginPath();
    ctx.strokeStyle = grainColors[i % 4];
    ctx.lineWidth   = 0.4 + (i % 3) * 0.6;
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(
      128, y0 + Math.sin(i * 2.3) * 12,
      384, y0 + Math.sin(i * 1.7) * 9,
      512, y0 + Math.sin(i * 2.1) * 7,
    );
    ctx.stroke();
  }

  // Knot
  ctx.beginPath();
  ctx.ellipse(210, 150, 22, 13, 0.4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(25,8,2,.5)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(210, 150, 10, 6, 0.4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(15,5,1,.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Subtle vignette
  const vgn = ctx.createRadialGradient(256, 256, 180, 256, 256, 380);
  vgn.addColorStop(0, 'rgba(0,0,0,0)');
  vgn.addColorStop(1, 'rgba(0,0,0,.25)');
  ctx.fillStyle = vgn;
  ctx.fillRect(0, 0, 512, 512);

  return c;
}

export function makeSlateCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#19191C';
  ctx.fillRect(0, 0, 512, 512);

  // Layered cleavage lines
  for (let i = 0; i < 70; i++) {
    const y   = (i / 70) * 512;
    const wavy = Math.sin(i * 0.8) * 1.5;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255,255,255,${0.01 + (i % 5) * 0.006})`;
    ctx.lineWidth   = 0.4 + (i % 4) * 0.15;
    ctx.moveTo(0, y + wavy);
    ctx.lineTo(512, y + wavy + Math.sin(i * 1.1) * 1.5);
    ctx.stroke();
  }

  // Mineral sparkle
  for (let i = 0; i < 600; i++) {
    const sx = (i * 73) % 512, sy = (i * 137) % 512;
    const brightness = 0.03 + (i % 6) * 0.025;
    ctx.fillStyle = `rgba(220,230,255,${brightness})`;
    ctx.fillRect(sx, sy, 1 + (i % 2), 1);
  }

  // Slight blue-grey sheen
  const sheen = ctx.createLinearGradient(0, 0, 512, 512);
  sheen.addColorStop(0, 'rgba(80,90,120,.08)');
  sheen.addColorStop(1, 'rgba(30,35,50,.04)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 512, 512);

  return c;
}
