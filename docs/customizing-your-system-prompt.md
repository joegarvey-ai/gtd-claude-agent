# Customizing Your System Prompt

The system prompt in this repo is a template. It works out of the box once you fill in the placeholders, but the real power comes from making it yours.

This guide explains what you can change, what you should keep, and how to extend the prompt for your specific workflow.

---

## Required vs. optional sections

### Required — keep these

These sections are core to how the assistant works. Removing them will break the GTD workflow:

| Section | Why it's required |
|---------|------------------|
| **Identity** | Tells Claude who it's working for and what its role is |
| **Inbox Disambiguation** | Prevents confusion between Obsidian and Gmail inboxes |
| **Obsidian Vault Structure** | Claude needs to know where to read and write files |
| **GTD Principles** | The framework Claude uses to organize your work |
| **Processing the Inbox** | The step-by-step logic for handling captured items |
| **Communication Style** | Keeps Claude's responses consistent and useful |

### Optional — customize or remove

These sections add depth but aren't required for the core workflow:

| Section | When to keep it |
|---------|----------------|
| **Weekly Review** | Keep if you want Claude to run structured weekly reviews |
| **Meal Planning** | Keep if you track meals or meal prep |
| **Fitness** | Keep if you want Claude to help with workout planning or tracking |
| **Writing & Career** | Keep if Claude helps you write or manage career-related work |
| **Finance** | Keep if you track expenses or financial goals |

You can delete any optional section entirely, or add new ones (see below).

---

## How to add domain-specific context

Want Claude to help with something not covered in the template? Add a new section under **Domain-Specific Context**. Here's the pattern:

```markdown
### [Your Domain]
[2-3 sentences explaining what this area of your life involves]
[Where relevant files live in your Obsidian vault, if applicable]
[Any rules or preferences Claude should follow in this domain]
```

### Examples

**Travel planning:**
```markdown
### Travel
I travel 3-4 times per year. Trip planning docs go in 02 Personal Projects/Travel/.
When I'm planning a trip, help me build a packing list, research logistics, and
create a day-by-day itinerary. I prefer direct flights and Airbnbs over hotels.
```

**Side business:**
```markdown
### Freelance Work
I do freelance data analysis on the side. Client project files are in
02 Personal Projects/Freelance/. Track invoices and deadlines carefully.
When I mention a client by name, check for their file in People/ for context.
```

**Learning goals:**
```markdown
### Learning
I'm currently learning Spanish and studying for the AWS Solutions Architect cert.
Study materials are in 05 Reference/Learning/. When I have free time and ask
what to work on, consider suggesting study sessions for these.
```

---

## Pointing Claude to your personal context file

The system prompt references a file called `[YOUR_NAME].md` in the `People/` folder. This is a file in your Obsidian vault that contains context about you — your role, priorities, work style, and anything else Claude should always know.

To set this up:

1. Create a file in your Obsidian vault at `People/YourName.md`
2. Write a brief profile (see [docs/obsidian-setup.md](obsidian-setup.md) for an example)
3. Update the last line of the system prompt to point to your file:

```markdown
For additional personal context, read `People/YourName.md` in my Obsidian vault.
```

Claude will read this file when it needs context about your preferences or priorities.

---

## Tips for writing a good system prompt

### Be specific about "next action"

The concept of a "next action" is central to GTD. Tell Claude what it means to you:

- **Vague:** "Update the project plan"
- **Clear:** "Open the Q2 Roadmap doc in Drive and add a row for the new onboarding feature"

If you add a line like *"A next action should be specific enough that I know exactly what to do when I see it — no ambiguity"*, Claude will push you toward clearer actions.

### Add your communication preferences

The template includes basic style rules, but you can get more specific:

```markdown
- When summarizing emails, give me: sender, subject, one-line summary, and whether it needs a reply
- For weekly reviews, use bullet points not paragraphs
- If I ask "what should I work on?", check my calendar first, then suggest from Deep Work if I have a 2+ hour block, or Quick Wins if I don't
```

### Define what "done" looks like

If you have a specific definition of when tasks are complete, tell Claude:

```markdown
A task is done when:
- The deliverable exists (file created, email sent, issue closed)
- Any follow-up has been captured as a new task
- The original item has been removed from Next Actions
```

### Include time-based rules

If your schedule affects how Claude should help:

```markdown
- Mornings (before noon) are for Deep Work — don't suggest Quick Wins during this time
- Fridays are for Weekly Reviews and planning
- Don't suggest scheduling meetings on Wednesdays — that's my no-meeting day
```

---

## Testing your changes

After editing the system prompt:

1. Copy your updated prompt
2. Go to Claude Desktop → Settings → Profile → Custom Instructions
3. Paste the new version and save
4. Open a new conversation (existing conversations use the old prompt)
5. Test with: *"What do you know about my system and how I work?"*

Claude should be able to describe your setup, your tools, and your preferences based on what's in the prompt.

---

## Sharing your customizations

If you've built something useful on top of this template, consider opening an issue or pull request on the [GitHub repo](https://github.com/joegarvey-ai/gtd-claude-agent). The goal is to make this a living resource that gets better as more people use it.
