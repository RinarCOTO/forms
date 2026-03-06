export interface SmvRow {
  location: string;
  year2006: string;
  year2012: string;
  subClassification: string;
}

export interface AgriculturalLandRow {
  landType: string;
  first: string;
  second: string;
  third: string;
  fourth: string;
}

export interface agriculturalImprovementRow {
  type: string;
  first: string;
  second: string;
  third: string;
}

export interface MunicipalityData {
  commercial: SmvRow[];
  residential: SmvRow[];
  agricultural: SmvRow[];
  agriculturalLand: AgriculturalLandRow[];
  agriculturalImprovementRow?: agriculturalImprovementRow[];
}

export const municipalityData: Record<string, MunicipalityData> = {
  barlig: {
    commercial: [],
    residential: [],
    agricultural: [],
    agriculturalLand: [],
    agriculturalImprovementRow: [],
  },
  bauko: {
    commercial: [],
    residential: [],
    agricultural: [],
    agriculturalLand: [],
    agriculturalImprovementRow: [],
  },
  besao: {
    commercial: [
      {
        location: "a) Commercial lots located along all weather roads.",
        year2006: "58.80",
        year2012: "105.00",
        subClassification: "C-1",
      },
    ],
    residential: [
      {
        location: "a) Residential lots located along the Provincial Road of Kin-iway",
        year2006: "58.80",
        year2012: "105.00",
        subClassification: "R-1",
      },
      {
        location: "b) Residential lots located within the inner part of Kin-iway, Residential lots within the Bararangays of Besao East, Besao West, Padangan, Payeo and Soquib.",
        year2006: "45.90",
        year2012: "86.30",
        subClassification: "R-2",
      },
      {
        location: "c) Residential lots within the Barangay of Banguitan, Agawa, Lacmaan, Gueday, Catengan and Laylaya.",
        year2006: "32.30",
        year2012: "64.30",
        subClassification: "R-3",
      },
      {
        location: "d) Residential lots located within the Barangays of Ambagiw, Dandanac and Tambulan.",
        year2006: "15.00",
        year2012: "28.70",
        subClassification: "R-4",
      },
    ],
    agricultural: [],
    agriculturalLand: [
      { landType: "Riceland w/ irrigation", first: "₱ 63,480.00", second: "₱ 55,640.00", third: "₱ 40,340.00", fourth: "₱ 32,500.00" },
      { landType: "Fishpond", first: "₱ 47,260.00", second: "₱ 43,290.00", third: "₱ 27,550.00", fourth: "₱ 23,620.00" },
      { landType: "Rootcrop Land", first: "₱ 53,910.00", second: "₱ 40,420.00", third: "₱ 26,920.00", fourth: "-" },
      { landType: "Vegetable Land", first: "₱ 45,350.00", second: "₱ 34,050.00", third: "₱ 22,680.00", fourth: "-" },
      { landType: "Fruit Land", first: "₱ 66,400.00", second: "₱ 42,360.00", third: "₱ 18,590.00", fourth: "-" },
      { landType: "Pasture Land", first: "₱ 10,880.00", second: "-", third: "-", fourth: "-" },
      { landType: "Cogon Land", first: "₱ 8,030.00", second: "-", third: "-", fourth: "-" },
      { landType: "Pinetree Land", first: "₱ 14,080.00", second: "-", third: "-", fourth: "-" },
    ],
    agriculturalImprovementRow: [
      { type: "Avocado", first: "₱ 820.00", second: "₱ 580.00", third: "₱ 340.00" },
      { type: "Banana", first: "₱ 190.00", second: "₱ 130.00", third: "₱ 80.00" },
      { type: "Calamansi", first: "₱ 160.00", second: "₱ 110.00", third: "₱ 80.00" },
      { type: "Coconut", first: "₱ 210.00", second: "₱ 130.00", third: "₱ 80.00" },
      { type: "Coffee/Cacao", first: "₱ 190.00", second: "₱ 140.00", third: "₱ 80.00" },
      { type: "Mango", first: "₱ 960.00", second: "₱ 600.00", third: "₱ 360.00" },
      { type: "Orange", first: "₱ 200.00", second: "₱ 150.00", third: "₱ 100.00" }
    ],
  },
  bontoc: {
    commercial: [
      {
        location: "a) Commercial Lots along all weather roads.",
        year2006: "372.00",
        year2012: "594.50",
        subClassification: "C-1",
      },
    ],
    residential: [
      {
        location: "a) Residential lots located along National Road within the barangays of Poblacion Caluttit, Bontoc Ili and Samoki, residential lots along Municipal Road of Streets #2-9.",
        year2006: "293.20",
        year2012: "490.50",
        subClassification: "R-1",
      },
      {
        location: "b) Residential lots located along the Provincial Road #1 starting from Tsayapan's residence to Jaime Gomex building: Residential lots along Provincial Road #2 starting from Pimentel to Sumyaan building of both sides; Residential lots along Provincial Road starting from Day-asen's building to Teng-ab of both sides; Barangay Road from Manalang to Cayang-o's building;",
        year2006: "293.20",
        year2012: "385.10",
        subClassification: "R-2",
      }
    ],
    agricultural: [],
    agriculturalLand: [
    { landType: "Riceland w/ irrigation", first: "₱ 91,740.00", second: "₱ 80,410.00", third: "₱ 58,310.00", fourth: "₱ 47,530.00" },
    { landType: "Fishpond", first: "₱ 47,260.00", second: "₱ 43,290.00", third: "₱ 27,550.00", fourth: "₱ 23,620.00" },
    { landType: "Rootcrop Land", first: "₱ 65,470.00", second: "₱ 49,050.00", third: "₱ 32,700.00", fourth: "-" },
    { landType: "Vegetable Land", first: "₱ 45,350.00", second: "₱ 34,050.00", third: "₱ 22,680.00", fourth: "-" },
    { landType: "Fruit Land", first: "₱ 66,400.00", second: "₱ 42,360.00", third: "₱ 18,590.00", fourth: "-" },
    { landType: "Pinetree Land", first: "₱ 14,080.00", second: "-", third: "-", fourth: "-" },
    { landType: "Pasture Land", first: "₱ 10,880.00", second: "-", third: "-", fourth: "-" },
    { landType: "Cogon Land", first: "₱ 8,030.00", second: "-", third: "-", fourth: "-" }
    ],
    agriculturalImprovementRow: [
    { type: "Avocado", first: "₱ 820.00", second: "₱ 580.00", third: "₱ 340.00" },
    { type: "Banana", first: "₱ 190.00", second: "₱ 130.00", third: "₱ 80.00" },
    { type: "Calamansi", first: "₱ 160.00", second: "₱ 110.00", third: "₱ 80.00" },
    { type: "Coconut", first: "₱ 210.00", second: "₱ 130.00", third: "₱ 80.00" },
    { type: "Coffee/Cacao", first: "₱ 190.00", second: "₱ 140.00", third: "₱ 80.00" },
    { type: "Mango", first: "₱ 960.00", second: "₱ 600.00", third: "₱ 360.00" },
    { type: "Orange", first: "₱ 200.00", second: "₱ 150.00", third: "₱ 100.00" }
],
  },
  natonin: {
    commercial: [{
      location: "a) Commercial lots located along all weather roads.",
      year2006: "34.30",
      year2012: "68.00",
      subClassification: "C-1",
    },],
    residential: [
      {
      location: "a) Residential lots located along the National Road of Barangay Poblacion, Bananao, Tonglayan, Pudo, Alunogan, Sta. Isabel, Saliok and Banawal; Residential lots located along the Municipal Road within Poblacion.",
      year2006: "34.30",
      year2012: "68.00",
      subClassification: "R-1",
    },
      {
      location: "b) Residential lots located within the Barangays of Sta. Isabel, Banawal, Saliok, Tonglayan, Bananao, Pudo ,Butac and Poblacion.",
      year2006: "27.90",
      year2012: "55.00",
      subClassification: "R-2",
    },
      {
      location: "c) Residential lots located within Barangays of the Alunogan,Balangao, Banawal, Pudo, Sta. Isabel, Bananao, Saliok, Tonglayan with a distance of 1/2 km. to 3km away from the road.",
      year2006: "20.50",
      year2012: "39.50",
      subClassification: "R-3",
    },
      {
      location: "d) Residential lots located within the Barangay of Maducayan",
      year2006: "12.70",
      year2012: "25.00",
      subClassification: "R-4",
    },
  ],
    agricultural: [],
    agriculturalLand: [
  { landType: "Riceland w/ irrigation", first: "₱ 63,830.00", second: "₱ 55,750.00", third: "₱ 40,370.00", fourth: "₱ 32,680.00" },
  { landType: "Fishpond", first: "₱ 47,260.00", second: "₱ 43,290.00", third: "₱ 27,550.00", fourth: "₱ 23,620.00" },
  { landType: "Fruit Land", first: "₱ 66,400.00", second: "₱ 42,360.00", third: "₱ 18,590.00", fourth: "-" },
  { landType: "Vegetable Land", first: "₱ 45,350.00", second: "₱ 34,050.00", third: "₱ 22,680.00", fourth: "-" },
  { landType: "Rootcrop Land", first: "₱ 51,000.00", second: "₱ 38,250.00", third: "₱ 25,470.00", fourth: "-" },
  { landType: "Pinetree Land", first: "₱ 14,080.00", second: "-", third: "-", fourth: "-" },
  { landType: "Pasture Land", first: "₱ 10,880.00", second: "-", third: "-", fourth: "-" },
  { landType: "Cogon Land", first: "₱ 8,030.00", second: "-", third: "-", fourth: "-" }
    ],
    agriculturalImprovementRow: [
  { type: "Avocado", first: "₱ 820.00", second: "₱ 580.00", third: "₱ 340.00" },
  { type: "Banana", first: "₱ 190.00", second: "₱ 130.00", third: "₱ 80.00" },
  { type: "Calamansi", first: "₱ 160.00", second: "₱ 110.00", third: "₱ 80.00" },
  { type: "Coconut", first: "₱ 210.00", second: "₱ 130.00", third: "₱ 80.00" },
  { type: "Coffee/Cacao", first: "₱ 190.00", second: "₱ 140.00", third: "₱ 80.00" },
  { type: "Mango", first: "₱ 960.00", second: "₱ 600.00", third: "₱ 360.00" },
  { type: "Orange", first: "₱ 200.00", second: "₱ 150.00", third: "₱ 100.00" }
    ],
  },
  paracelis: {
    commercial: [
      {
        location: "a) Commercial lots located along all weather roads.",
        year2006: "27.40",
        year2012: "72.50",
        subClassification: "C-1",
      },
    ],
    residential: [
      {
        location: "a) Residential lots located along the National Road to Bananao, Poblacion and Butigue.",
        year2006: "27.40",
        year2012: "72.50",
        subClassification: "R-1",
      },
      {
        location: "b) Residential lots located within the Barangays of Bacarri, Bantay, Palitod",
        year2006: "23.00",
        year2012: "51.20",
        subClassification: "R-2",
      },
      {
        location: "c) Residential lots located within the Barangays of Buringal, Anonat and Bunot.",
        year2006: "19.70",
        year2012: "36.90",
        subClassification: "R-3",
      },
    ],
    agricultural: [],
    agriculturalLand: [
  { landType: "Riceland w/ irrigation", first: "61,590.00", second: "53,980.00", third: "39,140.00", fourth: "31,530.00" },
  { landType: "Fishpond", first: "47,260.00", second: "43,290.00", third: "27,550.00", fourth: "23,620.00" },
  { landType: "Riceland, upland", first: "35,840.00", second: "29,620.00", third: "23,620.00", fourth: "-" },
  { landType: "Cornland", first: "30,610.00", second: "24,490.00", third: "18,340.00", fourth: "-" },
  { landType: "Riceland w/o Irrig.", first: "40,620.00", second: "34,910.00", third: "29,200.00", fourth: "-" },
  { landType: "Fruit Land", first: "66,400.00", second: "43,360.00", third: "18,590.00", fourth: "-" },
  { landType: "Pasture Land", first: "10,880.00", second: "-", third: "-", fourth: "-" },
  { landType: "Cogon Land", first: "8,030.00", second: "-", third: "-", fourth: "-" }
    ],
    agriculturalImprovementRow: [
  { type: "Avocado", first: "₱ 820.00", second: "₱ 580.00", third: "₱ 340.00" },
  { type: "Banana", first: "190.00", second: "130.00", third: "80.00" },
  { type: "Calamansi", first: "160.00", second: "110.00", third: "80.00" },
  { type: "Coconut", first: "210.00", second: "130.00", third: "80.00" },
  { type: "Coffee/Cacao", first: "190.00", second: "140.00", third: "80.00" },
  { type: "Mango", first: "960.00", second: "600.00", third: "360.00" },
  { type: "Orange", first: "200.00", second: "150.00", third: "100.00" }
    ],
  },
  sabangan: {
    commercial: [],
    residential: [],
    agricultural: [],
    agriculturalLand: [
  { landType: "Riceland w/ irrigation", first: "₱ 60,810.00", second: "₱ 53,110.00", third: "₱ 38,640.00", fourth: "₱ 31,130.00" },
  { landType: "Fishpond", first: "47,260.00", second: "43,290.00", third: "27,550.00", fourth: "23,620.00" },
  { landType: "Rootcrop Land", first: "57,150.00", second: "42,900.00", third: "28,570.00", fourth: "-" },
  { landType: "Fruit Land", first: "66,400.00", second: "42,360.00", third: "18,590.00", fourth: "-" },
  { landType: "Vegetable Land", first: "45,350.00", second: "34,050.00", third: "22,680.00", fourth: "-" },
  { landType: "Pinetree Land", first: "14,080.00", second: "-", third: "-", fourth: "-" },
  { landType: "Pasture Land", first: "10,880.00", second: "-", third: "-", fourth: "-" },
  { landType: "Cogon Land", first: "8,030.00", second: "-", third: "-", fourth: "-" }
    ],
    agriculturalImprovementRow: [
  { type: "Avocado", first: "₱ 820.00", second: "₱ 580.00", third: "₱ 340.00" },
  { type: "Banana", first: "190.00", second: "130.00", third: "80.00" },
  { type: "Calamansi", first: "160.00", second: "110.00", third: "80.00" },
  { type: "Coconut", first: "210.00", second: "130.00", third: "80.00" },
  { type: "Coffee/Cacao", first: "190.00", second: "140.00", third: "80.00" },
  { type: "Mango", first: "960.00", second: "600.00", third: "360.00" },
  { type: "Orange", first: "200.00", second: "150.00", third: "100.00" }
    ],
  },
  sadanga: {
    commercial: [
      {
        location: "a) Commercial lots located along all weather roads.",
        year2006: "41.95",
        year2012: "82.60",
        subClassification: "C-1",
      },
    ],
    residential: [
      {
        location: "a) Residential lots located along the National Road from SitioTabbrak to SitioMamaga, Saclit; Residential lots along the Provincial Road from Ampawilen to Lidem Junction; Residential lots located along the Municipal Road from Lidem Junction to Municipal Hall.",
        year2006: "41.95",
        year2012: "82.60",
        subClassification: "R-1",
      },
      {
        location: "b) Residential lots located within the inner portion of Poblacion; Residential lots within the Barangays of Anabel, Demang, Sacasacan.",
        year2006: "32.90",
        year2012: "62.20",
        subClassification: "R-3",
      },
    ],
    agricultural: [],
    agriculturalLand: [
  { landType: "Riceland w/ irrigation", first: "₱ 63,830.00", second: "₱ 55,750.00", third: "₱ 40,370.00", fourth: "₱ 32,680.00" },
  { landType: "Fishpond", first: "47,260.00", second: "43,290.00", third: "27,550.00", fourth: "23,620.00" },
  { landType: "Vegetable Land", first: "45,350.00", second: "34,050.00", third: "22,680.00", fourth: "-" },
  { landType: "Fruit Land", first: "66,400.00", second: "42,360.00", third: "18,590.00", fourth: "-" },
  { landType: "Rootcrop Land", first: "54,990.00", second: "41,250.00", third: "27,470.00", fourth: "-" },
  { landType: "Pinetree Land", first: "14,080.00", second: "-", third: "-", fourth: "-" },
  { landType: "Pasture Land", first: "10,880.00", second: "-", third: "-", fourth: "-" },
  { landType: "Cogon Land", first: "8,030.00", second: "-", third: "-", fourth: "-" }
    ],
    agriculturalImprovementRow: [
  { type: "Avocado", first: "₱ 820.00", second: "₱ 580.00", third: "₱ 340.00" },
  { type: "Banana", first: "190.00", second: "130.00", third: "80.00" },
  { type: "Calamansi", first: "160.00", second: "110.00", third: "80.00" },
  { type: "Coconut", first: "210.00", second: "130.00", third: "80.00" },
  { type: "Coffee/Cacao", first: "190.00", second: "140.00", third: "80.00" },
  { type: "Mango", first: "960.00", second: "600.00", third: "360.00" },
  { type: "Orange", first: "200.00", second: "150.00", third: "100.00" }
    ],
  },
  sagada: {
    commercial: [
      {
      location: "a) Commercial lots located along all weather roads.",
      year2006: "96.20",
      year2012: "179.20",
      subClassification: "C-1",
    }
  ],
    residential: [
      {
        location: "a) Residential lots located along the National Road on both sides of Barangays Patay and Dagdag; Residential lots located along the Provincial Road from Barangay Poblacion to Danom; Residential lots located along the Municipal Road starting from Mrs. Masferri's residence going to Barangay Madongo and Aguid; Residential lots along the Municipal Road from SitioSumaguing to Barangay Suyo; Residential lots located along the Barangay Road of Ambasing to Balugan; Residential lots located along the Barangay Road of Dao-angan to Atey and Residential lots located along the Barangay Road of Demang",
        year2006: "60.10",
        year2012: "112.10",
        subClassification: "R-1",
      },
      {
        location: "b) Residential lots located within the Barangays of Patay and Dagdag with a distance of 40 meters from the road frontage.",
        year2006: "49.40",
        year2012: "92.20",
        subClassification: "R-2",
      },
    ],
    agricultural: [],
    agriculturalLand: [
  { landType: "Riceland w/ irrigation", first: "₱ 65,530.00", second: "₱ 57,440.00", third: "₱ 41,650.00", fourth: "₱ 33,560.00" },
  { landType: "Fishpond", first: "47,260.00", second: "43,290.00", third: "29,550.00", fourth: "23,620.00" },
  { landType: "Rootcrop Land", first: "54,990.00", second: "41,250.00", third: "27,470.00", fourth: "-" },
  { landType: "Vegetable Land", first: "45,350.00", second: "34,050.00", third: "22,680.00", fourth: "-" },
  { landType: "Fruit Land", first: "66,400.00", second: "42,360.00", third: "18,590.00", fourth: "-" },
  { landType: "Pinetree Land", first: "14,080.00", second: "-", third: "-", fourth: "-" },
  { landType: "Pasture Land", first: "10,880.00", second: "-", third: "-", fourth: "-" },
  { landType: "Cogon Land", first: "8,030.00", second: "-", third: "-", fourth: "-" }
    ],
    agriculturalImprovementRow: [
  { type: "Avocado", first: "₱ 820.00", second: "₱ 580.00", third: "₱ 340.00" },
  { type: "Banana", first: "190.00", second: "130.00", third: "80.00" },
  { type: "Calamansi", first: "160.00", second: "110.00", third: "80.00" },
  { type: "Coconut", first: "210.00", second: "130.00", third: "80.00" },
  { type: "Coffee/Cacao", first: "190.00", second: "140.00", third: "80.00" },
  { type: "Mango", first: "960.00", second: "600.00", third: "360.00" },
  { type: "Orange", first: "200.00", second: "150.00", third: "100.00" }
    ],
  },
  tadian: {
    commercial: [
      {
        location: "a) Commercial lots located along all weather roads.",
        year2006: "62.20",
        year2012: "111.00",
        subClassification: "C-1",
      },
    ],
    residential: [
      {
        location: "a) Residential lots located along the National Road; along the Provincial Road and along the Municipal Road 1, Road 3; Residential lots within Poblacion",
        year2006: "62.20",
        year2012: "111.00",
        subClassification: "R-1",
      },
      {
        location: "b) Residential lots located within the Barangays of Lubon, Masla, Kayan East, Kayan West, Bunga, Balaoa, Tue, Sumadel, Cagubatan and Cabunagan.",
        year2006: "50.20",
        year2012: "91.60",
        subClassification: "R-2",
      },
      {
        location: "c) Residential lots within the Barangays of Banaao, Dacudac, Pandayan, Bantey and Batayan.",
        year2006: "31.40",
        year2012: "57.40",
        subClassification: "R-3",
      },
      {
        location: "d) Residential lots within the Barangays of Duagan, Nabitic, Cadad-anan, Lenga, Mabalite, Maket-an.",
        year2006: "19.20",
        year2012: "36.60",
        subClassification: "R-4",
      },
    ],
    agricultural: [],
    agriculturalLand: [
  { landType: "Riceland w/ irrigation", first: "₱ 60,810.00", second: "₱ 53,110.00", third: "₱ 38,640.00", fourth: "₱ 31,110.00" },
  { landType: "Fishpond", first: "47,260.00", second: "43,290.00", third: "27,550.00", fourth: "23,620.00" },
  { landType: "Rootcrop Land", first: "57,150.00", second: "42,900.00", third: "28,570.00", fourth: "-" },
  { landType: "Fruit Land", first: "66,400.00", second: "42,360.00", third: "18,590.00", fourth: "-" },
  { landType: "Vegetable Land", first: "45,350.00", second: "34,050.00", third: "22,680.00", fourth: "-" },
  { landType: "Pinetree Land", first: "14,080.00", second: "-", third: "-", fourth: "-" },
  { landType: "Pasture Land", first: "10,880.00", second: "-", third: "-", fourth: "-" },
  { landType: "Cogon Land", first: "8,030.00", second: "-", third: "-", fourth: "-" }
    ],
    agriculturalImprovementRow: [
    { type: "Avocado", first: "₱ 820.00", second: "₱ 580.00", third: "₱ 340.00" },
  { type: "Banana", first: "190.00", second: "130.00", third: "80.00" },
  { type: "Calamansi", first: "160.00", second: "110.00", third: "80.00" },
  { type: "Coconut", first: "210.00", second: "130.00", third: "80.00" },
  { type: "Coffee/Cacao", first: "190.00", second: "140.00", third: "80.00" },
  { type: "Mango", first: "960.00", second: "600.00", third: "360.00" },
  { type: "Orange", first: "200.00", second: "150.00", third: "100.00" }
    ],
  },
};
