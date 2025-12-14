import { NextResponse } from "next/server";

// 16 most common conversation starter symbols for AAC in French
const STARTER_SYMBOLS = [
  {
    id: '6632-je',
    name: 'je',
    imageUrl: 'https://static.arasaac.org/pictograms/6632/6632_500.png',
    label: 'je'
  },
  {
    id: '5441-vouloir',
    name: 'vouloir',
    imageUrl: 'https://static.arasaac.org/pictograms/5441/5441_500.png',
    label: 'vouloir'
  },
  {
    id: '37160-besoin',
    name: 'avoir besoin ',
    imageUrl: 'https://static.arasaac.org/pictograms/37160/37160_500.png',
    label: 'besoin'
  },
  {
    id: '32648-aider',
    name: 'aider',
    imageUrl: 'https://static.arasaac.org/pictograms/32648/32648_500.png',
    label: 'aider'
  },
  {
    id: '5584-oui',
    name: 'oui',
    imageUrl: 'https://static.arasaac.org/pictograms/5584/5584_500.png',
    label: 'oui'
  },
  {
    id: '5526-non',
    name: 'non',
    imageUrl: 'https://static.arasaac.org/pictograms/5526/5526_500.png',
    label: 'non'
  },
  {
    id: '6522-bonjour',
    name: 'salut',
    imageUrl: 'https://static.arasaac.org/pictograms/6522/6522_500.png',
    label: 'bonjour'
  },
  {
    id: '6028-au revoir',
    name: 'au revoir',
    imageUrl: 'https://static.arasaac.org/pictograms/6028/6028_500.png',
    label: 'au revoir'
  },
  {
    id: "8195-s'il vous plaît",
    name: "s'il vous plaît",
    imageUrl: 'https://static.arasaac.org/pictograms/8195/8195_500.png',
    label: "s'il vous plaît"
  },
  {
    id: '8129-merci',
    name: 'merci',
    imageUrl: 'https://static.arasaac.org/pictograms/8129/8129_500.png',
    label: 'merci'
  },
  {
    id: '32753-encore',
    name: "j'en veux plus",
    imageUrl: 'https://static.arasaac.org/pictograms/32753/32753_500.png',
    label: 'encore'
  },
  {
    id: '7196-arrêter',
    name: 'arrêter',
    imageUrl: 'https://static.arasaac.org/pictograms/7196/7196_500.png',
    label: 'arrêter'
  },
  {
    id: '8142-aller',
    name: 'aller',
    imageUrl: 'https://static.arasaac.org/pictograms/8142/8142_500.png',
    label: 'aller'
  },
  {
    id: '6456-manger',
    name: 'manger',
    imageUrl: 'https://static.arasaac.org/pictograms/6456/6456_500.png',
    label: 'manger'
  },
  {
    id: '6061-boire',
    name: 'boire',
    imageUrl: 'https://static.arasaac.org/pictograms/6061/6061_500.png',
    label: 'boire'
  },
  {
    id: '5921-toilettes',
    name: 'toilettes',
    imageUrl: 'https://static.arasaac.org/pictograms/5921/5921_500.png',
    label: 'toilettes'
  }
]

export async function POST() {
  return NextResponse.json({ symbols: STARTER_SYMBOLS });
}
