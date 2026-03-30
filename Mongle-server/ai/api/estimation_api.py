from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import base64
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ParseRequest(BaseModel):
    files: List[Dict[str, str]] # [{name, type, base64}]

@router.post("/estimation/parse")
async def parse_estimation(req: ParseRequest):
    results = []
    
    for file in req.files:
        try:
            prompt = """
            당신은 전문적인 웨딩 견적서 분석 전문가입니다.
            이미지가 다소 저화질이거나 흐릿하더라도, 문맥과 웨딩 업계의 일반적인 용어(예: 스드메, 대관료, 식대, 원본데이터 등)를 바탕으로 최대한 정확하게 정보를 추출해야 합니다.

            [분석 전략]
            1. 이미지의 모든 텍스트를 꼼꼼히 읽습니다.
            2. 특히 숫자(금액)와 단위(만원, 원)를 주의 깊게 확인하세요. '80'이 '800,000' 혹은 '80만원'인지 문맥으로 판단합니다.
            3. 항목이 명시되지 않았더라도 금액의 규모를 보고 카테고리(예: 수백만원대면 웨딩홀, 수십만원대면 옵션 등)를 유추할 수 있습니다.
            4. 웨딩홀 견적서의 경우, 식대·대관료·데코레이션 등 항목별 금액을 반드시 개별 필드로 추출하세요.

            [필드 가이드]
            - vendorName: 업체명 (가급적 이미지 상단이나 하단 직인 근처에서 찾으세요)
            - category: 항목 (웨딩홀, 스튜디오, 드레스, 메이크업, 본식스냅 등)
            - productName: 상품명/코스명
            - hallName: 홀 이름 (예: 그랜드볼룸, 다이아몬드홀 등, 없으면 null)
            - weddingDate: 예식 일자 (YYYY-MM-DD, 없으면 null)
            - totalPrice: 총액 (숫자만, 없으면 0)
            - deposit: 계약금 (숫자만, 없으면 0)
            - balance: 잔금 (숫자만, 없으면 0)
            - guaranteedCapacity: 보증인원 (숫자만, 없으면 0)
            - minCapacity: 최소인원 (숫자만, 없으면 0)
            - capacity: 수용 인원 (숫자만, 없으면 0)
            - foodPricePerPerson: 1인당 식대 (숫자만, 없으면 0) — 식사 단가
            - totalFoodPrice: 식음료 총액 (숫자만, 없으면 0)
            - rentalFee: 대관료/홀 사용료 (숫자만, 없으면 0)
            - decorationPrice: 데코레이션/꽃장식 비용 합계 (숫자만, 없으면 0)
            - serviceChargePercent: 봉사료 % (숫자만, 예: 10이면 10%, 없으면 0)
            - includedItems: 포함 사항 (리스트, 구체적으로 적어주세요 — 식사 포함 여부, 데코, 케이크, 주차 등)
            - excludedItems: 불포함/별도 비용 사항 (리스트, 중요!)
            - optionsPrice: 추가 옵션 비용 합계 (숫자, 없으면 0)
            - discountPrice: 할인액 (숫자, 없으면 0)
            - vatIncluded: 부가세 포함 여부 (boolean)
            - vatPercent: 부가세 요율 (숫자만, 일반적으로 10, 없으면 10)
            - refundPolicy: 환불/취소 규정 (핵심 내용 요약)
            - remarks: 기타 특이사항 (예: 당일 계약 혜택 등)

            응답은 반드시 JSON 형식으로만 작성하세요.
            """
            
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{file['base64']}"
                            }
                        }
                    ]
                }
            ]
            
            response = await openai_client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            parsed = json.loads(response.choices[0].message.content)
            parsed["fileName"] = file["name"]
            results.append(parsed)
            
        except Exception as e:
            print(f"Error parsing file {file['name']}: {e}")
            # Fallback for demo if AI fails or for testing
            results.append({
                "fileName": file['name'],
                "vendorName": f"분석 실패 ({file['name']})",
                "error": str(e)
            })
            
    return results
