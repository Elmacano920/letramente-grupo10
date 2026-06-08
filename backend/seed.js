/**
 * Letramente — Seeder Completo v3
 * Grupo 10 | Aprende, Comprende, Crea
 *
 *  TOTAL: ~90 retos
 *  Categorías:
 *    Vocales:      10 (con frases)
 *    Consonantes:  21 (todo el abecedario con animales/objetos)
 *    Silabas:      20 (completar sílabas)
 *    Palabras:     40 (animales, colores, familia, alimentos, objetos, naturaleza)
 */

require('dotenv').config();
const path     = require('path');
const fs       = require('fs');
const { Reto } = require('./src/config/database');

const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// ══════════════════════════════════════════════════════
// VOCALES — 10 retos
// ══════════════════════════════════════════════════════
const VOCALES = [
  { correc: 'A', emoji: '🍎', palabra: 'AVIÓN',    incorrectas: ['E','I','O'] },
  { correc: 'A', emoji: '🦅', palabra: 'ÁGUILA',   incorrectas: ['E','I','U'] },
  { correc: 'E', emoji: '🐘', palabra: 'ELEFANTE', incorrectas: ['A','I','O'] },
  { correc: 'E', emoji: '⭐', palabra: 'ESTRELLA', incorrectas: ['A','U','I'] },
  { correc: 'I', emoji: '🦎', palabra: 'IGUANA',   incorrectas: ['A','E','U'] },
  { correc: 'I', emoji: '🌈', palabra: 'IRIS',     incorrectas: ['A','O','U'] },
  { correc: 'O', emoji: '🐻', palabra: 'OSO',      incorrectas: ['A','E','I'] },
  { correc: 'O', emoji: '🌊', palabra: 'OLA',      incorrectas: ['A','U','I'] },
  { correc: 'U', emoji: '🍇', palabra: 'UVA',      incorrectas: ['A','E','O'] },
  { correc: 'U', emoji: '🦄', palabra: 'UNICORNIO',incorrectas: ['A','E','I'] },
].map(v => ({
  titulo:    `La vocal ${v.correc} — ${v.palabra}`,
  categoria: 'Vocales',
  dificultad: 1,
  puntos_base: 10,
  instruccion: `¿Con qué vocal empieza la palabra ${v.palabra}?`,
  emoji: v.emoji,
  activo: true,
  palabraClave: v.palabra,
  respuestaCorrecta: v.correc,
  opciones: shuffle([
    { texto: v.correc,          esCorrecta: true  },
    { texto: v.incorrectas[0],  esCorrecta: false },
    { texto: v.incorrectas[1],  esCorrecta: false },
    { texto: v.incorrectas[2],  esCorrecta: false },
  ]),
}));

// ══════════════════════════════════════════════════════
// CONSONANTES — Todo el abecedario (21 letras)
// ══════════════════════════════════════════════════════
const LETRAS_CONSONANTES = [
  { letra: 'B', emoji: '🦋', palabra: 'BURRO',      mal: ['D','P','V'] },
  { letra: 'C', emoji: '🐴', palabra: 'CABALLO',    mal: ['G','K','S'] },
  { letra: 'D', emoji: '🐬', palabra: 'DELFÍN',     mal: ['B','F','T'] },
  { letra: 'F', emoji: '🌺', palabra: 'FLOR',       mal: ['P','V','H'] },
  { letra: 'G', emoji: '🐱', palabra: 'GATO',       mal: ['C','J','K'] },
  { letra: 'H', emoji: '🏡', palabra: 'HOJA',       mal: ['J','G','F'] },
  { letra: 'J', emoji: '🦒', palabra: 'JIRAFA',     mal: ['G','H','Y'] },
  { letra: 'K', emoji: '🦘', palabra: 'KOALA',      mal: ['C','G','Q'] },
  { letra: 'L', emoji: '🦁', palabra: 'LEONA',      mal: ['R','N','M'] },
  { letra: 'M', emoji: '🐒', palabra: 'MONO',       mal: ['N','H','B'] },
  { letra: 'N', emoji: '🌙', palabra: 'NOCHE',      mal: ['M','Ñ','L'] },
  { letra: 'Ñ', emoji: '🍞', palabra: 'ÑAME',       mal: ['N','M','L'] },
  { letra: 'P', emoji: '🐦', palabra: 'PÁJARO',     mal: ['B','F','T'] },
  { letra: 'Q', emoji: '🧀', palabra: 'QUESO',      mal: ['C','G','K'] },
  { letra: 'R', emoji: '🐸', palabra: 'RANA',       mal: ['L','N','D'] },
  { letra: 'S', emoji: '🌞', palabra: 'SOL',        mal: ['C','Z','T'] },
  { letra: 'T', emoji: '🐢', palabra: 'TORTUGA',    mal: ['D','P','B'] },
  { letra: 'V', emoji: '🐄', palabra: 'VACA',       mal: ['B','F','P'] },
  { letra: 'W', emoji: '🍉', palabra: 'WASABI',     mal: ['V','B','U'] },
  { letra: 'Y', emoji: '🌿', palabra: 'YEMA',       mal: ['J','LL','I'] },
  { letra: 'Z', emoji: '🦊', palabra: 'ZORRO',      mal: ['S','C','X'] },
];

const CONSONANTES = LETRAS_CONSONANTES.map(c => ({
  titulo:    `La letra ${c.letra} — ${c.palabra}`,
  categoria: 'Consonantes',
  dificultad: c.letra.length > 1 ? 2 : 1,
  puntos_base: 12,
  instruccion: `¿Con qué letra empieza la palabra ${c.palabra}?`,
  emoji: c.emoji,
  activo: true,
  palabraClave: c.palabra,
  respuestaCorrecta: c.letra,
  opciones: shuffle([
    { texto: c.letra,    esCorrecta: true  },
    { texto: c.mal[0],   esCorrecta: false },
    { texto: c.mal[1],   esCorrecta: false },
    { texto: c.mal[2],   esCorrecta: false },
  ]),
}));

// ══════════════════════════════════════════════════════
// SÍLABAS — 25 retos (completar la SÍLABA que falta)
// Enfoque fonético-silábico del currículo venezolano:
//   PA-TO, SA-PO, LU-NA, ME-SA, MA-PA…
// ══════════════════════════════════════════════════════
const SILABAS_DATA = [
  // Letra M
  { palabra: 'MAMÁ', silabas: ['MA','MÁ'],  blancoEn: 1, imagen: '/images/mama.png',  emoji: '👩', distractores: ['ME','MI','MO'] },
  { palabra: 'MESA', silabas: ['ME','SA'],  blancoEn: 0, imagen: '/images/mesa.png',  emoji: '🪑', distractores: ['MA','MI','MO'] },
  { palabra: 'MAPA', silabas: ['MA','PA'],  blancoEn: 1, imagen: '/images/mapa.png',  emoji: '🗺️', distractores: ['PE','PI','PO'] },
  // Letra P
  { palabra: 'PAPÁ', silabas: ['PA','PÁ'],  blancoEn: 0, imagen: '/images/papa.png',  emoji: '👨', distractores: ['MA','SA','LA'] },
  { palabra: 'PATO', silabas: ['PA','TO'],  blancoEn: 1, imagen: '/images/pato.png',  emoji: '🦆', distractores: ['TA','TE','TI'] },
  { palabra: 'POLO', silabas: ['PO','LO'],  blancoEn: 0, imagen: '/images/polo.png',  emoji: '🧊', distractores: ['LA','LO','LU'] },
  // Letra S
  { palabra: 'SAPO', silabas: ['SA','PO'],  blancoEn: 1, imagen: '/images/sapo.png',  emoji: '🐸', distractores: ['PA','PE','PI'] },
  { palabra: 'SOPA', silabas: ['SO','PA'],  blancoEn: 0, imagen: '/images/sopa.png',  emoji: '🥣', distractores: ['MA','NA','LA'] },
  { palabra: 'SILO', silabas: ['SI','LO'],  blancoEn: 1, imagen: '/images/silo.png',  emoji: '🌾', distractores: ['LA','LE','LU'] },
  // Letra L
  { palabra: 'LUNA', silabas: ['LU','NA'],  blancoEn: 1, imagen: '/images/luna.png',  emoji: '🌙', distractores: ['NO','NE','NI'] },
  { palabra: 'LOMA', silabas: ['LO','MA'],  blancoEn: 0, imagen: '/images/loma.png',  emoji: '⛰️', distractores: ['SA','PA','NA'] },
  { palabra: 'LUPA', silabas: ['LU','PA'],  blancoEn: 1, imagen: '/images/lupa.png',  emoji: '🔍', distractores: ['PE','PI','PO'] },
  // Letra T
  { palabra: 'TAPA', silabas: ['TA','PA'],  blancoEn: 0, imagen: '/images/tapa.png',  emoji: '🫙', distractores: ['SA','MA','NA'] },
  { palabra: 'TINO', silabas: ['TI','NO'],  blancoEn: 1, imagen: '/images/tino.png',  emoji: '🎯', distractores: ['NA','NE','NI'] },
  // Letra N
  { palabra: 'NIDO', silabas: ['NI','DO'],  blancoEn: 1, imagen: '/images/nido.png',  emoji: '🪺', distractores: ['DA','DE','DU'] },
  { palabra: 'NUDO', silabas: ['NU','DO'],  blancoEn: 0, imagen: '/images/nudo.png',  emoji: '🪢', distractores: ['MA','SA','TA'] },
  // Letra D
  { palabra: 'DADO', silabas: ['DA','DO'],  blancoEn: 1, imagen: '/images/dado.png',  emoji: '🎲', distractores: ['DE','DI','DU'] },
  { palabra: 'DEDO', silabas: ['DE','DO'],  blancoEn: 0, imagen: '/images/dedo.png',  emoji: '👆', distractores: ['TA','SA','LA'] },
  // Mezcla avanzada
  { palabra: 'PUMA', silabas: ['PU','MA'],  blancoEn: 1, imagen: '/images/puma.png',  emoji: '🐆', distractores: ['ME','MI','MO'] },
  { palabra: 'DUNA', silabas: ['DU','NA'],  blancoEn: 0, imagen: '/images/duna.png',  emoji: '🏜️', distractores: ['SA','TA','LA'] },
  { palabra: 'MIMO', silabas: ['MI','MO'],  blancoEn: 1, imagen: '/images/mimo.png',  emoji: '🤡', distractores: ['MA','ME','MU'] },
  { palabra: 'POLO', silabas: ['PO','LO'],  blancoEn: 1, imagen: '/images/polo.png',  emoji: '🧊', distractores: ['LA','LE','LU'] },
  { palabra: 'SILO', silabas: ['SI','LO'],  blancoEn: 0, imagen: '/images/silo.png',  emoji: '🌾', distractores: ['MA','PA','NA'] },
  { palabra: 'TAPA', silabas: ['TA','PA'],  blancoEn: 1, imagen: '/images/tapa.png',  emoji: '🫙', distractores: ['PE','PI','PO'] },
  { palabra: 'LOMA', silabas: ['LO','MA'],  blancoEn: 1, imagen: '/images/loma.png',  emoji: '⛰️', distractores: ['ME','MI','MU'] },
];

const SILABAS = SILABAS_DATA.map(s => {
  const silabaMissing = s.silabas[s.blancoEn];
  // opciones = la correcta + 3 distractores mezclados
  const opciones = shuffle([
    { texto: silabaMissing,       esCorrecta: true  },
    { texto: s.distractores[0],  esCorrecta: false },
    { texto: s.distractores[1],  esCorrecta: false },
    { texto: s.distractores[2],  esCorrecta: false },
  ]);
  return {
    titulo:            `Completa: ${s.silabas.join(' - ')}`,
    categoria:         'Silabas',
    tipoReto:          'silaba',          // ← NUEVO: distingue del tipo letra
    dificultad:        2,
    puntos_base:       15,
    instruccion:       `¿Qué sílaba falta en la palabra ${s.palabra}?`,
    emoji:             s.emoji,
    imagenUrl:         s.imagen,          // ← NUEVO: ruta de imagen
    activo:            true,
    palabraClave:      s.palabra,
    respuestaCorrecta: silabaMissing,
    silabas:           s.silabas.map((txt, i) => ({
      texto:    txt,
      isBlank:  i === s.blancoEn,
      posicion: i,
    })),
    opciones,
  };
});

// ══════════════════════════════════════════════════════
// PALABRAS — 40 retos (animales, colores, familia,
//            alimentos, cuerpo, transporte, naturaleza)
// ══════════════════════════════════════════════════════
const PALABRAS_DATA = [
  // 🐾 Animales
  { c:'SOL',       e:'☀️',  p:'brilla en el día',          m:['SAL','SIL','SUL']        },
  { c:'LUNA',      e:'🌙',  p:'satélite de la Tierra',     m:['LANA','LONA','LENA']      },
  { c:'PERRO',     e:'🐶',  p:'dice guau guau',            m:['PERO','PARRO','PERRO'.split('').reverse().join('')] },
  { c:'GATO',      e:'🐱',  p:'dice miau miau',            m:['GOTO','GUTO','GATA']      },
  { c:'PATO',      e:'🦆',  p:'nada en el lago',           m:['PITO','PUTO','POTE']      },
  { c:'RANA',      e:'🐸',  p:'salta y dice croac',        m:['RAMA','RONA','RUNA']      },
  { c:'VACA',      e:'🐄',  p:'nos da leche',              m:['BACA','VOCA','VUCA']      },
  { c:'PÁJARO',    e:'🐦',  p:'vuela y canta',             m:['PAJERO','PAJARO','PÁJERO'] },
  { c:'TORTUGA',   e:'🐢',  p:'camina muy despacio',       m:['TORTOGA','TORTUCA','TURTUGA'] },
  { c:'MARIPOSA',  e:'🦋',  p:'insecto con alas de color', m:['MARIPOZA','MAROPOSA','MARIPOSE'] },
  { c:'ELEFANTE',  e:'🐘',  p:'animal con trompa larga',   m:['ELEFANTA','ELIFANTE','ELEFENTE'] },
  { c:'JIRAFA',    e:'🦒',  p:'cuello muy largo',          m:['GIRAFA','JIRAFA'.split('').reverse().join(''),'JIREFA'] },
  { c:'CEBRA',     e:'🦓',  p:'rayas negras y blancas',    m:['ZEBRA','SEBRA','CIBRA']   },
  { c:'MONO',      e:'🐒',  p:'vive en los árboles',       m:['MONA','MUNO','MANO']      },
  { c:'BURRO',     e:'🫏',  p:'transporte de campo',       m:['BURO','BORRO','BURRO'.split('').reverse().join('')]  },
  // 🍎 Alimentos
  { c:'MANZANA',   e:'🍎',  p:'fruta roja y crujiente',    m:['MANSANA','MANZENA','MANZANA'.split('').reverse().join('')] },
  { c:'NARANJA',   e:'🍊',  p:'fruta de color naranja',    m:['NARANGA','NARANXA','NARENJA'] },
  { c:'UVA',       e:'🍇',  p:'pequeña fruta morada',      m:['OVA','IVA','AVA']         },
  { c:'LECHE',     e:'🥛',  p:'bebida blanca de la vaca',  m:['LACHE','LUCHE','LECHA']   },
  { c:'PAN',       e:'🍞',  p:'alimento de harina',        m:['PIN','PEN','PUN']         },
  { c:'AGUA',      e:'💧',  p:'la tomamos todos los días', m:['AGUO','EGUA','OGUA']      },
  { c:'ARROZ',     e:'🍚',  p:'grano blanco que se cocina',m:['AROS','ARROS','ARROC']    },
  { c:'HUEVO',     e:'🥚',  p:'lo pone la gallina',        m:['GUEVO','JUEVO','HEVO']    },
  // 🏠 Objetos cotidianos
  { c:'LIBRO',     e:'📚',  p:'lo leemos para aprender',   m:['LIBRE','LIBRA','LEBRO']   },
  { c:'MESA',      e:'🪑',  p:'mueble donde comemos',      m:['MISA','MASA','MOSA']      },
  { c:'CASA',      e:'🏠',  p:'donde vivimos con la familia',m:['COSA','CUSA','SACA']    },
  { c:'PELOTA',    e:'⚽',  p:'se lanza y bota',           m:['PALOTA','PILOTA','POLETA'] },
  { c:'CARRO',     e:'🚗',  p:'tiene cuatro ruedas',       m:['CARO','CARRU','CORRO']    },
  { c:'ZAPATO',    e:'👟',  p:'lo usamos en el pie',       m:['SAPATO','ZAPOTO','ZAPATU'] },
  { c:'SILLA',     e:'🪑',  p:'nos sentamos en ella',      m:['SILA','CILLA','SYLLA']    },
  // 🌳 Naturaleza
  { c:'ÁRBOL',     e:'🌳',  p:'planta grande con ramas',   m:['ARBOL','ÁRBAL','ÁRBOL'.split('').reverse().join('')] },
  { c:'FLOR',      e:'🌸',  p:'bonita y perfumada',        m:['FLORE','FLAR','FLUR']     },
  { c:'NUBE',      e:'☁️',  p:'está en el cielo',          m:['NIVE','NOBE','NEBE']      },
  { c:'LLUVIA',    e:'🌧️', p:'cae del cielo cuando hay nubes',m:['LUVIA','YUVIA','LLOVIA'] },
  { c:'MAR',       e:'🌊',  p:'gran masa de agua salada',  m:['BAR','PAR','TAR']         },
  { c:'MONTAÑA',   e:'⛰️',  p:'elevación grande del suelo',m:['MONTAGNA','MONTAÑA'.split('').reverse().join(''),'MONTANA'] },
  // 👨‍👩‍👧 Familia / cuerpo
  { c:'MAMÁ',      e:'👩',  p:'nuestra madre',             m:['MAMA','MAPA','BAMA']      },
  { c:'PAPÁ',      e:'👨',  p:'nuestro padre',             m:['PAPA','PIPA','PAPO']      },
  { c:'MANO',      e:'✋',  p:'tiene cinco dedos',         m:['MANO'.split('').reverse().join(''),'MONO','MENO'] },
  { c:'OJO',       e:'👁️', p:'sirve para ver',            m:['OJA','IJO','UJO']         },
  { c:'NARIZ',     e:'👃',  p:'sirve para oler',           m:['NARIS','NARIZ'.split('').reverse().join(''),'NARIC'] },
];

const PALABRAS = PALABRAS_DATA.map(p => ({
  titulo:      `¿Cuál es la palabra? — ${p.c}`,
  categoria:   'Palabras',
  dificultad:  3,
  puntos_base: 20,
  instruccion: `${p.e}  ¿Cómo se escribe? (${p.p})`,
  emoji:        p.e,
  activo:       true,
  palabraClave: p.c,
  respuestaCorrecta: p.c,
  opciones: shuffle([
    { texto: p.c,    esCorrecta: true  },
    { texto: p.m[0], esCorrecta: false },
    { texto: p.m[1], esCorrecta: false },
    { texto: p.m[2], esCorrecta: false },
  ]),
}));

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function generarOpciones(correcta) {
  const pool = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  const malas = pool.filter(l => l !== correcta).sort(() => Math.random() - 0.5).slice(0, 3);
  return shuffle([{ texto: correcta, esCorrecta: true }, ...malas.map(t => ({ texto: t, esCorrecta: false }))]);
}

// ══════════════════════════════════════════════════════
// EJECUTAR
// ══════════════════════════════════════════════════════
const seed = async () => {
  console.log('\n🌱 Letramente — Seeder v3 (Abecedario Completo)\n');

  const eliminados = await Reto.remove({}, { multi: true });
  console.log(`🗑️  Eliminados ${eliminados} retos anteriores\n`);

  const todos = [...VOCALES, ...CONSONANTES, ...SILABAS, ...PALABRAS];

  for (const reto of todos) {
    await Reto.insert({ ...reto, fecha_creacion: new Date() });
  }

  const total = todos.length;
  console.log(`✅ Creados ${total} retos:\n`);
  console.log(`   🔤 Vocales:      ${VOCALES.length}   (A, E, I, O, U — dobles)`);
  console.log(`   🔡 Consonantes:  ${CONSONANTES.length}  (B C D F G H J K L M N Ñ P Q R S T V W Y Z)`);
  console.log(`   📝 Sílabas:      ${SILABAS.length}  (completar la letra que falta)`);
  console.log(`   📖 Palabras:     ${PALABRAS.length}  (animales, alimentos, objetos, naturaleza, familia, cuerpo)`);
  console.log(`\n   TOTAL: ${total} retos — ¡Abecedario completo!\n`);
  console.log('🎉 ¡Base de datos lista!\n');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
