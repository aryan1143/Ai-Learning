const API_KEY = 'AIzaSyBS7ZAE7mPtcn2KXncbSZLuYRYfsZEfgaM';
let currentView = 'learning';
let currentModel = "gemini-2.0-flash-thinking-exp-01-21";

document.addEventListener("DOMContentLoaded", () => {
    showView('learning');
    injectAnswerStyles();
});

let historyRecords = JSON.parse(localStorage.getItem('historyRecords')) || [];

function saveHistoryRecords() {
    localStorage.setItem('historyRecords', JSON.stringify(historyRecords));
    updateHistoryView();
}

function addToHistory(action, input, output) {
    const record = { action, input, output, timestamp: new Date().toLocaleString() };
    historyRecords.push(record);
    saveHistoryRecords();
}

function updateHistoryView() {
    const container = document.getElementById('historyContent');
    if (!container) return;
    if (historyRecords.length === 0) {
        container.innerHTML = '<p>No history yet.</p>';
    } else {
        let html = '<ul class="history-list" style="list-style: none; padding: 0;">';
        historyRecords.forEach((record, index) => {
            html += `
                <li style="cursor:pointer; padding:0.5rem; border-bottom:1px solid #444; display:flex; justify-content:space-between; align-items:center;">
                    <div onclick="showHistoryDetail(${index})">
                        <strong>${record.action}</strong> - ${record.timestamp}<br>
                        <em>User Input:</em> ${record.input}
                    </div>
                    <button onclick="event.stopPropagation(); deleteHistory(${index});" 
                            style="background: #ff4444; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer;">
                        Delete
                    </button>
                </li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
    }
}

function showHistoryDetail(index) {
    const container = document.getElementById('historyContent');
    const record = historyRecords[index];
    if (!record) return;
    container.innerHTML = `
      <div class="history-detail" style="padding:1rem;">
          <h3>${record.action}</h3>
          <p><em>Timestamp:</em> ${record.timestamp}</p>
          <p><strong>Input:</strong> ${record.input}</p>
          <p><strong>Output:</strong> ${record.output}</p>
          <button onclick="updateHistoryView()" style="margin-top:1rem;">Back to History List</button>
          <button onclick="deleteHistory(${index}); updateHistoryView();" style="margin-top:1rem; margin-left:1rem;">Delete</button>
      </div>
    `;
}

function deleteHistory(index) {
    historyRecords.splice(index, 1);
    saveHistoryRecords();
}

function showView(viewId) {
    // Remove active class from all views and buttons
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(btn => btn.classList.remove('active'));

    // Add active class to selected view and its button
    document.getElementById(viewId).classList.add('active');
    document.querySelector(`.nav button[onclick*="${viewId}"]`).classList.add('active');

    // Update heading text
    const headingMap = {
        'learning': 'Learning Path',
        'teacher': 'AI Teacher',
        'resume': 'Resume Builder',
        'history': 'History'
    };
    document.querySelector('.section-heading').textContent = headingMap[viewId];

    currentView = viewId;
    if (viewId === 'history') updateHistoryView();
}

function toggleGeminiModel() {
    const button = document.getElementById('modelSwitchButton');
    if (currentModel === "gemini-2.0-flash-thinking-exp-01-21") {
        currentModel = "gemini-2.0-flash-exp";
        button.textContent = "Switch to stable model";
        button.classList.add('deep-model');
    } else {
        currentModel = "gemini-2.0-flash-thinking-exp-01-21";
        button.textContent = "Switch to deep model";
        button.classList.remove('deep-model');
    }
}

async function callGeminiAPI(prompt) {
    try {
        showLoading(true);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'API request failed');
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            throw new Error('Invalid API response format');
        }
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        showError(error.message);
        throw error;
    } finally {
        showLoading(false);
    }
}

async function generateLearningPath() {
    const skill = document.getElementById('skillInput').value;
    const prompt = `Generate a learning path for ${skill} in HTML format. The duration should be between 4-24 weeks based on skill complexity. Use EXACTLY this structure:

<style>
.learning-path {
    padding: 2rem;
    background: linear-gradient(45deg, #0a192f, #172a45);
    color: #e0e0e0
}
.week {
    background: linear-gradient(45deg, #112240, #233554);
    margin: 2rem 0;
    padding: 1.5rem; border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5)
}
.day {
    background: linear-gradient(45deg, #0d1b2a, #1b263b);
    padding: 1rem 2.5rem;
    margin: 1rem 0;
    border-radius: 8px
}
.project {
    border-left: 4px solid #87CEEB;
    padding: 1rem;
    margin: 1.5rem 0
}
a {
    color: #64ffda;
    text-decoration: none;
    margin: 1rem 0;
}
</style>

<div class="learning-path">
  <!-- Repeat week blocks based on needed duration -->
  <div class="week">
    <h3>Week N: [Theme]</h3>
    <div class="days">
      <div class="day">
        <h4>Day N</h4>
        <ul class="topics">
          <li>[Specific learning objective]</li>
        </ul>
        <div class="resources">
          <a href="[URL]">[Resource title]</a>
        </div>
      </div>
    </div>
    <div class="project">
      [Project description with measurable outcome]
    </div>
  </div>
</div>

Requirements:
1. Duration (4-24 weeks) proportional to skill complexity
2. Real-world projects every week
3. Progressive difficulty curve
4. Authoritative resource links
5. No markdown, only HTML
6. Strictly follow the provided structure
7. Output ONLY the HTML code`;

    try {
        const result = await callGeminiAPI(prompt);
        document.getElementById('learningResult').innerHTML = result;
        addToHistory('Learning Path', skill, result);
    } catch (error) {
        showError(error.message);
    }
}

async function askAIQuestion() {
    const question = document.getElementById('questionInput').value;
    const prompt = `Explain ${question} in HTML format with:
      - A <div class="explanation-box"> container
      - <h3 class="concept-heading"> for the main concept
      - <ul class="key-points"> for key points
      - <div class="example-box"> for examples
      - <code class="code-sample"> blocks for code (ensure code blocks have distinct, darker color highlighting, and colorful)
      - Inline styling for:
           * Background: use a dark gradient (e.g., linear-gradient(45deg, #1c1c1e, #2e2e3a))
           * Text color: use light, contrasting shades (like #e0e0e0)
           * Padding: 1.5rem
           * Border-radius: 8px
           * Box-shadow: 0 2px 8px rgba(0,0,0,0.5)
           * Font-family: system-ui
      Structure the answer with clear sections and modern web formatting.
      Most important thing:
        - don't give anything other than the answer
        - ensure that this should be responsive`;
    try {
        const result = await callGeminiAPI(prompt);
        document.getElementById('answerResult').innerHTML = result;
        addToHistory('AI Teacher', question, result);
    } catch (error) {
        showError(error.message);
    }
}

async function generateResume() {
    const info = document.getElementById('resumeInput').value;
    const prompt = `Generate resume HTML for: ${info}. Follow this exact structure with dark, colorful styling:
      <div class="resume">
          <header class="resume-header">
              <h1 class="name">Full Name</h1>
              <div class="contact-info">
                  <p>email@example.com | (123) 456-7890 | LinkedIn: linkedin.com/in/name</p>
              </div>
          </header>
          
          <section class="resume-section summary">
              <h2 class="section-title">Summary</h2>
              <p class="summary-text">Professional summary text...</p>
          </section>
          
          <section class="resume-section experience">
              <h2 class="section-title">Experience</h2>
              <div class="experience-item">
                  <h3 class="job-title">Job Title</h3>
                  <div class="company-details">
                      <span class="company-name">Company Name</span>
                      <span class="employment-dates">Jan 2020 - Present</span>
                  </div>
                  <ul class="achievements">
                      <li>Key achievement 1</li>
                      <li>Key achievement 2</li>
                  </ul>
              </div>
          </section>
          
          <section class="resume-section education">
              <h2 class="section-title">Education</h2>
              <div class="education-item">
                  <h3 class="degree">Degree Name</h3>
                  <p class="institution">University Name</p>
                  <p class="education-dates">2016 - 2020</p>
              </div>
          </section>
          
          <section class="resume-section skills">
              <h2 class="section-title">Skills</h2>
              <div class="skills-container">
                  <div class="skill-category">
                      <h4 class="category-title">Technical</h4>
                      <ul class="skill-list">
                          <li>JavaScript</li>
                      </ul>
                  </div>
              </div>
          </section>
      </div>
      Include inline CSS for print and screen media queries with:
        - Background: use dark, rich gradients (e.g., linear-gradient(45deg, #112240, #233554) or linear-gradient(45deg, #0d1b2a, #1b263b))
        - Text colors: use bright, contrasting shades (e.g., #e0e0e0 for body text, accented with dark blue or dark purple for headings)
        - Border and shadow styling that accentuate the dark and colorful theme
        -don't give skill-list or skill-category any background
      Most important thing:
        - don't give anything else other than the resume`;
    try {
        showLoading(true);
        const result = await callGeminiAPI(prompt);
        const resultContainer = document.getElementById('resumeResult');
        resultContainer.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.innerHTML = result;
        const pdfButton = document.createElement('button');
        pdfButton.textContent = 'Download PDF';
        pdfButton.className = 'pdf-button';
        pdfButton.onclick = convertToPDF;
        resultContainer.appendChild(pdfButton);
        resultContainer.appendChild(wrapper);
        addResumeStyles();
        addToHistory('Resume Builder', info, result);
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function addResumeStyles() {
    if (!document.getElementById('resume-styles')) {
        const style = document.createElement('style');
        style.id = 'resume-styles';
        style.textContent = `
      .resume {
          width: 100%;
          max-width: 210mm;
          margin: 20px auto;
          padding: 20px;
          background: #1e1e1e;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          font-family: 'Arial', sans-serif;
          color: #e0e0e0;
      }

      .resume-header {
          text-align: center;
          margin-bottom: 1.5rem;
      }

      .section-title {
          color: #ff5f6d;
          border-bottom: 2px solid #ff5f6d;
          padding-bottom: 0.3rem;
          margin: 1.5rem 0;
      }

      .experience-item {
          margin: 1rem 0;
      }

      .company-details {
          display: flex;
          justify-content: space-between;
          margin: 0.5rem 0;
      }

      .pdf-button {
          background: #2b2d42;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 1rem;
      }

      @media (max-width: 768px) {
          .resume {
              margin: 10px;
              padding: 15px;
          }
          
          .company-details {
              flex-direction: column;
          }
      }

      @media print {
          @page { margin: 0; }
          body * { visibility: hidden; }
          .resume, .resume * { visibility: visible; }
          .resume {
              box-shadow: none;
              padding: 0;
              margin: 0;
              width: 100%;
              page-break-inside: avoid;
              page-break-before: avoid;
              page-break-after: avoid;
          }
          .pdf-button { display: none; }
      }
    `;
        document.head.appendChild(style);
    }
}

function showLoading(isLoading) {
    document.getElementById('loading').style.display = isLoading ? 'flex' : 'none';
}

function convertToPDF() {
    window.print();
}

function showError(message) {
    alert(`Error: ${message}`);
}

function injectAnswerStyles() {
    const answerStyles = `
    .explanation-box {
        background: #1e1e1e;
        color: #e0e0e0;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        margin: 1rem 0;
        font-family: system-ui;
    }
    .concept-heading {
        color: #ff5f6d;
        margin: 0 0 1rem 0;
        border-bottom: 2px solid #ff5f6d;
        padding-bottom: 0.5rem;
    }
    .key-points {
        padding-left: 1.5rem;
        margin: 1rem 0;
    }
    .key-points li {
        margin-bottom: 0.5rem;
        line-height: 1.6;
    }
    .example-box {
        background: #2a2a2a;
        border-left: 4px solid #4f46e5;
        padding: 1rem;
        border-radius: 4px;
        margin: 1rem 0;
    }
    .code-sample {
        display: block;
        background: #282929;
        padding: 1rem;
        border-radius: 6px;
        margin: 1rem 0;
        font-family: 'Courier New', monospace;
        overflow-x: auto;
    }
    .analogy {
        background: #2a2a2a;
        border: 1px solid #16a34a;
        padding: 1rem;
        border-radius: 6px;
        margin: 1rem 0;
    }
    @media (min-width: 768px) {
        .explanation-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }
        .main-explanation {
            grid-column: 1 / -1;
        }
    }
  `;
    const answerStyleElement = document.createElement('style');
    answerStyleElement.textContent = answerStyles;
    document.head.appendChild(answerStyleElement);
}
