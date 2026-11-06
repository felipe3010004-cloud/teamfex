
export const handler = async (event: any) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido" }),
    };
  }

  try {
    const apiKey = process.env.SONEX_API_KEY;

    if (!apiKey) {
      throw new Error("No se encontró SONEX_API_KEY");
    }

    const { text } = JSON.parse(event.body || "{}");

    if (!text || typeof text !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Falta el texto para convertir" }),
      };
    }

    const response = await fetch(
      "https://api.sonexlabs.com/v1/speech",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.slice(0, 5000),
          output_format: "wav",
          sample_rate: 24000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Error de Sonex Labs:", response.status, error);

      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "No se pudo generar el audio",
          status: response.status,
        }),
      };
    }

    const audioBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Content-Type": "audio/wav",
      },
      isBase64Encoded: true,
      body: audioBuffer.toString("base64"),
    };

  } catch (error: any) {
    console.error("Error en función de voz:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Error al generar la voz",
      }),
    };
  }
};
