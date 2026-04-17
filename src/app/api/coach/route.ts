import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Parker's personal life coach inside his Command Center app. You help him stay organized and balanced across 5 life domains: Personal (health, mindset, habits), Family (kids, wife, activities), Work (projects, priorities), Growth (learning, goals), and Balance (fun, rest, recreation).

Parker is a Product Manager, father with multiple kids in sports/activities, and a running coach.

Your coaching style:
- Be concise and actionable (2-4 short paragraphs max)
- Celebrate wins genuinely but briefly
- Be direct about areas for improvement
- Suggest one specific thing to try tomorrow
- Use a warm but no-nonsense tone — like a trusted advisor, not a cheerleader
- Reference his actual data when possible (habits completed, mood trends, etc.)
- Occasionally prompt him to think about balance across all 5 domains`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      message:
        "Great reflection today. Keep tracking your wins and challenges — patterns will emerge over time that help you improve. Rest well tonight.",
    });
  }

  try {
    const body = await req.json();
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    let userMessage = "";

    if (body.type === "evening_reflection") {
      userMessage = buildEveningPrompt(body);
    } else if (body.type === "morning_checkin") {
      userMessage = buildMorningPrompt(body);
    } else if (body.type === "coach_chat") {
      userMessage = body.message;
    } else {
      userMessage = JSON.stringify(body);
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Coach API error:", error);
    return NextResponse.json({
      message:
        "Your reflection has been saved. AI coaching is temporarily unavailable, but your consistency in reflecting is what matters most. Keep going.",
    });
  }
}

function buildEveningPrompt(data: {
  mood: number;
  energy: number;
  wins: string[];
  challenges: string[];
  reflection: string;
  morningMood?: number;
  morningEnergy?: number;
  morningIntention?: string;
  habitsCompleted: number;
  totalHabits: number;
  tasksCompleted: number;
}): string {
  let prompt = `Evening reflection for today:\n\n`;
  prompt += `Mood: ${data.mood}/5 | Energy: ${data.energy}/5\n`;

  if (data.morningMood) {
    prompt += `Morning mood was: ${data.morningMood}/5 | Morning energy: ${data.morningEnergy}/5\n`;
  }
  if (data.morningIntention) {
    prompt += `Morning intention: "${data.morningIntention}"\n`;
  }

  prompt += `Habits completed: ${data.habitsCompleted}/${data.totalHabits}\n`;
  prompt += `Tasks completed today: ${data.tasksCompleted}\n\n`;

  if (data.wins.length > 0) {
    prompt += `Wins:\n${data.wins.map((w) => `- ${w}`).join("\n")}\n\n`;
  }
  if (data.challenges.length > 0) {
    prompt += `Challenges:\n${data.challenges.map((c) => `- ${c}`).join("\n")}\n\n`;
  }
  if (data.reflection) {
    prompt += `Additional thoughts: "${data.reflection}"\n\n`;
  }

  prompt += `Please give a brief coaching response based on this evening reflection. Acknowledge the day, highlight what went well, address challenges constructively, and suggest one specific thing for tomorrow.`;

  return prompt;
}

function buildMorningPrompt(data: {
  mood: number;
  energy: number;
  gratitude: string[];
  priorities: string[];
  intention: string;
}): string {
  let prompt = `Morning check-in:\n\n`;
  prompt += `Mood: ${data.mood}/5 | Energy: ${data.energy}/5\n\n`;

  if (data.gratitude.length > 0) {
    prompt += `Grateful for:\n${data.gratitude.map((g) => `- ${g}`).join("\n")}\n\n`;
  }
  if (data.priorities.length > 0) {
    prompt += `Today's priorities:\n${data.priorities.map((p) => `- ${p}`).join("\n")}\n\n`;
  }
  if (data.intention) {
    prompt += `Intention: "${data.intention}"\n\n`;
  }

  prompt += `Please give a brief, energizing coaching response for the morning. Validate priorities, suggest how to approach the day, and offer one mindset tip.`;

  return prompt;
}
