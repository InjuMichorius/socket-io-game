// Load the JSON file containing the words and hints
const wordsData = require('../public/assets/wordList.json');

function getRandomWordWithHint() {
  const randomIndex = Math.floor(Math.random() * wordsData.length);
  const randomWordObject = wordsData[randomIndex];
  const randomWord = randomWordObject.word.toLowerCase(); // Convert the word to lowercase
  const randomHint = randomWordObject.hint;
  return { randomWord, randomHint };
}

module.exports = { getRandomWordWithHint };