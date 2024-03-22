// Load the JSON file containing the words and hints
const wordsData = require('../assets/wordList.json');

function getRandomWordWithHint() {
  const randomIndex = Math.floor(Math.random() * wordsData.length);
  const randomWordObject = wordsData[randomIndex];
  return { randomWord: randomWordObject.word, randomHint: randomWordObject.hint };
}

module.exports = { getRandomWordWithHint };