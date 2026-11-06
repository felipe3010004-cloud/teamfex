
import { generateGroundedChatResponse } from "../../server/aiService";

const GOOGLE_TTS_URL =
  "https://texttospeech.googleapis.com/v1/text:synthesize";

export const handler = async (event: any) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Método no permitido",
      }),
    };
  }

  try {
    const { prompt, history } = JSON.parse(event.body || "{}");

    // 1. Generar respuesta con Gemini
    const result = await generateGroundedChatResponse(
      prompt || "",
      history
    );

    const reply =
      typeof result === "string"
        ? result
        : result?.reply || "";

    if (!reply) {
      throw new Error("Gemini no devolvió una respuesta.");
    }

    // 2. Verificar API de Google Text-to-Speech
    const apiKey = process.env.GOOGLE_TTS_API_KEY;

    if (!apiKey) {
      throw new Error("Falta configurar GOOGLE_TTS_API_KEY.");
    }

    // 3. Convertir texto en voz
    const ttsResponse = await fetch(
      `${GOOGLE_TTS_URL}?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            text: reply,
          },
          voice: {
            languageCode: "es-US",
            name: "es-US-Neural2-A",
            ssmlGender: "FEMALE",
          },
          audioConfig: {
            audioEncoding: "LINEAR16",
            sampleRateHertz: 24000,
            speakingRate: 1.0,
            pitch: 0,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      throw new Error(
        `Error de Google TTS: ${errorText}`
      );
    }

    const audioData = await ttsResponse.json();

    if (!audioData.audioContent) {
      throw new Error("Google TTS no generó audio.");
    }

    // 4. Entregar texto y audio al ESP32
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply,
        audio: audioData.audioContent,
        audioFormat: "LINEAR16",
        sampleRate: 24000,
        channels: 1,
      }),
    };

  } catch (error: any) {
    console.error(
      "Error en TEAM LIFE:",
      error
    );

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        reply:
          "Error al procesar la consulta con la inteligencia artificial.",
        error: error.message,
      }),
    };
  }
};
