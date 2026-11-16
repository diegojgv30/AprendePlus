
/**
 * AI.GS
 * Evaluación de Speaking y Writing mediante Gemini.
 * Aprende+ - Séptimo grado - Nivel PreA1.
 *
 * La API Key y el modelo se obtienen desde Script Properties.
 *
 * Propiedades necesarias:
 * GEMINI_API_KEY
 *
 * Propiedades opcionales:
 * GEMINI_MODEL_SPEAKING
 * GEMINI_MODEL_WRITING
 *
 * Si no se configuran, se utilizan los modelos predeterminados
 * definidos en evaluateWithGemini_().
 */


/**
 * Evalúa una actividad de escritura.
 */
function evaluateWriting(token, activityId, answer) {

  const student = getStudentFromToken_(token);

  if (!student) {
    return {
      success: false,
      message: 'Tu sesión ha expirado.'
    };
  }

  answer = String(answer || '').trim();

  if (answer.length < 5) {
    return {
      success: false,
      message: 'Completa tu respuesta antes de enviarla.'
    };
  }

  if (answer.length > 5000) {
    return {
      success: false,
      message: 'Tu respuesta es demasiado extensa.'
    };
  }

  const activity = getAiActivity_(activityId);

  if (!activity) {
    return {
      success: false,
      message: 'No se encontró la actividad.'
    };
  }

  const instructions = getActivityInstructions_(
    activity,
    'Writing'
  );

  if (!instructions) {
    return {
      success: false,
      message: 'No se encontró la consigna de escritura.'
    };
  }

  const prompt = [
    'You are an English teacher evaluating a seventh-grade student.',
    'The student is learning English at Pre-A1 level.',
    'Evaluate the student fairly according to this beginner level.',
    '',
    'ACTIVITY:',
    activity.title,
    '',
    'WRITING INSTRUCTIONS:',
    instructions,
    '',
    'EXPECTED CONTENT:',
    getActivityContent_(activity, 'Writing'),
    '',
    'STUDENT ANSWER:',
    answer,
    '',
    'EVALUATION RUBRIC - 100 POINTS:',
    '- Task completion: 35 points.',
    '- Appropriate vocabulary: 25 points.',
    '- Basic grammar and sentence construction: 25 points.',
    '- Basic spelling and organization: 15 points.',
    '',
    'IMPORTANT RULES:',
    '- Accept simple sentences appropriate for Pre-A1.',
    '- Do not demand advanced grammar.',
    '- Accept different valid personal answers.',
    '- Do not invent errors.',
    '- Give feedback in simple English.',
    '- Be fair and encouraging.',
    '',
    'Return ONLY a valid JSON object:',
    '{',
    '"score": 0,',
    '"feedback": "Short feedback in English",',
    '"strengths": ["Strength 1"],',
    '"improvements": ["Improvement 1"],',
    '"recommendation": "One practical recommendation"',
    '}',
    '',
    'Score must be an integer from 0 to 100.'
  ].join('\n');

  return evaluateWithGemini_(
    token,
    activityId,
    prompt,
    null,
    'Writing'
  );
}


/**
 * Evalúa una actividad oral mediante una grabación.
 */
function evaluateSpeaking(
  token,
  activityId,
  audioBase64,
  mimeType
) {

  const student = getStudentFromToken_(token);

  if (!student) {
    return {
      success: false,
      message: 'Tu sesión ha expirado.'
    };
  }

  if (!audioBase64) {
    return {
      success: false,
      message: 'No se recibió una grabación.'
    };
  }

  const activity = getAiActivity_(activityId);

  if (!activity) {
    return {
      success: false,
      message: 'No se encontró la actividad.'
    };
  }

  const instructions = getActivityInstructions_(
    activity,
    'Speaking'
  );

  if (!instructions) {
    return {
      success: false,
      message: 'No se encontró la consigna oral.'
    };
  }

  try {

    const audioBytes = Utilities.base64Decode(audioBase64);

    if (!audioBytes || audioBytes.length === 0) {
      return {
        success: false,
        message: 'La grabación está vacía.'
      };
    }

    // Límite de 8 MB.
    if (audioBytes.length > 8 * 1024 * 1024) {
      return {
        success: false,
        message: 'La grabación es demasiado grande. Intenta grabar una respuesta más corta.'
      };
    }

    mimeType = String(mimeType || 'audio/webm')
      .split(';')[0]
      .trim()
      .toLowerCase();

    const supportedMimeTypes = [
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'audio/aac',
      'audio/flac'
    ];

    if (supportedMimeTypes.indexOf(mimeType) === -1) {
      return {
        success: false,
        message: 'El formato de audio no es compatible.'
      };
    }

    const audioBlob = Utilities.newBlob(
      audioBytes,
      mimeType,
      'speaking'
    );

    const prompt = [
      'You are an English speaking teacher evaluating a seventh-grade student.',
      'The student is learning English at Pre-A1 level.',
      'Listen carefully to the audio and evaluate the spoken response.',
      '',
      'ACTIVITY:',
      activity.title,
      '',
      'SPEAKING INSTRUCTIONS:',
      instructions,
      '',
      'EXPECTED CONTENT:',
      getActivityContent_(activity, 'Speaking'),
      '',
      'EVALUATION RUBRIC - 100 POINTS:',
      '- Task completion: 40 points.',
      '- Appropriate vocabulary: 25 points.',
      '- Basic grammar: 20 points.',
      '- Pronunciation and intelligibility: 15 points.',
      '',
      'IMPORTANT RULES:',
      '- Evaluate only what the student was asked to do.',
      '- Accept short and simple sentences.',
      '- Do not demand native pronunciation.',
      '- Do not penalize regional accents.',
      '- Evaluate intelligibility, not accent imitation.',
      '- If there is no understandable speech, explain this.',
      '- Do not invent words or statements.',
      '- Give feedback in simple English.',
      '',
      'Return ONLY a valid JSON object:',
      '{',
      '"score": 0,',
      '"feedback": "Short feedback in English",',
      '"strengths": ["Strength 1"],',
      '"improvements": ["Improvement 1"],',
      '"recommendation": "One practical recommendation"',
      '}',
      '',
      'Score must be an integer from 0 to 100.'
    ].join('\n');

    return evaluateWithGemini_(
      token,
      activityId,
      prompt,
      audioBlob,
      'Speaking'
    );

  } catch (error) {

    console.error(
      'Error en evaluateSpeaking: ' + String(error)
    );

    return {
      success: false,
      message: 'No fue posible procesar el audio.'
    };
  }
}


/**
 * Ejecuta la evaluación con Gemini.
 */
function evaluateWithGemini_(
  token,
  activityId,
  prompt,
  audioBlob,
  skill
) {

  try {

    const properties = PropertiesService.getScriptProperties();

    const apiKey = properties.getProperty('GEMINI_API_KEY');

    if (!apiKey) {
      return {
        success: false,
        message: 'Falta configurar la clave API de Gemini.'
      };
    }

    const model = skill === 'Speaking'
      ? properties.getProperty('GEMINI_MODEL_SPEAKING') || 'gemini-3.6-flash'
      : properties.getProperty('GEMINI_MODEL_WRITING') || 'gemini-3.5-flash-lite';

    // Validar la habilidad.
    if (skill !== 'Speaking' && skill !== 'Writing') {
      return {
        success: false,
        message: 'La habilidad que se intenta evaluar no es válida.'
      };
    }

    // Validar nuevamente la actividad.
    const activity = getAiActivity_(activityId);

    if (!activity) {
      return {
        success: false,
        message: 'No se encontró la actividad.'
      };
    }

    if (
      activity.parts &&
      !activity.parts[skill]
    ) {
      return {
        success: false,
        message: 'Esta actividad no contiene la habilidad solicitada.'
      };
    }

    // Preparar contenido.
    const parts = [
      {
        text: prompt
      }
    ];

    if (audioBlob) {

      const audioBytes = audioBlob.getBytes();

      if (audioBytes.length > 8 * 1024 * 1024) {
        return {
          success: false,
          message: 'La grabación es demasiado grande.'
        };
      }

      parts.push({
        inlineData: {
          mimeType: audioBlob.getContentType(),
          data: Utilities.base64Encode(audioBytes)
        }
      });

      console.log(
        'Audio preparado. Tamaño: ' +
        Math.round(audioBytes.length / 1024) +
        ' KB. Formato: ' +
        audioBlob.getContentType()
      );
    }

    // Endpoint de Gemini.
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(model) +
      ':generateContent';

    // Payload compatible con generateContent.
    const payload = {
      contents: [
        {
          parts: parts
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        candidateCount: 1
      }
    };

    console.log(
      'Iniciando evaluación Gemini. ' +
      'Habilidad: ' + skill +
      '. Modelo: ' + model
    );

    const startTime = Date.now();

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-goog-api-key': apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const elapsedSeconds = Math.round(
      (Date.now() - startTime) / 1000
    );

    console.log(
      'Gemini respondió en ' +
      elapsedSeconds +
      ' segundos.'
    );

    const status = response.getResponseCode();
    const responseText = response.getContentText();

    // Manejo de errores HTTP.
    if (status < 200 || status >= 300) {

      console.error(
        'Gemini API error. HTTP ' +
        status +
        ': ' +
        responseText.substring(0, 2000)
      );

      let errorMessage =
        'El servicio de evaluación no está disponible. Inténtalo nuevamente.';

      if (status === 400) {
        errorMessage =
          'La solicitud de evaluación contiene datos que Gemini no reconoce.';
      } else if (status === 403) {
        errorMessage =
          'La API de Gemini no tiene autorización para realizar la evaluación.';
      } else if (status === 404) {
        errorMessage =
          'El modelo de Gemini configurado no está disponible.';
      } else if (status === 429) {
        errorMessage =
          'Se alcanzó el límite de solicitudes de Gemini. Inténtalo más tarde.';
      } else if (status >= 500) {
        errorMessage =
          'Gemini presenta un problema temporal. Inténtalo nuevamente.';
      }

      return {
        success: false,
        message: errorMessage
      };
    }

    // Interpretar respuesta.
    const data = JSON.parse(responseText);

    const candidate =
      data.candidates &&
      data.candidates[0];

    const generatedText =
      candidate &&
      candidate.content &&
      candidate.content.parts
        ? candidate.content.parts
            .map(function(part) {
              return part.text || '';
            })
            .join('')
            .trim()
        : '';

    if (!generatedText) {

      console.error(
        'Gemini no devolvió texto válido: ' +
        responseText.substring(0, 2000)
      );

      return {
        success: false,
        message: 'La inteligencia artificial no generó una evaluación válida.'
      };
    }

    // Convertir respuesta a JSON.
    console.log(
      'RESPUESTA ORIGINAL DE GEMINI: ' + generatedText
    );

    const evaluation = parseGeminiJson_(generatedText);

    if (
      !evaluation ||
      typeof evaluation !== 'object' ||
      Array.isArray(evaluation)
    ) {
      return {
        success: false,
        message: 'La evaluación recibida tiene un formato incorrecto.'
      };
    }

    // Normalizar calificación.
    evaluation.score = Math.max(
      0,
      Math.min(
        100,
        Math.round(Number(evaluation.score) || 0)
      )
    );

    evaluation.feedback = String(
      evaluation.feedback || 'Evaluation completed.'
    );

    evaluation.strengths = Array.isArray(evaluation.strengths)
      ? evaluation.strengths
      : [];

    evaluation.improvements = Array.isArray(evaluation.improvements)
      ? evaluation.improvements
      : [];

    evaluation.recommendation = String(
      evaluation.recommendation || ''
    );

    evaluation.skill = skill;

    // Guardar resultado individual.
    const saveResponse = saveAiResult_(
      token,
      activityId,
      evaluation,
      skill
    );

    if (!saveResponse || !saveResponse.success) {

      console.error(
        'No se pudo guardar el resultado: ' +
        JSON.stringify(saveResponse)
      );

      return saveResponse || {
        success: false,
        message: 'No fue posible guardar la evaluación.'
      };
    }

    console.log(
      'Evaluación completada y guardada. ' +
      'Habilidad: ' + skill +
      '. Puntuación: ' + evaluation.score
    );

    return {
      success: true,
      skill: skill,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      recommendation: evaluation.recommendation,
      message: saveResponse.message
    };

  } catch (error) {

    console.error(
      'Error en evaluateWithGemini_: ' +
      String(error)
    );

    const errorMessage = String(error).toLowerCase();

    if (
      errorMessage.indexOf('timeout') !== -1 ||
      errorMessage.indexOf('tiempo de espera') !== -1
    ) {
      return {
        success: false,
        message: 'La evaluación está tardando demasiado. Intenta nuevamente con una grabación más corta.'
      };
    }

    return {
      success: false,
      message: 'Ocurrió un error al evaluar la actividad.'
    };
  }
}


/**
 * Obtiene las instrucciones específicas de una habilidad.
 */
function getActivityInstructions_(activity, skill) {

  if (!activity) {
    return '';
  }

  // Actividades combinadas.
  if (activity.parts) {

    const part = activity.parts[skill];

    if (!part) {
      return '';
    }

    return String(
      part.instructions ||
      part.prompt ||
      ''
    ).trim();
  }

  // Compatibilidad con actividades antiguas.
  const specificInstructions =
    activity[skill.toLowerCase() + 'Instructions'];

  if (specificInstructions) {
    return String(specificInstructions).trim();
  }

  return String(activity.instructions || '').trim();
}


/**
 * Obtiene únicamente el contenido correspondiente
 * a la habilidad que se está evaluando.
 */
function getActivityContent_(activity, skill) {

  if (!activity) {
    return '';
  }

  if (activity.parts && skill) {

    const part = activity.parts[skill];

    if (!part) {
      return '';
    }

    return String(
      part.content ||
      part.prompt ||
      ''
    ).trim();
  }

  // Compatibilidad con actividades antiguas.
  return String(activity.content || '').trim();
}


/**
 * Convierte la respuesta de Gemini en JSON.
 */
function parseGeminiJson_(text) {

  let cleanText = String(text || '').trim();

  cleanText = cleanText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  try {

    return JSON.parse(cleanText);

  } catch (error) {

    const start = cleanText.indexOf('{');
    const end = cleanText.lastIndexOf('}');

    if (start !== -1 && end !== -1) {

      return JSON.parse(
        cleanText.substring(start, end + 1)
      );
    }

    throw new Error(
      'La respuesta de Gemini no contiene JSON válido.'
    );
  }
}


/**
 * Busca una actividad para evaluación con IA.
 */
function getAiActivity_(activityId) {

  const activities = getActivityRows_();

  return activities.find(function(activity) {
    return String(activity.id) === String(activityId);
  }) || null;
}
