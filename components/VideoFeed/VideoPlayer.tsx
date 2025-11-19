// components/VideoFeed/VideoPlayer.tsx — РАБОТАЕТ КАК В TIKTOK 2025
import { useVideoPlayer, VideoView } from '@expo/video';
import React, { useEffect } from 'react';
import { Dimensions, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPlayerProps {
  url: string;
  isActive: boolean; // true если видео на экране
  shouldPlay: boolean;
}

export const VideoPlayer = React.memo(({ url, isActive, shouldPlay }: VideoPlayerProps) => {
  const player = useVideoPlayer(url);

  useEffect(() => {
    if (!isActive) {
      player.pause();
      return;
    }

    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, shouldPlay, player]);

  useEffect(() => {
    player.loop = true;
    player.muted = false;
    player.playbackRate = 1;
  }, [player]);

  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: SCREEN_HEIGHT }}
      allowsFullscreen
      allowsPictureInPicture
      nativeControls={false}
      usePoster
    />
  );
});

VideoPlayer.displayName = 'VideoPlayer';
