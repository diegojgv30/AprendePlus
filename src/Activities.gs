
/**
 * ACTIVITIES.GS
 * Gestión de actividades, evaluaciones y progreso.
 * Aprende+ - Séptimo grado - PreA1.
 *
 * Compatible con las hojas actuales de Google Sheets.
 *
 * Resultados:
 * ResultId, StudentId, ActivityId, Skill, Score,
 * MaxScore, Level, Feedback, AnswersJSON, CreatedAt
 */


/* =========================================
   DATOS PRINCIPALES
========================================= */

/**
 * Obtiene la información principal del estudiante.
 */
function getAppData(token) {
  const student = getStudentFromToken_(token);

  if (!student) {
    return {
      success: false,
      message: 'Tu sesión ha expirado. Inicia sesión nuevamente.'
    };
  }

  try {
    const activities = getActivityRows_();
    const dashboard = buildDashboard_(student.studentId);

    return {
      success: true,

      student: {
        id: student.studentId,
        name: student.name,
        grade: student.grade
      },

      activities: activities.map(function(activity) {
        return {
          id: activity.id,
          skill: activity.skill,
          skills: activity.parts
            ? Object.keys(activity.parts)
            : [activity.skill],
          title: activity.title,
          description: activity.description,
          type: activity.type
        };
      }),

      dashboard: dashboard
    };

  } catch (error) {
    console.error('Error en getAppData:', error);

    return {
      success: false,
      message: 'No fue posible cargar la información.'
    };
  }
}


/* =========================================
   OBTENER ACTIVIDAD
========================================= */

/**
 * Devuelve una actividad sin exponer respuestas correctas.
 *
 * La respuesta es directamente el objeto de actividad.
 */
function getActivity(token, activityId) {
  const student = getStudentFromToken_(token);

  if (!student) {
    throw new Error('Tu sesión ha expirado.');
  }

  const activities = getActivityRows_();

  const activity = activities.find(function(item) {
    return String(item.id) === String(activityId);
  });

  if (!activity) {
    throw new Error('Actividad no encontrada.');
  }

  function publicPart_(part) {
    if (!part) return null;

    return {
      instructions: part.instructions || '',
      content: part.content || '',
      prompt: part.prompt || '',

      questions: (part.questions || []).map(function(question) {
        return {
          question: question.question,
          options: question.options || [],
          explanation: question.explanation || ''
        };
      })
    };
  }

  let publicParts = null;

  if (activity.parts) {
    publicParts = {};

    Object.keys(activity.parts).forEach(function(skill) {
      publicParts[skill] = publicPart_(
        activity.parts[skill]
      );
    });
  }

  return {
    id: activity.id,
    skill: activity.skill,
    title: activity.title,
    description: activity.description,
    type: activity.type,
    instructions: activity.instructions,
    content: activity.content,

    questions: (activity.questions || []).map(function(question) {
      return {
        question: question.question,
        options: question.options || [],
        explanation: question.explanation || ''
      };
    }),

    parts: publicParts
  };
}


/* =========================================
   EVALUACIÓN AUTOMÁTICA
========================================= */

/**
 * Evalúa Listening o Reading.
 *
 * En actividades combinadas recibe la habilidad
 * como cuarto parámetro.
 */
function submitQuiz(token, activityId, answers, skill) {
  const student = getStudentFromToken_(token);

  if (!student) {
    return {
      success: false,
      message: 'Tu sesión ha expirado.'
    };
  }

  try {
    const activities = getActivityRows_();

    const activity = activities.find(function(item) {
      return String(item.id) === String(activityId);
    });

    if (!activity) {
      return {
        success: false,
        message: 'No se encontró la actividad.'
      };
    }

    const evaluatedSkill = String(
      skill || activity.skill || ''
    );

    const allowedSkills = activity.parts
      ? Object.keys(activity.parts)
      : [activity.skill];

    if (allowedSkills.indexOf(evaluatedSkill) === -1) {
      return {
        success: false,
        message: 'La habilidad seleccionada no pertenece a esta actividad.'
      };
    }

    if (
      evaluatedSkill !== 'Listening' &&
      evaluatedSkill !== 'Reading'
    ) {
      return {
        success: false,
        message: 'Esta habilidad no corresponde a una evaluación automática.'
      };
    }

    let questions = activity.questions || [];

    if (activity.parts) {
      questions = activity.parts[evaluatedSkill].questions || [];
    }

    if (!questions.length) {
      return {
        success: false,
        message: 'Esta actividad no tiene preguntas para esta habilidad.'
      };
    }

    if (
      !Array.isArray(answers) ||
      answers.length !== questions.length
    ) {
      return {
        success: false,
        message: 'Las respuestas enviadas no son válidas.'
      };
    }

    let correct = 0;

    const feedback = questions.map(function(question, index) {
      const selected = String(answers[index] || '');
      const expected = String(question.answer || '');

      const isCorrect =
        selected.trim().toLowerCase() ===
        expected.trim().toLowerCase();

      if (isCorrect) {
        correct++;
      }

      return {
        question: question.question,
        selected: selected,
        correctAnswer: expected,
        correct: isCorrect,
        explanation: question.explanation || ''
      };
    });

    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);

    const result = {
      studentId: student.studentId,
      activityId: activity.id,
      skill: evaluatedSkill,
      title: activity.title,
      type: 'quiz',
      correct: correct,
      total: total,
      percentage: percentage,
      feedback: feedback
    };

    saveResult_(result);

    return {
      success: true,
      skill: evaluatedSkill,
      correct: correct,
      total: total,
      score: percentage,
      percentage: percentage,
      feedback: feedback,
      message: getPerformanceMessage_(percentage)
    };

  } catch (error) {
    console.error('Error en submitQuiz:', error);

    return {
      success: false,
      message: 'No fue posible evaluar tus respuestas.'
    };
  }
}

/**
 * Guarda el resultado de Speaking o Writing.
 */

/**
 * Guarda el resultado de Speaking o Writing.
 * Función privada: solo puede ejecutarse desde el servidor.
 */
function saveAiResult_(token, activityId, evaluation, skill) {
  const student = getStudentFromToken_(token);

  if (!student) {
    return {
      success: false,
      message: 'Tu sesión ha expirado.'
    };
  }

  try {
    const activities = getActivityRows_();

    const activity = activities.find(function(item) {
      return String(item.id) === String(activityId);
    });

    if (!activity) {
      return {
        success: false,
        message: 'No se encontró la actividad.'
      };
    }

    if (!evaluation || typeof evaluation !== 'object') {
      return {
        success: false,
        message: 'La evaluación recibida no es válida.'
      };
    }

    const evaluatedSkill = String(
      skill || evaluation.skill || activity.skill || ''
    );

    const allowedSkills = activity.parts
      ? Object.keys(activity.parts)
      : [activity.skill];

    if (allowedSkills.indexOf(evaluatedSkill) === -1) {
      return {
        success: false,
        message: 'La habilidad evaluada no pertenece a esta actividad.'
      };
    }

    if (
      evaluatedSkill !== 'Speaking' &&
      evaluatedSkill !== 'Writing'
    ) {
      return {
        success: false,
        message: 'Esta habilidad no corresponde a una evaluación con IA.'
      };
    }

    const score = Math.max(
      0,
      Math.min(100, Number(evaluation.score) || 0)
    );

    const result = {
      studentId: student.studentId,
      activityId: activity.id,
      skill: evaluatedSkill,
      title: activity.title,
      type: 'ai',
      correct: null,
      total: null,
      percentage: score,
      feedback: evaluation.feedback || '',
      strengths: Array.isArray(evaluation.strengths)
        ? evaluation.strengths
        : [],
      improvements: Array.isArray(evaluation.improvements)
        ? evaluation.improvements
        : [],
      recommendation: evaluation.recommendation || ''
    };

    saveResult_(result);

    return {
      success: true,
      skill: evaluatedSkill,
      score: score,
      percentage: score,
      feedback: result.feedback,
      strengths: result.strengths,
      improvements: result.improvements,
      recommendation: result.recommendation,
      message: getPerformanceMessage_(score)
    };

  } catch (error) {
    console.error('Error en saveAiResult_:', error);

    return {
      success: false,
      message: 'No fue posible guardar la evaluación.'
    };
  }
}




/**
 * Guarda un resultado en las 10 columnas originales.
 */
function saveResult_(result) {
  const sheet = getSheet_('Resultados');

  let recommendation = result.recommendation || '';

  if (Array.isArray(recommendation)) {
    recommendation = recommendation.join(' ');
  } else if (typeof recommendation !== 'string') {
    recommendation = String(recommendation);
  }

  const details = {
    correct: result.correct,
    total: result.total,
    feedback: result.feedback || '',
    strengths: result.strengths || [],
    improvements: result.improvements || [],
    recommendation: recommendation,
    answers: result.answers || []
  };

  const score = Number(result.percentage) || 0;

  const level = score >= 90
    ? 'Excelente'
    : score >= 70
      ? 'Bueno'
      : score >= 50
        ? 'En progreso'
        : 'Necesita refuerzo';

  sheet.appendRow([
    Utilities.getUuid(),
    result.studentId,
    result.activityId,
    result.skill,
    score,
    100,
    level,
    typeof result.feedback === 'string'
      ? result.feedback
      : JSON.stringify(result.feedback || ''),
    JSON.stringify(details),
    new Date()
  ]);
}



/* =========================================
   DASHBOARD Y ESTADÍSTICAS
========================================= */


/**
 * Calcula el progreso real del estudiante.
 *
 * Una actividad combinada solo cuenta como completada
 * cuando tiene resultados de todas sus habilidades.
 *
 * Para cada actividad y habilidad utiliza únicamente
 * el intento más reciente.
 *
 * Los promedios por habilidad también se calculan
 * utilizando el último intento de cada actividad.
 */
function buildDashboard_(studentId) {
  const sheet = getSheet_('Resultados');
  const data = sheet.getDataRange().getValues();

  const records = data.slice(1)
    .map(function(row, index) {
      return {
        activityId: String(row[2] || ''),
        skill: String(row[3] || ''),
        score: Number(row[4]) || 0,
        date: row[9] ? new Date(row[9]).getTime() : NaN,
        rowIndex: index
      };
    })
    .filter(function(record) {
      const originalRow = data[record.rowIndex + 1];
      return String(originalRow[1]) === String(studentId);
    });

  const activities = getActivityRows_();

  // Conservar el intento más reciente por actividad y habilidad.
  const grouped = {};

  records.forEach(function(record) {
    const activityId = record.activityId;
    const skill = record.skill;

    if (!grouped[activityId]) {
      grouped[activityId] = {};
    }

    const current = grouped[activityId][skill];

    const isMoreRecent =
      !current ||
      (
        Number.isFinite(record.date) &&
        (
          !Number.isFinite(current.date) ||
          record.date > current.date ||
          (
            record.date === current.date &&
            record.rowIndex > current.rowIndex
          )
        )
      ) ||
      (
        !Number.isFinite(record.date) &&
        !Number.isFinite(current.date) &&
        record.rowIndex > current.rowIndex
      );

    if (isMoreRecent) {
      grouped[activityId][skill] = record;
    }
  });

  const completedScores = [];

  // Promedios individuales por habilidad.
  const skills = {
    Listening: [],
    Speaking: [],
    Reading: [],
    Writing: []
  };

  activities.forEach(function(activity) {
    const activityId = String(activity.id);
    const results = grouped[activityId];

    if (!results) return;

    const requiredSkills = activity.parts
      ? Object.keys(activity.parts)
      : [activity.skill];

    // Añadir el último resultado de cada habilidad
    // al cálculo de su promedio individual.
    requiredSkills.forEach(function(skill) {
      const result = results[skill];

      if (result && skills[skill]) {
        skills[skill].push(result.score);
      }
    });

    // Una actividad se completa cuando tiene
    // resultados de todas sus habilidades.
    const completed = requiredSkills.every(function(skill) {
      return Object.prototype.hasOwnProperty.call(results, skill);
    });

    if (!completed) return;

    const scores = requiredSkills.map(function(skill) {
      return results[skill].score;
    });

    const activityAverage = scores.reduce(function(sum, score) {
      return sum + score;
    }, 0) / scores.length;

    completedScores.push(activityAverage);
  });

  const totalActivities = completedScores.length;

  const average = totalActivities
    ? Math.round(
        completedScores.reduce(function(sum, score) {
          return sum + score;
        }, 0) / totalActivities
      )
    : 0;

  const skillProgress = {};

  Object.keys(skills).forEach(function(skill) {
    const values = skills[skill];

    skillProgress[skill] = values.length
      ? Math.round(
          values.reduce(function(sum, value) {
            return sum + value;
          }, 0) / values.length
        )
      : 0;
  });

  return {
    totalActivities: totalActivities,
    average: average,
    skillProgress: skillProgress,
    badges: getBadges_(totalActivities, average)
  };
}

/* =========================================
   HISTORIAL Y PROGRESO
========================================= */

/**
 * Obtiene los resultados individuales del estudiante.
 */
function getProgress(token) {
  const student = getStudentFromToken_(token);

  if (!student) {
    return {
      success: false,
      message: 'Tu sesión ha expirado.'
    };
  }

  try {
    const sheet = getSheet_('Resultados');
    const data = sheet.getDataRange().getValues();

    const activities = getActivityRows_();

    const activityTitles = {};

    activities.forEach(function(activity) {
      activityTitles[String(activity.id)] = activity.title;
    });

    const records = data.slice(1)
      .filter(function(row) {
        return String(row[1]) === String(student.studentId);
      })
      .map(function(row) {
        let details = {};

        try {
          details = JSON.parse(row[8] || '{}');
        } catch (error) {
          details = {};
        }

        const score = Number(row[4]) || 0;
        let feedback = row[7] || '';
        if (typeof feedback === 'string' && /^[\[{]/.test(feedback.trim())) {
          try { feedback = JSON.parse(feedback); } catch (error) { /* conservar texto original */ }
        }

        return {
          id: row[0],
          activityId: row[2],
          title: activityTitles[String(row[2])] || String(row[2]),
          skill: row[3],
          score: score,
          percentage: score,
          maxScore: Number(row[5]) || 100,
          level: row[6],
          feedback: feedback,
          correct: details.correct ?? null,
          total: details.total ?? null,
          strengths: details.strengths || [],
          improvements: details.improvements || [],
          recommendation: details.recommendation || '',
          date: row[9]
            ? new Date(row[9]).toISOString()
            : null
        };
      })
      .reverse();

    return {
      success: true,
      records: records,
      dashboard: buildDashboard_(student.studentId)
    };

  } catch (error) {
    console.error('Error en getProgress:', error);

    return {
      success: false,
      message: 'No fue posible consultar tu progreso.'
    };
  }
}


/* =========================================
   MENSAJES DE RENDIMIENTO
========================================= */

/**
 * Genera un mensaje según la puntuación.
 */
function getPerformanceMessage_(percentage) {
  if (percentage >= 90) {
    return '¡Excelente trabajo! Dominas muy bien esta actividad.';
  }

  if (percentage >= 70) {
    return '¡Buen trabajo! Sigue practicando para mejorar.';
  }

  if (percentage >= 50) {
    return 'Vas avanzando. Repasa los contenidos y vuelve a intentarlo.';
  }

  return 'Necesitas practicar un poco más. ¡No te rindas!';
}


/* =========================================
   INSIGNIAS
========================================= */

/**
 * Calcula las insignias según actividades completas.
 */
function getBadges_(totalActivities, average) {
  const badges = [];

  if (totalActivities >= 1) {
    badges.push({
      id: 'first-step',
      name: 'Primer paso',
      description: 'Completaste tu primera actividad.'
    });
  }

  if (totalActivities >= 4) {
    badges.push({
      id: 'active-learner',
      name: 'Estudiante activo',
      description: 'Completaste cuatro actividades.'
    });
  }

  if (totalActivities >= 8) {
    badges.push({
      id: 'explorer',
      name: 'Explorador',
      description: 'Completaste ocho actividades.'
    });
  }

  if (totalActivities > 0 && average >= 90) {
    badges.push({
      id: 'excellent',
      name: 'Excelente',
      description: 'Alcanzaste un promedio de 90 o más.'
    });
  }

  return badges;
}


/**
 * RESUMEN GENERAL DEL GRUPO
 * Solo accesible mediante una sesión docente válida.
 */
function getTeacherDashboard(token) {
  const teacher = getTeacherFromToken_(token);

  if (!teacher) {
    return {
      success: false,
      message: 'La sesión docente ha expirado. Inicia sesión nuevamente.'
    };
  }

  try {
    const studentSheet = getSheet_('Estudiantes');
    const studentData = studentSheet.getDataRange().getValues();
    const activityCount = getActivityRows_().length;

    const students = studentData.slice(1)
      .filter(function(row) {
        return row[0] && (
          row[6] === true ||
          String(row[6]).toUpperCase() === 'TRUE'
        );
      })
      .map(function(row) {
        const dashboard = buildDashboard_(row[0]);
        const completed = dashboard.totalActivities || 0;

        return {
          id: String(row[0]),
          code: String(row[1] || ''),
          name: String(row[2] || ''),
          grade: String(row[3] || ''),
          totalActivities: completed,
          activityCount: activityCount,
          progress: activityCount
            ? Math.round((completed / activityCount) * 100)
            : 0,
          average: dashboard.average || 0,
          skillProgress: dashboard.skillProgress || {},
          status: completed > 0 ? 'Con actividad' : 'Sin actividad'
        };
      });

    const started = students.filter(function(student) {
      return student.totalActivities > 0;
    }).length;

    const totalCompleted = students.reduce(function(sum, student) {
      return sum + student.totalActivities;
    }, 0);

    const totalPossible = students.length * activityCount;

    const studentsWithResults = students.filter(function(student) {
      return student.totalActivities > 0;
    });

    const groupAverage = studentsWithResults.length
      ? Math.round(
          studentsWithResults.reduce(function(sum, student) {
            return sum + student.average;
          }, 0) / studentsWithResults.length
        )
      : 0;

    // Promedios por habilidad usando el último intento
    // de cada estudiante, actividad y habilidad.
    const resultData = getSheet_('Resultados')
      .getDataRange()
      .getValues();

    const latestResults = {};

    resultData.slice(1).forEach(function(row, index) {
      const studentId = String(row[1] || '');
      const activityId = String(row[2] || '');
      const skill = String(row[3] || '');

      if (!studentId || !activityId || !skill) return;

      const key = studentId + '|' + activityId + '|' + skill;
      const rawDate = row[9]
        ? new Date(row[9]).getTime()
        : NaN;

      const current = latestResults[key];

      const isNewer = !current ||
        (
          Number.isFinite(rawDate) &&
          (
            !Number.isFinite(current.date) ||
            rawDate > current.date ||
            (rawDate === current.date && index > current.index)
          )
        ) ||
        (
          !Number.isFinite(rawDate) &&
          !Number.isFinite(current.date) &&
          index > current.index
        );

      if (isNewer) {
        latestResults[key] = {
          skill: skill,
          score: Number(row[4]) || 0,
          date: rawDate,
          index: index
        };
      }
    });

    const skillTotals = {
      Listening: { total: 0, count: 0 },
      Speaking: { total: 0, count: 0 },
      Reading: { total: 0, count: 0 },
      Writing: { total: 0, count: 0 }
    };

    Object.keys(latestResults).forEach(function(key) {
      const result = latestResults[key];
      const stat = skillTotals[result.skill];

      if (stat) {
        stat.total += result.score;
        stat.count++;
      }
    });

    const skillAverages = {};

    Object.keys(skillTotals).forEach(function(skill) {
      const stat = skillTotals[skill];

      skillAverages[skill] = {
        average: stat.count
          ? Math.round(stat.total / stat.count)
          : 0,
        evaluations: stat.count
      };
    });

    const skillsWithResults = Object.keys(skillAverages)
      .filter(function(skill) {
        return skillAverages[skill].evaluations > 0;
      });

    const weakestSkill = skillsWithResults.length
      ? skillsWithResults.reduce(function(weakest, skill) {
          return skillAverages[skill].average <
            skillAverages[weakest].average
            ? skill
            : weakest;
        })
      : null;

    const studentsNeedingSupport = students.filter(function(student) {
      return student.totalActivities > 0 &&
        student.average < 70;
    });

    return {
      success: true,
      summary: {
        totalStudents: students.length,
        studentsWithActivity: started,
        studentsWithoutActivity: students.length - started,
        groupProgress: totalPossible
          ? Math.round((totalCompleted / totalPossible) * 100)
          : 0,
        groupAverage: groupAverage,
        completedActivities: totalCompleted,
        possibleActivities: totalPossible,
        studentsNeedingSupport: studentsNeedingSupport.length,
        weakestSkill: weakestSkill
      },
      skillAverages: skillAverages,
      studentsNeedingSupport: studentsNeedingSupport,
      students: students
    };

  } catch (error) {
    console.error('Error en getTeacherDashboard:', error);

    return {
      success: false,
      message: 'No fue posible obtener el resumen del grupo.'
    };
  }
}


/**
 * CONSULTA INDIVIDUAL DEL ESTUDIANTE
 * Devuelve progreso e historial para el docente.
 */
function getTeacherStudentProgress(token, studentId) {
  const teacher = getTeacherFromToken_(token);

  if (!teacher) {
    return {
      success: false,
      message: 'La sesión docente ha expirado.'
    };
  }

  try {
    studentId = String(studentId || '').trim();

    if (!studentId) {
      return {
        success: false,
        message: 'No se indicó el estudiante.'
      };
    }

    const studentData = getSheet_('Estudiantes')
      .getDataRange()
      .getValues();

    let student = null;

    for (let i = 1; i < studentData.length; i++) {
      if (String(studentData[i][0]) === studentId) {
        student = {
          id: String(studentData[i][0]),
          code: String(studentData[i][1] || ''),
          name: String(studentData[i][2] || ''),
          grade: String(studentData[i][3] || ''),
          active: studentData[i][6] === true ||
            String(studentData[i][6]).toUpperCase() === 'TRUE'
        };
        break;
      }
    }

    if (!student) {
      return {
        success: false,
        message: 'No se encontró el estudiante.'
      };
    }

    const activities = getActivityRows_();
    const activityTitles = {};

    activities.forEach(function(activity) {
      activityTitles[String(activity.id)] = activity.title;
    });

    const data = getSheet_('Resultados')
      .getDataRange()
      .getValues();

    const records = data.slice(1)
      .filter(function(row) {
        return String(row[1]) === studentId;
      })
      .map(function(row) {
        let details = {};

        try {
          details = JSON.parse(row[8] || '{}');
        } catch (error) {
          details = {};
        }

        const date = row[9] ? new Date(row[9]) : null;

        return {
          id: String(row[0] || ''),
          activityId: String(row[2] || ''),
          title: activityTitles[String(row[2])] ||
            String(row[2] || ''),
          skill: String(row[3] || ''),
          score: Number(row[4]) || 0,
          maxScore: Number(row[5]) || 100,
          level: String(row[6] || ''),
          feedback: String(row[7] || ''),
          correct: details.correct ?? null,
          total: details.total ?? null,
          strengths: details.strengths || [],
          improvements: details.improvements || [],
          recommendation: details.recommendation || '',
          date: date && !isNaN(date.getTime())
            ? date.toISOString()
            : null
        };
      })
      .reverse();

    return {
      success: true,
      student: student,
      dashboard: buildDashboard_(studentId),
      records: records
    };

  } catch (error) {
    console.error('Error en getTeacherStudentProgress:', error);

    return {
      success: false,
      message: 'No fue posible consultar el progreso del estudiante.'
    };
  }
}


/**
 * REGISTRO DE ESTUDIANTES
 * Solo el docente puede crear cuentas.
 */
function createStudent(token, name, pin) {
  const teacher = getTeacherFromToken_(token);

  if (!teacher) {
    return {
      success: false,
      message: 'La sesión docente ha expirado.'
    };
  }

  name = String(name || '').trim();
  pin = String(pin || '').trim();

  if (name.length < 3 || name.length > 80) {
    return {
      success: false,
      message: 'El nombre debe tener entre 3 y 80 caracteres.'
    };
  }

  if (!/^\d{4}$/.test(pin)) {
    return {
      success: false,
      message: 'El PIN debe contener exactamente cuatro números.'
    };
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const sheet = getSheet_('Estudiantes');
    const data = sheet.getDataRange().getValues();

    let maxNumber = 0;

    data.slice(1).forEach(function(row) {
      const studentId = String(row[0] || '');
      const code = String(row[1] || '');

      const idMatch = studentId.match(/^STU-(\d+)$/i);
      const codeMatch = code.match(/^EST-(\d+)$/i);

      if (idMatch) {
        maxNumber = Math.max(maxNumber, Number(idMatch[1]));
      }

      if (codeMatch) {
        maxNumber = Math.max(maxNumber, Number(codeMatch[1]));
      }
    });

    const nextNumber = maxNumber + 1;
    const suffix = String(nextNumber).padStart(3, '0');

    const studentId = 'STU-' + suffix;
    const code = 'EST-' + suffix;

    // Comprobar que el código no exista.
    if (getStudentByCode_(code)) {
      throw new Error('El código generado ya existe.');
    }

    const salt = Utilities.getUuid();
    const pinHash = hashPin_(pin, salt);

    sheet.appendRow([
      studentId,
      code,
      name,
      '7.º',
      salt,
      pinHash,
      true,
      new Date()
    ]);

    return {
      success: true,
      message: 'Estudiante registrado correctamente.',
      student: {
        id: studentId,
        code: code,
        name: name,
        grade: '7.º',
        pin: pin
      }
    };

  } catch (error) {
    console.error('Error en createStudent:', error);

    return {
      success: false,
      message: 'No fue posible registrar al estudiante.'
    };

  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}
