/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';

export interface GeminiLandmarks {
  normTopHeadY: number;   // 0.0 to 1.0
  normEyeCenterY: number; // 0.0 to 1.0
  normChinY: number;      // 0.0 to 1.0
  normFaceCenterX: number;// 0.0 to 1.0
}

/**
 * Uses Gemini Vision API to analyze portrait photos and detect normalized landmark coordinates
 * (top of head/hair, eye line, chin, face center X) without any hardcoded geometric multipliers.
 */
export async function detectLandmarksWithGemini(
  base64Image: string,
  apiKey: string
): Promise<GeminiLandmarks | null> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        },
        'Analyze this portrait photo for official passport photo alignment. Return JSON with normalized 0.0 to 1.0 coordinates for: 1) topHeadY (topmost edge of hair or head), 2) eyeCenterY (eye pupil line), 3) chinY (bottom tip of chin), 4) faceCenterX (center line of face between eyes).',
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topHeadY: { type: Type.NUMBER, description: 'Normalized Y of top of hair/head (0.0 to 1.0)' },
            eyeCenterY: { type: Type.NUMBER, description: 'Normalized Y of eye line center (0.0 to 1.0)' },
            chinY: { type: Type.NUMBER, description: 'Normalized Y of chin bottom (0.0 to 1.0)' },
            faceCenterX: { type: Type.NUMBER, description: 'Normalized X of face center (0.0 to 1.0)' },
          },
          required: ['topHeadY', 'eyeCenterY', 'chinY', 'faceCenterX'],
        },
      },
    });

    const jsonText = response.text;
    if (jsonText) {
      const parsed = JSON.parse(jsonText);
      return {
        normTopHeadY: Math.max(0.01, Math.min(0.95, parsed.topHeadY)),
        normEyeCenterY: Math.max(0.05, Math.min(0.95, parsed.eyeCenterY)),
        normChinY: Math.max(0.10, Math.min(0.99, parsed.chinY)),
        normFaceCenterX: Math.max(0.05, Math.min(0.95, parsed.faceCenterX)),
      };
    }
  } catch (err) {
    console.warn('Lỗi khi gọi Gemini Vision AI Landmark Detection:', err);
  }
  return null;
}
