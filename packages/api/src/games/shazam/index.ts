import { GameType } from '@quest/shared';
import { type GameTypeDefinition } from '../types.js';

/** Текстовый вопрос без своей механики; описание — в README рядом. */
export const shazamGameType: GameTypeDefinition = { gameType: GameType.SHAZAM };
