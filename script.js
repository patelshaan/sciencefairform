// Questions array (24)
const questions = [
  "I enjoy working with plants/gardening.",
  "I enjoy making and understanding graphs.",
  "I have experience with computers (coding).",
  "I enjoy learning about illnesses and how people get them.",
  "I enjoy building structures, models, legos, etc.",
  "I am interested in how humans interact with the Earth.",
  "I use a computer to make drawings or edit pictures.",
  "I would enjoy doing my project mostly outside.",
  "I enjoy taking care of/ feeding animals and being with animals for long periods of time.",
  "I enjoy learning about memory, learning, and why people do things.",
  "I prefer thinking about a problem in my head more than doing work with my hands.",
  "I take things apart to see how they work.",
  "I'm good at math and would do it for fun.",
  "I am interested in why animals do what they do.",
  "I would be ok going up and asking lots of people do participate in my project.",
  "I have the responsibility to take care of something for a long time.",
  "I would take the time to learn to make an educational game.",
  "I enjoy coming up with sketches/designs for different things.",
  "I am interested in the human body and how people stay healthy.",
  "I am interested in the non-living aspects of our world (soil, nature, weather).",
  "I enjoy building and/or am interested in robots and how they work.",
  "I want to learn how to code.",
  "I am interested in the big problems the Earth faces such as climate change and pollution.",
  "I am interested in learning the concepts of the forces of nature (gravity, magnetism, etc.)."
];

// Category mapping using indices from the original script
const categoryMap = {
  "Plant Science and Animal Science": [0, 8, 13, 16],
  "Computer Science": [2, 6, 16, 21],
  "Medicine/Health and Behavioral Sciences": [3, 9, 14, 18],
  "Engineering": [4, 11, 17, 20],
  "Earth/Environmental": [5, 7, 19, 22],
  "Mathematics and Physics": [1, 10, 12, 23]
};

// Build the form
const qContainer = document.getElementById('questions');
questions.forEach((q, i) => {
  const div = document.createElement('div');
  div.className = 'question';
  div.innerHTML = `
    <div class="qtext"><strong>Q${i + 1}.</strong> ${q}</div>
    <div class="scale" role="radiogroup" aria-label="rating for question ${i + 1}">
      ${[0, 1, 2, 3, 4, 5].map(v => `
        <label><span>${v}</span><input type="radio" name="q${i}" value="${v}" ${v === 0 ? 'checked' : ''}></label>
      `).join('')}
    </div>
  `;
  qContainer.appendChild(div);
});

function getRatings() {
  const ratings = [];
  for (let i = 0; i < questions.length; i++) {
    const val = document.querySelector(`input[name=q${i}]:checked`).value;
    ratings.push(Number(val));
  }
  return ratings;
}

function computeCategories(ratings) {
  const categories = {};
  Object.keys(categoryMap).forEach(cat => {
    categories[cat] = categoryMap[cat].reduce((s, idx) => s + (ratings[idx] || 0), 0);
  });
  return categories;
}

function showResults(categories, ratings) {
  document.getElementById('results').classList.remove('hidden');
  const suggestion = Object.keys(categories).reduce((a, b) => categories[a] >= categories[b] ? a : b);
  document.getElementById('suggestion').textContent = `Suggested category is: ${suggestion}`;
  document.getElementById('rawScores').textContent = JSON.stringify(categories, null, 2);

  // Chart
  const ctx = document.getElementById('resultsChart').getContext('2d');
  if (window._surveyChart) window._surveyChart.destroy();
  window._surveyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(categories),
      datasets: [{ label: 'Score', data: Object.values(categories) }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  // Save last response
  window.latestResponse = { ratings, categories, suggestion, timestamp: new Date().toISOString() };
}

document.getElementById('submitBtn').addEventListener('click', () => {
  const ratings = getRatings();
  const categories = computeCategories(ratings);
  showResults(categories, ratings);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('surveyForm').reset();
  document.getElementById('results').classList.add('hidden');
  if (window._surveyChart) window._surveyChart.destroy();
  window.latestResponse = null;
});

// Downloads
function download(filename, content) {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

document.getElementById('downloadJson').addEventListener('click', () => {
  if (!window.latestResponse) { alert('Please submit the survey first.'); return; }
  download('survey_response.json', JSON.stringify(window.latestResponse, null, 2));
});

document.getElementById('downloadCsv').addEventListener('click', () => {
  if (!window.latestResponse) { alert('Please submit the survey first.'); return; }
  const r = window.latestResponse;
  const header = ['question_index', 'question', 'rating'];
  const rows = r.ratings.map((val, idx) => [idx + 1, `"${questions[idx].replace(/"/g, '')}"`, val].join(','));
  const catRows = ['---CATEGORY SCORES---'].concat(Object.entries(r.categories).map(([k, v]) => `${k},${v}`));
  const csv = header.join(',') + '\n' + rows.join('\n') + '\n\n' + catRows.join('\n');
  download('survey_response.csv', csv);
});
