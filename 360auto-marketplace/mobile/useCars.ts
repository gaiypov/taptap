// hooks/useCars.ts
import { useEffect, useState } from 'react';
import { db } from '../services/supabase';
import { Car } from '../types';

export interface CarsState {
  cars: Car[];
  loading: boolean;
  error: string | null;
}

export function useCars() {
  const [state, setState] = useState<CarsState>({
    cars: [],
    loading: true,
    error: null,
  });

  // Загрузить все автомобили
  const loadCars = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data: cars, error } = await db.getCars();
      if (error) throw error;
      setState(prev => ({ ...prev, cars: cars || [], loading: false }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  // Загрузить автомобиль по ID
  const loadCarById = async (id: string) => {
    try {
      const { data: car, error } = await db.getCarById(id);
      if (error) throw error;
      return car;
    } catch (error: any) {
      throw error;
    }
  };

  // Создать новый автомобиль
  const createCar = async (carData: Partial<Car>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data: newCar, error } = await db.createCar(carData as any);
      if (error) throw error;
      setState(prev => ({ 
        ...prev, 
        cars: [newCar, ...prev.cars], 
        loading: false 
      }));
      return newCar;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Обновить автомобиль
  const updateCar = async (id: string, updates: Partial<Car>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data: updatedCar, error } = await db.updateCar(id, updates as any);
      if (error) throw error;
      setState(prev => ({
        ...prev,
        cars: prev.cars.map(car => car.id === id ? updatedCar : car),
        loading: false,
      }));
      return updatedCar;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Удалить автомобиль
  const deleteCar = async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await db.deleteCar(id);
      if (error) throw error;
      setState(prev => ({
        ...prev,
        cars: prev.cars.filter(car => car.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Увеличить просмотры
  const incrementViews = async (id: string) => {
    try {
      const { data: updatedCar, error } = await db.getCarById(id);
      if (error) throw error;
      setState(prev => ({
        ...prev,
        cars: prev.cars.map(car => car.id === id ? updatedCar : car),
      }));
    } catch (error: any) {
      throw error;
    }
  };

  // Увеличить лайки
  const incrementLikes = async (id: string) => {
    try {
      // Используем новый API для лайков
      const { error } = await db.likeCar('current-user-id', id);
      if (error) throw error;
      // Обновляем локальное состояние
      setState(prev => ({
        ...prev,
        cars: prev.cars.map(car => 
          car.id === id ? { ...car, likes: car.likes + 1 } : car
        ),
      }));
    } catch (error: any) {
      throw error;
    }
  };

  // Увеличить сохранения
  const incrementSaves = async (id: string) => {
    try {
      const { error } = await db.saveCar('current-user-id', id);
      if (error) throw error;
      setState(prev => ({
        ...prev,
        cars: prev.cars.map(car => 
          car.id === id ? { ...car, saves: car.saves + 1 } : car
        ),
      }));
    } catch (error: any) {
      throw error;
    }
  };

  // Загрузить автомобили при монтировании
  useEffect(() => {
    loadCars();
  }, []);

  return {
    ...state,
    loadCars,
    loadCarById,
    createCar,
    updateCar,
    deleteCar,
    incrementViews,
    incrementLikes,
    incrementSaves,
  };
}
