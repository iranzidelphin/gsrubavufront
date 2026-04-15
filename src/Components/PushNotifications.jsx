import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  isPushSupported,
  checkNotificationPermission,
} from '../lib/pushNotifications';
import { apiJson } from '../lib/api';

export default function PushNotificationManager({ user }) {
  const { t } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);
      
      if (supported) {
        const perm = await checkNotificationPermission();
        setPermission(perm);
      }
    };
    
    checkSupport();
  }, []);

  const handleSubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const registration = await registerServiceWorker();
      
      if (!registration) {
        throw new Error('Failed to register service worker');
      }
      
      const sub = await subscribeToPush(registration);
      
      if (!sub) {
        throw new Error('Failed to subscribe to push notifications');
      }
      
      setSubscription(sub);
      
      const subscriptionData = sub.toJSON();
      
      await apiJson('/push/subscribe', 'POST', {
        subscription: subscriptionData,
        userId: user?.id,
      });
      
      setPermission('granted');
      setSuccess(t('notificationsEnabled'));
    } catch (err) {
      setError(err.message || t('notificationError'));
      console.error('Push subscription error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  const handleUnsubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        await unsubscribeFromPush(registration);
      }
      
      setSubscription(null);
      
      await apiJson('/push/unsubscribe', 'POST', {
        userId: user?.id,
      });
      
      setPermission('default');
      setSuccess(t('notificationsDisabled'));
    } catch (err) {
      setError(err.message || t('notificationError'));
      console.error('Push unsubscription error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
        <i className="fa-solid fa-triangle-exclamation mr-2"></i>
        {t('pushNotSupported')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-black/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gs-dark flex items-center justify-center text-white">
          <i className="fa-solid fa-bell"></i>
        </div>
        <div>
          <h4 className="font-serif text-lg text-gs-dark">{t('pushNotifications')}</h4>
          <p className="text-sm text-gray-500">{t('pushNotificationsDesc')}</p>
        </div>
      </div>

      {permission === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">
          <i className="fa-solid fa-circle-xmark mr-2"></i>
          {t('notificationsBlocked')}
        </div>
      )}

      {success && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 mb-4">
          <i className="fa-solid fa-check-circle mr-2"></i>
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">
          <i className="fa-solid fa-circle-exclamation mr-2"></i>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {permission === 'granted' || permission === 'default' ? (
          <button
            onClick={handleSubscribe}
            disabled={loading || permission === 'granted'}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              permission === 'granted'
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-gs-accent text-white hover:bg-orange-700'
            }`}
          >
            {loading ? (
              <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
            ) : permission === 'granted' ? (
              <>
                <i className="fa-solid fa-check mr-2"></i>
                {t('enabled')}
              </>
            ) : (
              <>
                <i className="fa-solid fa-bell mr-2"></i>
                {t('enableNotifications')}
              </>
            )}
          </button>
        ) : null}

        {permission === 'granted' && (
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200 transition-all"
          >
            {loading ? (
              <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
            ) : (
              <>
                <i className="fa-solid fa-bell-slash mr-2"></i>
                {t('disableNotifications')}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}