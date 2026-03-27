import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { PDFTemplates } from './PDFTemplates';
import { HistoryService } from '../history/HistoryService';

/**
 * PDF Service
 * Handles generation and sharing of PDF files.
 */
export const PDFService = {
  /**
   * Generates a PDF from HTML and shares it.
   * @param {string} html - HTML content
   * @param {string} fileName - Suggested filename
   */
  async generateAndShare(html, fileName) {
    try {
      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false 
      });

      console.log('PDF generated at:', uri);

      if (Platform.OS === 'ios') {
        // Renaming on iOS might need extra steps if sharing doesn't pick up filename,
        // but expo-sharing handles basic sharing.
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: fileName,
          UTI: 'com.adobe.pdf'
        });
        
        // Add to persistent history
        await HistoryService.addHistory({
          name: fileName,
          type: fileName.includes('budget') ? '예산 명세서' : '견적 비교서',
          uri: uri
        });

        return { success: true, uri };
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Failed to generate/share PDF:', error);
      return { success: false, error };
    }
  },

  /**
   * Specific helper for Budget Summary
   */
  async saveBudgetSummary(budgetData) {
    const html = PDFTemplates.getBudgetSummaryHTML({
      projectName: budgetData.projectName || '몽글 웨딩 프로젝트',
      weddingDate: budgetData.weddingDate || '미정',
      totalBudget: budgetData.totalBudget || 0,
      spentAmount: budgetData.spent || 0,
      remainingBudget: (budgetData.totalBudget || 0) - (budgetData.spent || 0),
      categories: (budgetData.items || []).map(item => ({
        title: item.category || '기타',
        budget: item.amount || 0, // In this simplified view, we treat amount as spent
        spent: item.amount || 0
      })),
      generatedAt: new Date().toLocaleString()
    });
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `wedding-budget-${dateStr}.pdf`;
    return await this.generateAndShare(html, fileName);
  },

  /**
   * Specific helper for Comparison Report
   */
  async saveComparisonReport(analysisResult) {
    const html = PDFTemplates.getComparisonReportHTML(analysisResult);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `estimation-comparison-${dateStr}.pdf`;
    return await this.generateAndShare(html, fileName);
  }
};
