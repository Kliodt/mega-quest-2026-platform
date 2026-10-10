import { GameType } from '@quest/shared';
import { blitzGameType } from './blitz/index.js';
import { encyclopediaGameType } from './encyclopedia/index.js';
import { googleFormsGameType } from './googleForms/index.js';
import { historyGameType } from './history/index.js';
import { lightGameType } from './light/index.js';
import { minesweeperGameType } from './minesweeper/index.js';
import { shazamGameType } from './shazam/index.js';
import { socialNetworksGameType } from './socialNetworks/index.js';
import { soundButtonsGameType } from './soundButtons/index.js';
import { stickersGameType } from './stickers/index.js';
import { televisionsGameType } from './televisions/index.js';
import { type GameTypeDefinition } from './types.js';
import { yagodnoeGameType } from './yagodnoe/index.js';
import { yandexGameType } from './yandex/index.js';

/** Единственное место в core, где перечислены конкретные типы игр. */
export const gameTypeRegistry: Record<GameType, GameTypeDefinition> = {
  [GameType.SHAZAM]: shazamGameType,
  [GameType.BLITZ]: blitzGameType,
  [GameType.GOOGLE_FORMS]: googleFormsGameType,
  [GameType.ENCYCLOPEDIA]: encyclopediaGameType,
  [GameType.HISTORY]: historyGameType,
  [GameType.TELEVISIONS]: televisionsGameType,
  [GameType.LIGHT]: lightGameType,
  [GameType.MINESWEEPER]: minesweeperGameType,
  [GameType.SOCIAL_NETWORKS]: socialNetworksGameType,
  [GameType.SOUND_BUTTONS]: soundButtonsGameType,
  [GameType.STICKERS]: stickersGameType,
  [GameType.YAGODNOE]: yagodnoeGameType,
  [GameType.YANDEX]: yandexGameType,
};
