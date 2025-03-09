
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readingTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "The Art of Mindful Writing",
    excerpt: "Exploring how mindfulness can transform your writing practice and help you connect more deeply with your words.",
    content: `
      <p>In a world filled with distractions, bringing mindfulness to your writing practice can be transformative. When we write mindfully, we bring our full attention to the present moment, allowing words to flow more naturally and authentically.</p>
      
      <p>Mindful writing begins with creating the right environment. Find a quiet space where you won't be interrupted. Turn off notifications on your devices. Take a few deep breaths before you begin, centering yourself in the present moment.</p>
      
      <p>As you write, pay attention to the physical sensations of writing—the feel of the keyboard beneath your fingertips or the pen in your hand, the rhythm of your breathing, the thoughts that arise and pass away. When your mind wanders, gently bring your attention back to your words.</p>
      
      <p>Don't judge what emerges. Mindful writing isn't about creating perfect prose on the first try; it's about being fully present with whatever arises. You can always revise later. For now, simply witness the words as they appear.</p>
      
      <p>With practice, you may find that mindful writing not only improves your craft but also becomes a form of meditation—a way to explore your inner landscape and connect more deeply with yourself and your readers.</p>
    `,
    date: "June 15, 2024",
    readingTime: "4 min read"
  },
  {
    id: "2",
    title: "Finding Inspiration in Everyday Moments",
    excerpt: "How the simplest experiences in daily life can become powerful catalysts for creativity and writing.",
    content: `
      <p>Writers often search for inspiration in extraordinary experiences, but some of the most profound insights can emerge from the ordinary moments of daily life—the play of light through leaves, a stranger's gesture of kindness, the familiar routine of morning coffee.</p>
      
      <p>Paying attention is the first step. In our rush through daily tasks, we often miss the quiet beauty and significance of small moments. Try slowing down. Observe the details of your surroundings. Listen more carefully to conversations. Notice the emotions that flicker through you as you move through your day.</p>
      
      <p>Keep a notebook handy to jot down observations, snippets of dialogue, or sudden realizations. These captured moments become seeds that can grow into essays, poems, or stories. Over time, you'll develop a rich archive of material drawn directly from your lived experience.</p>
      
      <p>The practice of finding inspiration in everyday life isn't just about gathering material—it's about cultivating a way of being in the world that's more awake, more curious, more connected. It transforms not only your writing but your experience of living.</p>
      
      <p>As writer Natalie Goldberg says, "Pay attention to your life. It pays you back with material."</p>
    `,
    date: "June 7, 2024",
    readingTime: "3 min read"
  },
  {
    id: "3",
    title: "The Power of Simplicity in Writing",
    excerpt: "Why stripping your writing down to its essential elements can make it more powerful and resonant.",
    content: `
      <p>In an age of information overload, there's profound power in simplicity. Writing that's clear, direct, and free of unnecessary ornamentation often communicates more effectively and leaves a deeper impression on readers.</p>
      
      <p>The pursuit of simplicity isn't about dumbing down complex ideas. Rather, it's about presenting those ideas with such clarity that their complexity becomes accessible. As Einstein reportedly said, "If you can't explain it simply, you don't understand it well enough."</p>
      
      <p>Simplifying your writing often begins with the editing process. Write your first draft without restraint, then go back and ask of each sentence, each word: Is this necessary? Does it strengthen or weaken what I'm trying to communicate? Be willing to "kill your darlings"—those phrases you love but that don't serve the whole.</p>
      
      <p>Pay attention to sentence structure. Vary length for rhythm, but favor shorter sentences when possible. Choose concrete, specific language over abstractions. Replace jargon with everyday words that communicate the same meaning.</p>
      
      <p>Remember that simplicity isn't a style; it's a clarity of thought. When you truly understand what you want to say and care about communicating it to others, simplicity follows naturally.</p>
    `,
    date: "May 28, 2024",
    readingTime: "4 min read"
  }
];
