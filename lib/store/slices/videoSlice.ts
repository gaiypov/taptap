import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface VideoPlayerState {
  activeVideoId: string | null;
  playingVideoIds: string[]; // Видео которые сейчас играют
  mutedVideoIds: string[]; // Видео в mute режиме
  videoCache: Record<string, { url: string; cachedAt: number }>; // Кэш URL видео
}

const initialState: VideoPlayerState = {
  activeVideoId: null,
  playingVideoIds: [],
  mutedVideoIds: [],
  videoCache: {},
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setActiveVideo(state, action: PayloadAction<string | null>) {
      state.activeVideoId = action.payload;
    },
    addPlayingVideo(state, action: PayloadAction<string>) {
      if (!state.playingVideoIds.includes(action.payload)) {
        state.playingVideoIds.push(action.payload);
      }
    },
    removePlayingVideo(state, action: PayloadAction<string>) {
      state.playingVideoIds = state.playingVideoIds.filter((id) => id !== action.payload);
    },
    toggleMuteVideo(state, action: PayloadAction<string>) {
      const index = state.mutedVideoIds.indexOf(action.payload);
      if (index >= 0) {
        state.mutedVideoIds.splice(index, 1);
      } else {
        state.mutedVideoIds.push(action.payload);
      }
    },
    cacheVideoUrl(state, action: PayloadAction<{ id: string; url: string }>) {
      state.videoCache[action.payload.id] = {
        url: action.payload.url,
        cachedAt: Date.now(),
      };
    },
    clearVideoCache(state) {
      state.videoCache = {};
    },
    clearOldCache(state, action: PayloadAction<number>) {
      // Удаляем кэш старше указанного времени (в миллисекундах)
      const now = Date.now();
      Object.keys(state.videoCache).forEach((id) => {
        if (now - state.videoCache[id].cachedAt > action.payload) {
          delete state.videoCache[id];
        }
      });
    },
  },
});

export const {
  setActiveVideo,
  addPlayingVideo,
  removePlayingVideo,
  toggleMuteVideo,
  cacheVideoUrl,
  clearVideoCache,
  clearOldCache,
} = videoSlice.actions;

export default videoSlice.reducer;
