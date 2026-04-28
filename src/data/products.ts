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
  // ===== SELEÇÕES (01-10) =====
  {
    id: "sel-01",
    image: `${BASE_URL}/01-brasil-frente.jpg`,
    images: [
      `${BASE_URL}/01-brasil-frente.jpg`,
      `${BASE_URL}/01-brasil-verso.jpg`,
      `${BASE_URL}/01-brasil-modelo.jpg`,
    ],
    name: "Camiseta Seleção Brasileira Home 2026/27",
    team: "Seleção Brasileira",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "Vista o manto da maior seleção do mundo. A camisa amarela é mais que um uniforme — é um símbolo de paixão, garra e cinco estrelas de glória. Tecido premium com tecnologia de absorção de suor, perfeita para torcer ou usar no dia a dia com estilo. Edição 2026/27 com design moderno e detalhes em verde. Garantia de 7 dias. Parcele em até 12x sem juros.",
    externalCheckoutUrl: "/checkout?id=60b4d28c-9137-4b46-9244-5cced17f9aac",
  },
  {
    id: "sel-02",
    image: `${BASE_URL}/02-espanha-frente.jpg`,
    images: [
      `${BASE_URL}/02-espanha-frente.jpg`,
      `${BASE_URL}/02-espanha-verso.jpg`,
    ],
    name: "Camiseta Seleção Espanhola 2026/27",
    team: "Seleção Espanhola",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "A Fúria espanhola em forma de camisa. Carregando a tradição do tiki-taka e a alma campeã do mundo, esta camiseta traz o vermelho vibrante com detalhes em dourado e azul marinho. Um manto para quem entende de futebol de elite. Tecido respirável e acabamento impecável. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "sel-03",
    image: `${BASE_URL}/03-argentina-frente.jpg`,
    images: [
      `${BASE_URL}/03-argentina-frente.jpg`,
      `${BASE_URL}/03-argentina-verso.jpg`,
    ],
    name: "Camiseta Seleção Argentina 2026/27",
    team: "Seleção Argentina",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "As listras albicelestes que carregam a herança de Maradona e Messi. Tricampeã mundial, a Argentina veste esta camisa com orgulho e paixão. Design clássico com detalhes dourados e escudo bordado. Vista a camisa de uma das maiores seleções da história. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "sel-04",
    image: `${BASE_URL}/04-inglaterra-frente.jpg`,
    images: [
      `${BASE_URL}/04-inglaterra-frente.jpg`,
      `${BASE_URL}/04-inglaterra-verso.png`,
      `${BASE_URL}/04-inglaterra-modelo.jpg`,
    ],
    name: "Camiseta Seleção Inglesa 2026/27",
    team: "Seleção Inglesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "O berço do futebol em uma camisa impecável. A Inglaterra traz elegância britânica com detalhes em vermelho e azul marinho sobre o branco clássico. Design sofisticado com textura exclusiva e escudo dos Três Leões. Para quem valoriza tradição e classe. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "sel-05",
    image: `${BASE_URL}/05-brasil-azul-frente.jpg`,
    images: [
      `${BASE_URL}/05-brasil-azul-frente.jpg`,
      `${BASE_URL}/05-brasil-azul-verso.jpg`,
    ],
    name: "Camiseta Seleção Brasileira Azul 2026/27",
    team: "Seleção Brasileira",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O manto azul da seleção pentacampeã. A camisa reserva do Brasil traz um design arrojado com padrão camuflado em tons de azul profundo e detalhes dourados — uma peça única para quem quer se destacar. Tecido premium com tecnologia de absorção de suor. Edição limitada 2026/27 com parceria Jordan. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "sel-06",
    image: `${BASE_URL}/06-franca-frente.jpg`,
    images: [
      `${BASE_URL}/06-franca-frente.jpg`,
      `${BASE_URL}/06-franca-verso.jpg`,
    ],
    name: "Camiseta Seleção Francesa 2026/27",
    team: "Seleção Francesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Les Bleus em sua forma mais elegante. Bicampeã mundial, a França une tradição e modernidade nesta camisa com padrão geométrico em azul royal e gola polo clássica. O galo gaulês brilha ao lado de duas estrelas de campeão. Para quem aprecia futebol com sofisticação. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "sel-07",
    image: `${BASE_URL}/07-alemanha-frente.jpg`,
    images: [
      `${BASE_URL}/07-alemanha-frente.jpg`,
      `${BASE_URL}/07-alemanha-verso.jpg`,
    ],
    name: "Camiseta Seleção Alemã 2026/27",
    team: "Seleção Alemã",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "A máquina alemã em forma de camisa. Tetracampeã mundial, a Alemanha traz o icônico chevron nas cores da bandeira sobre o branco impecável. Um design retrô-moderno que homenageia a lendária camisa de 1990. Precisão e estilo em cada detalhe. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "sel-08",
    image: `${BASE_URL}/08-portugal-frente.jpg`,
    images: [
      `${BASE_URL}/08-portugal-frente.jpg`,
      `${BASE_URL}/08-portugal-verso.jpg`,
    ],
    name: "Camiseta Seleção Portuguesa 2026/27",
    team: "Seleção Portuguesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "O vermelho de Portugal que conquistou a Europa. A camisa da seleção lusitana traz um padrão ondulado elegante com detalhes em verde nos punhos e gola. O escudo das Quinas bordado com orgulho. De Eusébio a Cristiano, de Rafael Leão ao futuro — vista a história. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "sel-09",
    image: `${BASE_URL}/09-holanda-frente.jpg`,
    images: [
      `${BASE_URL}/09-holanda-frente.jpg`,
      `${BASE_URL}/09-holanda-verso.jpg`,
    ],
    name: "Camiseta Seleção Holandesa 2026/27",
    team: "Seleção Holandesa",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "A Laranja Mecânica em versão away. A Holanda traz esta camisa branca com faixa laranja em degradê no peito e o leão holandês ao centro. Design clean e moderno que honra a tradição do futebol total. De Cruyff a Van Dijk, puro estilo. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "sel-10",
    image: `${BASE_URL}/10-italia-frente.jpg`,
    images: [
      `${BASE_URL}/10-italia-frente.jpg`,
      `${BASE_URL}/10-italia-verso.jpg`,
    ],
    name: "Camiseta Seleção Italiana 2026/27",
    team: "Seleção Italiana",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["seleções"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "A Azzurra que encanta o mundo. Tetracampeã mundial, a Itália traz esta camisa away em branco gelo com padrão geométrico sutil e detalhes em azul marinho e dourado. O escudo da FIGC com quatro estrelas brilha no peito. De Baggio a Buffon, de Totti ao futuro — vista a elegância italiana. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },

  // ===== RETRÔ (11-16) =====
  {
    id: "ret-11",
    image: `${BASE_URL}/11-milan-frente.jpg`,
    images: [
      `${BASE_URL}/11-milan-frente.jpg`,
      `${BASE_URL}/11-milan-verso.jpg`,
    ],
    name: "Camiseta Milan 2009/10",
    team: "AC Milan",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O Diavolo em sua era dourada. A camisa manga longa do Milan 2009/10 traz as icônicas listras rossonere com gola polo branca — usada por lendas como Kaká, Pirlo e Maldini. Uma peça de colecionador que respira história e grandeza. Tecido premium com acabamento retrô autêntico. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "ret-12",
    image: `${BASE_URL}/12-inter-frente.jpg`,
    images: [
      `${BASE_URL}/12-inter-frente.jpg`,
      `${BASE_URL}/12-inter-verso.jpg`,
    ],
    name: "Camiseta Inter de Milão 1998/99",
    team: "Inter de Milão",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "A Nerazzurri na era Ronaldo Fenômeno. A camisa da Inter 1998/99 com as clássicas listras azuis e pretas, gola polo e o patrocínio Pirelli. Vestida pelo maior atacante de todos os tempos, esta peça é pura nostalgia e poder. Edição retrô fiel ao original. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "ret-13",
    image: `${BASE_URL}/13-juventus-frente.jpg`,
    images: [
      `${BASE_URL}/13-juventus-frente.jpg`,
      `${BASE_URL}/13-juventus-verso.jpg`,
    ],
    name: "Camiseta Juventus 1995/97",
    team: "Juventus",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "A Vecchia Signora campeã da Champions. A Juventus 1995/97 da Kappa com patrocínio Sony — a camisa que Del Piero, Zidane e Vialli vestiram para conquistar a Europa. Listras bianconeire clássicas com duas estrelas douradas. Uma relíquia do futebol mundial. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "ret-14",
    image: `${BASE_URL}/14-lazio-frente.jpg`,
    images: [
      `${BASE_URL}/14-lazio-frente.jpg`,
      `${BASE_URL}/14-lazio-verso.jpg`,
    ],
    name: "Camiseta Lazio 1999/2000",
    team: "Lazio",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "A Lazio campeã do Scudetto. A camisa away branca da temporada 1999/2000, com faixas celestes nos ombros e detalhes dourados. A águia da Lazio e o centenário do clube estampados com orgulho. Vestida por Nesta, Veron e Nedvěd na conquista do título italiano. Peça rara e exclusiva. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "ret-15",
    image: `${BASE_URL}/15-fiorentina-frente.jpg`,
    images: [
      `${BASE_URL}/15-fiorentina-frente.jpg`,
      `${BASE_URL}/15-fiorentina-verso.jpg`,
    ],
    name: "Camiseta Fiorentina 1995/96",
    team: "Fiorentina",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "A Viola de Batistuta em sua fase mais gloriosa. A camisa away branca da Fiorentina 1995/96 com os icônicos grafismos roxos nos ombros, gola polo e o lírio de Florença no peito. Patrocínio Sammontana e fabricação Reebok. Uma obra de arte do futebol italiano que poucos conseguem ter. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "ret-16",
    image: `${BASE_URL}/16-parma-frente.jpg`,
    images: [
      `${BASE_URL}/16-parma-frente.jpg`,
      `${BASE_URL}/16-parma-verso.jpg`,
    ],
    name: "Camiseta Parma 2002/03",
    team: "Parma AC",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["retrô"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O Parma da era de ouro do calcio italiano. A camisa home branca com a faixa azul e dourada no peito, patrocínio Parmalat e fabricação Champion. Vestida por Buffon, Cannavaro e Adriano. Uma peça que representa o auge do futebol italiano nos anos 2000. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },

  // ===== EUROPEUS (17-39) =====
  {
    id: "eur-17",
    image: `${BASE_URL}/17-milan-home-frente.jpg`,
    images: [
      `${BASE_URL}/17-milan-home-frente.jpg`,
      `${BASE_URL}/17-milan-home-verso.jpg`,
    ],
    name: "Camiseta Milan Home 2026/27",
    team: "AC Milan",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "O Diavolo rossonero em sua versão moderna. As listras vermelhas e pretas com padrão camuflado trazem a essência do Milan para uma nova era. Patrocínio Emirates e fabricação Puma com tecnologia DryCELL. De Maldini a Leão, o DNA do Milan segue vivo. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-18",
    image: `${BASE_URL}/18-inter-frente.jpg`,
    images: [
      `${BASE_URL}/18-inter-frente.jpg`,
      `${BASE_URL}/18-inter-verso.jpg`,
    ],
    name: "Camiseta Inter de Milão 2026/27",
    team: "Inter de Milão",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "A Nerazzurri com listras onduladas em azul e preto que hipnotizam. A Inter de Milão 2026/27 traz design arrojado com detalhes em ciano, patrocínio Betsson e fabricação Nike. Bicampeã da Champions, a Inter veste poder e tradição. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-19",
    image: `${BASE_URL}/19-juventus-frente.jpg`,
    images: [
      `${BASE_URL}/19-juventus-frente.jpg`,
      `${BASE_URL}/19-juventus-verso.jpg`,
    ],
    name: "Camiseta Juventus 2026/27",
    team: "Juventus",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "A Vecchia Signora reinventada. As listras bianconeire com textura diagonal e detalhes em rosa trazem modernidade à tradição da Juve. Fabricação Adidas com três listras nos ombros. De Del Piero a Vlahović, a Juventus nunca para de evoluir. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-20",
    image: `${BASE_URL}/20-roma-frente.jpg`,
    images: [
      `${BASE_URL}/20-roma-frente.jpg`,
      `${BASE_URL}/20-roma-verso.jpg`,
    ],
    name: "Camiseta Roma 2026/27",
    team: "AS Roma",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "A Lupa Capitolina em forma de camisa. O grená profundo com detalhes em laranja queimado traz a alma de Roma para o campo. Fabricação Adidas com painéis laterais dinâmicos e o escudo da Loba no peito. De Totti a Dybala, a Roma é paixão eterna. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-21",
    image: `${BASE_URL}/21-napoli-frente.jpg`,
    images: [
      `${BASE_URL}/21-napoli-frente.jpg`,
      `${BASE_URL}/21-napoli-verso.jpg`,
    ],
    name: "Camiseta Napoli 2026/27",
    team: "SSC Napoli",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O azzurro de Nápoles que fez Maradona rei. A camisa home do Napoli 2026/27 em azul celeste com padrão texturizado, gola V e detalhes brancos. Fabricação EA7 com patrocínio MSC. Campeão italiano, o Napoli vive seu melhor momento. Vista a magia de Kvaratskhelia. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-22",
    image: `${BASE_URL}/22-manutd-frente.jpg`,
    images: [
      `${BASE_URL}/22-manutd-frente.jpg`,
      `${BASE_URL}/22-manutd-verso.jpg`,
    ],
    name: "Camiseta Manchester United 2026/27",
    team: "Manchester United",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "O Theatre of Dreams em vermelho vibrante. O Manchester United 2026/27 traz o icônico vermelho com mangas estampadas em padrão geométrico e punhos pretos. Patrocínio Snapdragon e fabricação Adidas. De Best a Beckham, de Ronaldo a Rashford — Old Trafford pulsa nesta camisa. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-23",
    image: `${BASE_URL}/23-liverpool-frente.jpg`,
    images: [
      `${BASE_URL}/23-liverpool-frente.jpg`,
      `${BASE_URL}/23-liverpool-verso.jpg`,
    ],
    name: "Camiseta Liverpool 2026/27",
    team: "Liverpool FC",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "You'll Never Walk Alone em forma de camisa. O Liverpool 2026/27 traz o vermelho intenso de Anfield com detalhes brancos nos ombros e gola. Patrocínio Standard Chartered e fabricação Adidas. De Gerrard a Salah, o Liverpool é tradição e garra. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-24",
    image: `${BASE_URL}/24-chelsea-frente.jpg`,
    images: [
      `${BASE_URL}/24-chelsea-frente.jpg`,
      `${BASE_URL}/24-chelsea-verso.jpg`,
    ],
    name: "Camiseta Chelsea 2026/27",
    team: "Chelsea FC",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "O Pride of London em azul royal deslumbrante. O Chelsea 2026/27 traz um padrão geométrico urbano inspirado na arquitetura de Londres, com gola branca e detalhes em vermelho. Fabricação Nike com patrocínio Trivago nas costas. De Zola a Palmer, Stamford Bridge pulsa nesta camisa. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-25",
    image: `${BASE_URL}/25-mancity-frente.jpg`,
    images: [
      `${BASE_URL}/25-mancity-frente.jpg`,
      `${BASE_URL}/25-mancity-verso.jpg`,
    ],
    name: "Camiseta Manchester City 2026/27",
    team: "Manchester City",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O sky blue que dominou a Inglaterra. O Manchester City 2026/27 traz o azul celeste com faixa diagonal branca em estilo pincelada e detalhes em marinho. Patrocínio Etihad Airways e fabricação Puma. De Agüero a Haaland, o City é sinônimo de conquistas. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-26",
    image: `${BASE_URL}/26-tottenham-frente.jpg`,
    images: [
      `${BASE_URL}/26-tottenham-frente.jpg`,
      `${BASE_URL}/26-tottenham-verso.jpg`,
    ],
    name: "Camiseta Tottenham 2026/27",
    team: "Tottenham Hotspur",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "O branco imaculado dos Spurs com detalhes em azul marinho e cinza nos ombros. O Tottenham 2026/27 traz design moderno com gola redonda e o galo de crista no peito. Patrocínio AIA e fabricação Nike. De Gascoigne a Son, o Spurs é tradição londrina. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-27",
    image: `${BASE_URL}/27-borussia-frente.jpg`,
    images: [
      `${BASE_URL}/27-borussia-frente.jpg`,
      `${BASE_URL}/27-borussia-verso.jpg`,
    ],
    name: "Camiseta Borussia Dortmund 2026/27",
    team: "Borussia Dortmund",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O Muro Amarelo em forma de camisa. O Borussia Dortmund 2026/27 traz o amarelo vibrante com estampa explosiva em preto nos ombros e gola V. Patrocínio Vodafone e fabricação Puma. De Reus a Bellingham, o Signal Iduna Park pulsa nesta camisa. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-28",
    image: `${BASE_URL}/28-leverkusen-frente.jpg`,
    images: [
      `${BASE_URL}/28-leverkusen-frente.jpg`,
      `${BASE_URL}/28-leverkusen-verso.jpg`,
    ],
    name: "Camiseta Bayer Leverkusen 2026/27",
    team: "Bayer Leverkusen",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "O invicto que conquistou a Bundesliga. O Bayer Leverkusen 2026/27 traz o preto profundo com padrão de cruzes vermelhas e detalhes nos punhos. Patrocínio Barmenia Gothaer e fabricação New Balance. De Xabi Alonso a Wirtz, Leverkusen é sinônimo de excelência. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-29",
    image: `${BASE_URL}/29-leipzig-frente.jpg`,
    images: [
      `${BASE_URL}/29-leipzig-frente.jpg`,
      `${BASE_URL}/29-leipzig-verso.jpg`,
    ],
    name: "Camiseta RB Leipzig 2026/27",
    team: "RB Leipzig",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "A força dos touros vermelhos em azul marinho. O RB Leipzig 2026/27 traz listras diagonais vermelhas sobre fundo navy com o icônico logo Red Bull no peito. Fabricação Puma com gola vermelha contrastante. Energia e ousadia em cada detalhe. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-30",
    image: `${BASE_URL}/30-bayern-frente.png`,
    images: [
      `${BASE_URL}/30-bayern-frente.png`,
      `${BASE_URL}/30-bayern-verso.png`,
    ],
    name: "Camiseta Bayern de Munique 2026/27",
    team: "Bayern de Munique",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "Mia San Mia em vermelho e branco deslumbrante. O Bayern de Munique 2026/27 traz o icônico vermelho com padrão ikat em branco e detalhes nos ombros. Patrocínio Deutsche Telekom e fabricação Adidas. De Beckenbauer a Müller, o maior da Alemanha veste grandeza. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-31",
    image: `${BASE_URL}/31-frankfurt-frente.jpg`,
    images: [
      `${BASE_URL}/31-frankfurt-frente.jpg`,
      `${BASE_URL}/31-frankfurt-verso.jpg`,
    ],
    name: "Camiseta Eintracht Frankfurt 2026/27",
    team: "Eintracht Frankfurt",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Nur eine Stadt, nur ein Verein. O Frankfurt 2026/27 traz as clássicas listras vermelhas e pretas com detalhes em branco e a águia no peito. Patrocínio Indeed e fabricação Adidas. Campeão da Europa League, o Eintracht é raça e tradição. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-32",
    image: `${BASE_URL}/32-realmadrid-frente.jpg`,
    images: [
      `${BASE_URL}/32-realmadrid-frente.jpg`,
      `${BASE_URL}/32-realmadrid-verso.jpg`,
    ],
    name: "Camiseta Real Madrid 2026/27",
    team: "Real Madrid",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O Rei da Europa em branco e dourado majestoso. O Real Madrid 2026/27 traz o branco imaculado com detalhes dourados e as três listras pretas nos ombros. Patrocínio Emirates e fabricação Adidas. De Di Stéfano a Vinícius Jr, o maior clube do mundo veste realeza. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-33",
    image: `${BASE_URL}/33-barcelona-frente.jpg`,
    images: [
      `${BASE_URL}/33-barcelona-frente.jpg`,
      `${BASE_URL}/33-barcelona-verso.jpg`,
    ],
    name: "Camiseta Barcelona 2026/27",
    team: "FC Barcelona",
    price: "R$ 139,93",
    priceNum: 139.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "Més que un club em listras blaugrana hipnotizantes. O Barcelona 2026/27 traz o azul e grená com textura ondulada e o Spotify ao centro. Fabricação Nike com detalhes dourados. De Cruyff a Lamine Yamal, o Camp Nou respira nesta camisa. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-34",
    image: `${BASE_URL}/34-atletico-frente.jpg`,
    images: [
      `${BASE_URL}/34-atletico-frente.jpg`,
      `${BASE_URL}/34-atletico-verso.jpg`,
    ],
    name: "Camiseta Atlético de Madrid 2026/27",
    team: "Atlético de Madrid",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "As listras rojiblancas que nunca desistem. O Atlético de Madrid 2026/27 traz o vermelho e branco clássico com patrocínio Riyadh Air e fabricação Nike. De Torres a Griezmann, o Atleti é coração e luta. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-35",
    image: `${BASE_URL}/35-psg-frente.jpg`,
    images: [
      `${BASE_URL}/35-psg-frente.jpg`,
      `${BASE_URL}/35-psg-verso.jpg`,
    ],
    name: "Camiseta PSG 2026/27",
    team: "Paris Saint-Germain",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "A Cidade Luz em azul marinho e vermelho. O PSG 2026/27 traz o azul profundo com faixa central em padrão geométrico vermelho e gola V. Patrocínio Qatar Airways e fabricação Nike. De Ronaldinho a Mbappé, Paris é glamour e futebol. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-36",
    image: `${BASE_URL}/36-marseille-frente.jpg`,
    images: [
      `${BASE_URL}/36-marseille-frente.jpg`,
      `${BASE_URL}/36-marseille-verso.jpg`,
    ],
    name: "Camiseta Olympique de Marseille 2026/27",
    team: "Olympique de Marseille",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "O azul marinho com detalhes em azul celeste do OM. O Marseille 2026/27 traz design moderno com padrão gráfico e patrocínio CMA CGM. Fabricação Puma. De Papin a Aubameyang, Marselha é paixão. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-37",
    image: `${BASE_URL}/37-lyon-frente.jpg`,
    images: [
      `${BASE_URL}/37-lyon-frente.jpg`,
      `${BASE_URL}/37-lyon-verso.jpg`,
    ],
    name: "Camiseta Olympique Lyonnais 2026/27",
    team: "Olympique Lyonnais",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "O branco clássico com faixa bleu-blanc-rouge central. O Lyon 2026/27 traz o tradicional branco com listras azul e vermelha e patrocínio Emirates. Fabricação Adidas. De Juninho a Lacazette, Lyon é tradição. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-38",
    image: `${BASE_URL}/38-lille-frente.jpg`,
    images: [
      `${BASE_URL}/38-lille-frente.jpg`,
      `${BASE_URL}/38-lille-verso.jpg`,
    ],
    name: "Camiseta Lille OSC Home",
    team: "LOSC Lille",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "O vermelho intenso com padrão geométrico hipnotizante. O Lille traz design ousado com textura 3D e patrocínio Boulanger. Fabricação New Balance. De Hazard a David, Lille é revelação. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "eur-39",
    image: `${BASE_URL}/39-monaco-frente.jpg`,
    images: [
      `${BASE_URL}/39-monaco-frente.jpg`,
      `${BASE_URL}/39-monaco-verso.jpg`,
    ],
    name: "Camiseta AS Monaco Home",
    team: "AS Monaco",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["europeus"],
    sizes: ["P", "M", "G", "GG"],
    description:
      "A diagonal vermelha e branca icônica do Principado. O Monaco traz o clássico design com patrocínio eToro e fabricação Kappa. De Henry a Ben Yedder, Monaco é glamour e gols. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },

  // ===== BRASILEIRÃO (40-59) =====
  {
    id: "bra-40",
    image: `${BASE_URL}/40-flamengo-frente.jpg`,
    images: [
      `${BASE_URL}/40-flamengo-frente.jpg`,
      `${BASE_URL}/40-flamengo-verso.jpg`,
    ],
    name: "Camiseta Flamengo Home 2026/27",
    team: "Flamengo",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O rubro-negro mais amado do Brasil. O Flamengo 2026/27 traz as listras horizontais em vermelho e preto com gola polo e fabricação Adidas. De Zico a Gabigol, a Nação veste com orgulho. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-41",
    image: `${BASE_URL}/41-corinthians-frente.png`,
    images: [
      `${BASE_URL}/41-corinthians-frente.png`,
      `${BASE_URL}/41-corinthians-verso.png`,
    ],
    name: "Camiseta Corinthians Home 2026/27",
    team: "Corinthians",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O manto alvinegro do Timão. O Corinthians 2026/27 traz o branco clássico com detalhes em preto e fabricação Nike. De Sócrates a Cássio, o Corinthians é povo e resistência. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-42",
    image: `${BASE_URL}/42-palmeiras-frente.png`,
    images: [
      `${BASE_URL}/42-palmeiras-frente.png`,
      `${BASE_URL}/42-palmeiras-verso.png`,
    ],
    name: "Camiseta Palmeiras Home 2026/27",
    team: "Palmeiras",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O verde alviverde que é sinônimo de títulos. O Palmeiras 2026/27 traz o verde com detalhes brancos e fabricação Puma. De Ademir da Guia a Endrick, o Verdão é tradição e conquistas. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-43",
    image: `${BASE_URL}/43-saopaulo-frente.png`,
    images: [
      `${BASE_URL}/43-saopaulo-frente.png`,
      `${BASE_URL}/43-saopaulo-verso.png`,
    ],
    name: "Camiseta São Paulo Home 2026/27",
    team: "São Paulo FC",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O tricolor paulista em branco, vermelho e preto. O São Paulo 2026/27 traz o clássico manto com faixa horizontal e fabricação New Balance. De Rogério Ceni a Luciano, o Morumbi pulsa nesta camisa. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-44",
    image: `${BASE_URL}/44-vasco-frente.png`,
    images: [
      `${BASE_URL}/44-vasco-frente.png`,
      `${BASE_URL}/44-vasco-verso.png`,
    ],
    name: "Camiseta Vasco Home 2026/27",
    team: "Vasco da Gama",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "A faixa diagonal que é símbolo de resistência. O Vasco 2026/27 traz o branco com a icônica faixa preta diagonal e o escudo no peito. Fabricação Kappa. De Romário a Cano, o Gigante da Colina inspira. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-45",
    image: `${BASE_URL}/45-internacional-frente.png`,
    images: [
      `${BASE_URL}/45-internacional-frente.png`,
      `${BASE_URL}/45-internacional-verso.png`,
    ],
    name: "Camiseta Internacional Home 2026/27",
    team: "Internacional",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O vermelho colorado que incendeia o Beira-Rio. O Internacional 2026/27 traz o vermelho com detalhes brancos e fabricação Adidas. De Fernandão a D'Alessandro, o Colorado é paixão gaúcha. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-46",
    image: `${BASE_URL}/46-gremio-frente.png`,
    images: [
      `${BASE_URL}/46-gremio-frente.png`,
      `${BASE_URL}/46-gremio-verso.png`,
    ],
    name: "Camiseta Grêmio Home 2026/27",
    team: "Grêmio",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O tricolor gaúcho em azul, preto e branco. O Grêmio 2026/27 traz as listras verticais clássicas com fabricação Umbro. De Renato Portaluppi a Suárez, o Imortal Tricolor é tradição e glória. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-47",
    image: `${BASE_URL}/47-cruzeiro-frente.png`,
    images: [
      `${BASE_URL}/47-cruzeiro-frente.png`,
      `${BASE_URL}/47-cruzeiro-verso.png`,
    ],
    name: "Camiseta Cruzeiro Home 2026/27",
    team: "Cruzeiro",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O azul celeste que brilha em Minas. O Cruzeiro 2026/27 traz o azul com detalhes brancos e fabricação Adidas. De Tostão a Dirceu Lopes, a Raposa é cinco estrelas e tradição. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-48",
    image: `${BASE_URL}/48-atleticomg-frente.png`,
    images: [
      `${BASE_URL}/48-atleticomg-frente.png`,
      `${BASE_URL}/48-atleticomg-verso.png`,
    ],
    name: "Camiseta Atlético-MG Home 2026/27",
    team: "Atlético Mineiro",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O preto e branco do Galo Forte. O Atlético-MG 2026/27 traz as listras verticais clássicas com fabricação Adidas. De Reinaldo a Hulk, o Galo é raça e paixão mineira. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-49",
    image: `${BASE_URL}/49-frente.png`,
    images: [
      `${BASE_URL}/49-frente.png`,
      `${BASE_URL}/49-verso.png`,
    ],
    name: "Camiseta Fluminense Home 2026/27",
    team: "Fluminense",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O tricolor das Laranjeiras em verde, grená e branco. O Fluminense 2026/27 mantém o visual clássico com fabricação Umbro. De Rivellino a Cano, o Flu mistura tradição e elegância. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-50",
    image: `${BASE_URL}/50-frente.png`,
    images: [
      `${BASE_URL}/50-frente.png`,
      `${BASE_URL}/50-verso.png`,
    ],
    name: "Camiseta Bahia Home 2026/27",
    team: "Bahia",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O tricolor de aço da Bahia. O Bahia 2026/27 traz o azul, vermelho e branco com fabricação Adidas. De Bobô a Daniel Alves, o Esquadrão é orgulho nordestino. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-51",
    image: `${BASE_URL}/51-athletico-frente.png`,
    images: [
      `${BASE_URL}/51-athletico-frente.png`,
      `${BASE_URL}/51-athletico-verso.png`,
    ],
    name: "Camiseta Athletico Paranaense Home 2026/27",
    team: "Athletico Paranaense",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O rubro-negro do Furacão. O Athletico Paranaense 2026/27 traz o vermelho e preto com fabricação Umbro. De Alex Mineiro a Fernandinho, o Furacão é força e modernidade. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-52",
    image: `${BASE_URL}/52-coritiba-frente.png`,
    images: [
      `${BASE_URL}/52-coritiba-frente.png`,
      `${BASE_URL}/52-coritiba-verso.png`,
    ],
    name: "Camiseta Coritiba Home 2026/27",
    team: "Coritiba",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O alviverde do Coxa Branca. O Coritiba 2026/27 traz o branco com detalhes verdes e fabricação Volt. De Dirceu Krüger a Alex, o Coxa é tradição curitibana. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-53",
    image: `${BASE_URL}/53-botafogo-sp-frente.png`,
    images: [
      `${BASE_URL}/53-botafogo-sp-frente.png`,
      `${BASE_URL}/53-botafogo-sp-verso.png`,
    ],
    name: "Camiseta Botafogo Home 2026/27",
    team: "Botafogo",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O manto alvinegro do Glorioso. O Botafogo 2026/27 traz o preto e branco clássico com a estrela solitária no peito. De Garrincha a Luís Henrique, o Fogão é história e paixão carioca. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-54",
    image: `${BASE_URL}/54-bragantino-frente.png`,
    images: [
      `${BASE_URL}/54-bragantino-frente.png`,
      `${BASE_URL}/54-bragantino-verso.png`,
    ],
    name: "Camiseta RB Bragantino Home 2026/27",
    team: "RB Bragantino",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O Massa Bruta de Bragança Paulista. O RB Bragantino 2026/27 traz o branco com detalhes verdes e vermelhos e fabricação Nike. Projeto moderno e ambicioso no futebol brasileiro. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-55",
    image: `${BASE_URL}/55-frente.png`,
    images: [
      `${BASE_URL}/55-frente.png`,
      `${BASE_URL}/55-verso.png`,
    ],
    name: "Camiseta Santos Home 2026/27",
    team: "Santos",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O branco sagrado da Vila Belmiro. O Santos 2026/27 traz o manto alvinegro clássico com fabricação Umbro. De Pelé a Neymar, o Peixe é história viva do futebol mundial. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-56",
    image: `${BASE_URL}/56-frente.png`,
    images: [
      `${BASE_URL}/56-frente.png`,
      `${BASE_URL}/56-verso.png`,
    ],
    name: "Camiseta Vitória Home 2026/27",
    team: "EC Vitória",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O rubro-negro do Leão da Barra. O Vitória 2026/27 traz as listras vermelhas e pretas verticais com fabricação Volt e o escudo bordado com orgulho. De Bebeto a Dinei, o Leão é tradição, raça e amor baiano. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-57",
    image: `${BASE_URL}/57-chape-frente.png`,
    images: [
      `${BASE_URL}/57-chape-frente.png`,
      `${BASE_URL}/57-chape-verso.png`,
    ],
    name: "Camiseta Chapecoense Home 2026/27",
    team: "Chapecoense",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O verde da Chape com identidade e superação. A Chapecoense 2026/27 traz o manto alviverde com fabricação própria e detalhes clássicos. A camisa carrega força, memória e orgulho catarinense. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-58",
    image: `${BASE_URL}/58-remo-frente.png`,
    images: [
      `${BASE_URL}/58-remo-frente.png`,
      `${BASE_URL}/58-remo-verso.png`,
    ],
    name: "Camiseta Remo Home 2026/27",
    team: "Clube do Remo",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O azul marinho do Leão Azul da Amazônia. O Remo 2026/27 traz um visual clássico com escudo em destaque e forte identidade paraense. Uma camisa de tradição regional e paixão da torcida. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
  {
    id: "bra-59",
    image: `${BASE_URL}/59-mirassol-frente.png`,
    images: [
      `${BASE_URL}/59-mirassol-frente.png`,
      `${BASE_URL}/59-mirassol-verso.png`,
    ],
    name: "Camiseta Mirassol Home 2026/27",
    team: "Mirassol",
    price: "R$ 109,93",
    priceNum: 109.93,
    category: ["brasileirão"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    description:
      "O amarelo vibrante do Leão Caipira. O Mirassol 2026/27 traz um visual marcante com detalhes verdes e identidade forte do interior paulista. Uma camisa de ascensão, personalidade e orgulho local. Garantia de 7 dias. Parcele em até 12x sem juros.",
  },
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

// Legacy exports for compatibility
export const historicas = retro;
export const lancamentos = europeus;
export const copaDoMundo = selecoes;
