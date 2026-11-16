/**
 * AUTH.GS
 * Autenticación de estudiantes para Aprende+.
 */

/**
 * Inicia sesión con el código y PIN del estudiante.
 * @param {string} code Código del estudiante.
 * @param {string} pin PIN del estudiante.
 * @return {Object} Resultado de autenticación.
 */
function loginStudent(code, pin) {
  try {
    code = String(code || '').trim().toUpperCase();
    pin = String(pin || '').trim();

    if (!code || !pin) {
      return {
        success: false,
        message: 'Ingresa tu código y PIN.'
      };
    }

    const student = getStudentByCode_(code);

    if (student && !student.active) {
      return {
        success: false,
        message: 'Esta cuenta está desactivada.'
      };
    }
    if (!student) {
      return {
        success: false,
        message: 'Código o PIN incorrectos.'
      };
    }

    const pinHash = hashPin_(pin, student.salt);

    if (pinHash !== student.pinHash) {
      return {
        success: false,
        message: 'Código o PIN incorrectos.'
      };
    }

    const token = Utilities.getUuid();

    const session = {
      studentId: student.id,
      name: student.name,
      grade: student.grade
    };

    CacheService.getScriptCache().put(
      'session_' + token,
      JSON.stringify(session),
      21600
    );

    return {
      success: true,
      token: token,
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade
      }
    };

  } catch (error) {
    console.error('Error en loginStudent:', error);

    return {
      success: false,
      message: 'No fue posible iniciar sesión. Intenta nuevamente.'
    };
  }
}

/**
 * Cierra la sesión del estudiante.
 * @param {string} token Token de sesión.
 * @return {Object} Resultado.
 */
function logoutStudent(token) {
  try {
    if (token) {
      CacheService.getScriptCache().remove(
        'session_' + token
      );
    }

    return { success: true };

  } catch (error) {
    console.error('Error en logoutStudent:', error);

    return {
      success: false,
      message: 'No fue posible cerrar la sesión.'
    };
  }
}

/**
 * Recupera los datos del estudiante usando su token.
 * Función interna utilizada por otros archivos.
 *
 * @param {string} token Token de sesión.
 * @return {Object|null} Datos del estudiante.
 */
function getStudentFromToken_(token) {
  if (!token) {
    return null;
  }

  try {
    const cached = CacheService
      .getScriptCache()
      .get('session_' + token);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached);

  } catch (error) {
    console.error('Error al validar sesión:', error);
    return null;
  }
}


/**
 * AUTHENTICATION - DOCENTE
 * Autenticación independiente del módulo docente.
 */

/**
 * Inicia sesión del docente.
 * La contraseña se obtiene de Script Properties.
 *
 * @param {string} password Contraseña del docente.
 * @return {Object} Resultado de autenticación.
 */
function loginTeacher(password) {
  try {
    password = String(password || '').trim();

    if (!password) {
      return {
        success: false,
        message: 'Ingresa la contraseña.'
      };
    }

    const configuredPassword = PropertiesService
      .getScriptProperties()
      .getProperty('TEACHER_PASSWORD');

    if (!configuredPassword) {
      console.error('No está configurada TEACHER_PASSWORD.');

      return {
        success: false,
        message: 'La cuenta docente no está configurada.'
      };
    }

    if (password !== configuredPassword) {
      return {
        success: false,
        message: 'Contraseña incorrecta.'
      };
    }

    const token = Utilities.getUuid();

    const session = {
      role: 'teacher',
      createdAt: new Date().toISOString()
    };

    CacheService.getScriptCache().put(
      'teacher_session_' + token,
      JSON.stringify(session),
      21600
    );

    return {
      success: true,
      token: token
    };

  } catch (error) {
    console.error('Error en loginTeacher:', error);

    return {
      success: false,
      message: 'No fue posible iniciar sesión.'
    };
  }
}

/**
 * Cierra la sesión del docente.
 *
 * @param {string} token Token de sesión.
 * @return {Object} Resultado.
 */
function logoutTeacher(token) {
  try {
    if (token) {
      CacheService.getScriptCache().remove(
        'teacher_session_' + token
      );
    }

    return { success: true };

  } catch (error) {
    console.error('Error en logoutTeacher:', error);

    return {
      success: false,
      message: 'No fue posible cerrar la sesión.'
    };
  }
}

/**
 * Recupera y valida la sesión del docente.
 * Función interna para el backend.
 *
 * @param {string} token Token de sesión.
 * @return {Object|null} Sesión docente.
 */
function getTeacherFromToken_(token) {
  if (!token) {
    return null;
  }

  try {
    const cached = CacheService
      .getScriptCache()
      .get('teacher_session_' + token);

    if (!cached) {
      return null;
    }

    const session = JSON.parse(cached);

    if (session.role !== 'teacher') {
      return null;
    }

    return session;

  } catch (error) {
    console.error('Error al validar sesión docente:', error);
    return null;
  }
}
