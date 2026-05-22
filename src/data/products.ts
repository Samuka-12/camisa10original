const BASE_URL = "https://kffjkhyhhjpkwzfrcvzh.supabase.co/storage/v1/object/public/camisetas";

export interface Product {
  id: string;
  image: string;
  images: string[];
  name: string;
  team: string;
  price: string;
  priceNum: number;
  oldPrice?: string;
  category: string[];
  sizes: string[];
  description: string;
  externalCheckoutUrl?: string;
}

export const allProducts: Product[] = [
  {
    id: "60b4d28c-9137-4b46-9244-5cced17f9aac",
    image: `${BASE_URL}/01-brasil-frente.jpg`,
    images: [`${BASE_URL}/01-brasil-frente.jpg`, `${BASE_URL}/01-brasil-verso.jpg`, `${BASE_URL}/01-brasil-modelo.jpg`],
    name: "Camiseta Seleção Brasileira Home 2026/27",
    team: "Seleção Brasileira",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "Vista o manto da maior seleção do mundo. Edição 2026/27 com design moderno e detalhes em verde.",
    externalCheckoutUrl: "/checkout?id=60b4d28c-9137-4b46-9244-5cced17f9aac"
  },
  {
    id: "163158f3-5246-431b-a53c-1123e42158f3",
    image: `${BASE_URL}/02-espanha-frente.jpg`,
    images: [`${BASE_URL}/02-espanha-frente.jpg`, `${BASE_URL}/02-espanha-verso.jpg`],
    name: "Camiseta Seleção Espanhola 2026/27",
    team: "Seleção Espanhola",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Fúria espanhola em forma de camisa. Vermelho vibrante com detalhes em dourado e azul marinho.",
    externalCheckoutUrl: "/checkout?id=163158f3-5246-431b-a53c-1123e42158f3"
  },
  {
    id: "1724482f-317c-42d4-8fed-086b128eb1d5",
    image: `${BASE_URL}/03-argentina-frente.jpg`,
    images: [`${BASE_URL}/03-argentina-frente.jpg`, `${BASE_URL}/03-argentina-verso.jpg`],
    name: "Camiseta Seleção Argentina 2026/27",
    team: "Seleção Argentina",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "As listras albicelestes que carregam a herança de Maradona e Messi. Tricampeã mundial.",
    externalCheckoutUrl: "/checkout?id=1724482f-317c-42d4-8fed-086b128eb1d5"
  },
  {
    id: "f0f3386b-df33-49b8-9af0-57cb918db34a",
    image: `${BASE_URL}/04-inglaterra-frente.jpg`,
    images: [`${BASE_URL}/04-inglaterra-frente.jpg`, `${BASE_URL}/04-inglaterra-verso.png`, `${BASE_URL}/04-inglaterra-modelo.jpg`],
    name: "Camiseta Seleção Inglesa 2026/27",
    team: "Seleção Inglesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "O berço do futebol em uma camisa impecável. Elegância britânica com detalhes em vermelho e azul.",
    externalCheckoutUrl: "/checkout?id=f0f3386b-df33-49b8-9af0-57cb918db34a"
  },
  {
    id: "b143af80-1395-41ea-b960-5dffb7bf95b3",
    image: `${BASE_URL}/05-brasil-azul-frente.jpg`,
    images: [`${BASE_URL}/05-brasil-azul-frente.jpg`, `${BASE_URL}/05-brasil-azul-verso.jpg`],
    name: "Camiseta Seleção Brasileira Azul 2026/27",
    team: "Seleção Brasileira",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O manto azul da seleção pentacampeã. Design arrojado com padrão camuflado.",
    externalCheckoutUrl: "/checkout?id=b143af80-1395-41ea-b960-5dffb7bf95b3"
  },
  {
    id: "7f27a433-69a0-4a9c-9ff3-5a158d797ca0",
    image: `${BASE_URL}/06-franca-frente.jpg`,
    images: [`${BASE_URL}/06-franca-frente.jpg`, `${BASE_URL}/06-franca-verso.jpg`],
    name: "Camiseta Seleção Francesa 2026/27",
    team: "Seleção Francesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "Les Bleus em sua forma mais elegante. Bicampeã mundial, unindo tradição e modernidade.",
    externalCheckoutUrl: "/checkout?id=7f27a433-69a0-4a9c-9ff3-5a158d797ca0"
  },
  {
    id: "71af1982-f1ca-4e35-b91e-8e1ad9bfbbb2",
    image: `${BASE_URL}/07-alemanha-frente.jpg`,
    images: [`${BASE_URL}/07-alemanha-frente.jpg`, `${BASE_URL}/07-alemanha-verso.jpg`],
    name: "Camiseta Seleção Alemã 2026/27",
    team: "Seleção Alemã",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "A máquina alemã em forma de camisa. Tetracampeã mundial com design retrô-moderno.",
    externalCheckoutUrl: "/checkout?id=71af1982-f1ca-4e35-b91e-8e1ad9bfbbb2"
  },
  {
    id: "8a43c8a2-152e-4a96-a9f1-b91db4ab4c07",
    image: `${BASE_URL}/08-portugal-frente.jpg`,
    images: [`${BASE_URL}/08-portugal-frente.jpg`, `${BASE_URL}/08-portugal-verso.jpg`],
    name: "Camiseta Seleção Portuguesa 2026/27",
    team: "Seleção Portuguesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "O vermelho de Portugal que conquistou a Europa. Padrão ondulado elegante.",
    externalCheckoutUrl: "/checkout?id=8a43c8a2-152e-4a96-a9f1-b91db4ab4c07"
  },
  {
    id: "ce318ad5-6e24-455b-9a98-4b84fc26c476",
    image: `${BASE_URL}/09-holanda-frente.jpg`,
    images: [`${BASE_URL}/09-holanda-frente.jpg`, `${BASE_URL}/09-holanda-verso.jpg`],
    name: "Camiseta Seleção Holandesa 2026/27",
    team: "Seleção Holandesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Laranja Mecânica em versão away. Design clean e moderno que honra a tradição.",
    externalCheckoutUrl: "/checkout?id=ce318ad5-6e24-455b-9a98-4b84fc26c476"
  },
  {
    id: "37bf2a9c-fd7f-40ab-a36f-af4873fb508b",
    image: `${BASE_URL}/10-italia-frente.jpg`,
    images: [`${BASE_URL}/10-italia-frente.jpg`, `${BASE_URL}/10-italia-verso.jpg`],
    name: "Camiseta Seleção Italiana 2026/27",
    team: "Seleção Italiana",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Azzurra que encanta o mundo. Tetracampeã mundial em branco gelo.",
    externalCheckoutUrl: "/checkout?id=37bf2a9c-fd7f-40ab-a36f-af4873fb508b"
  },
  {
    id: "8707c163-1b30-4623-bdf2-1145f432e250",
    image: `${BASE_URL}/11-milan-frente.jpg`,
    images: [`${BASE_URL}/11-milan-frente.jpg`, `${BASE_URL}/11-milan-verso.jpg`],
    name: "Camiseta Milan 2009/10",
    team: "AC Milan",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O Diavolo em sua era dourada. Camisa manga longa vestida por lendas como Kaká.",
    externalCheckoutUrl: "/checkout?id=8707c163-1b30-4623-bdf2-1145f432e250"
  },
  {
    id: "ee655070-ed53-40c0-afe3-bb15ac8ea04b",
    image: `${BASE_URL}/12-inter-frente.jpg`,
    images: [`${BASE_URL}/12-inter-frente.jpg`, `${BASE_URL}/12-inter-verso.jpg`],
    name: "Camiseta Inter de Milão 1998/99",
    team: "Inter de Milão",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Nerazzurri na era Ronaldo Fenômeno. Pura nostalgia e poder.",
    externalCheckoutUrl: "/checkout?id=ee655070-ed53-40c0-afe3-bb15ac8ea04b"
  },
  {
    id: "e121f324-d1b5-4f8a-b4d4-99822e921f42",
    image: `${BASE_URL}/13-juventus-frente.jpg`,
    images: [`${BASE_URL}/13-juventus-frente.jpg`, `${BASE_URL}/13-juventus-verso.jpg`],
    name: "Camiseta Juventus 1995/97",
    team: "Juventus",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "A Vecchia Signora campeã da Champions. Relíquia do futebol mundial.",
    externalCheckoutUrl: "/checkout?id=e121f324-d1b5-4f8a-b4d4-99822e921f42"
  },
  {
    id: "7a131914-3e37-4b0b-9a1d-e588b1a109db",
    image: `${BASE_URL}/14-lazio-frente.jpg`,
    images: [`${BASE_URL}/14-lazio-frente.jpg`, `${BASE_URL}/14-lazio-verso.jpg`],
    name: "Camiseta Lazio 1999/2000",
    team: "Lazio",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Lazio campeã do Scudetto. Peça rara e exclusiva.",
    externalCheckoutUrl: "/checkout?id=7a131914-3e37-4b0b-9a1d-e588b1a109db"
  },
  {
    id: "654f2c3f-a0da-4170-a5bd-a3610a06e066",
    image: `${BASE_URL}/15-fiorentina-frente.jpg`,
    images: [`${BASE_URL}/15-fiorentina-frente.jpg`, `${BASE_URL}/15-fiorentina-verso.jpg`],
    name: "Camiseta Fiorentina 1995/96",
    team: "Fiorentina",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Viola de Batistuta em sua fase mais gloriosa. Obra de arte do futebol italiano.",
    externalCheckoutUrl: "/checkout?id=654f2c3f-a0da-4170-a5bd-a3610a06e066"
  },
  {
    id: "856fe81a-08db-4a17-83be-2f32bc9958e7",
    image: `${BASE_URL}/16-parma-frente.jpg`,
    images: [`${BASE_URL}/16-parma-frente.jpg`, `${BASE_URL}/16-parma-verso.jpg`],
    name: "Camiseta Parma 2002/03",
    team: "Parma AC",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O Parma da era de ouro do calcio italiano. Representa o auge dos anos 2000.",
    externalCheckoutUrl: "/checkout?id=856fe81a-08db-4a17-83be-2f32bc9958e7"
  },
  {
    id: "d0d30f1f-5efd-4e8a-b9f8-a8a9daef4dc7",
    image: `${BASE_URL}/17-milan-home-frente.jpg`,
    images: [`${BASE_URL}/17-milan-home-frente.jpg`, `${BASE_URL}/17-milan-home-verso.jpg`],
    name: "Camiseta Milan Home 2026/27",
    team: "AC Milan",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "O Diavolo rossonero em sua versão moderna. DNA do Milan vivo.",
    externalCheckoutUrl: "/checkout?id=d0d30f1f-5efd-4e8a-b9f8-a8a9daef4dc7"
  },
  {
    id: "f0dcfa0b-2ebf-4096-adf7-1d67725e8172",
    image: `${BASE_URL}/18-inter-frente.jpg`,
    images: [`${BASE_URL}/18-inter-frente.jpg`, `${BASE_URL}/18-inter-verso.jpg`],
    name: "Camiseta Inter de Milão 2026/27",
    team: "Inter de Milão",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "A Nerazzurri com listras onduladas. Design arrojado e tradição.",
    externalCheckoutUrl: "/checkout?id=f0dcfa0b-2ebf-4096-adf7-1d67725e8172"
  },
  {
    id: "3c38b627-a66e-427e-acdf-e0cecf8aba46",
    image: `${BASE_URL}/19-juventus-frente.jpg`,
    images: [`${BASE_URL}/19-juventus-frente.jpg`, `${BASE_URL}/19-juventus-verso.jpg`],
    name: "Camiseta Juventus 2026/27",
    team: "Juventus",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Vecchia Signora reinventada. Modernidade unida à tradição da Juve.",
    externalCheckoutUrl: "/checkout?id=3c38b627-a66e-427e-acdf-e0cecf8aba46"
  },
  {
    id: "b22f1b45-27c3-4730-a7ae-c5642c2619f8",
    image: `${BASE_URL}/20-roma-frente.jpg`,
    images: [`${BASE_URL}/20-roma-frente.jpg`, `${BASE_URL}/20-roma-verso.jpg`],
    name: "Camiseta Roma 2026/27",
    team: "AS Roma",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Lupa Capitolina em forma de camisa. Grená profundo e paixão eterna.",
    externalCheckoutUrl: "/checkout?id=b22f1b45-27c3-4730-a7ae-c5642c2619f8"
  }
];

export const heroBanner = `${BASE_URL}/hero-banner.jpg`;

export const getProductsByCategory = (category: string): Product[] => {
  return allProducts.filter((p) => p.category.includes(category.toLowerCase()));
};

export const getProductById = (id: string): Product | undefined => {
  return allProducts.find((p) => p.id === id);
};

export const searchProducts = (query: string): Product[] => {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.team.toLowerCase().includes(q) ||
      p.category.some((c) => c.includes(q))
  );
};

export const selecoes = allProducts.filter((p) => p.category.includes("seleções"));
export const retro = allProducts.filter((p) => p.category.includes("retrô"));
export const europeus = allProducts.filter((p) => p.category.includes("europeus"));
export const brasileirao = allProducts.filter((p) => p.category.includes("brasileirão"));

export const historicas = retro;
export const lancamentos = europeus;
export const copaDoMundo = selecoes;
