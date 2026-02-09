
export enum Tab {
  LISTEN = 'listen',
  RECORD = 'record',
  BROWSE = 'browse'
}

export enum View {
  MAIN = 'main',
  JOURNAL_ARCHIVE = 'journal_archive',
  STORAGE = 'storage',
  PRIVACY = 'privacy',
  PERSONALIZATION = 'personalization'
}

export enum Theme {
  DESERT = 'desert',
  NIGHT = 'night',
  FOREST = 'forest',
  OCEAN = 'ocean'
}

export interface SoundScape {
  id: string;
  name: string;
  location: string;
  url: string;
  category: 'social' | 'urban' | 'nature' | 'people' | 'religious';
  recordedAt: string;
}

export interface AmbientSound {
  id: string;
  location: string;
  url: string;
}

export interface SavedRecording {
  id: string;
  name: string;
  caption: string;
  location: string;
  timestamp: string;
  date: string;
  year: string;
  duration: number;
  isFavorite?: boolean;
  audioUrl?: string;
}
