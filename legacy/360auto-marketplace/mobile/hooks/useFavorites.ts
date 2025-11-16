import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../services/api';

// Hook для работы с избранным
export function useFavorites() {
  const queryClient = useQueryClient();
  const [favoritesList, setFavoritesList] = useState<string[]>([]);

  // Загрузка списка избранного
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await api.favorites.getAll();
      setFavoritesList(response.data.map((item: any) => item.listingId || item.id));
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Добавление в избранное
  const addFavoriteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await api.favorites.add(listingId);
    },
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      setFavoritesList([...favoritesList, listingId]);
    },
    onError: (err, listingId) => {
      setFavoritesList(favoritesList.filter(id => id !== listingId));
    },
  });

  // Удаление из избранного
  const removeFavoriteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await api.favorites.remove(listingId);
    },
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      setFavoritesList(favoritesList.filter(id => id !== listingId));
    },
    onError: (err, listingId) => {
      setFavoritesList([...favoritesList, listingId]);
    },
  });

  // Проверка, находится ли в избранном
  const isFavorite = (listingId: string) => {
    return favoritesList.includes(listingId);
  };

  // Тoggle избранного
  const toggleFavorite = (listingId: string) => {
    if (isFavorite(listingId)) {
      removeFavoriteMutation.mutate(listingId);
    } else {
      addFavoriteMutation.mutate(listingId);
    }
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
  };
}

