import type { LanguageId } from './types';

export interface LanguagePack {
  id: LanguageId;
  name: string;
  nativeName: string;
  words: string[];
  sentences: string[];
  paragraphs: string[];
  quotes: { text: string; author: string }[];
}

const EN_WORDS = `the of and to a in is you that it he was for on are as with his they at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part over new sound take only little work know place years live me back give most very after things our just name good sentence man think say great where help through much before line right too mean old any same tell boy follow came want show also around form three small set put end does another well large must big even such because turn here why ask went men read need land different home us move try kind hand picture again change off play spell air away animal house point page letter mother answer found study still learn should world high every near add food between own below country plants last school father keep tree never start city earth eye light thought head under story saw left few while along might close something seem next hard open example begin life always those both paper together got group often run important until children side feet car mile night walk white sea began grow took river four carry state once book hear stop without second later miss idea enough eat face watch far really almost let above girl sometimes mountain cut young talk soon list song being leave family music color stand sun questions fish area mark dog horse birds problem complete room knew ship today during short better best however low hours black products happened whole measure remember early waves reached listen wind rock space covered fast several hold himself toward five steps morning passed vowel true hundred against pattern numeral table none north slowly money map farm pulled draw voice seen cold cried plan notice south sing war ground fall king town unit figure certain field travel wood fire upon done english study French Latin wait slowly center love person ride bank size single hope bear wonder smile thousand ago ran check game shape yes hot miss brought heat snow bed bring sit perhaps fill east weight language among`.split(/\s+/);

const EN_SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'Practice a little every day and the keys will feel natural.',
  'Keep your wrists relaxed and let your fingers rest on the home row.',
  'Accuracy comes first, and speed follows on its own.',
  'A calm rhythm beats a fast burst of mistakes.',
  'Look at the screen, not at your hands, while you type.',
  'Every expert typist was once a beginner who kept showing up.',
  'Good posture helps you stay comfortable through long sessions.',
  'The morning light filled the room with a soft golden glow.',
  'She wrote a short letter and sent it across the sea.',
  'Small steady improvements add up to remarkable results.',
  'Type each word as if it were part of a single flowing breath.',
  'The library was quiet except for the sound of turning pages.',
  'He packed a bag, checked the map, and walked toward the hills.',
  'Your hands already know more than you think they do.',
  'Take a breath, reset your posture, and begin again.',
  'The best time to review a lesson is right before you forget it.',
  'We measure progress in weeks, not in a single minute.',
  'A clear desk and a clear mind make practice easier.',
  'Learning to type well is a gift you give your future self.',
];

const EN_PARAGRAPHS = [
  'The city wakes slowly. First come the delivery vans and the smell of bread from the corner bakery, then the bicycles, then the long impatient line of cars. By eight the streets are full, and every window reflects a different version of the morning. Somewhere above the noise, a woman opens her laptop and begins to write. She types without looking down, and the words arrive almost as quickly as she thinks them.',
  'There is a particular pleasure in work that fits your hands. A carpenter knows the weight of a hammer, a pianist knows the distance between two keys, and a good typist knows the home row without needing to see it. This kind of knowledge is not memorised in a single afternoon. It is built slowly, through repetition, until the movement stops feeling like a decision and starts feeling like a habit.',
  'The old library stood at the end of a narrow street, between a shop that sold paper and a cafe that never seemed to close. Inside, the air was warm and smelled of wood and dust. Students came there to study, travelers came to rest, and a few people came simply because the silence felt friendly. On the second floor, near the window, there was a desk with a lamp that always worked.',
  'Every skill has a moment when it becomes useful rather than merely difficult. For a language, that moment arrives in a real conversation. For typing, it arrives when your thoughts and your fingers move at the same speed. Until then, practice can feel like a list of small chores. Afterward, it feels like a door has opened, and you wonder why you waited so long to walk through it.',
  'Rain moved across the valley in slow gray sheets, and the hills disappeared one by one. The farmer watched from the porch, counting the minutes between the lightning and the thunder. In the kitchen, his daughter read aloud from a book of maps, naming rivers she had never seen and cities she hoped to visit. The storm would pass, as storms do, leaving the world brighter and the air full of the smell of wet earth.',
];

const EN_QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'Do not watch the clock. Do what it does: keep going.', author: 'Sam Levenson' },
  { text: 'Whether you think you can or you think you cannot, you are right.', author: 'Henry Ford' },
  { text: 'A word after a word after a word is power.', author: 'Margaret Atwood' },
  { text: 'Everything should be made as simple as possible, but not simpler.', author: 'Albert Einstein' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'You miss one hundred percent of the shots you do not take.', author: 'Wayne Gretzky' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'Little by little, one travels far.', author: 'J. R. R. Tolkien' },
  { text: 'Courage is grace under pressure.', author: 'Ernest Hemingway' },
];

const ES_WORDS = `el la de que y a en un ser se no haber por con su para como estar tener le lo todo pero más hacer o poder decir este ir otro ese si me ya ver porque dar cuando él muy sin vez mucho saber qué sobre mi mismo yo también hasta año dos querer entre así primero desde grande eso ni nos llegar pasar tiempo ella día uno bien poco deber entonces poner cosa tanto hombre parecer nuestro tan donde ahora parte después vida quedar siempre creer hablar llevar dejar nada cada seguir menos nuevo encontrar algo solo pensar tras esperar mundo camino gente noche agua casa trabajo amigo familia ciudad libro palabra escribir aprender rápido teclado pantalla música escuela niño mujer madre padre hermano mesa silla puerta ventana luz sol luna mar cielo tierra fuego aire mano cabeza ojo voz historia viaje mañana tarde semana mes juego fuerza salud comida café pan leche fruta verde blanco negro rojo azul claro oscuro feliz tranquilo pequeño largo alto bajo fácil difícil temprano tarde`.split(/\s+/);

const ES_SENTENCES = [
  'El sol brillaba sobre las montañas al amanecer.',
  'Escribe con calma y deja que los dedos encuentren su ritmo.',
  'La práctica constante es el camino más corto hacia la velocidad.',
  'Mantén las muñecas relajadas y la espalda recta.',
  'Cada error es una oportunidad para aprender algo nuevo.',
  'La biblioteca estaba en silencio salvo por el sonido de las páginas.',
  'Un viaje de mil kilómetros comienza con un solo paso.',
  'El niño abrió el libro y leyó la primera frase en voz alta.',
  'La ciudad se despertaba lentamente entre la niebla.',
  'Practica un poco cada día y verás la diferencia.',
  'La música suave llenaba la habitación por la mañana.',
  'Los amigos se reunieron en la plaza para hablar del viaje.',
  'Escribir bien requiere paciencia y atención al detalle.',
  'El agua del río corría clara bajo el puente de piedra.',
];

const ES_PARAGRAPHS = [
  'La mañana llegó con una luz suave que atravesaba las cortinas. En la cocina, el café comenzaba a hervir y el aroma llenaba la casa. Afuera, los pájaros cantaban entre los árboles mientras la ciudad despertaba poco a poco. Era un día tranquilo, de esos que invitan a trabajar sin prisa y a disfrutar de las pequeñas cosas.',
  'Aprender a escribir con las diez dedos es una inversión que dura toda la vida. Al principio parece difícil recordar dónde está cada letra, pero con práctica diaria los movimientos se vuelven automáticos. Lo importante no es escribir rápido desde el primer día, sino escribir bien y con constancia hasta que la velocidad llegue por sí sola.',
  'El mercado de la plaza abría muy temprano. Los vendedores colocaban las frutas sobre mesas de madera y saludaban a los vecinos que pasaban. Había pan recién hecho, quesos de la región y flores de todos los colores. La gente hablaba en voz alta, reía y compartía noticias antes de comenzar su jornada.',
];

const ES_QUOTES = [
  { text: 'No hay camino para la paz, la paz es el camino.', author: 'Mahatma Gandhi' },
  { text: 'La imaginación es más importante que el conocimiento.', author: 'Albert Einstein' },
  { text: 'El que lee mucho y anda mucho, ve mucho y sabe mucho.', author: 'Miguel de Cervantes' },
  { text: 'La constancia vence lo que la dicha no alcanza.', author: 'Proverbio' },
  { text: 'Cada día es una nueva oportunidad para empezar.', author: 'Anónimo' },
  { text: 'La paciencia es el arte de esperar sin dejar de trabajar.', author: 'Anónimo' },
];

const DE_WORDS = `der die und in den von zu das mit sich des auf für ist im dem nicht ein eine als auch es an werden aus er hat dass sie nach wird bei einer um am sind noch wie einem über einen so zum war haben nur oder aber vor zur bis mehr durch man sein wurde sei welche ihre ihr wir ich du ihn ihm uns euch kann muss soll will machen gehen kommen sehen stehen finden bleiben liegen heißen lernen schreiben lesen sprechen hören denken wissen arbeiten spielen leben fahren geben nehmen zeigen fragen sagen zeit jahr tag haus stadt land mensch kind frau mann freund familie wasser buch wort schule musik straße arbeit leben welt hand kopf auge nacht morgen heute immer schnell langsam gut groß klein schön neu alt leicht schwer warm kalt hell dunkel grün blau rot gelb schwarz weiß leise ruhig freundlich glücklich müde wach brot milch kaffee tisch stuhl fenster tür garten berg fluss himmel sonne mond stern reise geschichte sprache übung tasten tastatur`.split(/\s+/);

const DE_SENTENCES = [
  'Der schnelle braune Fuchs springt über den faulen Hund.',
  'Übung macht den Meister, also übe jeden Tag ein wenig.',
  'Die Sonne ging langsam hinter den Bergen unter.',
  'Schreibe ruhig und genau, dann kommt die Geschwindigkeit von selbst.',
  'Sie öffnete das Fenster und hörte die Vögel im Garten.',
  'Ein guter Tag beginnt mit einer klaren Aufgabe.',
  'Die Bibliothek war still, nur das Rascheln der Seiten war zu hören.',
  'Über die Brücke führte ein schmaler Weg in die Stadt.',
  'Er lernte jeden Morgen zehn neue Wörter.',
  'Das Wasser im Fluss war klar und kalt.',
  'Zum Frühstück gab es Brot, Butter und heißen Kaffee.',
  'Mit Geduld und Übung werden die Finger immer sicherer.',
  'Am Abend saßen wir zusammen und erzählten Geschichten.',
  'Die Straßen waren leer, als der erste Schnee fiel.',
];

const DE_PARAGRAPHS = [
  'Der Morgen begann mit einem leisen Regen, der auf das Dach fiel. In der Küche duftete es nach frischem Kaffee und warmem Brot. Draußen bewegten sich die Bäume im Wind, und die Straßen glänzten im grauen Licht. Es war ein ruhiger Tag, an dem man gerne langsam arbeitet und die kleinen Dinge bemerkt.',
  'Tippen zu lernen ist wie das Spielen eines Instruments. Am Anfang muss man über jede Taste nachdenken, doch nach einigen Wochen werden die Bewegungen zu einer Gewohnheit. Wichtig ist nicht die Geschwindigkeit am ersten Tag, sondern die Regelmäßigkeit. Wer jeden Tag ein wenig übt, wird schneller und sicherer, ohne es zu merken.',
  'Der Markt in der Altstadt öffnete früh am Morgen. Die Händler stellten Körbe mit Obst auf die Tische und begrüßten die Nachbarn. Es gab frisches Gemüse, Blumen und warme Brezeln. Die Menschen sprachen laut, lachten und tauschten Neuigkeiten aus, bevor sie zur Arbeit gingen.',
];

const DE_QUOTES = [
  { text: 'Es ist nicht genug zu wissen, man muss auch anwenden.', author: 'Johann Wolfgang von Goethe' },
  { text: 'Wer immer tut, was er schon kann, bleibt immer das, was er schon ist.', author: 'Henry Ford' },
  { text: 'Der Weg ist das Ziel.', author: 'Konfuzius' },
  { text: 'Übung macht den Meister.', author: 'Sprichwort' },
  { text: 'Aller Anfang ist schwer.', author: 'Sprichwort' },
  { text: 'Die Zeit heilt keine Wunden, sie lehrt uns nur, mit ihnen zu leben.', author: 'Anonym' },
];

export const LANGUAGE_PACKS: Record<LanguageId, LanguagePack> = {
  en: {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    words: EN_WORDS,
    sentences: EN_SENTENCES,
    paragraphs: EN_PARAGRAPHS,
    quotes: EN_QUOTES,
  },
  es: {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    words: ES_WORDS,
    sentences: ES_SENTENCES,
    paragraphs: ES_PARAGRAPHS,
    quotes: ES_QUOTES,
  },
  de: {
    id: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    words: DE_WORDS,
    sentences: DE_SENTENCES,
    paragraphs: DE_PARAGRAPHS,
    quotes: DE_QUOTES,
  },
};

export function getPack(language: LanguageId): LanguagePack {
  return LANGUAGE_PACKS[language] ?? LANGUAGE_PACKS.en;
}

/** Filter the word list down to words that only use the allowed characters. */
export function wordsForKeys(words: string[], allowedKeys: string): string[] {
  const allowed = new Set(allowedKeys.split(''));
  return words.filter((word) => [...word].every((char) => allowed.has(char)));
}
