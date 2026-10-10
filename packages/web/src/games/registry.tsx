import { GameType } from '@quest/shared';
import { BasicAdminQuestions } from './basicGame/BasicAdminQuestions.js';
import { BasicAttemptView } from './basicGame/BasicAttemptView.js';
import { BlitzContent } from './blitz/BlitzContent.js';
import { EncyclopediaContent } from './encyclopedia/EncyclopediaContent.js';
import { GoogleFormsContent } from './googleForms/GoogleFormsContent.js';
import { HistoryContent } from './history/HistoryContent.js';
import { LightContent } from './light/LightContent.js';
import { MinesweeperContent } from './minesweeper/MinesweeperContent.js';
import { ShazamContent } from './shazam/ShazamContent.js';
import { SocialNetworksContent } from './socialNetworks/SocialNetworksContent.js';
import { SoundButtonsContent } from './soundButtons/SoundButtonsContent.js';
import { StickersContent } from './stickers/StickersContent.js';
import { TelevisionsContent } from './televisions/TelevisionsContent.js';
import { type WebGameTypeDefinition } from './types.js';
import { YagodnoeContent } from './yagodnoe/YagodnoeContent.js';
import { YandexContent } from './yandex/YandexContent.js';

/** Единственное место на фронте, где перечислены типы игр; у каждого свой `Content`. */
export const gameTypes: Record<GameType, WebGameTypeDefinition> = {
  [GameType.SHAZAM]: {
    label: 'Шазам',
    Content: ShazamContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.BLITZ]: {
    label: 'Блиц',
    Content: BlitzContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.GOOGLE_FORMS]: {
    label: 'Гугл-формы',
    Content: GoogleFormsContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
    fullscreen: true,
  },
  [GameType.ENCYCLOPEDIA]: {
    label: 'Энциклопедия',
    Content: EncyclopediaContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.HISTORY]: {
    label: 'История',
    Content: HistoryContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.TELEVISIONS]: {
    label: 'Телевизоры',
    Content: TelevisionsContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.LIGHT]: {
    label: 'Свет',
    Content: LightContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.MINESWEEPER]: {
    label: 'Сапёр',
    Content: MinesweeperContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.SOCIAL_NETWORKS]: {
    label: 'Соцсети',
    Content: SocialNetworksContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.SOUND_BUTTONS]: {
    label: 'Sound Buttons',
    Content: SoundButtonsContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.STICKERS]: {
    label: 'Стикеры',
    Content: StickersContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.YAGODNOE]: {
    label: 'Ягодное',
    Content: YagodnoeContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
  [GameType.YANDEX]: {
    label: 'Яндекс',
    Content: YandexContent,
    AttemptView: BasicAttemptView,
    AdminQuestions: BasicAdminQuestions,
  },
};
