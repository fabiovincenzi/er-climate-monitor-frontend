import { useLocalStorage } from '@vueuse/core';
import { fetchAlertNotification, restoreSubscriptions } from '@/apis/notificationsApi';
import { computed, ref } from 'vue';

export type SensorInfos = {
    name: string;
    type: string;
    queries: string[];
};

export type Topic = {
    topic: string;
    sensorName?: string;
    query?: string;
};

export type Notification = {
    id: string;
    sensorName: string;
    type: string;
    value: number;
    unit: string;
    timestamp: number;
    query: { value: number; name: string };
};

export type NotificationSubscription = {
    topic: Topic;
    uid: string;
    topicAddr: string;
};

export const getAlertIcon = (alertType: string): string => {
    const icons: { [key: string]: string } = {
        idro_level: 'water',
        temp: 'thermostat',
        rain: 'rainy',
        wind: 'air',
        humidity: 'humidity_high',
    };
    return icons[alertType] || 'wa️rning';
};

export const useNotificationState = () => {
    const notifications = useLocalStorage<Notification[]>('notifications', []);
    const activePopups = useLocalStorage<Notification[]>('activePopups', []);

    const getUnkonwnsId = computed(() => {
        return crypto.randomUUID();
    });

    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const isInitialised = ref(false);

    const prependNotification = (n: Notification) => {
        if (!notifications.value.some((not) => not.id == n.id)) {
            notifications.value.unshift(n);
        }
    };

    const showNotificationPopup = (n: Notification) => {
        activePopups.value.unshift(n);
    };

    const removeNotificationPopup = (id: string) => {
        activePopups.value = activePopups.value.filter((n) => n.id !== id);
    };

    const loadNotifications = async () => {
        if (isInitialised.value) {
            await restoreSubscriptions();
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            notifications.value = await fetchAlertNotification();
            isInitialised.value = true;
            await restoreSubscriptions();
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to load notifications...';
        } finally {
            isLoading.value = false;
        }
    };

    return {
        notifications,
        activePopups,
        prependNotification,
        loadNotifications,
        showNotificationPopup,
        removeNotificationPopup,
        getUnkonwnsId,
    };
};
