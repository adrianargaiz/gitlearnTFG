export interface ExerciseAnswerState {
  selected: string | null;
  order: string[] | null;
  matches: Record<string, string>;
  tokenIndices: number[];
  flaggedLines: string[];
  submitted: boolean;
}

export const DEFAULT_EXERCISE_STATE: ExerciseAnswerState = {
  selected: null,
  order: null,
  matches: {},
  tokenIndices: [],
  flaggedLines: [],
  submitted: false,
};

export interface CheckableEjercicio {
  readonly tipo: 'opcionMultiple' | 'rellenarHuecos' | 'arrastrarSoltar' | 'emparejar' | 'construirComando' | 'detectarError';
  readonly opciones: readonly string[];
  readonly respuestaCorrecta: string | readonly string[];
}

export function isExerciseCorrect(ex: CheckableEjercicio | null | undefined, state: ExerciseAnswerState): boolean {
  if (!ex) return false;
  switch (ex.tipo) {
    case 'opcionMultiple':
      return state.selected === (ex.respuestaCorrecta as string);
    case 'rellenarHuecos':
      return (state.selected ?? '').trim().toLowerCase() ===
        (ex.respuestaCorrecta as string).trim().toLowerCase();
    case 'arrastrarSoltar': {
      const correct = Array.isArray(ex.respuestaCorrecta) ? ex.respuestaCorrecta : [];
      const order = state.order ?? [...ex.opciones];
      return JSON.stringify(order) === JSON.stringify(correct);
    }
    case 'emparejar': {
      const pairs = Array.isArray(ex.respuestaCorrecta) ? ex.respuestaCorrecta as readonly string[] : [];
      return pairs.every((pair) => {
        const [l, r] = pair.split('||');
        return state.matches[l] === r;
      });
    }
    case 'construirComando': {
      const correct = Array.isArray(ex.respuestaCorrecta) ? ex.respuestaCorrecta as readonly string[] : [];
      const built = state.tokenIndices.map((idx) => ex.opciones[idx]);
      return JSON.stringify(built) === JSON.stringify(correct);
    }
    case 'detectarError': {
      const correct = Array.isArray(ex.respuestaCorrecta)
        ? new Set((ex.respuestaCorrecta as readonly string[]).map(String))
        : new Set<string>();
      const flagged = new Set(state.flaggedLines);
      if (flagged.size !== correct.size) return false;
      for (const v of correct) if (!flagged.has(v)) return false;
      return true;
    }
  }
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.abs(Math.sin(seed + index)) * 1_000_000) % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
