import { Video } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

export interface VideoData {
  id: string;
  uri: string;
  title: string;
  description?: string;
  likes: number;
  comments: number;
  carInfo: {
    make: string;
    model: string;
    year: number;
    price?: number;
  };
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface UseVideoReturn {
  videos: VideoData[];
  loading: boolean;
  error: string | null;
  currentVideo: VideoData | null;
  currentIndex: number;
  playVideo: (index: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  likeVideo: (videoId: string) => Promise<void>;
  refreshVideos: () => Promise<void>;
  loadMoreVideos: () => Promise<void>;
}

export function useVideo(): UseVideoReturn {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<{ [key: string]: Video }>({});

  const currentVideo = videos[currentIndex] || null;

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.videos.getAll();
      setVideos(response.data);
    } catch (err) {
      setError('Failed to load videos');
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshVideos = async () => {
    await loadVideos();
  };

  const loadMoreVideos = async () => {
    try {
      // In a real app, you would implement pagination here
      const response = await api.videos.getAll();
      setVideos(prev => [...prev, ...response.data]);
    } catch (err) {
      console.error('Error loading more videos:', err);
    }
  };

  const playVideo = (index: number) => {
    if (index >= 0 && index < videos.length) {
      setCurrentIndex(index);
    }
  };

  const nextVideo = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const likeVideo = async (videoId: string) => {
    try {
      await api.videos.like(videoId);
      setVideos(prev => 
        prev.map(video => 
          video.id === videoId 
            ? { ...video, likes: video.likes + 1 }
            : video
        )
      );
    } catch (err) {
      console.error('Error liking video:', err);
    }
  };

  return {
    videos,
    loading,
    error,
    currentVideo,
    currentIndex,
    playVideo,
    nextVideo,
    previousVideo,
    likeVideo,
    refreshVideos,
    loadMoreVideos,
  };
}
