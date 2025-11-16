import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Пользовательское соглашение</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ</Text>
        <Text style={styles.subtitle}>Мобильное приложение &ldquo;360Auto&ldquo;</Text>
        <Text style={styles.date}>Дата вступления в силу: 12 октября 2025 г.</Text>

        {/* Раздел 1 */}
        <Text style={styles.sectionTitle}>1. ОБЩИЕ ПОЛОЖЕНИЯ</Text>
        <Text style={styles.paragraph}>
          1.1. Настоящее Пользовательское соглашение (далее - &ldquo;Соглашение&ldquo;) регулирует отношения между 
          Общество с ограниченной ответственностью &ldquo;Супер Апп&ldquo; (ОСОО &ldquo;Супер Апп&ldquo;), ИНН 01905202010099, 
          регистрационный номер 190615-3301-ООО (далее - &ldquo;Администрация&ldquo;), и пользователем мобильного 
          приложения &ldquo;360Auto&ldquo; (далее - &ldquo;Приложение&ldquo;).
        </Text>
        <Text style={styles.paragraph}>
          1.2. Приложение представляет собой онлайн-платформу для размещения объявлений о продаже 
          автомобилей на территории Кыргызской Республики.
        </Text>
        <Text style={styles.paragraph}>
          1.3. Использование Приложения регулируется настоящим Соглашением и законодательством 
          Кыргызской Республики, включая, но не ограничиваясь: Гражданским кодексом КР, 
          Законом КР &ldquo;Об информации персонального характера&ldquo; от 14.04.2008 № 58, 
          Законом КР &ldquo;О защите прав потребителей&ldquo;.
        </Text>
        <Text style={styles.paragraph}>
          1.4. Регистрируясь и используя Приложение, Пользователь подтверждает, что ознакомился, 
          понял и принимает все условия настоящего Соглашения.
        </Text>

        {/* Раздел 2 */}
        <Text style={styles.sectionTitle}>2. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ</Text>
        <Text style={styles.paragraph}>
          2.1. <Text style={styles.bold}>Приложение</Text> - мобильное приложение &ldquo;360Auto&ldquo;, 
          предназначенное для размещения и просмотра объявлений о продаже автомобилей.
        </Text>
        <Text style={styles.paragraph}>
          2.2. <Text style={styles.bold}>Пользователь</Text> - физическое или юридическое лицо, 
          использующее Приложение.
        </Text>
        <Text style={styles.paragraph}>
          2.3. <Text style={styles.bold}>Продавец</Text> - Пользователь, размещающий объявления 
          о продаже автомобилей.
        </Text>
        <Text style={styles.paragraph}>
          2.4. <Text style={styles.bold}>Покупатель</Text> - Пользователь, просматривающий объявления 
          с целью покупки автомобиля.
        </Text>
        <Text style={styles.paragraph}>
          2.5. <Text style={styles.bold}>Контент</Text> - информация, размещаемая Пользователями 
          в Приложении, включая тексты, фотографии, видео.
        </Text>

        {/* Раздел 3 */}
        <Text style={styles.sectionTitle}>3. РЕГИСТРАЦИЯ И УЧЕТНАЯ ЗАПИСЬ</Text>
        <Text style={styles.paragraph}>
          3.1. Для использования функций Приложения Пользователь должен пройти регистрацию, 
          указав номер мобильного телефона.
        </Text>
        <Text style={styles.paragraph}>
          3.2. Пользователь гарантирует достоверность предоставленной информации и обязуется 
          своевременно обновлять её при изменении.
        </Text>
        <Text style={styles.paragraph}>
          3.3. Пользователь несет ответственность за сохранность своих данных для входа в Приложение 
          и за все действия, совершенные с использованием его учетной записи.
        </Text>
        <Text style={styles.paragraph}>
          3.4. При обнаружении несанкционированного доступа к учетной записи Пользователь обязан 
          незамедлительно уведомить Администрацию.
        </Text>
        <Text style={styles.paragraph}>
          3.5. Для регистрации в Приложении Пользователь должен быть не моложе 18 лет или иметь 
          согласие законного представителя.
        </Text>

        {/* Раздел 4 */}
        <Text style={styles.sectionTitle}>4. РАЗМЕЩЕНИЕ ОБЪЯВЛЕНИЙ</Text>
        <Text style={styles.paragraph}>
          4.1. Продавец имеет право размещать объявления о продаже принадлежащих ему автомобилей.
        </Text>
        <Text style={styles.paragraph}>
          4.2. Объявление должно содержать достоверную информацию об автомобиле, включая марку, 
          модель, год выпуска, пробег, техническое состояние, цену.
        </Text>
        <Text style={styles.paragraph}>
          4.3. Продавец обязуется загружать только собственные фотографии и видео автомобиля.
        </Text>
        <Text style={styles.paragraph}>
          4.4. Запрещается размещение объявлений о продаже:
          {'\n'}• Автомобилей, находящихся в розыске или под арестом
          {'\n'}• Автомобилей с поддельными документами
          {'\n'}• Автомобилей, не принадлежащих Продавцу на законных основаниях
        </Text>
        <Text style={styles.paragraph}>
          4.5. Администрация оставляет за собой право удалить объявление без объяснения причин 
          в случае нарушения настоящего Соглашения или законодательства КР.
        </Text>

        {/* Раздел 5 */}
        <Text style={styles.sectionTitle}>5. ПРАВА И ОБЯЗАННОСТИ ПОЛЬЗОВАТЕЛЕЙ</Text>
        <Text style={styles.paragraph}>
          5.1. Пользователь имеет право:
          {'\n'}• Просматривать объявления других Пользователей
          {'\n'}• Размещать собственные объявления
          {'\n'}• Общаться с другими Пользователями через встроенный чат
          {'\n'}• Сохранять понравившиеся объявления
          {'\n'}• Оставлять комментарии
        </Text>
        <Text style={styles.paragraph}>
          5.2. Пользователь обязуется:
          {'\n'}• Соблюдать законодательство Кыргызской Республики
          {'\n'}• Не нарушать права третьих лиц
          {'\n'}• Не размещать оскорбительный контент
          {'\n'}• Не использовать Приложение в мошеннических целях
          {'\n'}• Не распространять спам и рекламу
        </Text>

        {/* Раздел 6 */}
        <Text style={styles.sectionTitle}>6. ОТВЕТСТВЕННОСТЬ</Text>
        <Text style={styles.paragraph}>
          6.1. Администрация не несет ответственности за:
          {'\n'}• Достоверность информации, размещенной Пользователями
          {'\n'}• Качество и состояние автомобилей, представленных в объявлениях
          {'\n'}• Сделки между Пользователями
          {'\n'}• Действия или бездействие Пользователей
        </Text>
        <Text style={styles.paragraph}>
          6.2. Администрация выступает исключительно в роли технической платформы для размещения 
          объявлений и не является стороной сделок между Пользователями.
        </Text>
        <Text style={styles.paragraph}>
          6.3. Пользователь самостоятельно несет ответственность за:
          {'\n'}• Достоверность размещаемой информации
          {'\n'}• Соблюдение законодательства КР
          {'\n'}• Сделки, совершаемые с использованием Приложения
        </Text>
        <Text style={styles.paragraph}>
          6.4. В случае нарушения настоящего Соглашения Администрация имеет право:
          {'\n'}• Удалить объявление Пользователя
          {'\n'}• Заблокировать учетную запись Пользователя
          {'\n'}• Передать информацию правоохранительным органам
        </Text>

        {/* Раздел 7 */}
        <Text style={styles.sectionTitle}>7. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ</Text>
        <Text style={styles.paragraph}>
          7.1. Все права на Приложение, включая программный код, дизайн, логотипы, 
          принадлежат ОСОО &ldquo;Супер Апп&ldquo;.
        </Text>
        <Text style={styles.paragraph}>
          7.2. Пользователь сохраняет все права на размещаемый им Контент.
        </Text>
        <Text style={styles.paragraph}>
          7.3. Размещая Контент в Приложении, Пользователь предоставляет Администрации 
          неисключительное право использовать данный Контент в целях функционирования Приложения.
        </Text>

        {/* Раздел 8 */}
        <Text style={styles.sectionTitle}>8. ПЕРСОНАЛЬНЫЕ ДАННЫЕ</Text>
        <Text style={styles.paragraph}>
          8.1. Обработка персональных данных Пользователей осуществляется в соответствии с 
          Политикой конфиденциальности и Законом КР &ldquo;Об информации персонального характера&ldquo;.
        </Text>
        <Text style={styles.paragraph}>
          8.2. Регистрируясь в Приложении, Пользователь дает согласие на обработку своих 
          персональных данных.
        </Text>

        {/* Раздел 9 */}
        <Text style={styles.sectionTitle}>9. ИЗМЕНЕНИЕ УСЛОВИЙ</Text>
        <Text style={styles.paragraph}>
          9.1. Администрация имеет право в любое время вносить изменения в настоящее Соглашение.
        </Text>
        <Text style={styles.paragraph}>
          9.2. Новая редакция Соглашения вступает в силу с момента размещения в Приложении.
        </Text>
        <Text style={styles.paragraph}>
          9.3. Продолжение использования Приложения после внесения изменений означает принятие 
          новых условий.
        </Text>

        {/* Раздел 10 */}
        <Text style={styles.sectionTitle}>10. РАЗРЕШЕНИЕ СПОРОВ</Text>
        <Text style={styles.paragraph}>
          10.1. Все споры и разногласия решаются путем переговоров.
        </Text>
        <Text style={styles.paragraph}>
          10.2. В случае невозможности достижения согласия споры рассматриваются в судебных 
          органах Кыргызской Республики по месту нахождения Администрации.
        </Text>
        <Text style={styles.paragraph}>
          10.3. К настоящему Соглашению применяется законодательство Кыргызской Республики.
        </Text>

        {/* Раздел 11 */}
        <Text style={styles.sectionTitle}>11. КОНТАКТНАЯ ИНФОРМАЦИЯ</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Администрация Приложения:</Text>
          {'\n\n'}Общество с ограниченной ответственностью &ldquo;Супер Апп&ldquo;
          {'\n'}ИНН: 01905202010099
          {'\n'}Регистрационный номер: 190615-3301-ООО
          {'\n'}ОКПО: 30720909
          {'\n\n'}Юридический адрес:
          {'\n'}Кыргызская Республика, г. Бишкек, Октябрьский район,
          {'\n'}5 микрорайон, дом 63, квартира 28
          {'\n\n'}Директор: Гайыпов Уланбек Кимсанович
          {'\n\n'}Контакты для связи:
          {'\n'}Email: ulan495@me.com
          {'\n'}Телефон: +996 779 728 888
          {'\n\n'}Режим работы: Пн-Пт, 9:00-18:00 (GMT+6)
        </Text>

        {/* Заключение */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Используя Приложение &ldquo;360Auto&ldquo;, вы подтверждаете, что прочитали, поняли и 
            согласны с условиями настоящего Пользовательского соглашения.
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

