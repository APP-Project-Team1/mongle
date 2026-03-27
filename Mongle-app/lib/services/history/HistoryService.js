import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@mongle_pdf_history';

/**
 * History Service
 * Persists PDF generation events to AsyncStorage.
 */
export const HistoryService = {
  /**
   * Adds a new entry to the PDF history.
   * @param {Object} entry - { name: string, type: string, date: string }
   */
  async addHistory(entry) {
    try {
      const existing = await this.getHistory();
      const newEntry = {
        id: Date.now().toString(),
        ...entry,
        date: new Date().toLocaleString(),
      };
      const updated = [newEntry, ...existing].slice(0, 50); // Keep last 50
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Failed to add history:', error);
      return [];
    }
  },

  /**
   * Retrieves the PDF history from AsyncStorage.
   */
  async getHistory() {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  },

  /**
   * Clears the entire history.
   */
  async clearHistory() {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }
};
