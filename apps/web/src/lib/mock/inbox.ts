export const mockConversations = [
  {
    id: "conv_1",
    contactName: "Amira Ben Salah",
    phone: "+21622123456",
    lastMessagePreview: "Bonjour, j’ai un problème avec ma commande",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 2,
  },
  {
    id: "conv_2",
    contactName: "Mehdi Trabelsi",
    phone: "+21655987111",
    lastMessagePreview: "Merci pour votre retour 🙏",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    unreadCount: 0,
  },
];

export const mockMessages: Record<string, any[]> = {
  conv_1: [
    {
      id: "m1",
      direction: "in",
      text: "Bonjour, j’ai un problème avec ma commande",
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: "m2",
      direction: "out",
      text: "Bonjour Amira 👋 pouvez-vous me donner votre numéro de commande ?",
      status: "delivered",
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
  ],
  conv_2: [
    {
      id: "m3",
      direction: "out",
      text: "Merci pour votre retour 🙏",
      status: "read",
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ],
};