const BUS_DATA = {
  city: "São Carlos - SP",
  operator: "Serttel Soluções em Mobilidade Urbana",
  center: [-22.008, -47.890],
  zoom: 13,

  lines: {
    "01": { name: "Pacaembu / USFCar Norte",              color: "primary"   },
    "03": { name: "Azulville / Estação Norte",         },
    "04": { name: "Vila São José / Redenção",           },
    "06": { name: "Cardinalli / Vila São José",           },
    "08": { name: "Faga-Major / Industrial",       },
    "13": { name: "Tortorelli / Astolpho",     },
    "18": { name: "Planalto verde / Vila Nery",  }
  },

  defaultSchedule: {
    "01": {
      weekday: ["05:30", "06:00", "06:20", "06:40", "07:00", "07:20", "07:45",
                "08:15", "08:45", "09:15", "09:45", "10:15", "10:45", "11:15",
                "11:45", "12:15", "12:45", "13:15", "13:45", "14:15", "14:45",
                "15:15", "15:45", "16:15", "16:45", "17:15", "17:45", "18:15",
                "18:45", "19:15", "19:45", "20:15", "20:45", "21:15", "21:45", "22:15", "22:45"],
      saturday: ["06:00", "06:30", "07:00", "07:35", "08:10", "08:50", "09:30",
                 "10:10", "10:50", "11:30", "12:10", "12:50", "13:30", "14:10",
                 "14:50", "15:30", "16:10", "16:50", "17:30", "18:10", "18:50",
                 "19:30", "20:10", "20:50", "21:30", "22:00"],
      sunday:   ["06:30", "07:15", "08:00", "08:45", "09:30", "10:15", "11:00",
                 "11:45", "12:30", "13:15", "14:00", "14:45", "15:30", "16:15",
                 "17:00", "17:45", "18:30", "19:15", "20:00", "20:45", "21:00"]
    },
    "03": {
      weekday: ["05:45", "06:15", "06:45", "07:15", "07:45", "08:20", "09:00",
                "09:40", "10:20", "11:00", "11:40", "12:20", "13:00", "13:40",
                "14:20", "15:00", "15:40", "16:20", "17:00", "17:40", "18:20",
                "19:00", "19:40", "20:20", "21:00", "21:40", "22:20"],
      saturday: ["06:30", "07:10", "07:50", "08:30", "09:10", "09:50", "10:30",
                 "11:10", "11:50", "12:30", "13:10", "13:50", "14:30", "15:10",
                 "15:50", "16:30", "17:10", "17:50", "18:30", "19:10", "19:50", "20:30", "21:10"],
      sunday:   ["07:00", "07:50", "08:40", "09:30", "10:20", "11:10", "12:00",
                 "12:50", "13:40", "14:30", "15:20", "16:10", "17:00", "17:50",
                 "18:40", "19:30", "20:20", "21:00"]
    },
    "04": {
      weekday: ["05:50", "06:25", "07:00", "07:30", "08:00", "08:30", "09:10",
                "09:50", "10:30", "11:10", "11:50", "12:30", "13:10", "13:50",
                "14:30", "15:10", "15:50", "16:30", "17:10", "17:50", "18:30",
                "19:10", "19:50", "20:30", "21:10", "21:50", "22:30"],
      saturday: ["06:15", "07:00", "07:45", "08:30", "09:15", "10:00", "10:45",
                 "11:30", "12:15", "13:00", "13:45", "14:30", "15:15", "16:00",
                 "16:45", "17:30", "18:15", "19:00", "19:45", "20:30", "21:15"],
      sunday:   ["06:45", "07:35", "08:25", "09:15", "10:05", "10:55", "11:45",
                 "12:35", "13:25", "14:15", "15:05", "15:55", "16:45", "17:35",
                 "18:25", "19:15", "20:05", "20:55"]
    },
    "06": {
      weekday: ["06:00", "06:40", "07:20", "08:00", "08:45", "09:30", "10:15",
                "11:00", "11:45", "12:30", "13:15", "14:00", "14:45", "15:30",
                "16:15", "17:00", "17:45", "18:30", "19:15", "20:00", "20:45", "21:30"],
      saturday: ["06:45", "07:30", "08:15", "09:00", "09:45", "10:30", "11:15",
                 "12:00", "12:45", "13:30", "14:15", "15:00", "15:45", "16:30",
                 "17:15", "18:00", "18:45", "19:30", "20:15", "21:00"],
      sunday:   ["07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30",
                 "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30"]
    },
    "08": {
      weekday: ["05:30", "06:10", "06:50", "07:25", "08:00", "08:40", "09:20",
                "10:00", "10:40", "11:20", "12:00", "12:40", "13:20", "14:00",
                "14:40", "15:20", "16:00", "16:40", "17:20", "18:00", "18:40",
                "19:20", "20:00", "20:40", "21:20", "22:00", "22:40"],
      saturday: ["06:30", "07:15", "08:00", "08:45", "09:30", "10:15", "11:00",
                 "11:45", "12:30", "13:15", "14:00", "14:45", "15:30", "16:15",
                 "17:00", "17:45", "18:30", "19:15", "20:00", "20:45", "21:30"],
      sunday:   ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
                 "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"]
    },
    "13": {
      weekday: ["06:10", "06:50", "07:30", "08:10", "08:55", "09:40", "10:25",
                "11:10", "11:55", "12:40", "13:25", "14:10", "14:55", "15:40",
                "16:25", "17:10", "17:55", "18:40", "19:25", "20:10", "20:55", "21:40"],
      saturday: ["07:00", "07:50", "08:40", "09:30", "10:20", "11:10", "12:00",
                 "12:50", "13:40", "14:30", "15:20", "16:10", "17:00", "17:50",
                 "18:40", "19:30", "20:20", "21:10"],
      sunday:   ["07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30",
                 "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30"]
    },
    "18": {
      weekday: ["06:00", "06:45", "07:30", "08:15", "09:00", "09:45", "10:30",
                "11:15", "12:00", "12:45", "13:30", "14:15", "15:00", "15:45",
                "16:30", "17:15", "18:00", "18:45", "19:30", "20:15", "21:00", "21:45"],
      saturday: ["06:45", "07:30", "08:15", "09:00", "09:45", "10:30", "11:15",
                 "12:00", "12:45", "13:30", "14:15", "15:00", "15:45", "16:30",
                 "17:15", "18:00", "18:45", "19:30", "20:15", "21:00"],
      sunday:   ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
                 "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
    }
  },

  routes: {
  "01": ["p27", "p27", "p28", "p2", "p60", "p1", "p21", "p7", "p22", "p53", "p58", "p73", "p11", "p63", "p26", "p84"],
  "03": ["p52", "p51", "p37", "p55", "p64", "p38", "p6", "p35", "p36", "p57", "p76", "p65", "p69", "p59", "p50", "p71", "p74", "p72", "p75", "p47", "p17", "p23", "p26", "p11", "p21", "p1", "p3"],
  "04": ["p29", "p30", "p3", "p54", "p85", "p66", "p47", "p17", "p23", "p26", "p11", "p21", "p1", "p73", "p58", "p50", "p71", "p74", "p59", "p10", "p15", "p18", "p24"],
  "06": ["p52", "p51", "p39", "p28", "p27", "p40", "p8", "p10", "p31", "p32", "p78", "p80", "p62", "p1", "p21", "p15", "p24", "p68", "p49", "p70", "p53", "p5", "p7", "p9", "p11", "p22", "p23", "p61"],
  "08": ["p81", "p82", "p45", "p4", "p46", "p41", "p42", "p47", "p31", "p32", "p35", "p36", "p48", "p49", "p7", "p22"],
  "13": ["p41", "p23", "p52", "p79", "p43", "p6", "p4", "p44", "p2", "p27", "p28", "p60", "p15", "p24", "p1", "p22", "p7", "p17", "p23", "p26", "p11", "p73", "p51", "p77", "p25", "p67", "p48", "p56", "p9", "p5", "p33", "p34", "p21"],
  "18": ["p83", "p81", "p45", "p46", "p31", "p32", "p10", "p8", "p78", "p80", "p62", "p1", "p22", "p7", "p25", "p67", "p48", "p76", "p65", "p69", "p57", "p35", "p36", "p6"]
},

 points: [
  {
    id: "p1",
    name: "Terminal Rodoviária",
    address: "Av. Henrique Gregori - Centro",
    lat: -22.0052,
    lng: -47.8892,
    type: "terminal",
    lines: ["01", "03", "04", "06", "13", "18"]
  },
  {
    id: "p2",
    name: "Terminal Cidade Aracy",
    address: "Av. João Sabino - Cidade Aracy",
    lat: -22.0625,
    lng: -47.9025,
    type: "terminal",
    lines: ["01", "13"]
  },
  {
    id: "p3",
    name: "Terminal Vila Nery",
    address: "Av. São Carlos - Vila Nery",
    lat: -22.0130,
    lng: -47.8825,
    type: "terminal",
    lines: ["04", "03"]
  },
  {
    id: "p4",
    name: "Terminal Maria Stella Fagá",
    address: "Av. Bruno Ruggiero Filho - Maria Stella Fagá",
    lat: -22.0040,
    lng: -47.8576,
    type: "terminal",
    lines: [ "08", "13"]
  },
  {
    id: "p5",
    name: "Terminal Cruzeiro do Sul",
    address: "R. Alfredo Lopes de Oliveira - Cruzeiro do Sul",
    lat: -22.0385,
    lng: -47.8920,
    type: "terminal",
    lines: ["06", "13"]
  },
  {
    id: "p6",
    name: "Terminal Jardim Ipanema",
    address: "Av. Victor Attanasio - Parque Delta",
    lat: -21.9888,
    lng: -47.9305,
    type: "terminal",
    lines: ["03", "13", "18"]
  },
  {
    id: "p7",
    name: "Praça XV de Novembro",
    address: "R. Episcopal com R. São Sebastião - Centro",
    lat: -22.0172,
    lng: -47.8935,
    type: "stop",
    lines: ["01", "06", "08", "13", "18"]
  },
  {
    id: "p8",
    name: "UFSCar (Campus São Carlos)",
    address: "Rod. Washington Luís, km 235",
    lat: -21.9825,
    lng: -47.8808,
    type: "stop",
    lines: ["06", "18"]
  },
  {
    id: "p9",
    name: "USP São Carlos (EESC/IAU)",
    address: "Av. Trabalhador São-carlense, 400",
    lat: -22.0044,
    lng: -47.9270,
    type: "stop",
    lines: ["06", "13"]
  },
  {
    id: "p10",
    name: "Hospital Universitário (HU-UFSCar)",
    address: "Rod. Washington Luís, km 235",
    lat: -21.9835,
    lng: -47.8810,
    type: "stop",
    lines: ["04", "06", "18"]
  },
  {
    id: "p11",
    name: "Santa Casa de São Carlos",
    address: "R. Paulino Botelho de Abreu Sampaio, 573",
    lat: -22.0119,
    lng: -47.8892,
    type: "stop",
    lines: ["01", "03", "04", "06", "13"]
  },
  {
    id: "p15",
    name: "Câmara Municipal",
    address: "R. 7 de Setembro - Centro",
    lat: -22.0182,
    lng: -47.8860,
    type: "stop",
    lines: ["04", "06", "13"]
  },
  {
    id: "p18",
    name: "SENAI São Carlos",
    address: "Av. Paulista - Vila Boa Vista",
    lat: -22.0070,
    lng: -47.9020,
    type: "stop",
    lines: ["04"]
  },
  {
    id: "p21",
    name: "Ponto Av. São Carlos (Centro)",
    address: "Av. São Carlos, 1200 - Centro",
    lat: -22.0192,
    lng: -47.8912,
    type: "stop",
    lines: ["01", "03", "04", "06", "13"]
  },
  {
    id: "p22",
    name: "Ponto R. Episcopal (Centro)",
    address: "R. Episcopal, 800 - Centro",
    lat: -22.0184,
    lng: -47.8890,
    type: "stop",
    lines: ["01", "06", "08", "13", "18"]
  },
  {
    id: "p23",
    name: "Ponto Av. Dr. Carlos Botelho",
    address: "Av. Dr. Carlos Botelho - Vila Prado",
    lat: -22.0240,
    lng: -47.9005,
    type: "stop",
    lines: ["03", "04", "06", "13"]
  },
  {
    id: "p24",
    name: "Ponto R. 7 de Setembro",
    address: "R. 7 de Setembro, 1500 - Centro",
    lat: -22.0195,
    lng: -47.8848,
    type: "stop",
    lines: ["04", "06", "13"]
  },

  {
    id: "p25",
    name: "Ponto Jd. Lutfalla",
    address: "Av. Trabalhador São-carlense - Jd. Lutfalla",
    lat: -22.0018,
    lng: -47.9215,
    type: "stop",
    lines: ["13", "18"]
  },
  {
    id: "p26",
    name: "Ponto R. Paulino Botelho (Santa Casa)",
    address: "R. Paulino Botelho de Abreu Sampaio - Centro",
    lat: -22.0128,
    lng: -47.8900,
    type: "stop",
    lines: ["01", "03", "04", "13"]
  },
  {
    id: "p27",
    name: "Ponto Cidade Aracy I",
    address: "Av. João Sabino, 500 - Cidade Aracy",
    lat: -22.0715,
    lng: -47.8850,
    type: "stop",
    lines: ["01", "06", "13"]
  },
  {
    id: "p28",
    name: "Ponto Cidade Aracy II",
    address: "R. José Bonifácio - Cidade Aracy",
    lat: -22.0690,
    lng: -47.8820,
    type: "stop",
    lines: ["01", "06", "13"]
  },
  {
    id: "p29",
    name: "Ponto Vila Nery I",
    address: "R. Marechal Deodoro - Vila Nery",
    lat: -22.0160,
    lng: -47.8845,
    type: "stop",
    lines: ["04"]
  },
  {
    id: "p30",
    name: "Ponto Vila Nery II",
    address: "Av. São Carlos, 2500 - Vila Nery",
    lat: -22.0135,
    lng: -47.8820,
    type: "stop",
    lines: ["04"]
  },
  {
    id: "p31",
    name: "Ponto Maria Stella Fagá I",
    address: "Av. Bruno Ruggiero Filho, 800 - Maria Stella Fagá",
    lat: -22.0115,
    lng: -47.8685,
    type: "stop",
    lines: ["06", "08", "18"]
  },
  {
    id: "p32",
    name: "Ponto Maria Stella Fagá II",
    address: "R. dos Pessegueiros - Maria Stella Fagá",
    lat: -22.0100,
    lng: -47.8655,
    type: "stop",
    lines: ["06", "08", "18"]
  },
  {
    id: "p33",
    name: "Ponto Cruzeiro do Sul I",
    address: "R. Alfredo Lopes de Oliveira, 200 - Cruzeiro do Sul",
    lat: -22.0375,
    lng: -47.8915,
    type: "stop",
    lines: ["13"]
  },
  {
    id: "p34",
    name: "Ponto Cruzeiro do Sul II",
    address: "R. dos Andradas - Cruzeiro do Sul",
    lat: -22.0360,
    lng: -47.8940,
    type: "stop",
    lines: ["13"]
  },
  {
    id: "p35",
    name: "Ponto Parque Delta I",
    address: "Av. Victor Attanasio, 300 - Parque Delta",
    lat: -21.9935,
    lng: -47.9070,
    type: "stop",
    lines: ["03", "08", "18"]
  },
  {
    id: "p36",
    name: "Ponto Parque Delta II",
    address: "R. das Acácias - Parque Delta",
    lat: -21.9905,
    lng: -47.9050,
    type: "stop",
    lines: ["03", "08", "18"]
  },
  {
    id: "p37",
    name: "Ponto Santa Felícia I",
    address: "R. Episcopal - Santa Felícia",
    lat: -21.9845,
    lng: -47.9150,
    type: "stop",
    lines: ["03"]
  },
  {
    id: "p38",
    name: "Ponto Santa Felícia II",
    address: "Av. São Carlos, 3000 - Santa Felícia",
    lat: -21.9870,
    lng: -47.9120,
    type: "stop",
    lines: ["03"]
  },
  {
    id: "p39",
    name: "Ponto São Carlos III I",
    address: "Av. José Pereira Lopes - São Carlos III",
    lat: -22.0315,
    lng: -47.9020,
    type: "stop",
    lines: ["06"]
  },
  {
    id: "p40",
    name: "Ponto São Carlos III II",
    address: "R. dos Lírios - São Carlos III",
    lat: -22.0330,
    lng: -47.9000,
    type: "stop",
    lines: ["06"]
  },
  {
    id: "p41",
    name: "Ponto Botafogo I",
    address: "R. Bento Carlos - Botafogo",
    lat: -22.0155,
    lng: -47.8965,
    type: "stop",
    lines: ["08", "13"]
  },
  {
    id: "p43",
    name: "Ponto Tijuco Preto I",
    address: "R. XV de Novembro - Tijuco Preto",
    lat: -22.0220,
    lng: -47.8985,
    type: "stop",
    lines: ["13"]
  },
  {
    id: "p44",
    name: "Ponto Tijuco Preto II",
    address: "Av. da Saudade - Tijuco Preto",
    lat: -22.0235,
    lng: -47.8970,
    type: "stop",
    lines: ["13"]
  },
  {
    id: "p45",
    name: "Ponto Marilândia I",
    address: "R. das Flores - Marilândia",
    lat: -22.0080,
    lng: -47.8720,
    type: "stop",
    lines: ["08", "18"]
  },
  {
    id: "p46",
    name: "Ponto Marilândia II",
    address: "Av. Brasil, 800 - Marilândia",
    lat: -22.0065,
    lng: -47.8700,
    type: "stop",
    lines: ["08", "18"]
  },
  {
    id: "p47",
    name: "Ponto Vila Prado",
    address: "R. dos Operários - Vila Prado",
    lat: -22.0265,
    lng: -47.8955,
    type: "stop",
    lines: ["03", "04", "08"]
  },
 
  {
    id: "p49",
    name: "Ponto Jd. Acapulco",
    address: "Av. das Palmeiras - Jd. Acapulco",
    lat: -22.0120,
    lng: -47.8635,
    type: "stop",
    lines: ["06", "08"]
  },
  {
    id: "p50",
    name: "Ponto Jd. Santa Paula",
    address: "R. dos Ipês - Jd. Santa Paula",
    lat: -22.0210,
    lng: -47.9150,
    type: "stop",
    lines: ["03", "04"]
  },
  {
    id: "p51",
    name: "Ponto Jd. Beatriz",
    address: "R. das Margaridas - Jd. Beatriz",
    lat: -22.0285,
    lng: -47.9125,
    type: "stop",
    lines: ["03", "06", "13"]
  },{
    id: "p52",
    name: "Ponto Jd. Novo Mundo",
    address: "Av. das Indústrias - Jd. Novo Mundo",
    lat: -22.0380,
    lng: -47.8860,
    type: "stop",
    lines: ["03", "06", "13"]
  },
  {
    id: "p53",
    name: "Ponto Jd. São Paulo",
    address: "R. dos Jasmins - Jd. São Paulo",
    lat: -22.0160,
    lng: -47.8800,
    type: "stop",
    lines: ["01", "06"]
  },
  {
    id: "p54",
    name: "Ponto Jd. das Torres",
    address: "R. das Acácias, 200 - Jd. das Torres",
    lat: -21.9880,
    lng: -47.9220,
    type: "stop",
    lines: ["04"]
  },
  {
    id: "p55",
    name: "Ponto Jd. Monte Carlo",
    address: "Av. das Palmeiras, 600 - Jd. Monte Carlo",
    lat: -21.9860,
    lng: -47.9180,
    type: "stop",
    lines: ["03"]
  },
  {
    id: "p56",
    name: "Ponto Jd. Paulista",
    address: "R. dos Bandeirantes - Jd. Paulista",
    lat: -22.0225,
    lng: -47.9020,
    type: "stop",
    lines: ["13"]
  },
  {
    id: "p57",
    name: "Ponto Jd. Brasil",
    address: "R. dos Pioneiros - Jd. Brasil",
    lat: -22.0080,
    lng: -47.8760,
    type: "stop",
    lines: ["03", "18"]
  },
  {
    id: "p58",
    name: "Ponto Jd. Ricetti",
    address: "R. das Oliveiras - Jd. Ricetti",
    lat: -22.0090,
    lng: -47.9085,
    type: "stop",
    lines: ["01", "04"]
  },
  {
    id: "p59",
    name: "Ponto Jd. Cardinalli",
    address: "R. dos Lírios, 300 - Jd. Cardinalli",
    lat: -22.0085,
    lng: -47.8640,
    type: "stop",
    lines: ["03", "04"]
  },
  {
    id: "p60",
    name: "Ponto Jd. Alvorada",
    address: "Av. dos Migrantes - Jd. Alvorada",
    lat: -21.9835,
    lng: -47.9090,
    type: "stop",
    lines: ["01", "13"]
  },
  {
    id: "p61",
    name: "Ponto Jd. Real",
    address: "R. dos Pinhais - Jd. Real",
    lat: -22.0280,
    lng: -47.8860,
    type: "stop",
    lines: ["06"]
  },
  {
    id: "p62",
    name: "Ponto Jd. Pacaembu",
    address: "R. dos Esportes - Jd. Pacaembu",
    lat: -22.0005,
    lng: -47.8980,
    type: "stop",
    lines: ["06", "18"]
  },
  {
    id: "p63",
    name: "Ponto Jd. Centenário",
    address: "R. dos Pinheiros, 500 - Jd. Centenário",
    lat: -22.0025,
    lng: -47.8870,
    type: "stop",
    lines: ["01"]
  },
  {
    id: "p64",
    name: "Ponto Jd. Hikari",
    address: "R. das Cerejeiras - Jd. Hikari",
    lat: -21.9810,
    lng: -47.9130,
    type: "stop",
    lines: ["03"]
  },
  {
    id: "p65",
    name: "Ponto Jd. das Flores",
    address: "R. das Violetas - Jd. das Flores",
    lat: -22.0120,
    lng: -47.8670,
    type: "stop",
    lines: ["03", "18"]
  },
  {
    id: "p66",
    name: "Ponto Jd. Tambaú",
    address: "R. dos Jacarandás - Jd. Tambaú",
    lat: -22.0215,
    lng: -47.8780,
    type: "stop",
    lines: ["04"]
  },
  {
    id: "p67",
    name: "Ponto Jd. Bandeirantes",
    address: "Av. dos Bandeirantes - Jd. Bandeirantes",
    lat: -22.0070,
    lng: -47.9140,
    type: "stop",
    lines: ["13", "18"]
  },
  {
    id: "p68",
    name: "Ponto Jd. Nair",
    address: "R. dos Cravos - Jd. Nair",
    lat: -22.0145,
    lng: -47.8700,
    type: "stop",
    lines: ["06"]
  },
  {
    id: "p69",
    name: "Ponto Jd. Tangará",
    address: "R. dos Tangarás - Jd. Tangará",
    lat: -22.0290,
    lng: -47.8700,
    type: "stop",
    lines: ["03", "18"]
  },
  {
    id: "p70",
    name: "Ponto Jd. Acapulco II",
    address: "R. das Acácias, 800 - Jd. Acapulco",
    lat: -22.0110,
    lng: -47.8680,
    type: "stop",
    lines: ["06"]
  },
  {
    id: "p71",
    name: "Ponto Jd. Vista Alegre",
    address: "R. dos Coqueiros - Jd. Vista Alegre",
    lat: -22.0230,
    lng: -47.8830,
    type: "stop",
    lines: ["03", "04"]
  },
  {
    id: "p72",
    name: "Ponto Jd. São José",
    address: "R. dos Lírios, 700 - Jd. São José",
    lat: -22.0270,
    lng: -47.9050,
    type: "stop",
    lines: ["03"]
  },
  {
    id: "p73",
    name: "Ponto Jd. Ipanema",
    address: "R. dos Manacás - Jd. Ipanema",
    lat: -21.9800,
    lng: -47.9050,
    type: "stop",
    lines: ["01", "04", "13"]
  },{
    id: "p74",
    name: "Ponto Jd. Santa Maria",
    address: "R. dos Crisântemos - Jd. Santa Maria",
    lat: -22.0320,
    lng: -47.8820,
    type: "stop",
    lines: ["03", "04"]
  },
  {
    id: "p75",
    name: "Ponto Jd. São Sebastião",
    address: "R. dos Andradas, 400 - Jd. São Sebastião",
    lat: -22.0220,
    lng: -47.8920,
    type: "stop",
    lines: ["03"]
  },
  {
    id: "p76",
    name: "Ponto Jd. Santa Mônica",
    address: "R. das Hortênsias - Jd. Santa Mônica",
    lat: -21.9890,
    lng: -47.9080,
    type: "stop",
    lines: ["03", "18"]
  },
  {
    id: "p77",
    name: "Ponto Jd. dos Coqueiros",
    address: "R. dos Coqueiros, 200 - Jd. dos Coqueiros",
    lat: -21.9830,
    lng: -47.9150,
    type: "stop",
    lines: ["13"]
  },
  {
    id: "p78",
    name: "Ponto Jd. Boa Vista",
    address: "R. das Mangueiras - Jd. Boa Vista",
    lat: -22.0250,
    lng: -47.8980,
    type: "stop",
    lines: ["06", "18"]
  },
  {
    id: "p79",
    name: "Ponto Jd. Cruzeiro",
    address: "R. dos Cedros - Jd. Cruzeiro",
    lat: -22.0350,
    lng: -47.8940,
    type: "stop",
    lines: ["13"]
  },
  {
    id: "p80",
    name: "Ponto Jd. Santa Efigênia",
    address: "R. dos Plátanos - Jd. Santa Efigênia",
    lat: -22.0115,
    lng: -47.9055,
    type: "stop",
    lines: ["06", "18"]
  },
  {
    id: "p81",
    name: "Ponto Residencial Itamaraty",
    address: "Av. Dr. Aurélio Catani - Res. Itamaraty",
    lat: -22.0000,
    lng: -47.8535,
    type: "stop",
    lines: ["08", "18"]
  },
  {
    id: "p82",
    name: "Ponto Maria Stella Fagá",
    address: "Av. João De Lourenço - Parque Res. Maria Stella Fagá",
    lat: -22.0130,
    lng: -47.8620,
    type: "stop",
    lines: ["08"]
  },
  {
    id: "p83",
    name: "Ponto São Carlos VIII",
    address: "Av. Cap. Luiz Brandão - São Carlos VIII",
    lat: -21.9980,
    lng: -47.8670,
    type: "stop",
    lines: ["18"]
  },
  {
    id: "p84",
    name: "Ponto Residencial Eldorado",
    address: "R. Miguel Petroni - Res. Eldorado",
    lat: -21.9750,
    lng: -47.9010,
    type: "stop",
    lines: ["01"]
  },
  {
    id: "p85",
    name: "Ponto Parque Novo Mundo",
    address: "Av. Bruno Ruggiero Filho - Parque Novo Mundo",
    lat: -21.9960,
    lng: -47.9150,
    type: "stop",
    lines: ["04"]
  }
  ]
};

function getScheduleForLine(lineNumber) {
  return BUS_DATA.defaultSchedule[lineNumber] || null;
}

function getRouteForLine(lineNumber) {
  return BUS_DATA.routes[lineNumber] || [];
}
