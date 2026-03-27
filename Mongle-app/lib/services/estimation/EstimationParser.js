import { NORMALIZATION_MAP } from './ComparisonModels';

/**
 * Mock PDF Parser Service
 * In a real app, this would use an OCR engine or a server-side PDF parser.
 */
export const EstimationParser = {
  /**
   * Simulates selecting and "parsing" a PDF file.
   * @param {string} fileUri - Selected PDF URI
   * @returns {Promise<Object>} Mock parsed data
   */
  async parsePdf(fileUri, fileName) {
    // Simulate network/processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, we return dummy data based on the filename or just random wedding hall data
    const isHall = fileName.toLowerCase().includes('홀') || fileName.toLowerCase().includes('hall');
    
    if (fileName.includes('가루다')) {
      return this.getMockData1();
    } else if (fileName.includes('라온')) {
      return this.getMockData2();
    } else {
      return isHall ? this.getMockData1() : this.getMockData3();
    }
  },

  /**
   * Normalizes keys from OCR text to standard keys
   * @param {Object} rawData - Extracted raw text/key-value pairs
   */
  normalizeData(rawData) {
    const normalized = {};
    for (const [key, aliases] of Object.entries(NORMALIZATION_MAP)) {
      const foundMatch = Object.keys(rawData).find(rawKey => 
        aliases.some(alias => rawKey.includes(alias) || alias.includes(rawKey))
      );
      normalized[key] = foundMatch ? rawData[foundMatch] : null;
    }
    return normalized;
  },

  getMockData1() {
    return {
      vendorName: "가루다 웨딩홀",
      category: "웨딩홀",
      productName: "그랜드볼룸 패키지",
      totalPrice: 4500000,
      deposit: 500000,
      balance: 4000000,
      includedItems: ["대관료", "생화 장식", "혼구용품", "포토테이블"],
      excludedItems: ["식대 별도 (인당 5.5만)", "폐백실 이용료"],
      optionsPrice: 300000,
      discountPrice: 200000,
      vatIncluded: true,
      capacity: "250명",
      duration: "90분",
      rawFilesIncluded: false,
      retouchedFilesIncluded: false,
      refundPolicy: "예식 90일 전 100% 환불",
      remarks: "당일 계약 시 연주 서비스",
      confidence: 0.95
    };
  },

  getMockData2() {
    return {
      vendorName: "라온 컨벤션",
      category: "웨딩홀",
      productName: "에메랄드 가든",
      totalPrice: 4200000,
      deposit: 400000,
      balance: 3800000,
      includedItems: ["대관료", "조화 장식", "전문 사회자"],
      excludedItems: ["생화 장식 추가 가능", "수수료 별도"],
      optionsPrice: 800000,
      discountPrice: 500000,
      vatIncluded: false,
      capacity: "200명",
      duration: "60분",
      rawFilesIncluded: false,
      retouchedFilesIncluded: false,
      refundPolicy: "취소 불가",
      remarks: "음료 무제한 포함",
      confidence: 0.88
    };
  },

  getMockData3() {
    return {
      vendorName: "모던 스튜디오",
      category: "스튜디오",
      productName: "올데이 리허설",
      totalPrice: 2200000,
      deposit: 300000,
      balance: 1900000,
      includedItems: ["촬영 5시간", "드레스 3벌", "메이크업 1회"],
      excludedItems: ["원본 파일 (33만원)", "수정본 (11만원)"],
      optionsPrice: 500000,
      discountPrice: 100000,
      vatIncluded: true,
      capacity: "수량 20P",
      duration: "300분",
      rawFilesIncluded: false,
      retouchedFilesIncluded: false,
      refundPolicy: "촬영 30일 전까지 전액 환불",
      remarks: "평일 촬영 시 야간 촬영 서비스",
      confidence: 0.92
    };
  }
};
