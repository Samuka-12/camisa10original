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
    id: "421a5c9d-63d2-44be-831d-1c01dec4a146",
    image: `${BASE_URL}/01-brasil-frente.jpg`,
    images: [`${BASE_URL}/01-brasil-frente.jpg`, `${BASE_URL}/01-brasil-verso.jpg`, `${BASE_URL}/01-brasil-modelo.jpg`],
    name: "Camiseta Seleção Brasileira Home 2026/27",
    team: "Seleção Brasileira",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "Vista o manto da maior seleção do mundo. Edição 2026/27 com design moderno e detalhes em verde.",
    externalCheckoutUrl: "/checkout?id=421a5c9d-63d2-44be-831d-1c01dec4a146"
  },
  {
    id: "0d2e2638-9c47-4637-b278-5bef856687fa",
    image: `${BASE_URL}/02-espanha-frente.jpg`,
    images: [`${BASE_URL}/02-espanha-frente.jpg`, `${BASE_URL}/02-espanha-verso.jpg`],
    name: "Camiseta Seleção Espanhola 2026/27",
    team: "Seleção Espanhola",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Fúria espanhola em forma de camisa. Vermelho vibrante com detalhes em dourado e azul marinho.",
    externalCheckoutUrl: "/checkout?id=0d2e2638-9c47-4637-b278-5bef856687fa"
  },
  {
    id: "da698fa3-abd8-44ee-afba-b4da0ca4f6a5",
    image: `${BASE_URL}/03-argentina-frente.jpg`,
    images: [`${BASE_URL}/03-argentina-frente.jpg`, `${BASE_URL}/03-argentina-verso.jpg`],
    name: "Camiseta Seleção Argentina 2026/27",
    team: "Seleção Argentina",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "As listras albicelestes que carregam a herança de Maradona e Messi. Tricampeã mundial.",
    externalCheckoutUrl: "/checkout?id=da698fa3-abd8-44ee-afba-b4da0ca4f6a5"
  },
  {
    id: "28774c5c-6fe1-439d-b4d2-2d1c274e9df4",
    image: `${BASE_URL}/04-inglaterra-frente.jpg`,
    images: [`${BASE_URL}/04-inglaterra-frente.jpg`, `${BASE_URL}/04-inglaterra-verso.png`, `${BASE_URL}/04-inglaterra-modelo.jpg`],
    name: "Camiseta Seleção Inglesa 2026/27",
    team: "Seleção Inglesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "O berço do futebol em uma camisa impecável. Elegância britânica com detalhes em vermelho e azul.",
    externalCheckoutUrl: "/checkout?id=28774c5c-6fe1-439d-b4d2-2d1c274e9df4"
  },
  {
    id: "cde19a73-e642-4ef8-b518-cbdcc3362403",
    image: `${BASE_URL}/05-brasil-azul-frente.jpg`,
    images: [`${BASE_URL}/05-brasil-azul-frente.jpg`, `${BASE_URL}/05-brasil-azul-verso.jpg`],
    name: "Camiseta Seleção Brasileira Azul 2026/27",
    team: "Seleção Brasileira",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O manto azul da seleção pentacampeã. Design arrojado com padrão camuflado.",
    externalCheckoutUrl: "/checkout?id=cde19a73-e642-4ef8-b518-cbdcc3362403"
  },
  {
    id: "c3f43773-c264-4830-9c97-df85ae1f4d4e",
    image: `${BASE_URL}/06-franca-frente.jpg`,
    images: [`${BASE_URL}/06-franca-frente.jpg`, `${BASE_URL}/06-franca-verso.jpg`],
    name: "Camiseta Seleção Francesa 2026/27",
    team: "Seleção Francesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "Les Bleus em sua forma mais elegante. Bicampeã mundial, unindo tradição e modernidade.",
    externalCheckoutUrl: "/checkout?id=c3f43773-c264-4830-9c97-df85ae1f4d4e"
  },
  {
    id: "9300e288-b4f6-40c4-91a9-414b5475c1ef",
    image: `${BASE_URL}/07-alemanha-frente.jpg`,
    images: [`${BASE_URL}/07-alemanha-frente.jpg`, `${BASE_URL}/07-alemanha-verso.jpg`],
    name: "Camiseta Seleção Alemã 2026/27",
    team: "Seleção Alemã",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "A máquina alemã em forma de camisa. Tetracampeã mundial com design retrô-moderno.",
    externalCheckoutUrl: "/checkout?id=9300e288-b4f6-40c4-91a9-414b5475c1ef"
  },
  {
    id: "d66eef0e-5566-4591-882c-6adb14c77f10",
    image: `${BASE_URL}/08-portugal-frente.jpg`,
    images: [`${BASE_URL}/08-portugal-frente.jpg`, `${BASE_URL}/08-portugal-verso.jpg`],
    name: "Camiseta Seleção Portuguesa 2026/27",
    team: "Seleção Portuguesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "O vermelho de Portugal que conquistou a Europa. Padrão ondulado elegante.",
    externalCheckoutUrl: "/checkout?id=d66eef0e-5566-4591-882c-6adb14c77f10"
  },
  {
    id: "4d071167-b4b9-46ee-b982-7b97eacd3f9c",
    image: `${BASE_URL}/09-holanda-frente.jpg`,
    images: [`${BASE_URL}/09-holanda-frente.jpg`, `${BASE_URL}/09-holanda-verso.jpg`],
    name: "Camiseta Seleção Holandesa 2026/27",
    team: "Seleção Holandesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Laranja Mecânica em version away. Design clean e moderno que honra a tradição.",
    externalCheckoutUrl: "/checkout?id=4d071167-b4b9-46ee-b982-7b97eacd3f9c"
  },
  {
    id: "2b6ab8d9-1707-4158-93b3-a8c9d2600bb2",
    image: `${BASE_URL}/10-italia-frente.jpg`,
    images: [`${BASE_URL}/10-italia-frente.jpg`, `${BASE_URL}/10-italia-verso.jpg`],
    name: "Camiseta Seleção Italiana 2026/27",
    team: "Seleção Italiana",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Azzurra que encanta o world. Tetracampeã mundial em branco gelo.",
    externalCheckoutUrl: "/checkout?id=2b6ab8d9-1707-4158-93b3-a8c9d2600bb2"
  },
  {
    id: "8efd9895-60a9-4268-9512-a5ff7927be2e",
    image: `${BASE_URL}/11-milan-frente.jpg`,
    images: [`${BASE_URL}/11-milan-frente.jpg`, `${BASE_URL}/11-milan-verso.jpg`],
    name: "Camiseta Milan 2009/10",
    team: "AC Milan",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O Diavolo em sua era dourada. Camisa manga longa vestida por lendas como Kaká.",
    externalCheckoutUrl: "/checkout?id=8efd9895-60a9-4268-9512-a5ff7927be2e"
  },
  {
    id: "3e812368-f2e2-4f45-9fb8-38377d74d038",
    image: `${BASE_URL}/12-inter-frente.jpg`,
    images: [`${BASE_URL}/12-inter-frente.jpg`, `${BASE_URL}/12-inter-verso.jpg`],
    name: "Camiseta Inter de Milão 1998/99",
    team: "Inter de Milão",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Nerazzurri na era Ronaldo Fenômeno. Pura nostalgia e poder.",
    externalCheckoutUrl: "/checkout?id=3e812368-f2e2-4f45-9fb8-38377d74d038"
  },
  {
    id: "82e720a7-a5d3-4c62-ad8c-d03b4e0a2f43",
    image: `${BASE_URL}/13-juventus-frente.jpg`,
    images: [`${BASE_URL}/13-juventus-frente.jpg`, `${BASE_URL}/13-juventus-verso.jpg`],
    name: "Camiseta Juventus 1995/97",
    team: "Juventus",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "A Vecchia Signora campeã da Champions. Relíquia do futebol mundial.",
    externalCheckoutUrl: "/checkout?id=82e720a7-a5d3-4c62-ad8c-d03b4e0a2f43"
  },
  {
    id: "16ee2b91-cef3-492c-801c-1680bc64b1d3",
    image: `${BASE_URL}/14-lazio-frente.jpg`,
    images: [`${BASE_URL}/14-lazio-frente.jpg`, `${BASE_URL}/14-lazio-verso.jpg`],
    name: "Camiseta Lazio 1999/2000",
    team: "Lazio",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Lazio campeã do Scudetto. Peça rara e exclusiva.",
    externalCheckoutUrl: "/checkout?id=16ee2b91-cef3-492c-801c-1680bc64b1d3"
  },
  {
    id: "514cd6fb-3b0f-4de4-a1be-5b9283459c5f",
    image: `${BASE_URL}/15-fiorentina-frente.jpg`,
    images: [`${BASE_URL}/15-fiorentina-frente.jpg`, `${BASE_URL}/15-fiorentina-verso.jpg`],
    name: "Camiseta Fiorentina 1995/96",
    team: "Fiorentina",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Viola de Batistuta em sua fase mais gloriosa. Obra de arte do futebol italiano.",
    externalCheckoutUrl: "/checkout?id=514cd6fb-3b0f-4de4-a1be-5b9283459c5f"
  },
  {
    id: "1e2ced50-987a-48f7-96d6-1ff800ca30bd",
    image: `${BASE_URL}/16-parma-frente.jpg`,
    images: [`${BASE_URL}/16-parma-frente.jpg`, `${BASE_URL}/16-parma-verso.jpg`],
    name: "Camiseta Parma 2002/03",
    team: "Parma AC",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O Parma da era de ouro do calcio italiano. Representa o auge dos anos 2000.",
    externalCheckoutUrl: "/checkout?id=1e2ced50-987a-48f7-96d6-1ff800ca30bd"
  },
  {
    id: "7424482f-317c-42d4-8fed-086b128eb1d5",
    image: `${BASE_URL}/17-milan-home-frente.jpg`,
    images: [`${BASE_URL}/17-milan-home-frente.jpg`, `${BASE_URL}/17-milan-home-verso.jpg`],
    name: "Camiseta Milan Home 2026/27",
    team: "AC Milan",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "O Diavolo rossonero em sua versão moderna. DNA do Milan vivo.",
    externalCheckoutUrl: "/checkout?id=7424482f-317c-42d4-8fed-086b128eb1d5"
  },
  {
    id: "f0f3386b-df33-49b8-9af0-57cb918db34a",
    image: `${BASE_URL}/18-inter-frente.jpg`,
    images: [`${BASE_URL}/18-inter-frente.jpg`, `${BASE_URL}/18-inter-verso.jpg`],
    name: "Camiseta Inter de Milão 2026/27",
    team: "Inter de Milão",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "A Nerazzurri com listras onduladas. Design arrojado e tradição.",
    externalCheckoutUrl: "/checkout?id=f0f3386b-df33-49b8-9af0-57cb918db34a"
  },
  {
    id: "b143af80-1395-41ea-b960-5dffb7bf95b3",
    image: `${BASE_URL}/19-juventus-frente.jpg`,
    images: [`${BASE_URL}/19-juventus-frente.jpg`, `${BASE_URL}/19-juventus-verso.jpg`],
    name: "Camiseta Juventus 2026/27",
    team: "Juventus",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Vecchia Signora reinventada. Modernidade unida à tradição da Juve.",
    externalCheckoutUrl: "/checkout?id=b143af80-1395-41ea-b960-5dffb7bf95b3"
  },
  {
    id: "7f27a433-69a0-4a9c-9ff3-5a158d797ca0",
    image: `${BASE_URL}/20-roma-frente.jpg`,
    images: [`${BASE_URL}/20-roma-frente.jpg`, `${BASE_URL}/20-roma-verso.jpg`],
    name: "Camiseta Roma 2026/27",
    team: "AS Roma",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "A Lupa Capitolina em forma de camisa. Grená profundo e paixão eterna.",
    externalCheckoutUrl: "/checkout?id=7f27a433-69a0-4a9c-9ff3-5a158d797ca0"
  },
  {
    id: "71af1982-f1ca-4e35-b91e-8e1ad9bfbbb2",
    image: `${BASE_URL}/21-napoli-frente.jpg`,
    images: [`${BASE_URL}/21-napoli-frente.jpg`, `${BASE_URL}/21-napoli-verso.jpg`],
    name: "Camiseta Napoli 2026/27",
    team: "SSC Napoli",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O azzurro de Nápoles que fez Maradona rei. Magia de Kvaratskhelia.",
    externalCheckoutUrl: "/checkout?id=71af1982-f1ca-4e35-b91e-8e1ad9bfbbb2"
  },
  {
    id: "8a43c8a2-152e-4a96-a9f1-b91db4ab4c07",
    image: `${BASE_URL}/22-manutd-frente.jpg`,
    images: [`${BASE_URL}/22-manutd-frente.jpg`, `${BASE_URL}/22-manutd-verso.jpg`],
    name: "Camiseta Manchester United 2026/27",
    team: "Manchester United",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "O Theatre of Dreams em vermelho vibrante. Old Trafford pulsa nesta camisa.",
    externalCheckoutUrl: "/checkout?id=8a43c8a2-152e-4a96-a9f1-b91db4ab4c07"
  },
  {
    id: "ce318ad5-6e24-455b-9a98-4b84fc26c476",
    image: `${BASE_URL}/23-liverpool-frente.jpg`,
    images: [`${BASE_URL}/23-liverpool-frente.jpg`, `${BASE_URL}/23-liverpool-verso.jpg`],
    name: "Camiseta Liverpool 2026/27",
    team: "Liverpool FC",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "You'll Never Walk Alone em forma de camisa. Tradição e garra de Anfield.",
    externalCheckoutUrl: "/checkout?id=ce318ad5-6e24-455b-9a98-4b84fc26c476"
  },
  {
    id: "37bf2a9c-fd7f-40ab-a36f-af4873fb508b",
    image: `${BASE_URL}/24-chelsea-frente.jpg`,
    images: [`${BASE_URL}/24-chelsea-frente.jpg`, `${BASE_URL}/24-chelsea-verso.jpg`],
    name: "Camiseta Chelsea 2026/27",
    team: "Chelsea FC",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "O Pride of London em azul royal deslumbrante. Padrão geométrico urbano.",
    externalCheckoutUrl: "/checkout?id=37bf2a9c-fd7f-40ab-a36f-af4873fb508b"
  },
  {
    id: "8707c163-1b30-4623-bdf2-1145f432e250",
    image: `${BASE_URL}/25-mancity-frente.jpg`,
    images: [`${BASE_URL}/25-mancity-frente.jpg`, `${BASE_URL}/25-mancity-verso.jpg`],
    name: "Camiseta Manchester City 2026/27",
    team: "Manchester City",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O sky blue que dominou a Inglaterra. Sinônimo de conquistas.",
    externalCheckoutUrl: "/checkout?id=8707c163-1b30-4623-bdf2-1145f432e250"
  },
  {
    id: "ee655070-ed53-40c0-afe3-bb15ac8ea04b",
    image: `${BASE_URL}/26-tottenham-frente.jpg`,
    images: [`${BASE_URL}/26-tottenham-frente.jpg`, `${BASE_URL}/26-tottenham-verso.jpg`],
    name: "Camiseta Tottenham 2026/27",
    team: "Tottenham Hotspur",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "O branco imaculado dos Spurs com detalhes em azul marinho. Tradição londrina.",
    externalCheckoutUrl: "/checkout?id=ee655070-ed53-40c0-afe3-bb15ac8ea04b"
  },
  {
    id: "e121f324-d1b5-4f8a-b4d4-99822e921f42",
    image: `${BASE_URL}/27-borussia-frente.jpg`,
    images: [`${BASE_URL}/27-borussia-frente.jpg`, `${BASE_URL}/27-borussia-verso.jpg`],
    name: "Camiseta Borussia Dortmund 2026/27",
    team: "Borussia Dortmund",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O Muro Amarelo em forma de camisa. Amarelo vibrante e estampa explosiva.",
    externalCheckoutUrl: "/checkout?id=e121f324-d1b5-4f8a-b4d4-99822e921f42"
  },
  {
    id: "7a131914-3e37-4b0b-9a1d-e588b1a109db",
    image: `${BASE_URL}/28-leverkusen-frente.jpg`,
    images: [`${BASE_URL}/28-leverkusen-frente.jpg`, `${BASE_URL}/28-leverkusen-verso.jpg`],
    name: "Camiseta Bayer Leverkusen 2026/27",
    team: "Bayer Leverkusen",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "O invicto que conquistou a Bundesliga. Sinônimo de excelência.",
    externalCheckoutUrl: "/checkout?id=7a131914-3e37-4b0b-9a1d-e588b1a109db"
  },
  {
    id: "654f2c3f-a0da-4170-a5bd-a3610a06e066",
    image: `${BASE_URL}/29-leipzig-frente.jpg`,
    images: [`${BASE_URL}/29-leipzig-frente.jpg`, `${BASE_URL}/29-leipzig-verso.jpg`],
    name: "Camiseta RB Leipzig 2026/27",
    team: "RB Leipzig",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "A força dos touros vermelhos em azul marinho. Energia e ousadia.",
    externalCheckoutUrl: "/checkout?id=654f2c3f-a0da-4170-a5bd-a3610a06e066"
  },
  {
    id: "856fe81a-08db-4a17-83be-2f32bc9958e7",
    image: `${BASE_URL}/30-bayern-frente.png`,
    images: [`${BASE_URL}/30-bayern-frente.png`, `${BASE_URL}/30-bayern-verso.png`],
    name: "Camiseta Bayern de Munique 2026/27",
    team: "Bayern de Munique",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "Mia San Mia em vermelho e branco deslumbrante. O maior da Alemanha.",
    externalCheckoutUrl: "/checkout?id=856fe81a-08db-4a17-83be-2f32bc9958e7"
  },
  {
    id: "d0d30f1f-5efd-4e8a-b9f8-a8a9daef4dc7",
    image: `${BASE_URL}/31-frankfurt-frente.jpg`,
    images: [`${BASE_URL}/31-frankfurt-frente.jpg`, `${BASE_URL}/31-frankfurt-verso.jpg`],
    name: "Camiseta Eintracht Frankfurt 2026/27",
    team: "Eintracht Frankfurt",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "Nur eine Stadt, nur ein Verein. Raça e tradição alemã.",
    externalCheckoutUrl: "/checkout?id=d0d30f1f-5efd-4e8a-b9f8-a8a9daef4dc7"
  },
  {
    id: "f0dcfa0b-2ebf-4096-adf7-1d67725e8172",
    image: `${BASE_URL}/32-realmadrid-frente.jpg`,
    images: [`${BASE_URL}/32-realmadrid-frente.jpg`, `${BASE_URL}/32-realmadrid-verso.jpg`],
    name: "Camiseta Real Madrid 2026/27",
    team: "Real Madrid",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O Rei da Europa em branco e dourado majestoso. Maior clube do mundo.",
    externalCheckoutUrl: "/checkout?id=f0dcfa0b-2ebf-4096-adf7-1d67725e8172"
  },
  {
    id: "3c38b627-a66e-427e-acdf-e0cecf8aba46",
    image: `${BASE_URL}/33-barcelona-frente.jpg`,
    images: [`${BASE_URL}/33-barcelona-frente.jpg`, `${BASE_URL}/33-barcelona-verso.jpg`],
    name: "Camiseta Barcelona 2026/27",
    team: "FC Barcelona",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "Més que un club em listras blaugrana. Camp Nou respira nesta camisa.",
    externalCheckoutUrl: "/checkout?id=3c38b627-a66e-427e-acdf-e0cecf8aba46"
  },
  {
    id: "b22f1b45-27c3-4730-a7ae-c5642c2619f8",
    image: `${BASE_URL}/34-atletico-frente.jpg`,
    images: [`${BASE_URL}/34-atletico-frente.jpg`, `${BASE_URL}/34-atletico-verso.jpg`],
    name: "Camiseta Atlético de Madrid 2026/27",
    team: "Atlético de Madrid",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "As listras rojiblancas que nunca desistem. Atleti é coração e luta.",
    externalCheckoutUrl: "/checkout?id=b22f1b45-27c3-4730-a7ae-c5642c2619f8"
  },
  {
    id: "30f0444c-9e03-4cd8-98f4-2ec16a4ad326",
    image: `${BASE_URL}/35-psg-frente.jpg`,
    images: [`${BASE_URL}/35-psg-frente.jpg`, `${BASE_URL}/35-psg-verso.jpg`],
    name: "Camiseta PSG 2026/27",
    team: "Paris Saint-Germain",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "A Cidade Luz em azul marinho e vermelho. Glamour e futebol parisiense.",
    externalCheckoutUrl: "/checkout?id=30f0444c-9e03-4cd8-98f4-2ec16a4ad326"
  },
  {
    id: "23be9419-95c0-4c92-a371-43cb4dd70791",
    image: `${BASE_URL}/36-marseille-frente.jpg`,
    images: [`${BASE_URL}/36-marseille-frente.jpg`, `${BASE_URL}/36-marseille-verso.jpg`],
    name: "Camiseta Olympique de Marseille 2026/27",
    team: "Olympique de Marseille",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "O azul marinho com detalhes em azul celeste do OM. Marselha é paixão.",
    externalCheckoutUrl: "/checkout?id=23be9419-95c0-4c92-a371-43cb4dd70791"
  },
  {
    id: "09817d91-1b6a-4315-8c5d-9505d434f686",
    image: `${BASE_URL}/37-lyon-frente.jpg`,
    images: [`${BASE_URL}/37-lyon-frente.jpg`, `${BASE_URL}/37-lyon-verso.jpg`],
    name: "Camiseta Olympique Lyonnais 2026/27",
    team: "Olympique Lyonnais",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "O branco clássico com faixa bleu-blanc-rouge central. Lyon é tradição.",
    externalCheckoutUrl: "/checkout?id=09817d91-1b6a-4315-8c5d-9505d434f686"
  },
  {
    id: "f1dbae1a-0aee-4173-b6d7-5264113e44ae",
    image: `${BASE_URL}/38-lille-frente.jpg`,
    images: [`${BASE_URL}/38-lille-frente.jpg`, `${BASE_URL}/38-lille-verso.jpg`],
    name: "Camiseta Lille OSC Home",
    team: "LOSC Lille",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "O vermelho intenso com padrão geométrico hipnotizante. Lille é revelação.",
    externalCheckoutUrl: "/checkout?id=f1dbae1a-0aee-4173-b6d7-5264113e44ae"
  },
  {
    id: "f56eb04c-2a8f-4dda-a446-cb929c2315b7",
    image: `${BASE_URL}/39-monaco-frente.jpg`,
    images: [`${BASE_URL}/39-monaco-frente.jpg`, `${BASE_URL}/39-monaco-verso.jpg`],
    name: "Camiseta AS Monaco Home",
    team: "AS Monaco",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description: "A diagonal vermelha e branca icônica do Principado. Glamour e gols.",
    externalCheckoutUrl: "/checkout?id=f56eb04c-2a8f-4dda-a446-cb929c2315b7"
  },
  {
    id: "287fefad-2acc-47bf-b756-333678f4f0f9",
    image: `${BASE_URL}/40-flamengo-frente.jpg`,
    images: [`${BASE_URL}/40-flamengo-frente.jpg`, `${BASE_URL}/40-flamengo-verso.jpg`],
    name: "Camiseta Flamengo Home 2026/27",
    team: "Flamengo",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O rubro-negro mais amado do Brasil. A Nação veste com orgulho.",
    externalCheckoutUrl: "/checkout?id=287fefad-2acc-47bf-b756-333678f4f0f9"
  },
  {
    id: "2786bbee-354f-4597-a5fa-2a0426c0703c",
    image: `${BASE_URL}/41-corinthians-frente.png`,
    images: [`${BASE_URL}/41-corinthians-frente.png`, `${BASE_URL}/41-corinthians-verso.png`],
    name: "Camiseta Corinthians Home 2026/27",
    team: "Corinthians",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O manto alvinegro do Timão. Corinthians é povo e resistência.",
    externalCheckoutUrl: "/checkout?id=2786bbee-354f-4597-a5fa-2a0426c0703c"
  },
  {
    id: "e708e86c-5295-49bf-beb9-95c2340d7311",
    image: `${BASE_URL}/42-palmeiras-frente.png`,
    images: [`${BASE_URL}/42-palmeiras-frente.png`, `${BASE_URL}/42-palmeiras-verso.png`],
    name: "Camiseta Palmeiras Home 2026/27",
    team: "Palmeiras",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O verde alviverde que é sinônimo de títulos. Verdão é tradição.",
    externalCheckoutUrl: "/checkout?id=e708e86c-5295-49bf-beb9-95c2340d7311"
  },
  {
    id: "054577a5-e4f7-459c-b332-2d934fc089c7",
    image: `${BASE_URL}/43-saopaulo-frente.png`,
    images: [`${BASE_URL}/43-saopaulo-frente.png`, `${BASE_URL}/43-saopaulo-verso.png`],
    name: "Camiseta São Paulo Home 2026/27",
    team: "São Paulo FC",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O tricolor paulista em branco, vermelho e preto. Morumbi pulsa.",
    externalCheckoutUrl: "/checkout?id=054577a5-e4f7-459c-b332-2d934fc089c7"
  },
  {
    id: "d812bb24-43ad-4f95-b6b5-ce06c0c0e487",
    image: `${BASE_URL}/44-vasco-frente.png`,
    images: [`${BASE_URL}/44-vasco-frente.png`, `${BASE_URL}/44-vasco-verso.png`],
    name: "Camiseta Vasco Home 2026/27",
    team: "Vasco da Gama",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "A faixa diagonal que é símbolo de resistência. Gigante da Colina.",
    externalCheckoutUrl: "/checkout?id=d812bb24-43ad-4f95-b6b5-ce06c0c0e487"
  },
  {
    id: "2c64505b-69d9-453e-ad1f-ec3a61dfacd0",
    image: `${BASE_URL}/45-internacional-frente.png`,
    images: [`${BASE_URL}/45-internacional-frente.png`, `${BASE_URL}/45-internacional-verso.png`],
    name: "Camiseta Internacional Home 2026/27",
    team: "Internacional",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O vermelho colorado que incendeia o Beira-Rio. Paixão gaúcha.",
    externalCheckoutUrl: "/checkout?id=2c64505b-69d9-453e-ad1f-ec3a61dfacd0"
  },
  {
    id: "321cf2ad-5f7b-41b7-a8f0-b69ddf96d8af",
    image: `${BASE_URL}/46-gremio-frente.png`,
    images: [`${BASE_URL}/46-gremio-frente.png`, `${BASE_URL}/46-gremio-verso.png`],
    name: "Camiseta Grêmio Home 2026/27",
    team: "Grêmio",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O tricolor gaúcho em azul, preto e branco. Imortal Tricolor.",
    externalCheckoutUrl: "/checkout?id=321cf2ad-5f7b-41b7-a8f0-b69ddf96d8af"
  },
  {
    id: "3aa75dda-7e62-4a8c-b679-3e14a08dec60",
    image: `${BASE_URL}/47-cruzeiro-frente.png`,
    images: [`${BASE_URL}/47-cruzeiro-frente.png`, `${BASE_URL}/47-cruzeiro-verso.png`],
    name: "Camiseta Cruzeiro Home 2026/27",
    team: "Cruzeiro",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O azul celeste que brilha em Minas. Raposa é cinco estrelas.",
    externalCheckoutUrl: "/checkout?id=3aa75dda-7e62-4a8c-b679-3e14a08dec60"
  },
  {
    id: "b763ceab-0648-4ea4-b889-ccf5c446fbe1",
    image: `${BASE_URL}/48-atleticomg-frente.png`,
    images: [`${BASE_URL}/48-atleticomg-frente.png`, `${BASE_URL}/48-atleticomg-verso.png`],
    name: "Camiseta Atlético-MG Home 2026/27",
    team: "Atlético Mineiro",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O preto e branco do Galo Forte. Raça e paixão mineira.",
    externalCheckoutUrl: "/checkout?id=b763ceab-0648-4ea4-b889-ccf5c446fbe1"
  },
  {
    id: "7d58bd78-051f-4c0d-b1c0-85df57f1c645",
    image: `${BASE_URL}/49-frente.png`,
    images: [`${BASE_URL}/49-frente.png`, `${BASE_URL}/49-verso.png`],
    name: "Camiseta Fluminense Home 2026/27",
    team: "Fluminense",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O tricolor das Laranjeiras. Mistura de tradição e elegância.",
    externalCheckoutUrl: "/checkout?id=7d58bd78-051f-4c0d-b1c0-85df57f1c645"
  },
  {
    id: "c19cb7f5-95ea-4915-bcbf-c8962173de99",
    image: `${BASE_URL}/50-frente.png`,
    images: [`${BASE_URL}/50-frente.png`, `${bytes_URL}/50-verso.png`],
    name: "Camiseta Bahia Home 2026/27",
    team: "Bahia",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O tricolor de aço da Bahia. Esquadrão é orgulho nordestino.",
    externalCheckoutUrl: "/checkout?id=c19cb7f5-95ea-4915-bcbf-c8962173de99"
  },
  {
    id: "8d0ebfd3-2dda-4edc-bcbe-745b619459ed",
    image: `${BASE_URL}/51-athletico-frente.png`,
    images: [`${BASE_URL}/51-athletico-frente.png`, `${BASE_URL}/51-athletico-verso.png`],
    name: "Camiseta Athletico Paranaense Home 2026/27",
    team: "Athletico Paranaense",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O rubro-negro do Furacão. Força e modernidade paranaense.",
    externalCheckoutUrl: "/checkout?id=8d0ebfd3-2dda-4edc-bcbe-745b619459ed"
  },
  {
    id: "509e7366-4cbc-41c1-8243-53ee6cb8e8d0",
    image: `${BASE_URL}/52-coritiba-frente.png`,
    images: [`${BASE_URL}/52-coritiba-frente.png`, `${BASE_URL}/52-coritiba-verso.png`],
    name: "Camiseta Coritiba Home 2026/27",
    team: "Coritiba",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O alviverde do Coxa Branca. Tradição curitibana.",
    externalCheckoutUrl: "/checkout?id=509e7366-4cbc-41c1-8243-53ee6cb8e8d0"
  },
  {
    id: "07eb8b8f-5718-4d4e-a5f4-e0e810cb6521",
    image: `${BASE_URL}/53-botafogo-sp-frente.png`,
    images: [`${BASE_URL}/53-botafogo-sp-frente.png`, `${BASE_URL}/53-botafogo-sp-verso.png`],
    name: "Camiseta Botafogo Home 2026/27",
    team: "Botafogo",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O manto alvinegro do Glorioso. História e paixão carioca.",
    externalCheckoutUrl: "/checkout?id=07eb8b8f-5718-4d4e-a5f4-e0e810cb6521"
  },
  {
    id: "9498656f-d8be-4c98-97c9-9c738fdd294c",
    image: `${BASE_URL}/54-bragantino-frente.png`,
    images: [`${BASE_URL}/54-bragantino-frente.png`, `${BASE_URL}/54-bragantino-verso.png`],
    name: "Camiseta RB Bragantino Home 2026/27",
    team: "RB Bragantino",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O Massa Bruta de Bragança Paulista. Projeto ambicioso.",
    externalCheckoutUrl: "/checkout?id=9498656f-d8be-4c98-97c9-9c738fdd294c"
  },
  {
    id: "f153d8f3-3c27-423a-a645-5c2c1b2b89a4",
    image: `${BASE_URL}/55-frente.png`,
    images: [`${BASE_URL}/55-frente.png`, `${BASE_URL}/55-verso.png`],
    name: "Camiseta Santos Home 2026/27",
    team: "Santos",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O branco sagrado da Vila Belmiro. História viva do futebol.",
    externalCheckoutUrl: "/checkout?id=f153d8f3-3c27-423a-a645-5c2c1b2b89a4"
  },
  {
    id: "78eca020-2dc5-4754-a331-7a63ba82dda0",
    image: `${BASE_URL}/56-frente.png`,
    images: [`${BASE_URL}/56-frente.png`, `${BASE_URL}/56-verso.png`],
    name: "Camiseta Vitória Home 2026/27",
    team: "EC Vitória",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O rubro-negro do Leão da Barra. Tradição, raça e amor baiano.",
    externalCheckoutUrl: "/checkout?id=78eca020-2dc5-4754-a331-7a63ba82dda0"
  },
  {
    id: "ece4cf32-c2eb-428e-b7a5-f0341f438c52",
    image: `${BASE_URL}/57-chape-frente.png`,
    images: [`${BASE_URL}/57-chape-frente.png`, `${BASE_URL}/57-chape-verso.png`],
    name: "Camiseta Chapecoense Home 2026/27",
    team: "Chapecoense",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O verde da Chape com superação. Força e orgulho catarinense.",
    externalCheckoutUrl: "/checkout?id=ece4cf32-c2eb-428e-b7a5-f0341f438c52"
  },
  {
    id: "57fc9654-10e5-4710-91c6-6c61df44373c",
    image: `${BASE_URL}/58-remo-frente.png`,
    images: [`${BASE_URL}/58-remo-frente.png`, `${BASE_URL}/58-remo-verso.png`],
    name: "Camiseta Remo Home 2026/27",
    team: "Clube do Remo",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O azul marinho do Leão Azul da Amazônia. Paixão paraense.",
    externalCheckoutUrl: "/checkout?id=57fc9654-10e5-4710-91c6-6c61df44373c"
  },
  {
    id: "2600c8ec-21b6-473c-ab62-c3c994d1eb49",
    image: `${BASE_URL}/59-mirassol-frente.png`,
    images: [`${BASE_URL}/59-mirassol-frente.png`, `${BASE_URL}/59-mirassol-verso.png`],
    name: "Camiseta Mirassol Home 2026/27",
    team: "Mirassol",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O amarelo vibrante do Leão Caipira. Orgulho local paulista.",
    externalCheckoutUrl: "/checkout?id=2600c8ec-21b6-473c-ab62-c3c994d1eb49"
  },
  {
    id: "7609f213-55d2-4115-aadd-dc2f92301a4d",
    image: `${BASE_URL}/61-palestina-frente.png`,
    images: [`${BASE_URL}/61-palestina-frente.png`, `${BASE_URL}/61-palestina-verso.png`],
    name: "Camiseta Seleção Palestina 2026",
    team: "Seleção Palestina",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O manto da resistência e orgulho palestino. Edição 2026 com design exclusivo e detalhes que honram a história do país.",
    externalCheckoutUrl: "/checkout?id=7609f213-55d2-4115-aadd-dc2f92301a4d"
  },
  {
    id: "9adab132-ac18-479f-bde3-aa1d2a82471c",
    image: `${BASE_URL}/62-inter-frente.png`,
    images: [`${BASE_URL}/62-inter-frente.png`, `${BASE_URL}/62-inter-verso.png`],
    name: "Camiseta Internacional Manga Longa Branca 2026",
    team: "Internacional",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description: "O manto branco do Colorado em versão manga longa. Elegância e tradição para o torcedor gaúcho.",
    externalCheckoutUrl: "/checkout?id=9adab132-ac18-479f-bde3-aa1d2a82471c"
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
