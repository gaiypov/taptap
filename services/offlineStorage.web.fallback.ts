// Пустой модуль для замены expo-sqlite на web
// Metro будет использовать этот файл вместо реального expo-sqlite на web платформе
// Это предотвращает попытку загрузить WASM файлы

export const openDatabaseAsync = () => {
  throw new Error('SQLite is not available on web platform. Use AsyncStorage instead.');
};

export default {
  openDatabaseAsync: () => {
    throw new Error('SQLite is not available on web platform. Use AsyncStorage instead.');
  },
};

