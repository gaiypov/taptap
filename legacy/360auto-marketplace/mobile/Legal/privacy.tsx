import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Политика конфиденциальности</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</Text>
        <Text style={styles.subtitle}>Мобильное приложение &ldquo;360Auto&ldquo;</Text>
        <Text style={styles.date}>Дата вступления в силу: 12 октября 2025 г.</Text>

        {/* Раздел 1 */}
        <Text style={styles.sectionTitle}>1. ОБЩИЕ ПОЛОЖЕНИЯ</Text>
        <Text style={styles.paragraph}>
          1.1. Настоящая Политика конфиденциальности (далее - &ldquo;Политика&ldquo;) определяет порядок обработки 
          персональных данных пользователей мобильного приложения &ldquo;360Auto&ldquo; (далее - &ldquo;Приложение&ldquo;).
        </Text>
        <Text style={styles.paragraph}>
          1.2. Оператором персональных данных является Общество с ограниченной ответственностью 
          &ldquo;Супер Апп&ldquo; (ОСОО &ldquo;Супер Апп&ldquo;), ИНН 01905202010099, расположенное по адресу: 
          Кыргызская Республика, г. Бишкек, Октябрьский район, 5 мкрн, д. 63, кв. 28.
        </Text>
        <Text style={styles.paragraph}>
          1.3. Обработка персональных данных осуществляется в соответствии с:
          {'\n'}• Конституцией Кыргызской Республики
          {'\n'}• Законом КР &ldquo;Об информации персонального характера&ldquo; от 14.04.2008 № 58
          {'\n'}• Гражданским кодексом КР
          {'\n'}• Иными нормативными правовыми актами КР
        </Text>

        {/* Раздел 2 */}
        <Text style={styles.sectionTitle}>2. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ</Text>
        <Text style={styles.paragraph}>
          2.1. <Text style={styles.bold}>Персональные данные</Text> - любая информация, 
          относящаяся к прямо или косвенно определенному или определяемому физическому лицу 
          (субъекту персональных данных).
        </Text>
        <Text style={styles.paragraph}>
          2.2. <Text style={styles.bold}>Обработка персональных данных</Text> - любое действие 
          (операция) или совокупность действий (операций), совершаемых с использованием средств 
          автоматизации или без использования таких средств с персональными данными.
        </Text>
        <Text style={styles.paragraph}>
          2.3. <Text style={styles.bold}>Конфиденциальность персональных данных</Text> - 
          обязательное для соблюдения Оператором требование не допускать распространение 
          персональных данных без согласия субъекта.
        </Text>

        {/* Раздел 3 */}
        <Text style={styles.sectionTitle}>3. КАКИЕ ДАННЫЕ МЫ СОБИРАЕМ</Text>
        <Text style={styles.paragraph}>
          3.1. <Text style={styles.bold}>Данные, предоставляемые пользователем:</Text>
          {'\n'}• Номер мобильного телефона
          {'\n'}• Имя и фамилия
          {'\n'}• Адрес электронной почты (опционально)
          {'\n'}• Фотография профиля (опционально)
        </Text>
        <Text style={styles.paragraph}>
          3.2. <Text style={styles.bold}>Данные об автомобилях:</Text>
          {'\n'}• Марка, модель, год выпуска
          {'\n'}• Пробег, цена
          {'\n'}• Фотографии и видео автомобиля
          {'\n'}• Описание и технические характеристики
        </Text>
        <Text style={styles.paragraph}>
          3.3. <Text style={styles.bold}>Автоматически собираемые данные:</Text>
          {'\n'}• IP-адрес
          {'\n'}• Тип устройства и операционная система
          {'\n'}• Уникальный идентификатор устройства
          {'\n'}• Дата и время использования Приложения
          {'\n'}• Информация о просмотренных объявлениях
          {'\n'}• История поиска и взаимодействий
        </Text>
        <Text style={styles.paragraph}>
          3.4. <Text style={styles.bold}>Данные о местоположении:</Text>
          {'\n'}• Геолокация (при наличии согласия пользователя)
          {'\n'}• Регион, указанный пользователем
        </Text>

        {/* Раздел 4 */}
        <Text style={styles.sectionTitle}>4. ЦЕЛИ ОБРАБОТКИ ДАННЫХ</Text>
        <Text style={styles.paragraph}>
          4.1. Персональные данные обрабатываются в следующих целях:
          {'\n'}• Регистрация и идентификация пользователя
          {'\n'}• Предоставление доступа к функциям Приложения
          {'\n'}• Размещение объявлений о продаже автомобилей
          {'\n'}• Обеспечение коммуникации между пользователями
          {'\n'}• Отправка уведомлений и важной информации
          {'\n'}• Улучшение качества услуг
          {'\n'}• Защита от мошенничества
          {'\n'}• Соблюдение законодательства КР
        </Text>

        {/* Раздел 5 */}
        <Text style={styles.sectionTitle}>5. ПРАВОВЫЕ ОСНОВАНИЯ ОБРАБОТКИ</Text>
        <Text style={styles.paragraph}>
          5.1. Обработка персональных данных осуществляется на основании:
          {'\n'}• Согласия субъекта персональных данных
          {'\n'}• Необходимости исполнения договора (Пользовательского соглашения)
          {'\n'}• Законодательства Кыргызской Республики
        </Text>

        {/* Раздел 6 */}
        <Text style={styles.sectionTitle}>6. СПОСОБЫ ОБРАБОТКИ ДАННЫХ</Text>
        <Text style={styles.paragraph}>
          6.1. Обработка персональных данных осуществляется с использованием средств автоматизации 
          и без использования таких средств.
        </Text>
        <Text style={styles.paragraph}>
          6.2. Персональные данные хранятся на защищенных серверах с применением современных 
          технологий шифрования.
        </Text>
        <Text style={styles.paragraph}>
          6.3. Оператор принимает необходимые правовые, организационные и технические меры для 
          защиты персональных данных от неправомерного доступа, уничтожения, изменения, блокирования.
        </Text>

        {/* Раздел 7 */}
        <Text style={styles.sectionTitle}>7. ПЕРЕДАЧА ДАННЫХ ТРЕТЬИМ ЛИЦАМ</Text>
        <Text style={styles.paragraph}>
          7.1. Персональные данные могут быть переданы третьим лицам в следующих случаях:
          {'\n'}• При наличии согласия пользователя
          {'\n'}• Для исполнения договора с пользователем
          {'\n'}• По требованию уполномоченных государственных органов КР
          {'\n'}• Для обработки платежей (платежным системам)
          {'\n'}• Для отправки SMS (провайдеру SMS-услуг)
          {'\n'}• Для хранения и обработки видео (api.video)
        </Text>
        <Text style={styles.paragraph}>
          7.2. Оператор гарантирует, что третьи лица обязуются соблюдать конфиденциальность 
          и обеспечивать безопасность персональных данных.
        </Text>

        {/* Раздел 8 */}
        <Text style={styles.sectionTitle}>8. ПРАВА СУБЪЕКТОВ ПЕРСОНАЛЬНЫХ ДАННЫХ</Text>
        <Text style={styles.paragraph}>
          8.1. Субъект персональных данных имеет право:
          {'\n'}• Получать информацию об обработке своих персональных данных
          {'\n'}• Требовать уточнения своих персональных данных
          {'\n'}• Требовать удаления своих персональных данных
          {'\n'}• Отозвать согласие на обработку персональных данных
          {'\n'}• Обжаловать действия или бездействие Оператора
        </Text>
        <Text style={styles.paragraph}>
          8.2. Для реализации своих прав субъект может обратиться к Оператору по адресу электронной 
          почты: ulan495@me.com или по телефону: +996 779 728 888.
        </Text>
        <Text style={styles.paragraph}>
          8.3. Срок рассмотрения обращения - не более 30 календарных дней.
        </Text>

        {/* Раздел 9 */}
        <Text style={styles.sectionTitle}>9. СРОК ХРАНЕНИЯ ДАННЫХ</Text>
        <Text style={styles.paragraph}>
          9.1. Персональные данные хранятся в течение срока, необходимого для достижения целей 
          обработки, но не менее срока, установленного законодательством КР.
        </Text>
        <Text style={styles.paragraph}>
          9.2. При удалении учетной записи персональные данные удаляются в течение 30 дней, 
          за исключением данных, хранение которых требуется законодательством КР.
        </Text>

        {/* Раздел 10 */}
        <Text style={styles.sectionTitle}>10. COOKIES И АНАЛИТИКА</Text>
        <Text style={styles.paragraph}>
          10.1. Приложение использует технологии, аналогичные cookies, для улучшения работы 
          и анализа поведения пользователей.
        </Text>
        <Text style={styles.paragraph}>
          10.2. Собираемая информация используется для:
          {'\n'}• Аутентификации пользователя
          {'\n'}• Сохранения настроек и предпочтений
          {'\n'}• Анализа использования Приложения
          {'\n'}• Улучшения функциональности
        </Text>

        {/* Раздел 11 */}
        <Text style={styles.sectionTitle}>11. БЕЗОПАСНОСТЬ ДАННЫХ</Text>
        <Text style={styles.paragraph}>
          11.1. Оператор применяет следующие меры безопасности:
          {'\n'}• Шифрование данных при передаче (SSL/TLS)
          {'\n'}• Защищенное хранение данных
          {'\n'}• Ограничение доступа к персональным данным
          {'\n'}• Регулярное резервное копирование
          {'\n'}• Мониторинг безопасности
        </Text>
        <Text style={styles.paragraph}>
          11.2. Пользователь обязан обеспечить конфиденциальность своих данных для входа в Приложение.
        </Text>

        {/* Раздел 12 */}
        <Text style={styles.sectionTitle}>12. ИЗМЕНЕНИЕ ПОЛИТИКИ</Text>
        <Text style={styles.paragraph}>
          12.1. Оператор имеет право вносить изменения в настоящую Политику.
        </Text>
        <Text style={styles.paragraph}>
          12.2. Новая редакция Политики вступает в силу с момента её размещения в Приложении.
        </Text>
        <Text style={styles.paragraph}>
          12.3. Пользователь обязан самостоятельно проверять Политику на предмет изменений.
        </Text>

        {/* Раздел 13 */}
        <Text style={styles.sectionTitle}>13. КОНТАКТНАЯ ИНФОРМАЦИЯ</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Оператор персональных данных:</Text>
          {'\n\n'}Общество с ограниченной ответственностью &ldquo;Супер Апп&ldquo;
          {'\n'}ИНН: 01905202010099
          {'\n'}Регистрационный номер: 190615-3301-ООО
          {'\n'}ОКПО: 30720909
          {'\n\n'}Юридический адрес:
          {'\n'}Кыргызская Республика, г. Бишкек, Октябрьский район,
          {'\n'}5 микрорайон, дом 63, квартира 28
          {'\n\n'}Директор: Гайыпов Уланбек Кимсанович
          {'\n\n'}Контакты для обращений по вопросам персональных данных:
          {'\n'}Email: ulan495@me.com
          {'\n'}Телефон: +996 779 728 888
          {'\n\n'}Режим работы: Пн-Пт, 9:00-18:00 (GMT+6)
        </Text>

        {/* Заключение */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Используя Приложение &ldquo;360Auto&ldquo;, вы подтверждаете, что прочитали и согласны 
            с настоящей Политикой конфиденциальности.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
  },
  footer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 32,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

