export const ru = {
  // Onboarding
  onboarding: {
    welcome: {
      title: 'Продай за 60 секунд',
      subtitle: 'Снимай видео → Листай ленту → Продавай быстро',
      button: 'Начать',
      skip: 'Пропустить',
    },
    permissions: {
      title: 'Разрешения',
      subtitle: 'Для лучшего опыта нам нужны:',
      location: {
        title: 'Геолокация',
        description: 'Показываем объявления рядом с вами',
        button: 'Разрешить геолокацию',
      },
      notifications: {
        title: 'Уведомления',
        description: 'Узнавайте о новых сообщениях и лайках',
        button: 'Разрешить уведомления',
      },
      skip: 'Пропустить',
      continue: 'Продолжить',
    },
    language: {
      title: 'Выберите язык',
      subtitle: 'Вы всегда сможете изменить это в настройках',
    },
  },

  // Auth
  auth: {
    login: {
      title: 'Войдите в 360°',
      subtitle: 'Чтобы писать продавцам и создавать объявления',
      phonePlaceholder: '+996 ___ ___ ___',
      buttonGetCode: 'Получить код',
      buttonVerify: 'Войти',
      codeSent: 'Код отправлен на',
      resendCode: 'Отправить ещё раз',
      resendTimer: 'через {{seconds}} сек',
      legal: 'Нажимая кнопку, вы соглашаетесь с',
      terms: 'условиями использования',
      privacy: 'политикой конфиденциальности',
      and: 'и',
    },
    errors: {
      invalidPhone: 'Неверный формат номера',
      invalidCode: 'Неверный код',
      tooManyRequests: 'Слишком много попыток. Попробуйте через минуту',
      networkError: 'Ошибка сети. Проверьте соединение',
    },
    triggers: {
      like: 'Войдите, чтобы сохранить избранное',
      comment: 'Войдите, чтобы оставлять комментарии',
      message: 'Войдите, чтобы писать продавцам',
      create: 'Войдите, чтобы создавать объявления',
    },
  },

  // Feed
  feed: {
    title: 'Главная',
    sold: 'Продано',
    likeToSave: 'Нравится? Войдите, чтобы сохранить',
    messageToContact: 'Войдите, чтобы написать продавцу',
  },

  // Actions
  actions: {
    like: 'Нравится',
    comment: 'Комментарий',
    share: 'Поделиться',
    message: 'Написать',
    call: 'Позвонить',
    favorite: 'В избранное',
  },

  // Common
  common: {
    cancel: 'Отмена',
    continue: 'Продолжить',
    save: 'Сохранить',
    delete: 'Удалить',
    edit: 'Редактировать',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    som: 'сом',
    granted: 'Разрешено',
  },

  // Categories
  categories: {
    car: 'Автомобиль',
    horse: 'Лошадь',
    realty: 'Недвижимость',
  },
};

// Гибкий тип для всех переводов (не строгие литералы)
export type Translations = {
  onboarding: {
    welcome: {
      title: string;
      subtitle: string;
      button: string;
      skip: string;
    };
    permissions: {
      title: string;
      subtitle: string;
      location: {
        title: string;
        description: string;
        button: string;
      };
      notifications: {
        title: string;
        description: string;
        button: string;
      };
      skip: string;
      continue: string;
    };
    language: {
      title: string;
      subtitle: string;
    };
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      phonePlaceholder: string;
      buttonGetCode: string;
      buttonVerify: string;
      codeSent: string;
      resendCode: string;
      resendTimer: string;
      legal: string;
      terms: string;
      privacy: string;
      and: string;
    };
    errors: {
      invalidPhone: string;
      invalidCode: string;
      tooManyRequests: string;
      networkError: string;
    };
    triggers: {
      like: string;
      comment: string;
      message: string;
      create: string;
    };
  };
  feed: {
    title: string;
    sold: string;
    likeToSave: string;
    messageToContact: string;
  };
  actions: {
    like: string;
    comment: string;
    share: string;
    message: string;
    call: string;
    favorite: string;
  };
  common: {
    cancel: string;
    continue: string;
    save: string;
    delete: string;
    edit: string;
    loading: string;
    error: string;
    success: string;
    som: string;
    granted: string;
  };
  categories: {
    car: string;
    horse: string;
    realty: string;
  };
};

