import { regionalFunctions } from '../firebase';

// Type definitions matching backend
interface RegisterFcmTokenRequest {
  deviceId: string;
  fcmToken: string;
  platform: 'android' | 'ios';
  appVersion: string;
  notificationsEnabled: boolean;
}

interface RegisterFcmTokenResponse {
  ok: boolean;
  updated: boolean;
}

interface SetNotificationPreferenceRequest {
  deviceId: string;
  enabled: boolean;
}

interface SetNotificationPreferenceResponse {
  ok: boolean;
}

interface GetNotificationPreferenceRequest {
  deviceId: string;
}

interface GetNotificationPreferenceResponse {
  ok: boolean;
  exists: boolean;
  notificationsEnabled: boolean | null;
}

interface TouchLastSeenRequest {
  deviceId: string;
}

interface TouchLastSeenResponse {
  ok: boolean;
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  functionName: string,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`📞 Calling ${functionName} (attempt ${attempt + 1}/${maxRetries})...`);
      const result = await fn();
      console.log(`✅ ${functionName} succeeded:`, result);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`❌ ${functionName} failed (attempt ${attempt + 1}/${maxRetries}):`, {
        code: error?.code,
        message: error?.message,
        details: error?.details,
      });
      
      // Don't retry on invalid-argument errors
      if (error?.code === 'functions/invalid-argument') {
        console.error(`🚫 ${functionName}: Invalid argument - not retrying`);
        throw error;
      }
      
      // Don't retry on permission-denied errors
      if (error?.code === 'functions/permission-denied') {
        console.error(`🚫 ${functionName}: Permission denied (App Check?) - not retrying`);
        throw error;
      }
      
      // Last attempt - throw error
      if (attempt === maxRetries - 1) {
        console.error(`🚫 ${functionName}: All retries exhausted`);
        break;
      }
      
      // Calculate delay with jitter
      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * delay * 0.3;
      const totalDelay = Math.round(delay + jitter);
      console.log(`⏳ Waiting ${totalDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError;
}

class FcmTokenApi {
  /**
   * Register or update FCM token
   */
  async registerFcmToken(data: RegisterFcmTokenRequest): Promise<RegisterFcmTokenResponse> {
    console.log('🔑 registerFcmToken called with:', {
      deviceId: data.deviceId.substring(0, 8) + '...',
      platform: data.platform,
      appVersion: data.appVersion,
      notificationsEnabled: data.notificationsEnabled,
    });
    
    return retryWithBackoff(async () => {
      const callable = regionalFunctions.httpsCallable('registerFcmToken');
      const result = await callable(data);
      return result.data as RegisterFcmTokenResponse;
    }, 'registerFcmToken');
  }

  /**
   * Set notification preference
   */
  async setNotificationPreference(data: SetNotificationPreferenceRequest): Promise<SetNotificationPreferenceResponse> {
    console.log('🔔 setNotificationPreference called:', {
      deviceId: data.deviceId.substring(0, 8) + '...',
      enabled: data.enabled,
    });
    
    return retryWithBackoff(async () => {
      const callable = regionalFunctions.httpsCallable('setNotificationPreference');
      const result = await callable(data);
      return result.data as SetNotificationPreferenceResponse;
    }, 'setNotificationPreference');
  }

  /**
   * Get notification preference
   */
  async getNotificationPreference(data: GetNotificationPreferenceRequest): Promise<GetNotificationPreferenceResponse> {
    console.log('📖 getNotificationPreference called:', {
      deviceId: data.deviceId.substring(0, 8) + '...',
    });
    
    return retryWithBackoff(async () => {
      const callable = regionalFunctions.httpsCallable('getNotificationPreference');
      const result = await callable(data);
      return result.data as GetNotificationPreferenceResponse;
    }, 'getNotificationPreference');
  }

  /**
   * Touch lastSeen timestamp
   */
  async touchLastSeen(data: TouchLastSeenRequest): Promise<TouchLastSeenResponse> {
    console.log('👆 touchLastSeen called:', {
      deviceId: data.deviceId.substring(0, 8) + '...',
    });
    
    // Don't retry this one as aggressively - it's not critical
    try {
      const callable = regionalFunctions.httpsCallable('touchLastSeen');
      const result = await callable(data);
      console.log('✅ touchLastSeen succeeded');
      return result.data as TouchLastSeenResponse;
    } catch (error: any) {
      console.warn('⚠️ touchLastSeen failed:', {
        code: error?.code,
        message: error?.message,
      });
      return { ok: false };
    }
  }
}

export default new FcmTokenApi();
