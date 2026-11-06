
import { generateGroundedChatResponse } from "../../server/aiService";

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

    if (!prompt || typeof prompt !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Falta la pregunta del usuario.",
        }),
      };
    }

    const result = await generateGroundedChatResponse(
      prompt,
      history || []
    );

    const reply =
      typeof result === "string"
        ? result
        : result?.reply || "";

    if (!reply) {
      throw new Error("Gemini no devolvió una respuesta.");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: reply,
      }),
    };

  } catch (error: any) {
    console.error("Error en TEAM LIFE:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Error al procesar la consulta.",
      }),
    };
  }
};
