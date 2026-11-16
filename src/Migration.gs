
/**
 * MIGRATION.GS
 * Migración curricular de Aprende+.
 *
 * Séptimo grado - PreA1.
 *
 * 6 unidades.
 * 12 actividades.
 * 2 habilidades por actividad.
 *
 * No elimina datos ni resultados históricos.
 * No ejecuta setupProject().
 */


/* =========================================
   MIGRACIÓN PRINCIPAL
========================================= */

function migrateActivities() {

  const sheet = getSheet_('Actividades');

  const lastRow = sheet.getLastRow();

  if (lastRow < 1) {
    throw new Error('La hoja Actividades no tiene encabezados.');
  }

  const headers = sheet.getRange(1, 1, 1, 8).getValues()[0];

  const expectedHeaders = [
    'ActivityId',
    'Skill',
    'Title',
    'Level',
    'Description',
    'Instructions',
    'PayloadJSON',
    'Active'
  ];

  expectedHeaders.forEach(function(header, index) {
    if (String(headers[index]).trim() !== header) {
      throw new Error(
        'Encabezado incorrecto en columna ' +
        (index + 1) +
        '. Se esperaba: ' + header
      );
    }
  });

  const activities = buildAprendePlusActivities_();

  const legacyIds = [
    'LIS-01',
    'LIS-02',
    'REA-01',
    'REA-02',
    'SPE-01',
    'SPE-02',
    'WRI-01',
    'WRI-02'
  ];

  const existingRows = sheet.getDataRange().getValues();

  let deactivated = 0;
  let inserted = 0;
  let updated = 0;

  // 1. Desactivar actividades antiguas.
  for (let i = 1; i < existingRows.length; i++) {

    const id = String(existingRows[i][0]).trim();

    if (legacyIds.indexOf(id) !== -1) {

      if (
        existingRows[i][7] === true ||
        String(existingRows[i][7]).toLowerCase() === 'true'
      ) {
        sheet.getRange(i + 1, 8).setValue(false);
        deactivated++;
      }

    }
  }

  // 2. Cargar o actualizar las 12 actividades.
  activities.forEach(function(activity) {

    const payload = JSON.stringify(activity.payload);

    const row = [
      activity.id,
      'Combined',
      activity.title,
      'PreA1',
      activity.description,
      activity.instructions,
      payload,
      true
    ];

    const matchingRows = [];

    for (let i = 1; i < existingRows.length; i++) {

      if (
        String(existingRows[i][0]).trim() === activity.id
      ) {
        matchingRows.push(i + 1);
      }

    }

    if (matchingRows.length) {

      // Actualizar la primera coincidencia.
      sheet.getRange(matchingRows[0], 1, 1, 8)
        .setValues([row]);

      updated++;

      // Desactivar posibles duplicados del mismo ID.
      matchingRows.slice(1).forEach(function(rowNumber) {
        sheet.getRange(rowNumber, 8).setValue(false);
      });

    } else {

      sheet.appendRow(row);
      inserted++;

    }

  });

  SpreadsheetApp.flush();

  // 3. Verificar la migración.
  const verification = verifyMigratedActivities_();

  const report = {
    success: verification.success,
    deactivated: deactivated,
    inserted: inserted,
    updated: updated,
    activeActivities: verification.activeActivities,
    validActivities: verification.validActivities,
    errors: verification.errors
  };

  console.log(JSON.stringify(report, null, 2));

  if (!verification.success) {
    throw new Error(
      'La migración terminó, pero la verificación detectó problemas: ' +
      verification.errors.join('; ')
    );
  }

  return report;
}


/* =========================================
   ACTIVIDADES CURRICULARES
========================================= */

function buildAprendePlusActivities_() {

  return [

    /* =====================================
       UNIDAD 1
    ===================================== */

    {
      id: 'U1-A',
      title: 'Meeting new people',
      description: 'Escucha presentaciones personales y practica cómo presentarte en inglés.',
      instructions: 'Completa primero Listening y después Speaking.',

      payload: {
        type: 'combined',

        parts: {

          Listening: {
            instructions: 'Escucha la presentación y responde las preguntas.',

            audioText:
              'Hello! My name is Mia. I am twelve years old. I am in seventh grade. My favorite color is blue. Nice to meet you!',

            questions: [
              {
                q: 'What is the girl’s name?',
                options: ['Anna', 'Mia', 'Sofia'],
                correct: 1,
                why: 'She says: My name is Mia.'
              },
              {
                q: 'How old is Mia?',
                options: ['Eleven', 'Twelve', 'Thirteen'],
                correct: 1,
                why: 'She says she is twelve years old.'
              },
              {
                q: 'What is her favorite color?',
                options: ['Red', 'Green', 'Blue'],
                correct: 2,
                why: 'She says her favorite color is blue.'
              }
            ]
          },

          Speaking: {
            instructions: 'Preséntate en inglés. Di tu nombre, edad, grado y color favorito.',

            prompt:
              'Introduce yourself. Say your name, age, grade and favorite color.'
          }

        }
      }
    },

    {
      id: 'U1-B',
      title: 'My personal profile',
      description: 'Lee un perfil personal y escribe información básica sobre ti.',
      instructions: 'Completa primero Reading y después Writing.',

      payload: {
        type: 'combined',

        parts: {

          Reading: {
            instructions: 'Lee el perfil de Daniel y responde las preguntas.',

            passage:
              'Hello! My name is Daniel. I am twelve years old. I am a student in seventh grade. My favorite subject is English. I like football and music. My favorite color is green.',

            questions: [
              {
                q: 'What is the boy’s name?',
                options: ['David', 'Daniel', 'Carlos'],
                correct: 1,
                why: 'The text says: My name is Daniel.'
              },
              {
                q: 'What grade is Daniel in?',
                options: ['Sixth grade', 'Seventh grade', 'Eighth grade'],
                correct: 1,
                why: 'He is a student in seventh grade.'
              },
              {
                q: 'What is his favorite subject?',
                options: ['English', 'Math', 'Science'],
                correct: 0,
                why: 'His favorite subject is English.'
              }
            ]
          },

          Writing: {
            instructions: 'Escribe un perfil personal con oraciones sencillas en inglés.',

            prompt:
              'Write a short personal profile. Include your name, age, grade, favorite subject and favorite color.'
          }

        }
      }
    },


    /* =====================================
       UNIDAD 2
    ===================================== */

    {
      id: 'U2-A',
      title: 'School supplies',
      description: 'Identifica útiles escolares mediante una conversación breve.',
      instructions: 'Completa primero Listening y después Speaking.',

      payload: {
        type: 'combined',

        parts: {

          Listening: {
            instructions: 'Escucha la conversación sobre útiles escolares y responde.',

            audioText:
              'Hello, Maria! What do you have in your school bag? I have two pencils, one notebook and a ruler. I also have a blue pen. Great!',

            questions: [
              {
                q: 'How many pencils does Maria have?',
                options: ['One', 'Two', 'Three'],
                correct: 1,
                why: 'She says she has two pencils.'
              },
              {
                q: 'What does Maria have to write?',
                options: ['A notebook', 'A ruler', 'A blue pen'],
                correct: 2,
                why: 'She has a blue pen.'
              },
              {
                q: 'What other school supply does she have?',
                options: ['A ruler', 'A computer', 'A book'],
                correct: 0,
                why: 'She says she has a ruler.'
              }
            ]
          },

          Speaking: {
            instructions: 'Describe tres útiles escolares que tienes.',

            prompt:
              'Talk about three school supplies you have. Use sentences like: I have a pencil. I have a notebook.'
          }

        }
      }
    },

    {
      id: 'U2-B',
      title: 'What’s in my backpack?',
      description: 'Lee una descripción de una mochila y escribe sobre tus útiles escolares.',
      instructions: 'Completa primero Reading y después Writing.',

      payload: {
        type: 'combined',

        parts: {

          Reading: {
            instructions: 'Lee el texto y responde las preguntas.',

            passage:
              'My name is Alex. This is my backpack. I have three books, two notebooks and a pencil case. My pencil case has four pencils and one blue pen. My backpack is black.',

            questions: [
              {
                q: 'How many books does Alex have?',
                options: ['Two', 'Three', 'Four'],
                correct: 1,
                why: 'He has three books.'
              },
              {
                q: 'What color is the backpack?',
                options: ['Blue', 'Green', 'Black'],
                correct: 2,
                why: 'The backpack is black.'
              },
              {
                q: 'How many pencils are in the pencil case?',
                options: ['Three', 'Four', 'Five'],
                correct: 1,
                why: 'There are four pencils.'
              }
            ]
          },

          Writing: {
            instructions: 'Describe lo que tienes en tu mochila utilizando oraciones sencillas.',

            prompt:
              'Write about your backpack. Name at least four school supplies and describe their colors or quantities.'
          }

        }
      }
    },


    /* =====================================
       UNIDAD 3
    ===================================== */

    {
      id: 'U3-A',
      title: 'Meet my family',
      description: 'Escucha una presentación familiar y practica cómo hablar de tu familia.',
      instructions: 'Completa primero Listening y después Speaking.',

      payload: {
        type: 'combined',

        parts: {

          Listening: {
            instructions: 'Escucha la presentación de la familia de Emma.',

            audioText:
              'Hello! My name is Emma. This is my family. My father is John. My mother is Laura. I have one brother. His name is Peter. We are a happy family.',

            questions: [
              {
                q: 'What is the mother’s name?',
                options: ['Emma', 'Laura', 'Peter'],
                correct: 1,
                why: 'Her mother is Laura.'
              },
              {
                q: 'What is the father’s name?',
                options: ['John', 'Peter', 'David'],
                correct: 0,
                why: 'Her father is John.'
              },
              {
                q: 'Does Emma have a brother?',
                options: ['Yes', 'No', 'Two brothers'],
                correct: 0,
                why: 'She says she has one brother.'
              }
            ]
          },

          Speaking: {
            instructions: 'Presenta a dos integrantes de tu familia.',

            prompt:
              'Introduce two members of your family. Say their names and who they are. Use sentences like: This is my mother. Her name is Ana.'
          }

        }
      }
    },

    {
      id: 'U3-B',
      title: 'My family tree',
      description: 'Lee información sobre una familia y escribe una descripción de la tuya.',
      instructions: 'Completa primero Reading y después Writing.',

      payload: {
        type: 'combined',

        parts: {

          Reading: {
            instructions: 'Lee el texto sobre la familia de Lucas.',

            passage:
              'My name is Lucas. My father is Carlos and my mother is Elena. I have one sister. Her name is Sofia. My grandparents are Pedro and Rosa. I love my family.',

            questions: [
              {
                q: 'What is Lucas’s father’s name?',
                options: ['Pedro', 'Carlos', 'Lucas'],
                correct: 1,
                why: 'His father is Carlos.'
              },
              {
                q: 'What is his sister’s name?',
                options: ['Elena', 'Rosa', 'Sofia'],
                correct: 2,
                why: 'His sister is Sofia.'
              },
              {
                q: 'Who are Pedro and Rosa?',
                options: ['His parents', 'His grandparents', 'His friends'],
                correct: 1,
                why: 'The text identifies them as his grandparents.'
              }
            ]
          },

          Writing: {
            instructions: 'Escribe sobre tu familia y menciona al menos tres integrantes.',

            prompt:
              'Write a short description of your family. Include at least three family members, their names and their relationship to you.'
          }

        }
      }
    },


    /* =====================================
       UNIDAD 4
    ===================================== */

    {
      id: 'U4-A',
      title: 'Around my house',
      description: 'Identifica las habitaciones de una casa y practica describiendo tu hogar.',
      instructions: 'Completa primero Listening y después Speaking.',

      payload: {
        type: 'combined',

        parts: {

          Listening: {
            instructions: 'Escucha la descripción de una casa y responde.',

            audioText:
              'Welcome to my house! There is a living room, a kitchen and two bedrooms. My mother cooks in the kitchen. I sleep in my bedroom. We have a small garden outside.',

            questions: [
              {
                q: 'Where does the mother cook?',
                options: ['In the bedroom', 'In the kitchen', 'In the garden'],
                correct: 1,
                why: 'The mother cooks in the kitchen.'
              },
              {
                q: 'How many bedrooms are there?',
                options: ['One', 'Two', 'Three'],
                correct: 1,
                why: 'There are two bedrooms.'
              },
              {
                q: 'What is outside the house?',
                options: ['A garden', 'A classroom', 'A store'],
                correct: 0,
                why: 'There is a small garden outside.'
              }
            ]
          },

          Speaking: {
            instructions: 'Describe tu casa y menciona algunas habitaciones.',

            prompt:
              'Describe your house. Name at least three rooms and say what you do in one of them.'
          }

        }
      }
    },

    {
      id: 'U4-B',
      title: 'My favorite room',
      description: 'Lee una descripción de una habitación y escribe sobre tu espacio favorito.',
      instructions: 'Completa primero Reading y después Writing.',

      payload: {
        type: 'combined',

        parts: {

          Reading: {
            instructions: 'Lee la descripción de la habitación favorita de Sofia.',

            passage:
              'My favorite room is my bedroom. It is small and comfortable. I have a blue bed, a desk and two chairs. There are books on my desk. I like my bedroom because I can read and study there.',

            questions: [
              {
                q: 'What is Sofia’s favorite room?',
                options: ['The kitchen', 'The bedroom', 'The living room'],
                correct: 1,
                why: 'Her favorite room is her bedroom.'
              },
              {
                q: 'What color is her bed?',
                options: ['Blue', 'Red', 'White'],
                correct: 0,
                why: 'She has a blue bed.'
              },
              {
                q: 'Why does she like her bedroom?',
                options: [
                  'She can cook there.',
                  'She can play football there.',
                  'She can read and study there.'
                ],
                correct: 2,
                why: 'She likes reading and studying there.'
              }
            ]
          },

          Writing: {
            instructions: 'Describe tu habitación favorita utilizando vocabulario sencillo.',

            prompt:
              'Write about your favorite room. Say what room it is, describe at least three objects and explain why you like it.'
          }

        }
      }
    },


    /* =====================================
       UNIDAD 5
    ===================================== */

    {
      id: 'U5-A',
      title: 'A typical day',
      description: 'Escucha una rutina diaria y practica describiendo tus actividades.',
      instructions: 'Completa primero Listening y después Speaking.',

      payload: {
        type: 'combined',

        parts: {

          Listening: {
            instructions: 'Escucha la rutina de David y responde.',

            audioText:
              'Hello! I am David. I wake up at six o’clock. I have breakfast at six thirty. I go to school at seven o’clock. In the afternoon, I do my homework. At night, I read a book and go to bed at nine.',

            questions: [
              {
                q: 'What time does David wake up?',
                options: ['Five o’clock', 'Six o’clock', 'Seven o’clock'],
                correct: 1,
                why: 'He wakes up at six o’clock.'
              },
              {
                q: 'What time does he go to school?',
                options: ['Six o’clock', 'Six thirty', 'Seven o’clock'],
                correct: 2,
                why: 'He goes to school at seven.'
              },
              {
                q: 'What does he do in the afternoon?',
                options: ['He sleeps', 'He does his homework', 'He reads'],
                correct: 1,
                why: 'He does his homework in the afternoon.'
              }
            ]
          },

          Speaking: {
            instructions: 'Describe tres actividades de tu rutina diaria.',

            prompt:
              'Describe your typical day. Say what you do in the morning, afternoon and evening. Use simple sentences.'
          }

        }
      }
    },

    {
      id: 'U5-B',
      title: 'My daily routine',
      description: 'Lee una rutina diaria y escribe sobre tus actividades cotidianas.',
      instructions: 'Completa primero Reading y después Writing.',

      payload: {
        type: 'combined',

        parts: {

          Reading: {
            instructions: 'Lee la rutina de Maria y responde las preguntas.',

            passage:
              'My name is Maria. I get up at five thirty. I take a shower and have breakfast. I go to school at seven. I come home at one o’clock. In the evening, I watch television and do my homework.',

            questions: [
              {
                q: 'What time does Maria get up?',
                options: ['Five thirty', 'Six thirty', 'Seven'],
                correct: 0,
                why: 'She gets up at five thirty.'
              },
              {
                q: 'What time does she go to school?',
                options: ['Six', 'Seven', 'Eight'],
                correct: 1,
                why: 'She goes to school at seven.'
              },
              {
                q: 'What does she do in the evening?',
                options: [
                  'She plays football.',
                  'She goes to school.',
                  'She watches television and does homework.'
                ],
                correct: 2,
                why: 'She watches television and does her homework.'
              }
            ]
          },

          Writing: {
            instructions: 'Escribe una rutina diaria utilizando verbos y expresiones de tiempo sencillas.',

            prompt:
              'Write about your daily routine. Include at least four activities and use time expressions such as in the morning, in the afternoon and at night.'
          }

        }
      }
    },


    /* =====================================
       UNIDAD 6
    ===================================== */

    {
      id: 'U6-A',
      title: 'Things I like',
      description: 'Escucha una conversación sobre gustos personales y habla de tus preferencias.',
      instructions: 'Completa primero Listening y después Speaking.',

      payload: {
        type: 'combined',

        parts: {

          Listening: {
            instructions: 'Escucha lo que le gusta a Anna y responde.',

            audioText:
              'Hi! My name is Anna. I like apples and bananas. My favorite sport is basketball. I love music, especially pop music. I do not like coffee.',

            questions: [
              {
                q: 'What fruit does Anna like?',
                options: ['Apples and bananas', 'Oranges only', 'Grapes'],
                correct: 0,
                why: 'She says she likes apples and bananas.'
              },
              {
                q: 'What is her favorite sport?',
                options: ['Football', 'Basketball', 'Swimming'],
                correct: 1,
                why: 'Her favorite sport is basketball.'
              },
              {
                q: 'What does Anna NOT like?',
                options: ['Music', 'Apples', 'Coffee'],
                correct: 2,
                why: 'She says she does not like coffee.'
              }
            ]
          },

          Speaking: {
            instructions: 'Habla sobre tres cosas que te gustan y una que no te gusta.',

            prompt:
              'Talk about your likes and dislikes. Mention your favorite food, sport, music or hobby. Say at least three things you like and one thing you do not like.'
          }

        }
      }
    },

    {
      id: 'U6-B',
      title: 'My favorite things',
      description: 'Lee sobre las preferencias de un estudiante y escribe sobre tus cosas favoritas.',
      instructions: 'Completa primero Reading y después Writing.',

      payload: {
        type: 'combined',

        parts: {

          Reading: {
            instructions: 'Lee el texto de Carlos y responde las preguntas.',

            passage:
              'Hello! My name is Carlos. My favorite color is blue. My favorite animal is the dog. I love pizza and orange juice. My favorite hobby is playing football with my friends.',

            questions: [
              {
                q: 'What is Carlos’s favorite color?',
                options: ['Green', 'Blue', 'Red'],
                correct: 1,
                why: 'His favorite color is blue.'
              },
              {
                q: 'What is his favorite animal?',
                options: ['The cat', 'The bird', 'The dog'],
                correct: 2,
                why: 'His favorite animal is the dog.'
              },
              {
                q: 'What is his favorite hobby?',
                options: [
                  'Playing football',
                  'Reading books',
                  'Watching television'
                ],
                correct: 0,
                why: 'He likes playing football with his friends.'
              }
            ]
          },

          Writing: {
            instructions: 'Escribe sobre tus cosas favoritas utilizando oraciones sencillas.',

            prompt:
              'Write about your favorite things. Include your favorite color, animal, food, hobby and one activity you enjoy.'
          }

        }
      }
    }

  ];

}


/* =========================================
   VERIFICACIÓN DE LA MIGRACIÓN
========================================= */

function verifyMigratedActivities_() {

  const activities = getActivityRows_();

  const errors = [];

  const expectedIds = [
    'U1-A', 'U1-B',
    'U2-A', 'U2-B',
    'U3-A', 'U3-B',
    'U4-A', 'U4-B',
    'U5-A', 'U5-B',
    'U6-A', 'U6-B'
  ];

  const migrated = activities.filter(function(activity) {
    return expectedIds.indexOf(String(activity.id)) !== -1;
  });

  expectedIds.forEach(function(id) {

    const matches = migrated.filter(function(activity) {
      return String(activity.id) === id;
    });

    if (matches.length !== 1) {
      errors.push(
        id + ': se esperaba una actividad activa y se encontraron ' +
        matches.length
      );

      return;
    }

    const activity = matches[0];

    if (!activity.parts) {
      errors.push(id + ': no tiene partes combinadas.');
      return;
    }

    const skills = Object.keys(activity.parts).sort();

    const isActivityA = id.endsWith('-A');

    const expectedSkills = isActivityA
      ? ['Listening', 'Speaking']
      : ['Reading', 'Writing'];

    expectedSkills.sort();

    if (JSON.stringify(skills) !== JSON.stringify(expectedSkills)) {
      errors.push(
        id + ': habilidades incorrectas: ' + skills.join(', ')
      );
    }

    expectedSkills.forEach(function(skill) {

      const part = activity.parts[skill];

      if (!part) return;

      if (
        (skill === 'Listening' || skill === 'Reading') &&
        (!part.questions || part.questions.length !== 3)
      ) {
        errors.push(
          id + ': ' + skill + ' debe tener tres preguntas.'
        );
      }

      if (
        (skill === 'Speaking' || skill === 'Writing') &&
        !part.prompt
      ) {
        errors.push(
          id + ': falta la consigna de ' + skill + '.'
        );
      }

    });

  });

  return {
    success: errors.length === 0 &&
      migrated.length === 12,
    activeActivities: migrated.length,
    validActivities: migrated.length - errors.length,
    errors: errors
  };

}
