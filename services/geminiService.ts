import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI && process.env.API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const fetchZenWisdom = async (count: number, intention: string, lang: 'zh' | 'en'): Promise<string> => {
  const ai = getGenAI();
  if (!ai) {
    return getRandomFallbackQuote(intention, lang);
  }

  const langInstruction = lang === 'en' ? "in English" : "in Chinese";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a single, very short, profound, and encouraging sentence (max 15 words) ${langInstruction} for someone who is meditating by knocking a digital wooden fish. 
      The current knock count is ${count}. 
      The user's specific prayer/intention is: "${intention}".
      The tone should be peaceful, calm, Zen-like, and insightful, relevant to their intention.
      Do not include quotes around the text. 
      Do not include explanations.`,
      config: {
        temperature: 1.1,
        maxOutputTokens: 60,
      }
    });

    return response.text?.trim() || getRandomFallbackQuote(intention, lang);
  } catch (error) {
    console.error("Failed to fetch Zen wisdom:", error);
    return getRandomFallbackQuote(intention, lang);
  }
};

// --- CHINESE QUOTES ---
const peaceQuotesZh = [
  "心静自然凉。", "一念放下，万般自在。", "功德 +1，烦恼 -1。", "静能生慧。", "此心安处是吾乡。", "平常心是道。", "本来无一物，何处惹尘埃。", "呼吸之间，便是天地。", "平安二字值千金。", "心宽一寸，路宽一丈。"
];
const wealthQuotesZh = [
  "广结善缘，财源自来。", "知足者常乐，富贵在心中。", "天道酬勤。", "财散人聚，德厚流光。", "和气生财，善气迎祥。", "君子爱财，取之有道。", "积善之家，必有余庆。"
];
const healthQuotesZh = [
  "身心康健，是为大福。", "养生先养心。", "动静皆宜，福寿绵长。", "早睡早起，精神百倍。", "心宽体胖，无忧无虑。", "松花酿酒，春水煎茶。"
];
const loveQuotesZh = [
  "惜缘随缘，莫强求。", "花开有时，相逢有期。", "善待他人，便是善待自己。", "心中有爱，处处春风。", "愿得一心人，白首不相离。", "两情相悦，贵在知心。", "缘分天注定，半点不由人。", "爱出者爱返，福往者福来。"
];
const wisdomQuotesZh = [
  "大智若愚。", "宁静致远，淡泊明志。", "书山有路勤为径。", "智慧如水，润物无声。", "开卷有益。", "静而后能安，安而后能虑。", "心如明镜台。"
];
const careerQuotesZh = [
  "天生我材必有用。", "功不唐捐，玉汝于成。", "机会总是留给有准备的人。", "不积跬步，无以至千里。", "长风破浪会有时，直挂云帆济沧海。", "精诚所至，金石为开。", "厚积薄发，笃行致远。"
];

// --- ENGLISH QUOTES ---
const peaceQuotesEn = [
  "Inner peace is the greatest wealth.",
  "Let go, and be free.",
  "Merit +1, Worries -1.",
  "Stillness creates wisdom.",
  "Peace comes from within.",
  "Breathe in calm, breathe out stress.",
  "Every moment is a fresh beginning.",
  "Simplicity is the ultimate sophistication.",
  "Where the mind goes, energy flows."
];
const wealthQuotesEn = [
  "Gratitude brings abundance.",
  "Fortune favors the bold.",
  "True wealth is in the heart.",
  "Generosity begets prosperity.",
  "Diligence is the mother of good luck.",
  "Attract success with a positive mind.",
  "Plant seeds of kindness, harvest wealth."
];
const healthQuotesEn = [
  "Health is the real wealth.",
  "A calm mind brings a healthy body.",
  "Balance is the key to life.",
  "Nourish your soul.",
  "Rest is part of the work.",
  "Listen to your body.",
  "Vitality flows where attention goes."
];
const loveQuotesEn = [
  "Love flows to you and through you.",
  "What is meant for you will not pass you by.",
  "Kindness is a language everyone speaks.",
  "Love is the bridge between two hearts.",
  "Cherish every connection.",
  "To love is to recognize yourself in another.",
  "The heart sees what is invisible to the eye."
];
const wisdomQuotesEn = [
  "Knowledge speaks, wisdom listens.",
  "Silence is a source of great strength.",
  "The journey of a thousand miles begins with a step.",
  "Be like water.",
  "Learn from yesterday, live for today.",
  "Clarity comes from a still mind.",
  "Wisdom is knowing what to overlook."
];
const careerQuotesEn = [
  "Believe you can and you're halfway there.",
  "Success is the sum of small efforts.",
  "The future depends on what you do today.",
  "Patience and persistence conquer all things.",
  "Your potential is limitless.",
  "Focus on the journey, not the destination.",
  "Hard work betrays none."
];

export const getRandomFallbackQuote = (intention: string = "", lang: 'zh' | 'en' = 'zh') => {
  const isEn = lang === 'en';
  
  // Normalized check for intention keywords
  const i = intention.toLowerCase();
  
  let pool: string[] = [];

  if (isEn) {
    if (i.includes("wealth") || i.includes("money") || i.includes("rich")) pool = [...wealthQuotesEn, ...peaceQuotesEn];
    else if (i.includes("health") || i.includes("body")) pool = [...healthQuotesEn, ...peaceQuotesEn];
    else if (i.includes("love") || i.includes("relationship") || i.includes("romance")) pool = [...loveQuotesEn, ...peaceQuotesEn];
    else if (i.includes("wisdom") || i.includes("study") || i.includes("smart")) pool = [...wisdomQuotesEn, ...peaceQuotesEn];
    else if (i.includes("career") || i.includes("job") || i.includes("work")) pool = [...careerQuotesEn, ...peaceQuotesEn];
    else pool = peaceQuotesEn;
  } else {
    // Chinese fallback logic
    if (i.includes("财")) pool = [...wealthQuotesZh, ...peaceQuotesZh];
    else if (i.includes("安") || i.includes("康")) pool = [...healthQuotesZh, ...peaceQuotesZh];
    else if (i.includes("缘") || i.includes("爱")) pool = [...loveQuotesZh, ...peaceQuotesZh];
    else if (i.includes("智") || i.includes("学")) pool = [...wisdomQuotesZh, ...peaceQuotesZh];
    else if (i.includes("工") || i.includes("职")) pool = [...careerQuotesZh, ...peaceQuotesZh];
    else pool = peaceQuotesZh;
  }
  
  return pool[Math.floor(Math.random() * pool.length)];
};