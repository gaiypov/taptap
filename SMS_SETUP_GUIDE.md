# 📱 Настройка реального SMS провайдера Nikita.kg

## 🔑 Получение API ключей:

1. **Зарегистрируйтесь на [smspro.nikita.kg](https://smspro.nikita.kg/myProfile.jsp)**
2. **Получите логин и пароль** от администратора
3. **Добавьте имя отправителя** "360Auto" в профиле
4. **Пополните счет** через Pay24 или ЭЛСОМ

## ⚙️ Настройка переменных окружения:

### **Создайте файл `.env` в корне проекта:**
```env
# SMS API настройки для Nikita.kg
EXPO_PUBLIC_SMS_LOGIN=ваш_логин_от_nikita
EXPO_PUBLIC_SMS_PASSWORD=ваш_пароль_от_nikita
EXPO_PUBLIC_SMS_SENDER=360Auto
EXPO_PUBLIC_SMS_API_URL=https://smspro.nikita.kg/api/message
```

### **Пример:**
```env
EXPO_PUBLIC_SMS_LOGIN=mycompany
EXPO_PUBLIC_SMS_PASSWORD=mypassword123
EXPO_PUBLIC_SMS_SENDER=360Auto
EXPO_PUBLIC_SMS_API_URL=https://smspro.nikita.kg/api/message
```

## 🔧 Обновление кода:

Теперь обновлю SMS сервис для работы с реальным API:
