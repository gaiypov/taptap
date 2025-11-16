/**
 * SMS Service для отправки реальных SMS через smspro.nikita.kg API
 * Поддерживает режим mock для тестирования
 */

export interface SMSConfig {
  login: string;
  password: string;
  sender: string;
  apiUrl: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  info?: string;
}

export class SMSService {
  private config: SMSConfig;
  private isMockMode: boolean;

  constructor(config: SMSConfig) {
    this.config = config;
    // Проверяем, есть ли реальные credentials для определения режима
    this.isMockMode = !config.login || !config.password || 
                      config.login === 'test' || config.password === 'test' ||
                      process.env.EXPO_PUBLIC_SMS_TEST_MODE === 'true';
  }

  /**
   * Отправка SMS
   * В mock режиме только логирует сообщение
   * В реальном режиме отправляет через API
   */
  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
    // Mock режим для тестирования
    if (this.isMockMode) {
      console.log(`🧪 Mock SMS sent to ${phone}: ${message}`);
      return {
        success: true,
        info: 'Mock SMSService used (dev/test mode)',
        messageId: `mock-${Date.now()}`,
      };
    }

    // Реальный режим - отправка через API
    try {
      // Для smspro.nikita.kg API
      const requestBody = {
        login: this.config.login,
        password: this.config.password,
        phones: phone,
        message: message,
        sender: this.config.sender
      };

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // Проверяем статус ответа
      if (!response.ok) {
        const errorText = await response.text();
        console.error('SMS API error response:', errorText);
        return {
          success: false,
          error: `SMS API error: ${response.status} ${response.statusText}`
        };
      }

      // Проверяем Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('SMS API returned non-JSON:', errorText);
        
        // Если это XML ответ, попробуем его обработать
        if (errorText.includes('<?xml') && errorText.includes('<response>')) {
          try {
            // Простая обработка XML ответа
            const idMatch = errorText.match(/<id>(\d+)<\/id>/);
            const statusMatch = errorText.match(/<status>(\d+)<\/status>/);
            
            if (statusMatch && statusMatch[1] === '1') {
              return {
                success: true,
                messageId: idMatch ? idMatch[1] : 'unknown'
              };
            } else {
              return {
                success: false,
                error: 'SMS API returned error status'
              };
            }
          } catch (xmlError) {
            console.error('Error parsing XML response:', xmlError);
          }
        }
        
        return {
          success: false,
          error: 'SMS API returned invalid response format'
        };
      }

      const data = await response.json();

      if (data.error || data.status === 'error') {
        return {
          success: false,
          error: data.error || data.message || 'SMS sending failed'
        };
      }

      return {
        success: true,
        messageId: data.id || data.messageId
      };
    } catch (error: any) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendVerificationCode(phone: string): Promise<{
    success: boolean;
    testCode?: string;
    error?: string;
  }> {
    // Этот метод теперь не используется напрямую
    // Frontend должен использовать /api/auth/request-code для отправки кода
    // Код отправки перенесен на backend
    
    // Возвращаем ошибку, чтобы использовать только backend API
    return {
      success: false,
      error: 'Use backend API endpoint /api/auth/request-code instead'
    };
  }
}

// Экспорты уже объявлены выше через export class и export interface

// Пример использования:
/*
const smsService = new SMSService({
  login: 'your_login',
  password: 'your_password', 
  sender: '360Auto',
  apiUrl: 'https://api.smsc.kz/send/'
});

// Отправка SMS
const result = await smsService.sendSMS('+996555123456', 'Тестовое сообщение');

// Отправка кода подтверждения
const codeResult = await smsService.sendVerificationCode('+996555123456');
*/
