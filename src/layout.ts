import { ArrowType, Entities, Settings } from "./parser";

export interface ParticipantPos {
  type: "participant";
  x: number;
  y1: number;
  y2: number;
  name: string;
}

export interface ArrowPos {
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  arrowType: ArrowType;
  label?: string;
}

export interface AnnotationPos {
  type: "annotation";
  x: number;
  y: number;
  align: "left" | "right";
  text: string;
}

export interface Diagram {
  settings: Settings;
  width: number;
  height: number;
  draws: (ParticipantPos | ArrowPos | AnnotationPos)[];
}

export function resolveLayout(entities: Entities): Diagram {
  const { settings, participants, actions, numAnnotations } = entities;

  // 1. check if need extra spacing for annotations

  let width = settings.participantSpacingX * (participants.length - 1)
    + 2 * settings.paddingX;

  if (numAnnotations > 0)
    width += 2 * settings.annotationSpacingX;

  // 2. figure out top spacing for participant label and padding

  let height = settings.paddingX + settings.participantLabelHeight + settings.messageSpacingY; // last one is a hack

  // 3. resolve participant x position

  const participantsX = new Map(); // map alias -> x coord
  {
    // recomputing width, but whatever
    let x = settings.paddingX + (numAnnotations > 0 ? settings.annotationSpacingX : 0);
    for (const participant of participants) {
      participantsX.set(participant.alias, x);
      x += settings.participantSpacingX;
    }
  }

  // 4. resolve arrows and annotations

  let counter = 0, counterMax = counter;
  const draws: (ParticipantPos | ArrowPos | AnnotationPos)[] = [];

  for (const action of actions) { // actions should be in order :D
    switch (action.type) {
      case "arrow":
        // @ positioning on the source should modify the counter
        let startY = counter;
        let endY = counter + 1;

        if (action.start) {
          counter = action.start;
        }

        if (action.end) {
          endY = action.end;
        }

        draws.push({
          type: action.type,
          x1: participantsX.get(action.from),
          y1: height + startY * settings.messageSpacingY,
          x2: participantsX.get(action.to),
          y2: height + endY * settings.messageSpacingY,
          arrowType: action.arrowType,
          label: action.label,
        });

        counter++;
        break;

      case "annotation":
        // @ positioning should just position and nothing else
        let y = counter;
        if (action.height) {
          y = action.height;
        }

        draws.push({
          type: action.type,
          x: participantsX.get(action.participant) - ((action.side == "left" ? 1 : -1) * (settings.annotationSpacingX / 2)),
          y: height + y * settings.messageSpacingY,
          align: action.side == "left" ? "right" : "left", // if on left, use right align
          text: action.text,
        });

        break;

      // default:
      //   // should not reach here
      //   console.error(`[protocol-ml] Errror: invalid action type ${action.type}`);
    }
    counterMax = Math.max(counterMax, counter);
  }

  // 5. resolve height of participant lifetimes

  // draws.reverse(); // TBC: might look better if one rendered above

  const oldHeight = height - settings.messageSpacingY; // another hack
  height += (counterMax + 1) * settings.messageSpacingY; // add some extra length to the lifetime

  const lifelines: ParticipantPos[] = participants.map(p => {
    return {
      type: "participant",
      x: participantsX.get(p.alias),
      y1: oldHeight,
      y2: height,
      name: p.name,
    };
  });

  height += settings.paddingY;

  return {
    settings,
    width,
    height,
    draws: [...lifelines, ...draws],
  };
}
