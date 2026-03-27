import * as FileSystem from 'expo-file-system/legacy';
import { BASE_URL } from '../../api';

/**
 * AI Estimation Parser Service
 * Extracts structured data from estimate images/PDFs using the backend AI API.
 */
export const EstimationParser = {
  /**
   * Parses multiple estimate files using the backend AI.
   * @param {Array} files - Selected files info [{uri, name, type}]
   * @returns {Promise<Array>} Parsed data results
   */
  async parseFiles(files) {
    try {
      // 1. Prepare base64 for each file
      const fileData = await Promise.all(
        files.map(async (file) => {
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: 'base64',
          });
          return {
            name: file.name,
            type: file.type || 'image', // Assume image if not specified
            base64: base64,
          };
        }),
      );

      // 2. Call Backend API
      const response = await fetch(`${BASE_URL}/api/v2/estimation/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: fileData }),
      });

      if (!response.ok) {
        throw new Error('AI 분석 중 오류가 발생했습니다.');
      }

      const results = await response.json();
      return results;
    } catch (err) {
      console.error('EstimationParser Error:', err);
      throw err;
    }
  },

  // Keep old method for backward compatibility if needed, but point to new logic
  async parsePdf(fileUri, fileName) {
    const results = await this.parseFiles([{ uri: fileUri, name: fileName, type: 'pdf' }]);
    return results[0];
  },
};
