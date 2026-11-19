export const categories = [
  'Identidad y documentos', 'Salud', 'Adulto mayor y programas sociales', 'Trámites municipales',
  'Justicia y orientación legal', 'Trabajo y pensiones', 'Educación', 'Vivienda y servicios básicos',
  'Transporte', 'Seguridad y emergencias', 'Asistencia y servicios comunitarios', 'Servicios financieros y orientación al consumidor',
] as const;

type Entry = [category: number, name: string, institution: string, modality: string, detail: string, keywords: string, sourceUrl: string];
const reniec = 'https://www.gob.pe/institucion/reniec/tramites';
const catalog = 'https://www.gob.pe/catalogos/34-tramitesyservicios';
const entries: Entry[] = [
  [0, 'DNI por primera vez', 'RENIEC', 'Presencial · orientación web', 'Consulta la inscripción inicial y los requisitos para menores o mayores de edad.', 'dni identidad inscripcion documento nacional de identidad', reniec],
  [0, 'Renovación de DNI', 'RENIEC', 'Según el caso · consulta oficial', 'Revisa cómo renovar un documento vencido o por vencer.', 'dni identidad renovar vencimiento', reniec],
  [0, 'Duplicado de DNI', 'RENIEC', 'Mixta', 'Revisa los canales para reemplazar un DNI extraviado o robado.', 'dni identidad duplicado perdida robo', 'https://www.gob.pe/224'],
  [0, 'Rectificación de datos del DNI', 'RENIEC', 'Según el dato · consulta oficial', 'Consulta el procedimiento para corregir o actualizar datos de identificación.', 'dni identidad rectificar direccion domicilio nombre', reniec],
  [0, 'Inscripción de nacimiento', 'RENIEC', 'Según el caso · consulta oficial', 'Consulta los requisitos para registrar un nacimiento.', 'nacimiento inscribir bebe registro civil', reniec],
  [0, 'Copia certificada de acta o partida', 'RENIEC', 'Según el acta · consulta oficial', 'Consulta copias de actas de nacimiento, matrimonio o defunción.', 'partida nacimiento acta matrimonio defuncion certificado registro civil', reniec],
  [1, 'Afiliación virtual al SIS', 'Seguro Integral de Salud', 'Virtual', 'Solicita afiliación si estás en el Perú y careces de otro seguro de salud.', 'sis afiliar seguro salud seguro medico', 'https://www.gob.pe/institucion/sis/campa%C3%B1as/139622-afiliacion-virtual-al-sis'],
  [1, 'Consultar afiliación y centro asignado', 'Seguro Integral de Salud', 'Virtual', 'Consulta tu cobertura y el centro o puesto asignado con tu documento de identidad.', 'sis centro salud posta medico consulta atencion medica', 'https://www.gob.pe/97742-plataforma-conect-sis-servicio-de-consulta-en-linea'],
  [1, 'Consultar establecimientos registrados', 'SUSALUD', 'Virtual · directorio oficial', 'Busca establecimientos inscritos por ubicación en el registro oficial.', 'renipress hospital centro medico medico posta clinica atencion medica consulta medica', 'https://www.gob.pe/institucion/susalud/campa%C3%B1as/95866-consulta-el-renipress'],
  [1, 'Acreditación y centro asistencial de EsSalud', 'EsSalud', 'Virtual', 'Verifica la vigencia de tu seguro y consulta tu centro asignado.', 'essalud seguro medico hospital acreditacion', 'https://www.gob.pe/es/51254-seguro-regular-essalud-seguro-consulta-tu-acreditacion'],
  [1, 'Trámites en VIVA', 'EsSalud', 'Virtual', 'Consulta afiliación de derechohabientes, adscripción y prestaciones económicas.', 'essalud viva derechohabientes subsidio', 'https://www.gob.pe/es/50981-acceder-a-la-plataforma-viva'],
  [1, 'Orientación sobre vacunación', 'Ministerio de Salud', 'Orientación web', 'Consulta campañas y novedades del Ministerio de Salud.', 'vacuna vacunacion vacunatorio', 'https://www.gob.pe/minsa'],
  [2, 'Inscripción en Pensión 65', 'MIDIS · Pensión 65', 'Presencial · orientación web', 'Consulta la afiliación y cómo presentar el Formulario 1000 ante el programa o la municipalidad.', 'pension 65 pension65 cobrar pension adulto mayor programa social', 'https://www.gob.pe/623'],
  [2, 'Afiliación a un CIAM', 'Municipalidad correspondiente', 'Presencial · orientación web', 'Consulta el procedimiento municipal de inscripción y los talleres para personas mayores.', 'ciam centro integral atencion adulto mayor club talleres', 'https://www.gob.pe/37164-afiliarse-al-centro-integral-de-atencion-al-adulto-mayor-ciam-en-la-municipalidad'],
  [3, 'Impuesto predial y arbitrios', 'Municipalidad competente', 'Según la municipalidad', 'Consulta el canal de rentas y las condiciones de pago de tu jurisdicción.', 'predial arbitrios pago tributo rentas municipal', catalog],
  [3, 'Licencias y certificados municipales', 'Municipalidad competente', 'Según la municipalidad', 'Verifica el procedimiento y el TUPA de tu municipalidad.', 'licencia funcionamiento constancia certificado autorizacion municipal tupa', catalog],
  [4, 'Asesoría legal gratuita', 'MINJUSDH · ALEGRA', 'Mixta', 'Consulta la orientación para asuntos familiares, penales, civiles o laborales.', 'abogado asesoria legal orientacion derechos defensa publica', 'https://www.gob.pe/562'],
  [4, 'Conciliación y defensa pública', 'MINJUSDH', 'Orientación web', 'Consulta los centros habilitados y los canales institucionales.', 'conciliacion defensa abogado derechos', 'https://www.gob.pe/minjus'],
  [5, 'Consultar aportes a la ONP', 'ONP', 'Virtual · consulta oficial', 'Solicita tu registro de aportes al Sistema Nacional de Pensiones.', 'onp aporte pension jubilacion cobrar pension', 'https://www.gob.pe/13762-solicitar-informacion-de-aportes'],
  [5, 'Jubilación y trámites de pensión', 'ONP', 'Orientación web', 'Consulta los trámites y requisitos del Sistema Nacional de Pensiones.', 'jubilacion onp pension cobrar pension', 'https://www.gob.pe/onp'],
  [5, 'Orientación sobre AFP', 'SBS', 'Orientación web', 'Identifica los canales para consultas del Sistema Privado de Pensiones.', 'afp jubilacion pension cobrar pension aportes', 'https://www.sbs.gob.pe/'],
  [5, 'Certificado Único Laboral', 'MTPE', 'Virtual', 'Obtén el documento para acreditar información laboral.', 'cul certificado trabajo empleo', 'https://www.gob.pe/47089'],
  [6, 'Certificados, matrícula y educación de adultos', 'MINEDU', 'Orientación web', 'Consulta los canales educativos y el procedimiento correspondiente a tu solicitud.', 'certificado estudios matricula ceba alfabetizacion educacion adultos validar', 'https://www.gob.pe/minedu'],
  [7, 'Orientación por un recibo de agua', 'SUNASS', 'Orientación web', 'Consulta los canales oficiales de orientación sobre agua y saneamiento.', 'recibo agua reclamo factura saneamiento prestadora', 'https://www.gob.pe/sunass'],
  [7, 'Orientación por un recibo de electricidad', 'Osinergmin', 'Orientación web', 'Consulta los canales para usuarios de los servicios de energía.', 'recibo luz electricidad factura reclamo energia', 'https://www.gob.pe/osinergmin'],
  [7, 'Formalización de predios y propiedad', 'COFOPRI', 'Orientación web', 'Consulta trámites de formalización y titulación.', 'casa vivienda propiedad titulo predio formalizacion', 'https://www.gob.pe/cofopri'],
  [7, 'Consultas y publicidad registral', 'SUNARP', 'Orientación web', 'Consulta los servicios para partidas e información registral.', 'sunarp partida registral propiedad vehicular', 'https://www.gob.pe/sunarp'],
  [8, 'Licencia de conducir y duplicados', 'MTC', 'Orientación web', 'Consulta los canales y requisitos según el tipo de licencia.', 'brevete licencia conducir duplicado revalidar transporte', 'https://www.gob.pe/mtc'],
  [8, 'Consultar récord y papeletas', 'MTC', 'Virtual', 'Consulta tu récord de conductor y las infracciones registradas.', 'papeleta multa vehicular conductor licencia', 'https://www.gob.pe/341'],
  [9, 'Denuncias y orientación policial', 'Policía Nacional del Perú', 'Orientación web', 'Consulta los canales policiales. Usa los números de emergencia para urgencias.', 'comisaria denuncia policia inseguridad', 'https://www.gob.pe/pnp'],
  [10, 'Comedores populares y apoyo alimentario', 'Municipalidad competente', 'Orientación municipal', 'Pregunta por el Programa de Complementación Alimentaria y la atención disponible en tu municipio.', 'comedor popular comedor alimentacion asistencia comunitaria', 'https://www.gob.pe/midis'],
  [11, 'Consultar un reclamo ante Indecopi', 'Indecopi', 'Virtual', 'Revisa el estado de un reclamo o de buenos oficios.', 'indecopi reclamo queja consumidor compra', 'https://www.gob.pe/10304-consultar-el-estado-de-reclamos-y-buenos-oficios-en-indecopi'],
  [11, 'Orientación financiera', 'SBS', 'Orientación web', 'Consulta información para usuarios del sistema financiero y de seguros.', 'finanzas banco seguro consumidor reclamo financiero', 'https://www.sbs.gob.pe/'],
];

export const nationalProcedures = entries.map(([category, name, institution, modality, detail, keywords, sourceUrl]) => ({
  category: categories[category], name, institution, modality, detail, keywords, sourceUrl,
}));

