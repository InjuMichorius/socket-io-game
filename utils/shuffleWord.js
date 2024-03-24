function shuffleWord(word) {
  const letters = word.split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]]; // Swap letters at index i and j
  }
  return letters; // Return the array of shuffled letters
}

module.exports = { shuffleWord };
