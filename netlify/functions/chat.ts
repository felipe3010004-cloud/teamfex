
import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Metodo no permitido" })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Falta GEMINI_API_KEY" })
      };
    }

    const body = JSON.parse(event.body || "{}");

    const message = typeof body.message === "string"
      ? body.message.trim()
      : "";

    const audio = typeof body.audio === "string"
      ? body.audio
      : "";

    if (!message && !audio) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Debes enviar un mensaje o un audio"
        })
      };
    }

    const parts: any[] = [];

    if (audio) {
      parts.push({
        inline_data: {
          mime_type: body.mimeType || "audio/wav",
          data: audio
        }
      });

      parts.push({
        text:
          "Escucha el audio del usuario, comprende lo que dice " +
          "en español y responde directamente a su consulta. " +
          "No te limites a transcribirlo. " +
          "Actúa como la asesora virtual de TEAM LIFE | Equipo Vida S.R.L. " +
          "Responde de manera clara, cordial y natural. " +
          "Si no comprendes el audio, solicita que repita la pregunta."
      });
    } else {
      parts.push({
        text:
          "Actúa como la asesora virtual de TEAM LIFE | Equipo Vida S.R.L. " +
          "Responde de manera clara, cordial y natural. " +
          "Consulta del usuario: " + message
      });
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      "gemini-2.5-flash:generateContent?key=" + apiKey;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts
          }
        ],
        generationConfig: {
          temperature: 0.4
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Error de Gemini:", result);

      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "Gemini no pudo procesar la solicitud",
          detail: result
        })
      };
    }

    const reply =
      result.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text || "")
        .join("")
        .trim() || "";

    if (!reply) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "Gemini no genero una respuesta"
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    console.error("Error en chat:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error interno del servidor"
      })
    };
  }
};
