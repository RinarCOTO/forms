export interface SmvRow {
  location: string;
  year2006: string;
  year2012: string;
  subClassification: string;
}

export interface MunicipalityData {
  commercial: SmvRow[];
  residential: SmvRow[];
  agricultural: SmvRow[];
}

export const municipalityData: Record<string, MunicipalityData> = {
  barlig: {
    commercial: [],
    residential: [],
    agricultural: [],
  },
  bauko: {
    commercial: [],
    residential: [],
    agricultural: [],
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
  },
  sabangan: {
    commercial: [],
    residential: [],
    agricultural: [],
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
  },
};
