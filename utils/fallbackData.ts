// УНИВЕРСАЛЬНЫЕ FALLBACK ДАННЫЕ
// Этот файл содержит fallback данные для всех компонентов

export const FALLBACK_LISTINGS = [
  {
    id: '1',
    category: 'car' as const,
    title: 'Toyota Camry 2020',
    description: 'Отличное состояние, один владелец',
    price: 2500000,
    video_id: 'test-video-1',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail_url: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Toyota+Camry',
    views: 120,
    likes: 15,
    saves: 3,
    shares: 5,
    messages_count: 2,
    seller_id: 'test-user-1',
    status: 'active' as const,
    is_promoted: false,
    seller: {
      id: 'test-user-1',
      name: 'Айбек Продавец',
      phone: '+996555123456',
      avatar_url: 'https://i.pravatar.cc/150?img=1',
      is_verified: true,
      rating: 4.8
    },
    details: {
      brand: 'Toyota',
      model: 'Camry',
      year: 2020,
      mileage: 45000,
      color: 'Белый',
      transmission: 'automatic' as const,
      fuel_type: 'gasoline' as const
    },
    ai_score: 0.85,
    boost_level: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    category: 'car' as const,
    title: 'BMW X5 2019',
    description: 'Премиум класс, полный привод',
    price: 4500000,
    video_id: 'test-video-2',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail_url: 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=BMW+X5',
    views: 200,
    likes: 28,
    saves: 8,
    shares: 12,
    messages_count: 5,
    seller_id: 'test-user-2',
    status: 'active' as const,
    is_promoted: false,
    seller: {
      id: 'test-user-2',
      name: 'Нурлан Автодилер',
      phone: '+996555654321',
      avatar_url: 'https://i.pravatar.cc/150?img=2',
      is_verified: true,
      rating: 4.9
    },
    details: {
      brand: 'BMW',
      model: 'X5',
      year: 2019,
      mileage: 32000,
      color: 'Черный',
      transmission: 'automatic' as const,
      fuel_type: 'gasoline' as const
    },
    ai_score: 0.92,
    boost_level: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    category: 'horse' as const,
    title: 'Арабская лошадь',
    description: 'Чистокровная арабская лошадь',
    price: 1500000,
    video_id: 'test-video-3',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: 'https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Arabian+Horse',
    views: 80,
    likes: 12,
    saves: 2,
    shares: 3,
    messages_count: 1,
    seller_id: 'test-user-3',
    status: 'active' as const,
    is_promoted: false,
    seller: {
      id: 'test-user-3',
      name: 'Айгуль Коннозаводчик',
      phone: '+996555789012',
      avatar_url: 'https://i.pravatar.cc/150?img=3',
      is_verified: true,
      rating: 4.7
    },
    details: {
      breed: 'Арабская',
      age: 5,
      color: 'Гнедая',
      height: 160,
      gender: 'Кобыла'
    },
    ai_score: 0.78,
    boost_level: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    category: 'real_estate' as const,
    title: 'Квартира в центре Бишкека',
    description: '3-комнатная квартира в новом доме',
    price: 8000000,
    video_id: 'test-video-4',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail_url: 'https://via.placeholder.com/400x300/96CEB4/FFFFFF?text=Apartment',
    views: 150,
    likes: 20,
    saves: 5,
    shares: 8,
    messages_count: 3,
    seller_id: 'test-user-4',
    status: 'active' as const,
    is_promoted: false,
    seller: {
      id: 'test-user-4',
      name: 'Элмира Риелтор',
      phone: '+996555345678',
      avatar_url: 'https://i.pravatar.cc/150?img=4',
      is_verified: true,
      rating: 4.6
    },
    details: {
      property_type: 'Квартира',
      rooms: 3,
      area: 85,
      floor: 5,
      total_floors: 9,
      city: 'Бишкек'
    },
    ai_score: 0.88,
    boost_level: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const FALLBACK_USER = {
  id: 'test-user-1',
  name: 'Тестовый Пользователь',
  phone: '+996555123456',
  avatar_url: 'https://i.pravatar.cc/150?img=1',
  is_verified: true,
  rating: 4.8,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const FALLBACK_BUSINESS = {
  id: 'test-business-1',
  user_id: 'test-user-1',
  business_name: 'Тестовый Автодилер',
  description: 'Продажа качественных автомобилей',
  logo_url: 'https://via.placeholder.com/100x100/FF6B6B/FFFFFF?text=TA',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Функция для получения fallback данных
export const getFallbackData = (type: 'listings' | 'user' | 'business') => {
  switch (type) {
    case 'listings':
      return FALLBACK_LISTINGS;
    case 'user':
      return FALLBACK_USER;
    case 'business':
      return FALLBACK_BUSINESS;
    default:
      return null;
  }
};
