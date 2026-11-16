/**
 * ADMINHELPERS.GS
 * Herramientas de diagnóstico y configuración de Aprende+.
 */

/**
 * Comprueba que las hojas y configuraciones necesarias existan.
 */
function checkProjectSetup() {
  const requiredSheets = [
    'Estudiantes',
    'Actividades',
    'Resultados'
  ];

  const spreadsheet = getSpreadsheet_();

  const sheetStatus = requiredSheets.map(function(name) {
    return {
      name: name,
      exists: Boolean(spreadsheet.getSheetByName(name))
    };
  });

  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty('GEMINI_API_KEY');

  const speakingModel =
    properties.getProperty('GEMINI_MODEL_SPEAKING') ||
    'gemini-3.6-flash';

  const writingModel =
    properties.getProperty('GEMINI_MODEL_WRITING') ||
    'gemini-3.5-flash-lite';

  const activities = getActivityRows_();

  return {
    success: sheetStatus.every(function(sheet) {
      return sheet.exists;
    }),
    sheets: sheetStatus,
    geminiConfigured: Boolean(apiKey),
    geminiSpeakingModel: speakingModel,
    geminiWritingModel: writingModel,
    activitiesCount: activities.length
  };
}


/**
 * Ejecuta el diagnóstico general y registra los resultados
 * en la hoja Diagnostico.
 */
function testProjectSetup() {
  const ss = getSpreadsheet_();
  const report = ss.getSheetByName('Diagnostico') ||
                 ss.insertSheet('Diagnostico');

  report.clear();

  const rows = [
    ['COMPROBACIÓN DE APRENDE+', 'RESULTADO']
  ];

  try {
    const result = checkProjectSetup();

    rows.push(
      ['Configuración general', result.success ? 'CORRECTA' : 'REVISAR'],
      ['Hoja Estudiantes', result.sheets[0].exists ? 'OK' : 'ERROR'],
      ['Hoja Actividades', result.sheets[1].exists ? 'OK' : 'ERROR'],
      ['Hoja Resultados', result.sheets[2].exists ? 'OK' : 'ERROR'],
      ['API Key de Gemini', result.geminiConfigured ? 'CONFIGURADA' : 'FALTA'],
      ['Modelo Gemini Speaking', result.geminiSpeakingModel],
      ['Modelo Gemini Writing', result.geminiWritingModel],
      ['Cantidad de actividades', result.activitiesCount]
    );

  } catch (error) {
    rows.push(['ERROR', error.message]);
  }

  report.getRange(1, 1, rows.length, 2).setValues(rows);
  report.autoResizeColumns(1, 2);

  SpreadsheetApp.flush();
}
