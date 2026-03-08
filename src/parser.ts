export type ArrowType =
  | "normal"
  | "thick"
  | "corrupt"
  | "dropped";

export interface Participant {
  name: string;
  alias: string;
  column: number;
}

export interface Arrow {
  type: "arrow";
  from: string;
  to: string;
  start?: number;
  end?: number;
  arrowType: ArrowType;
  label?: string;
}

export interface Annotation {
  type: "annotation";
  participant: string;
  height?: number;
  side: "left" | "right";
  text: string;
}

export interface Entities {
  settings: Settings;
  participants: Participant[];
  actions: (Arrow | Annotation)[];
  numAnnotations: number;
}

const DEFAULT_SETTINGS = {
  arrowSize: 10,
  crossSize: 12,
  thickArrowSize: 30,
  labelOffset: 10,
  corruptStart: 0.85,
  dropStart: 0.85,

  squiggleSize: 20,
  squiggleCount: 2,

  messageSpacingY: 40,
  participantSpacingX: 240,
  participantLabelHeight: 30,
  annotationSpacingX: 80,

  participantFontSize: 20,
  messageFontSize: 15,

  paddingX: 30,
  paddingY: 20,
};

export type Settings = typeof DEFAULT_SETTINGS;

export function parse(src: string): Entities {
  const settings = DEFAULT_SETTINGS;

  const participants: Participant[] = [];
  const actions: (Arrow | Annotation)[] = [];
  let numAnnotations = 0;

  const lines = src.split("\n");

  for (let line of lines) {

    line = line.trim();

    if (!line || line.startsWith("//")) continue;

    // overwrite default settings
    if (line.startsWith("def")) {

      const [, name, value] = line.split(/\s+/);

      settings[name] = parseFloat(value);

      continue;
    }

    // participants
    // /^participant\s+((?:["'][^"'@]+["'])|[^\s"'@]+)\s+([^\s"'@]+)/
    if (line.startsWith("participant")) {

      const [, name, alias] = line.split(/\s+/);

      participants.push({
        name,
        alias,
        column: participants.length
      });

      continue;
    }

    // annotations
    const annMatch = line.match(
      /^(\w+)(?:\s*@([\d.]+))?\s*([<>])\s*"(.+)"/
    );

    if (annMatch) {
      numAnnotations++;

      actions.push({
        type: "annotation",
        participant: annMatch[1],
        height: annMatch[2] ? parseFloat(annMatch[2]) : undefined,
        side: annMatch[3] === "<" ? "left" : "right",
        text: annMatch[4]
      });

      continue;
    }

    // arrows
    const arrowMatch = line.match(
      /^(\w+)(?:\s*@([\d.]+))?\s*(->|=>|~>|-x)\s*(\w+)(?:\s*@([\d.]+))?(?:\s*:\s*"(.+)")?/
    );

    if (arrowMatch) {

      const typeMap: Record<string, ArrowType> = {
        "->": "normal",
        "=>": "thick",
        "~>": "corrupt",
        "-x": "dropped"
      };

      actions.push({
        type: "arrow",
        from: arrowMatch[1],
        start: arrowMatch[2] ? parseFloat(arrowMatch[2]) : undefined,
        arrowType: typeMap[arrowMatch[3]],
        to: arrowMatch[4],
        end: arrowMatch[5] ? parseFloat(arrowMatch[5]) : undefined,
        label: arrowMatch[6]
      });

      continue;
    }

  }

  return {
    settings,
    participants,
    actions,
    numAnnotations
  };
}
