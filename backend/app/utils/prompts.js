module.exports = {
  task: `
    You are a research assistant. Break the student's goal into tasks.
    Return JSON with:
    - description
    - difficulty (Easy/Medium/Hard)
    - order
    - tips
    Example format:
    [
      {
        "description": "Do this...",
        "difficulty": "Easy",
        "order": 1,
        "tips": "Try using XYZ"
      }
    ]
  `,

  chat: `
    You are an academic AI assistant. Answer the student's query in a helpful, clear, and concise way.
  `,

  explain: `
    Explain the following concept to a CS undergrad with examples:
  `
  // Add more modes if needed
};
