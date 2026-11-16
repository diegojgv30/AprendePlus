
/**
 * APRENDE+
 * Aplicación educativa MVP
 * Archivo principal
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Aprende+ | Inglés')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Permite incorporar archivos HTML.
 */
function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();
}

/**
 * CONFIGURACIÓN INICIAL
 * Ejecutar una sola vez desde Apps Script.
 */
function setupProject() {

  var props = PropertiesService.getScriptProperties();

  var existingId = props.getProperty('SPREADSHEET_ID');

  if (existingId) {
    return 'El proyecto ya está configurado.\n' +
      SpreadsheetApp.openById(existingId).getUrl();
  }

  var ss = SpreadsheetApp.create('Aprende+ | Datos MVP');

  props.setProperty('SPREADSHEET_ID', ss.getId());

  // HOJA 1: ESTUDIANTES

  var students = ss.getSheets()[0];

  students.setName('Estudiantes');

  students.appendRow([
    'StudentId',
    'Code',
    'Name',
    'Grade',
    'PINSalt',
    'PINHash',
    'Active',
    'CreatedAt'
  ]);

  // HOJA 2: ACTIVIDADES

  var activities = ss.insertSheet('Actividades');

  activities.appendRow([
    'ActivityId',
    'Skill',
    'Title',
    'Level',
    'Description',
    'Instructions',
    'PayloadJSON',
    'Active'
  ]);

  // HOJA 3: RESULTADOS

  var results = ss.insertSheet('Resultados');

  results.appendRow([
    'ResultId',
    'StudentId',
    'ActivityId',
    'Skill',
    'Score',
    'MaxScore',
    'Level',
    'Feedback',
    'AnswersJSON',
    'CreatedAt'
  ]);

  // FORMATO DE LAS HOJAS

  [students, activities, results].forEach(function(sheet) {

    sheet.setFrozenRows(1);

    sheet.getRange(
      1,
      1,
      1,
      sheet.getLastColumn()
    )
    .setFontWeight('bold')
    .setBackground('#202B35')
    .setFontColor('#FFFFFF');

    sheet.autoResizeColumns(
      1,
      sheet.getLastColumn()
    );

  });

  // No se crea ningún usuario de demostración ni credenciales por defecto.

  // CARGAR ACTIVIDADES INICIALES

  seedActivities_(activities);

  return 'Configuración completada.\n\n' +
    'Hoja de datos:\n' + ss.getUrl();

}

/**
 * OBTENER ARCHIVO DE GOOGLE SHEETS
 */
function getSpreadsheet_() {

  var id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  if (!id) {
    throw new Error(
      'Primero ejecuta setupProject().'
    );
  }

  return SpreadsheetApp.openById(id);

}

/**
 * OBTENER UNA HOJA
 */
function getSheet_(name) {

  var sheet = getSpreadsheet_().getSheetByName(name);

  if (!sheet) {
    throw new Error('No existe la hoja: ' + name);
  }

  return sheet;

}

/**
 * GENERAR HASH DEL PIN
 */
function hashPin_(pin, salt) {

  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt) + ':' + String(pin),
    Utilities.Charset.UTF_8
  );

  return bytes.map(function(b) {

    var value = b < 0 ? b + 256 : b;

    var hex = value.toString(16);

    return hex.length === 1 ? '0' + hex : hex;

  }).join('');

}

/**
 * CARGAR ACTIVIDADES INICIALES
 */
function seedActivities_(sheet) {

  var rows = [

    [
      'LIS-01',
      'Listening',
      'Daily Conversations',
      'A1',
      'Escucha una conversación breve.',
      'Escucha y responde las preguntas.',
      {
        type: 'quiz',
        audioText: 'Hello! My name is Anna. I am twelve years old. I live in San Salvador. I go to school by bus.',
        questions: [
          {
            q: 'What is the girl’s name?',
            options: ['Anna', 'Maria', 'Sofia'],
            correct: 0,
            why: 'She says: My name is Anna.'
          },
          {
            q: 'How old is she?',
            options: ['Ten', 'Twelve', 'Fourteen'],
            correct: 1,
            why: 'She says she is twelve years old.'
          },
          {
            q: 'How does she go to school?',
            options: ['By car', 'On foot', 'By bus'],
            correct: 2,
            why: 'She says: I go to school by bus.'
          }
        ]
      }
    ],

    [
      'LIS-02',
      'Listening',
      'At the Restaurant',
      'A1',
      'Identifica alimentos y pedidos.',
      'Escucha el pedido y responde.',
      {
        type: 'quiz',
        audioText: 'Good afternoon. I would like a chicken sandwich and a glass of orange juice, please. That is five dollars.',
        questions: [
          {
            q: 'What does the customer order?',
            options: ['A hamburger', 'A chicken sandwich', 'A pizza'],
            correct: 1,
            why: 'The customer orders a chicken sandwich.'
          },
          {
            q: 'What does the customer drink?',
            options: ['Orange juice', 'Water', 'Milk'],
            correct: 0,
            why: 'The customer asks for orange juice.'
          },
          {
            q: 'How much is it?',
            options: ['Three dollars', 'Four dollars', 'Five dollars'],
            correct: 2,
            why: 'The total is five dollars.'
          }
        ]
      }
    ],

    [
      'REA-01',
      'Reading',
      'My Family',
      'A1',
      'Lee un texto sobre una familia.',
      'Lee el texto y responde.',
      {
        type: 'quiz',
        passage: 'Hello! My name is Daniel. I am thirteen years old. I live with my parents and my sister. My father is a teacher and my mother is a nurse. On Sundays, we visit my grandparents.',
        questions: [
          {
            q: 'How old is Daniel?',
            options: ['Twelve', 'Thirteen', 'Fourteen'],
            correct: 1,
            why: 'Daniel is thirteen years old.'
          },
          {
            q: 'What is his mother’s job?',
            options: ['Teacher', 'Doctor', 'Nurse'],
            correct: 2,
            why: 'His mother is a nurse.'
          },
          {
            q: 'When do they visit their grandparents?',
            options: ['On Fridays', 'On Sundays', 'On Mondays'],
            correct: 1,
            why: 'They visit on Sundays.'
          }
        ]
      }
    ],

    [
      'REA-02',
      'Reading',
      'A Day at School',
      'A1',
      'Comprende una rutina escolar.',
      'Lee el texto y responde.',
      {
        type: 'quiz',
        passage: 'I start school at seven o’clock. My favorite subject is English. At break time, I eat a sandwich with my friends. Classes finish at twelve thirty.',
        questions: [
          {
            q: 'What time does school start?',
            options: ['At six', 'At seven', 'At eight'],
            correct: 1,
            why: 'School starts at seven o’clock.'
          },
          {
            q: 'What is the favorite subject?',
            options: ['Science', 'Math', 'English'],
            correct: 2,
            why: 'The favorite subject is English.'
          },
          {
            q: 'What time do classes finish?',
            options: ['12:00', '12:30', '1:00'],
            correct: 1,
            why: 'Classes finish at twelve thirty.'
          }
        ]
      }
    ],

    [
      'SPE-01',
      'Speaking',
      'Introduce Yourself',
      'A1',
      'Practica una presentación personal.',
      'Graba una respuesta oral.',
      {
        type: 'speaking',
        prompt: 'Introduce yourself. Say your name, age, grade and one thing you like.',
        minSeconds: 15,
        maxSeconds: 45
      }
    ],

    [
      'SPE-02',
      'Speaking',
      'My Daily Routine',
      'A1',
      'Describe las actividades de tu día.',
      'Graba una respuesta oral.',
      {
        type: 'speaking',
        prompt: 'Describe your daily routine. What do you do in the morning, afternoon and evening?',
        minSeconds: 15,
        maxSeconds: 45
      }
    ],

    [
      'WRI-01',
      'Writing',
      'Describe Yourself',
      'A1',
      'Escribe una breve descripción personal.',
      'Redacta una respuesta en inglés.',
      {
        type: 'writing',
        prompt: 'Write a short paragraph about yourself. Include your name, age, school grade, hobbies and favorite subject.',
        minWords: 30,
        maxWords: 70
      }
    ],

    [
      'WRI-02',
      'Writing',
      'My Last Weekend',
      'A1',
      'Describe tus actividades pasadas.',
      'Redacta una respuesta en inglés.',
      {
        type: 'writing',
        prompt: 'Write about your last weekend. Mention where you went, what you did and how you felt.',
        minWords: 30,
        maxWords: 70
      }
    ]

  ];

  rows.forEach(function(row) {

    sheet.appendRow([
      row[0],
      row[1],
      row[2],
      row[3],
      row[4],
      row[5],
      JSON.stringify(row[6]),
      true
    ]);

  });

}

/**
 * OBTENER ACTIVIDADES ACTIVAS
 */

/**
 * OBTENER ACTIVIDADES ACTIVAS
 * Convierte las filas de Google Sheets en objetos
 * compatibles con Activities.gs y App.html.
 */

function getActivityRows_() {

  var values = getSheet_('Actividades')
    .getDataRange()
    .getValues();

  function normalizeQuestions_(questions) {

    return (questions || []).map(function(question) {

      var options = question.options || [];
      var correctIndex = Number(question.correct);
      var answer = question.answer;

      if (
        answer === undefined &&
        Number.isInteger(correctIndex) &&
        correctIndex >= 0 &&
        correctIndex < options.length
      ) {
        answer = options[correctIndex];
      }

      return {
        question: question.q || question.question || '',
        options: options,
        answer: answer,
        explanation: question.why || question.explanation || ''
      };

    });

  }

  function normalizePart_(part, fallbackInstructions) {

    part = part || {};

    return {
      instructions:
        part.instructions ||
        fallbackInstructions ||
        '',

      content:
        part.content ||
        part.audioText ||
        part.passage ||
        part.prompt ||
        '',

      prompt: part.prompt || '',

      questions: normalizeQuestions_(part.questions || [])
    };

  }

  return values.slice(1)

    .filter(function(row) {

      return row[7] === true ||
        String(row[7]).toLowerCase() === 'true';

    })

    .map(function(row) {

      var payload = {};

      try {

        payload = JSON.parse(row[6] || '{}');

      } catch (error) {

        console.error(
          'Error leyendo PayloadJSON de ' + row[0],
          error
        );

      }

      var parts = null;

      if (payload.parts && typeof payload.parts === 'object') {

        parts = {};

        ['Listening', 'Speaking', 'Reading', 'Writing']
          .forEach(function(skill) {

            if (payload.parts[skill]) {

              parts[skill] = normalizePart_(
                payload.parts[skill],
                ''
              );

            }

          });

      }

      var questions = normalizeQuestions_(
        payload.questions || []
      );

      return {

        id: row[0],
        skill: row[1],
        title: row[2],
        level: row[3],
        description: row[4],
        instructions: row[5],

        type: payload.type || 'quiz',

        content:
          payload.audioText ||
          payload.passage ||
          payload.prompt ||
          '',

        questions: questions,

        parts: parts,

        payload: payload

      };

    });

}


/**
 * BUSCAR ESTUDIANTE POR CÓDIGO
 */

function getStudentByCode_(code) {
  const values = getSheet_('Estudiantes')
    .getDataRange()
    .getValues();

  for (let i = 1; i < values.length; i++) {
    if (
      String(values[i][1]).trim().toUpperCase() ===
      String(code).trim().toUpperCase()
    ) {
      return {
        row: i + 1,
        id: values[i][0],
        studentId: values[i][0],
        code: values[i][1],
        name: values[i][2],
        grade: values[i][3],
        salt: values[i][4],
        pinHash: values[i][5],
        active: values[i][6] === true ||
                String(values[i][6]).toUpperCase() === 'TRUE'
      };
    }
  }

  return null;
}

