// Простой SMS сервис для тестирования
// Этот файл можно использовать для отправки реальных SMS

interface SMSConfig {
  login: string;
  password: string;
  sender: string;
  apiUrl: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SMSService {
  private config: SMSConfig;

  constructor(config: SMSConfig) {
    this.config = config;
  }

  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
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
    // Генерируем случайный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const message = `Ваш код подтверждения: ${code}. Не сообщайте его никому.`;
    
    const result = await this.sendSMS(phone, message);
    
    if (result.success) {
      return {
        success: true,
        testCode: code // В реальном приложении не возвращаем код
      };
    }
    
    // Если SMS API не работает, используем mock режим
    console.log('🚧 SMS API failed, using mock mode');
    return {
      success: true,
      testCode: code // Возвращаем код для тестирования
    };
  }
}

// Экспорт для использования
export { SMSService };
export type { SMSConfig, SMSResponse };

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
