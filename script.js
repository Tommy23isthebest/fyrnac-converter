const fyrnacMap = {
  'A': 'ᛅ', 'B': 'ᛒ', 'C': 'ᚳ', 'D': 'ᛙ', 'E': 'ᛜ', 'F': 'ᚠ', 'G': 'ᛕ', 'H': 'ᛦ', 'I': 'ᛇ', 'J': 'ᛆ',
  'K': 'ᛚ', 'L': '᛬', 'M': 'ᛩ', 'N': 'ᚼ', 'O': 'ᛟ', 'P': 'ᛖ', 'Q': 'ᛢ', 'R': 'ᚱ', 'S': 'ᛊ', 'T': 'ᛏ',
  'U': 'ᚢ', 'V': 'ᛯ', 'W': 'ᚹ', 'X': 'ᛪ', 'Y': 'ᛲ', 'Z': 'ᛎ'
};

// Create reverse mapping
const reverseMap = {};
for (const [key, value] of Object.entries(fyrnacMap)) {
  reverseMap[value] = key;
}

function toFyrnac(text) {
  return text.split('').map(char => {
    const upper = char.toUpperCase();
    return fyrnacMap[upper] || char;
  }).join('');
}

function fromFyrnac(text) {
  return text.split('').map(char => {
    return reverseMap[char] || char;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('english-input');
  const output = document.getElementById('fyrnac-output');
  const copyBtn = document.getElementById('copy-btn');
  const toggleDirection = document.getElementById('toggle-direction');
  const toggleReverse = document.getElementById('toggle-reverse');
  
  let isReverseMode = false;

  function updateOutput() {
    if (isReverseMode) {
      output.textContent = fromFyrnac(input.value);
    } else {
      output.textContent = toFyrnac(input.value);
    }
  }

  function updatePlaceholder() {
    if (isReverseMode) {
      input.placeholder = "Type Fyrnac text here...";
    } else {
      input.placeholder = "Type English text here...";
    }
  }

  input.addEventListener('input', updateOutput);

  copyBtn.addEventListener('click', () => {
    const text = output.textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy Output', 1200);
    }
  });

  // Clear button functionality
  const clearBtn = document.getElementById('clear-btn');
  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.textContent = '';
    input.focus();
  });

  // Toggle direction functionality
  toggleDirection.addEventListener('click', () => {
    isReverseMode = false;
    toggleDirection.classList.add('active');
    toggleReverse.classList.remove('active');
    updatePlaceholder();
    updateOutput();
  });

  toggleReverse.addEventListener('click', () => {
    isReverseMode = true;
    toggleReverse.classList.add('active');
    toggleDirection.classList.remove('active');
    updatePlaceholder();
    updateOutput();
  });

  // Common words functionality
  const wordButtons = document.querySelectorAll('.word-btn');
  wordButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const word = btn.getAttribute('data-word');
      const currentValue = input.value;
      const newValue = currentValue + (currentValue && !currentValue.endsWith(' ') ? ' ' : '') + word;
      input.value = newValue;
      updateOutput();
      input.focus();
    });
  });

  updateOutput();
}); 