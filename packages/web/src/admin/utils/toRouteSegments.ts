import { getStepOptions, type Location, type StepKind, type TeamStep } from '@quest/shared';

export interface RouteCell {
  stepIndex: number;
  kind: StepKind;
  /** Аудитории шага; больше одной, когда маршрут после вопроса ветвится */
  roomNumbers: string[];
}

export interface RouteSegment {
  location: Location;
  cells: RouteCell[];
}

/** Маршрут команды как в таблице организаторов: корпуса по порядку, внутри — аудитории. */
export function toRouteSegments(sequence: TeamStep[]): RouteSegment[] {
  const segments: RouteSegment[] = [];
  sequence.forEach((step, stepIndex) => {
    const options = getStepOptions(step);
    const first = options[0];
    if (!first) {
      return;
    }
    const last = segments.at(-1);
    const segment = last?.location === first.location ? last : null;
    const cell: RouteCell = {
      stepIndex,
      kind: step.kind,
      roomNumbers: options.map((option) => option.roomNumber),
    };
    if (segment) {
      segment.cells.push(cell);
      return;
    }
    segments.push({ location: first.location, cells: [cell] });
  });
  return segments;
}
