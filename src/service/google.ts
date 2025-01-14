import { type ChatSession, GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Chave do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const activeChats = new Map();

// Estrutura do Prompt
const promptData = {
  introduction: "Olá! Eu sou o assistente virtual do Thomas, um desenvolvedor web especializado em soluções personalizadas que ajudam negócios a crescer de maneira eficaz na web. Estou aqui para ajudar você a entender como os serviços de Thomas podem melhorar a sua presença online e impulsionar o seu negócio.",
  services: {
    landing_pages: "Thomas cria landing pages altamente eficazes para conversões rápidas. Se você precisa de uma página de captura para atrair novos clientes, ele pode construir uma página personalizada que atenda às suas metas, seja para promoção de um produto, coleta de leads ou campanhas de marketing.",
    institutional_websites: "Ele oferece o desenvolvimento de sites responsivos e intuitivos, garantindo que seu site seja acessível em qualquer dispositivo, com uma experiência de usuário impecável que ajuda a sua marca a se destacar.",
    e_commerce: "Quer vender online? Thomas desenvolve lojas virtuais com integração de sistemas de pagamento e controle de estoque, garantindo uma experiência de compra segura e eficiente para seus clientes. Se você está pronto para expandir seu negócio para o mundo digital, vamos conversar!",
    website_optimization: "Se o seu site está com desempenho abaixo do esperado, Thomas pode otimizar a performance, diminuindo os tempos de carregamento e melhorando a experiência do usuário. Ele utiliza as melhores práticas em SEO, performance e usabilidade para garantir que seu site seja rápido e eficiente."
  },
  personalized_service: {
    existing_clients: "Se você é um cliente já conhecido, por favor, aguarde um momento enquanto Thomas retorna com a melhor solução para o seu projeto. Estou aqui para garantir que você receba a atenção que merece!",
    new_clients: "Se este é um novo contato, estou aqui para responder a todas as suas perguntas com cuidado e atenção. Thomas está comprometido em oferecer um serviço excepcional e está ansioso para ajudá-lo a alcançar seus objetivos online."
  },
  conclusion: "Se você está buscando melhorar sua presença online ou expandir seus negócios com soluções digitais, Thomas é a pessoa certa para ajudar. Todos os projetos são desenvolvidos com foco na experiência do usuário (UX), sempre com designs modernos e responsivos. Vamos conversar e ver como ele pode transformar seu site ou e-commerce para trazer mais resultados para o seu negócio!"
};

const getOrCreateChatSession = (chatId: string): ChatSession => {
  console.log('activeChats.has(chatId)', activeChats.has(chatId));
  if (activeChats.has(chatId)) {
    const currentHistory = activeChats.get(chatId);
    console.log({ currentHistory, chatId });
    return model.startChat({
      history: currentHistory,
    });
  }
  const history = [
    {
      role: 'user',
      parts: promptData.introduction, // Usando a introdução como prompt inicial
    },
    {
      role: 'model',
      parts: 'Olá, certo! Como posso ajudar você hoje?',
    },
  ];
  activeChats.set(chatId, history);
  return model.startChat({
    history,
  });
};

export const mainGoogle = async ({
  currentMessage,
  chatId,
}: {
  currentMessage: string;
  chatId: string;
}): Promise<string> => {
  const chat = getOrCreateChatSession(chatId);

  // Se a mensagem for relacionada a um serviço específico, vamos usar as informações detalhadas
  let responseText = '';
  if (currentMessage.toLowerCase().includes('landing page')) {
    responseText = promptData.services.landing_pages;
  } else if (currentMessage.toLowerCase().includes('site institucional')) {
    responseText = promptData.services.institutional_websites;
  } else if (currentMessage.toLowerCase().includes('loja virtual')) {
    responseText = promptData.services.e_commerce;
  } else if (currentMessage.toLowerCase().includes('otimização de site')) {
    responseText = promptData.services.website_optimization;
  } else if (currentMessage.toLowerCase().includes('cliente existente')) {
    responseText = promptData.personalized_service.existing_clients;
  } else if (currentMessage.toLowerCase().includes('novo cliente')) {
    responseText = promptData.personalized_service.new_clients;
  } else {
    responseText = promptData.conclusion;
  }

  const prompt = currentMessage;
  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  const text = response.text();

  activeChats.set(chatId, [
    ...activeChats.get(chatId),
    {
      role: 'user',
      parts: prompt,
    },
    {
      role: 'model',
      parts: text || responseText, // Se a resposta não for gerada, usamos nossa resposta personalizada
    },
  ]);

  console.log('Resposta Gemini: ', text);
  return text || responseText; // Retorna a resposta gerada ou a personalizada
};
