// Demo course used ONLY in preview mode (?preview=1) so the course player and
// every activity type can be tried. It is not a real course and is never
// saved to the live database. It also shows the course file format used by
// "Import course file" in the admin course editor.
const CPD_DEMO_COURSE = {
  meta: {
    slug: 'demo-course',
    title: 'Demo Course (preview only)',
    category: 'Demo',
    icon: '🧪',
    summary: 'Shows every type of lesson block and activity a CPD course can use. Only visible in preview mode.',
    hours: 1,
    price: '£0',
    stripeLink: '',
    status: 'live',
    outcomes: ['C'],
    aims: 'To show how a DNT CPD short course is laid out.',
    objectives: ['See how lessons, activities, the quiz, reflection and feedback fit together'],
    updated: '2026-10-06',
    thumbnail: '',
  },
  content: {
    lessons: [
      {
        id: 'l1', title: 'Reading blocks',
        blocks: [
          { type: 'text', text: 'This is a **text block**. Leave a blank line to start a new paragraph.\n\n## A small heading\n- Bullet points start with a dash\n- Like this\n\n1. Numbered lists\n2. Work too' },
          { type: 'callout', style: 'info', label: 'Key point', text: 'Key point boxes pull out the one thing learners must remember.' },
          { type: 'callout', style: 'warn', label: 'Important', text: 'Warning boxes are for safety points and things that must never be done.' },
          { type: 'reveal', title: 'Click to reveal', items: [
            { title: 'What is this?', text: 'Hidden text that opens when clicked. Good for "test yourself" moments or extra detail.' },
            { title: 'A second section', text: 'You can add as many sections as you like.' },
          ] },
          { type: 'flipcards', title: 'Flip cards', cards: [
            { front: 'Front of card', back: 'The back. Great for key terms and definitions.' },
            { front: 'Another card', back: 'Tap again to turn it back.' },
          ] },
        ],
      },
      {
        id: 'l2', title: 'Interactive activities',
        blocks: [
          { type: 'text', text: 'Learners must try each activity on a page before they can mark the lesson complete.' },
          { type: 'check', question: 'Knowledge checks give instant feedback. Which option is correct?', options: ['This one', 'Not this one', 'Or this one'], answer: 1, explain: 'The first option was set as correct in the editor.' },
          { type: 'truefalse', title: 'True or false?', items: [
            { statement: 'True or false activities can have several statements.', answer: 'true', explain: 'Add as many as you need.' },
            { statement: 'Learners have to get them all right to carry on.', answer: 'false', explain: 'They just need to answer each one; it is for learning, not scoring.' },
          ] },
          { type: 'scenario', title: 'What would you do?', situation: 'Scenarios describe a real situation and ask the learner to choose a response.', options: [
            { text: 'The best response', best: true, feedback: 'This is shown in green.' },
            { text: 'A weaker response', best: false, feedback: 'Explain why this is not the best choice.' },
          ] },
          { type: 'sort', prompt: 'Sort each item into the right group', categories: ['Fruit', 'Vegetable'], items: [
            { text: 'Apple', cat: 1 }, { text: 'Carrot', cat: 2 }, { text: 'Banana', cat: 1 }, { text: 'Broccoli', cat: 2 },
          ] },
          { type: 'order', prompt: 'Put the numbers in order', steps: ['One', 'Two', 'Three', 'Four'] },
        ],
      },
    ],
    quiz: {
      passMark: 80,
      questions: [
        { q: 'The end-of-course quiz works like this. Pick the first answer.', options: ['First answer', 'Second answer', 'Third answer', 'Fourth answer'], answer: 1, explain: 'Explanations show after the quiz is marked.' },
        { q: 'Questions are shuffled each attempt. Pick the second answer.', options: ['First answer', 'Second answer', 'Third answer', 'Fourth answer'], answer: 2, explain: '' },
      ],
    },
    reflection: [
      'What were the key things you learned from this course?',
      'How will you apply this learning in your day-to-day practice?',
      'How will this benefit your patients?',
      'Is there anything you would like to learn more about? (Add it to your personal development plan.)',
    ],
  },
};
