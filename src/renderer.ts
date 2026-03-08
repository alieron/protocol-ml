import { Entities, Settings } from "./parser";
import { AnnotationPos, ArrowPos, ParticipantPos, resolveLayout } from "./layout";

function drawParticipant(settings: Settings, participant: ParticipantPos): string {
  const { x, y1, y2, name } = participant;

  return `
<text
  x="${x}"
  y="${y1 - settings.participantLabelHeight / 2}"
  text-anchor="middle"
  dominant-baseline="middle"
  font-family="JetBrains Mono, monospace"
  fill="white"
  font-size="${settings.participantFontSize}"
>
  ${name}
</text>
<line stroke="#aaaaaa" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" />`;
}

function drawAnnotation(settings: Settings, annotation: AnnotationPos): string {
  const { x, y, align, text } = annotation;
  // TODO: handle align and wrapping
  return `
<text
  x="${x}"
  y="${y}"
  text-anchor="middle"
  dominant-baseline="middle"
  font-family="JetBrains Mono, monospace"
  fill="white"
  font-size="${settings.messageFontSize}"
>
  ${text}
</text>`
}

function drawArrow(settings: Settings, arrow: ArrowPos): string {
  const { x1, y1, x2, y2, arrowType, label } = arrow;

  const dx = x2 - x1;
  const dy = y2 - y1;

  const len = Math.hypot(dx, dy);

  // normalized
  const ux = dx / len;
  const uy = dy / len;

  // normalized perpendicular
  const px = -uy;
  const py = ux;

  // arrow
  let arrowsvg = '';

  // arrow head
  const baseX = x2 - ux * settings.arrowSize;
  const baseY = y2 - uy * settings.arrowSize;

  const leftX = baseX + px * settings.arrowSize * 0.5;
  const leftY = baseY + py * settings.arrowSize * 0.5;

  const rightX = baseX - px * settings.arrowSize * 0.5;
  const rightY = baseY - py * settings.arrowSize * 0.5;

  switch (arrowType) {
    case "normal":
      arrowsvg = `
<g stroke="white" stroke-width="2" fill="none" stroke-linecap="round">
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />
  <line x1="${x2}" y1="${y2}" x2="${leftX}" y2="${leftY}" />
  <line x1="${x2}" y1="${y2}" x2="${rightX}" y2="${rightY}" />
</g>`;
      break;

    case "dropped":
      // cross
      const dropX = x1 + ux * len * settings.dropStart;
      const dropY = y1 + uy * len * settings.dropStart;

      arrowsvg = `
<g stroke="white" stroke-width="2" fill="none" stroke-linecap="round">
  <line x1="${x1}" y1="${y1}" x2="${dropX}" y2="${dropY}" />
  <line stroke="red" x1="${dropX - settings.crossSize * 0.5}" y1="${dropY - settings.crossSize * 0.5}" x2="${dropX + settings.crossSize * 0.5}" y2="${dropY + settings.crossSize * 0.5}" />
  <line stroke="red" x1="${dropX - settings.crossSize * 0.5}" y1="${dropY + settings.crossSize * 0.5}" x2="${dropX + settings.crossSize * 0.5}" y2="${dropY - settings.crossSize * 0.5}" />
</g>`;
      break;

    case "corrupt":
      // draw the squiggly
      const waveX = x1 + ux * len * settings.corruptStart;
      const waveY = y1 + uy * len * settings.corruptStart;

      const waveLen = (len * (1 - settings.corruptStart)) - 2 * settings.arrowSize;
      const waveInterval = waveLen / (4 * settings.squiggleCount);


      let path = '';

      let sx = waveX;
      let sy = waveY;

      for (let i = 0; i < settings.squiggleCount; i++) {
        sx += ux * waveInterval;
        sy += uy * waveInterval;

        path += `L ${sx - (px * settings.squiggleSize * 0.5)} ${sy - (py * settings.squiggleSize * 0.5)} `

        sx += 2 * ux * waveInterval;
        sy += 2 * uy * waveInterval;

        path += `L ${sx + (px * settings.squiggleSize * 0.5)} ${sy + (py * settings.squiggleSize * 0.5)} `;

        sx += ux * waveInterval;
        sy += uy * waveInterval;
      }
      sx += ux * waveInterval;
      sy += uy * waveInterval;

      path += `L ${sx} ${sy}`

      arrowsvg = `
<g stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <line x1="${x1}" y1="${y1}" x2="${waveX}" y2="${waveY}" />
  <path stroke="orange" d="M ${waveX} ${waveY} ${path} L ${baseX} ${baseY}" />
  <line stroke="orange" x1="${baseX}" y1="${baseY}" x2="${x2}" y2="${y2}" />
  <line stroke="orange" x1="${x2}" y1="${y2}" x2="${leftX}" y2="${leftY}" />
  <line stroke="orange" x1="${x2}" y1="${y2}" x2="${rightX}" y2="${rightY}" />
</g>`;
      break;

    case "thick":
      arrowsvg = `
<g stroke="white" stroke-width="2" fill="none" stroke-linecap="round">
  <polygon stroke="none" fill="#ffffff44" points="${x1},${y1} ${x2},${y2} ${x2},${y2 + settings.thickArrowSize} ${x1},${y1 + settings.thickArrowSize}" />
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />
  <line x1="${x2}" y1="${y2}" x2="${leftX}" y2="${leftY}" />
  <line x1="${x2}" y1="${y2}" x2="${rightX}" y2="${rightY}" />
  <line x1="${x1}" y1="${y1 + settings.thickArrowSize}" x2="${x2}" y2="${y2 + settings.thickArrowSize}" />
  <line x1="${x2}" y1="${y2 + settings.thickArrowSize}" x2="${leftX}" y2="${leftY + settings.thickArrowSize}" />
  <line x1="${x2}" y1="${y2 + settings.thickArrowSize}" x2="${rightX}" y2="${rightY + settings.thickArrowSize}" />
</g>`;
      break;

    // default:
    //   // should not reach here
    //   console.error(`[protocol-ml] Error: Invalid arrow type: ${type}`)
  }

  // label
  let labelsvg = '';

  if (label) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    let offset = settings.labelOffset;
    let direction = 1;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle > 90 || angle < -90) {
      angle += 180;
      direction = -1;
      offset *= direction;
    }

    const lx = mx - px * offset;
    const ly = (arrowType === "thick")
      ? my + (direction * py * settings.thickArrowSize / 2)
      : my - py * offset;


    labelsvg = `
<text
  x="${lx}"
  y="${ly}"
  text-anchor="middle"
  dominant-baseline="middle"
  font-family="JetBrains Mono, monospace"
  transform="rotate(${angle} ${lx} ${ly})"
  fill="white"
  font-size="${settings.messageFontSize}"
>
  ${label}
</text>`;
  }

  return `${arrowsvg}${labelsvg}`;
}

export function renderSVG(entities: Entities): string {
  const { settings, width, height, draws } = resolveLayout(entities);

  let svg: string[] = [];

  svg.push(
    `<svg class="protocol-diagram" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
  );

  svg.push(
    `<rect width="100%" height="100%" fill="#333333"/>`
  );

  for (const draw of draws) {
    switch (draw.type) {
      case "participant":
        svg.push(drawParticipant(settings, draw));
        break;
      case "arrow":
        svg.push(drawArrow(settings, draw));
        break;
      case "annotation":
        svg.push(drawAnnotation(settings, draw));
        break;
    }
  }

  //   svg.push(`<line
  //   x1=50
  //   y1=0
  //   x2=50
  //   y2=480
  //   stroke="#eeeeee"
  //   stroke-width=1
  // />
  // <line
  //   x1=330
  //   y1=0
  //   x2=330
  //   y2=480
  //   stroke="#eeeeee"
  //   stroke-width=1
  // />`);

  // svg.push(drawArrow("normal", 50, 50, 510, 100, "hello"));
  // svg.push(drawArrow("dropped", 510, 100, 50, 200, "hello indeed"));
  // svg.push(drawArrow("corrupt", 50, 200, 510, 300, "why u blue tick me?"));
  // svg.push(drawArrow("thick", 510, 300, 50, 430, "chonk"));
  //
  svg.push(`</svg>`);

  return svg.join("\n");
}
